/* Gamepad Navigation for Mobile/Android */
/* Only active on non-player pages */

(function() {
    // Do NOT run on the player page (emulator is running there)
    if (document.querySelector('#game') || document.querySelector('.start-modal')) {
        return;
    }
    
    let currentFocusIndex = 0;
    let focusableElements = [];
    let gamepadPollInterval = null;
    let lastInputTime = 0;
    const INPUT_DELAY = 200; // ms between inputs
    
    // State tracking for D-pad/stick
    let lastAxisState = { x: 0, y: 0 };
    
    // Initialize gamepad navigation
    function initGamepadNavigation() {
        updateFocusableElements();
        
        // Start polling for gamepad
        if (!gamepadPollInterval) {
            gamepadPollInterval = setInterval(pollGamepadForNavigation, 100);
        }
        
        // Focus first element
        if (focusableElements.length > 0) {
            focusElement(0);
        }
        
        // Update on DOM changes
        const observer = new MutationObserver(updateFocusableElements);
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    // Get focusable elements: game/emulator cards first, then back buttons only
    function updateFocusableElements() {
        const elements = [];
        
        // Priority 1: game cards and emulator cards (main navigation target)
        document.querySelectorAll('.game-card, .emulator-card').forEach(el => {
            if (el.offsetParent !== null) elements.push(el);
        });
        
        // Priority 2: back button if present (not header/scan/search)
        document.querySelectorAll('.back-button:not(.modal-button)').forEach(el => {
            if (el.offsetParent !== null) elements.push(el);
        });
        
        // Deduplicate while preserving order
        focusableElements = [...new Set(elements)];
    }
    
    // Focus an element with visual feedback
    function focusElement(index) {
        if (focusableElements.length === 0) return;
        
        // Remove previous focus
        focusableElements.forEach(el => {
            el.classList.remove('gamepad-focused');
            el.style.outline = '';
        });
        
        // Wrap around
        if (index < 0) index = focusableElements.length - 1;
        if (index >= focusableElements.length) index = 0;
        
        currentFocusIndex = index;
        const element = focusableElements[index];
        
        // Add focus class and visual outline
        element.classList.add('gamepad-focused');
        element.style.outline = '3px solid #10b981';
        element.style.outlineOffset = '4px';
        
        // Scroll into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Also set DOM focus for inputs
        if (element.tagName === 'INPUT') {
            element.focus();
        }
    }
    
    // Navigate in grid (for game/emulator cards)
    function navigateGrid(direction) {
        if (focusableElements.length === 0) return;
        
        const currentElement = focusableElements[currentFocusIndex];
        const rect = currentElement.getBoundingClientRect();
        
        let targetIndex = currentFocusIndex;
        let minDistance = Infinity;
        
        focusableElements.forEach((el, index) => {
            if (index === currentFocusIndex) return;
            
            const elRect = el.getBoundingClientRect();
            let isInDirection = false;
            let distance = 0;
            
            switch(direction) {
                case 'up':
                    isInDirection = elRect.top < rect.top - 10;
                    distance = rect.top - elRect.top + Math.abs(rect.left - elRect.left);
                    break;
                case 'down':
                    isInDirection = elRect.top > rect.top + 10;
                    distance = elRect.top - rect.top + Math.abs(rect.left - elRect.left);
                    break;
                case 'left':
                    isInDirection = elRect.left < rect.left - 10;
                    distance = rect.left - elRect.left + Math.abs(rect.top - elRect.top) * 0.5;
                    break;
                case 'right':
                    isInDirection = elRect.left > rect.left + 10;
                    distance = elRect.left - rect.left + Math.abs(rect.top - elRect.top) * 0.5;
                    break;
            }
            
            if (isInDirection && distance < minDistance) {
                minDistance = distance;
                targetIndex = index;
            }
        });
        
        // If no element found in direction, try simple linear navigation
        if (targetIndex === currentFocusIndex) {
            if (direction === 'down' || direction === 'right') {
                targetIndex = currentFocusIndex + 1;
            } else if (direction === 'up' || direction === 'left') {
                targetIndex = currentFocusIndex - 1;
            }
        }
        
        focusElement(targetIndex);
    }
    
    // Poll gamepad for navigation inputs
    function pollGamepadForNavigation() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
        
        if (!gamepad) return;
        
        const now = Date.now();
        if (now - lastInputTime < INPUT_DELAY) return;
        
        // D-pad buttons (12=up, 13=down, 14=left, 15=right)
        if (gamepad.buttons[12] && gamepad.buttons[12].pressed) {
            navigateGrid('up');
            lastInputTime = now;
        } else if (gamepad.buttons[13] && gamepad.buttons[13].pressed) {
            navigateGrid('down');
            lastInputTime = now;
        } else if (gamepad.buttons[14] && gamepad.buttons[14].pressed) {
            navigateGrid('left');
            lastInputTime = now;
        } else if (gamepad.buttons[15] && gamepad.buttons[15].pressed) {
            navigateGrid('right');
            lastInputTime = now;
        }
        
        // Left stick (axes 0=X, 1=Y)
        const axisX = gamepad.axes[0] || 0;
        const axisY = gamepad.axes[1] || 0;
        const threshold = 0.7;
        
        // Detect new axis movement (not held)
        if (Math.abs(axisY) > threshold && Math.abs(lastAxisState.y) <= threshold) {
            if (axisY < -threshold) {
                navigateGrid('up');
                lastInputTime = now;
            } else if (axisY > threshold) {
                navigateGrid('down');
                lastInputTime = now;
            }
        }
        
        if (Math.abs(axisX) > threshold && Math.abs(lastAxisState.x) <= threshold) {
            if (axisX < -threshold) {
                navigateGrid('left');
                lastInputTime = now;
            } else if (axisX > threshold) {
                navigateGrid('right');
                lastInputTime = now;
            }
        }
        
        lastAxisState.x = axisX;
        lastAxisState.y = axisY;
        
        // A button (0) = confirm/click
        if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
            const element = focusableElements[currentFocusIndex];
            if (element && now - lastInputTime >= INPUT_DELAY) {
                element.click();
                lastInputTime = now;
            }
        }
        
        // B button (1) = back
        if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
            if (now - lastInputTime >= INPUT_DELAY) {
                // Go back or close modal
                if (document.getElementById('startModal')?.style.display !== 'none') {
                    // Can't go back from start modal
                } else if (window.history.length > 1) {
                    window.history.back();
                    lastInputTime = now;
                }
            }
        }
    }
    
    // Stop gamepad navigation (for when emulator takes over)
    function stopGamepadNavigation() {
        if (gamepadPollInterval) {
            clearInterval(gamepadPollInterval);
            gamepadPollInterval = null;
        }
        
        // Remove focus from all elements
        focusableElements.forEach(el => {
            el.classList.remove('gamepad-focused');
            el.style.outline = '';
        });
        
        console.log('🎮 Navigation manette désactivée - Émulateur prend le contrôle');
    }
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGamepadNavigation);
    } else {
        initGamepadNavigation();
    }
    
    // Expose globally
    window.gamepadNavigation = {
        init: initGamepadNavigation,
        stop: stopGamepadNavigation,
        update: updateFocusableElements,
        focus: focusElement
    };
})();
