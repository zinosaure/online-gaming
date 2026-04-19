/* Player Page JavaScript */

let emulatorInstance = null;
let isMenuOpen = false;
let gamePaused = false;
let isAndroidDevice = false;

// Parse controls configuration from backend (injected by template)
// This will be set by the template: const controlsConfig = {{ controls|safe }};

function isMobileDevice() {
    return !!(
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i)
    );
}

function isAndroid() {
    return !!navigator.userAgent.match(/Android/i);
}

function showToast(message, duration = 5000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) {
        console.error('Toast elements not found');
        return;
    }
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

function enterFullscreen() {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        }
    }
}

function exitFullscreen() {
    if (document.fullscreenElement) {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function showError(message) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').style.display = 'block';
}

function toggleMenu() {
    isMenuOpen = !isMenuOpen;
    const menu = document.getElementById('pushMenu');
    const overlay = document.getElementById('menuOverlay');
    const pausedIndicator = document.getElementById('gamePaused');
    
    if (isMenuOpen) {
        menu.classList.add('active');
        overlay.classList.add('active');
        pausedIndicator.style.display = 'block';
        pauseEmulator();
    } else {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        pausedIndicator.style.display = 'none';
        resumeEmulator();
    }
}

function pauseEmulator() {
    if (emulatorInstance && typeof emulatorInstance.pause === 'function') {
        emulatorInstance.pause();
        gamePaused = true;
    }
}

function resumeEmulator() {
    if (emulatorInstance && typeof emulatorInstance.resume === 'function') {
        emulatorInstance.resume();
        gamePaused = false;
    }
}

// Initialize menu events
function initializeMenu() {
    // Check if Android device
    isAndroidDevice = isAndroid();
    
    // Hide menu button on Android devices
    const menuButton = document.getElementById('menuButton');
    if (isAndroidDevice && menuButton) {
        menuButton.style.display = 'none';
        // Show toast with instructions after a delay to ensure page is fully loaded
        setTimeout(() => {
            showToast('Appuyez sur Select + Start pour ouvrir le menu', 6000);
        }, 3000);
    }
    
    // Menu button event
    if (menuButton) {
        menuButton.addEventListener('click', toggleMenu);
    }
    
    const menuOverlay = document.getElementById('menuOverlay');
    if (menuOverlay) {
        menuOverlay.addEventListener('click', toggleMenu);
    }
    
    // Keyboard shortcuts for menu - dynamically detect based on controls
    let menuKey1 = 'KeyA'; // default select
    let menuKey2 = 'KeyS'; // default start
    let menuKey1Pressed = false;
    let menuKey2Pressed = false;
    let menuShortcutText = 'Select + Start';
    
    if (typeof controlsConfig !== 'undefined' && controlsConfig.player1) {
        // Priority: select + start, or mode + start, or z + start
        if (controlsConfig.player1.select && controlsConfig.player1.start) {
            menuKey1 = controlsConfig.player1.select;
            menuKey2 = controlsConfig.player1.start;
            menuShortcutText = 'Select + Start';
        } else if (controlsConfig.player1.mode && controlsConfig.player1.start) {
            menuKey1 = controlsConfig.player1.mode;
            menuKey2 = controlsConfig.player1.start;
            menuShortcutText = 'Mode + Start';
        } else if (controlsConfig.player1.z && controlsConfig.player1.start) {
            menuKey1 = controlsConfig.player1.z;
            menuKey2 = controlsConfig.player1.start;
            menuShortcutText = 'Z + Start';
        } else if (controlsConfig.player1.start) {
            // If only start exists, use L/R + Start or just Start alone won't work well
            // Let's use a fallback combination
            menuKey1 = controlsConfig.player1.l || controlsConfig.player1.z || 'KeyA';
            menuKey2 = controlsConfig.player1.start;
            menuShortcutText = (controlsConfig.player1.l ? 'L' : 'Z') + ' + Start';
        }
    }
    
    // Menu shortcut text removed (simplified menu with 3 icon buttons only)
    // document.getElementById('menuShortcut').textContent = menuShortcutText;
    
    document.addEventListener('keydown', function(e) {
        if (e.code === menuKey1) menuKey1Pressed = true;
        if (e.code === menuKey2) menuKey2Pressed = true;
        
        if (menuKey1Pressed && menuKey2Pressed && !isMenuOpen) {
            toggleMenu();
        }
        
        // ESC to close menu
        if (e.code === 'Escape' && isMenuOpen) {
            toggleMenu();
        }
    });
    
    document.addEventListener('keyup', function(e) {
        if (e.code === menuKey1) menuKey1Pressed = false;
        if (e.code === menuKey2) menuKey2Pressed = false;
    });
}

// Initialize menu action buttons
function initializeMenuActions(emulatorId) {
    // Quit button
    const quitBtn = document.getElementById('quitBtn');
    if (quitBtn) {
        quitBtn.addEventListener('click', function() {
            exitFullscreen();
            setTimeout(() => {
                window.location.href = '/emulator/' + emulatorId;
            }, 100);
        });
    }
    
    // Reload button
    const reloadBtn = document.getElementById('reloadBtn');
    if (reloadBtn) {
        reloadBtn.addEventListener('click', function() {
            location.reload();
        });
    }
    
    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (!document.fullscreenElement) {
                enterFullscreen();
            } else {
                exitFullscreen();
            }
        });
    }
}

// Initialize automatic pause on blur
function initializeAutoPause() {
    // Delay to avoid interfering with initial load
    setTimeout(function() {
        window.addEventListener('blur', function() {
            if (!gamePaused && !isMenuOpen && emulatorInstance) {
                pauseEmulator();
                document.getElementById('gamePaused').style.display = 'block';
            }
        });
        
        window.addEventListener('focus', function() {
            if (gamePaused && !isMenuOpen && emulatorInstance) {
                resumeEmulator();
                document.getElementById('gamePaused').style.display = 'none';
            }
        });
    }, 2000);
}

// ============================================================
// START MODAL & GAMEPAD DETECTION
// ============================================================

let gamepadDetectedBeforeStart = false;

// Check if a gamepad is currently connected
function hasGamepadConnected() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            return true;
        }
    }
    return false;
}

// Show start modal and handle gamepad detection + fullscreen
function showStartModal(emulatorId, romFilename, emulatorJs) {
    const modal = document.getElementById('startModal');
    const startButton = document.getElementById('startButton');
    const backButton = document.getElementById('backButton');
    
    if (!modal || !startButton || !backButton) return;
    
    // Modal button navigation
    let currentModalButton = 1; // 0 = back, 1 = start (default to start)
    const modalButtons = [backButton, startButton];
    let modalNavInterval = null;
    
    // Update button focus in modal
    function updateModalFocus() {
        modalButtons.forEach((btn, index) => {
            if (index === currentModalButton) {
                btn.classList.add('gamepad-focused');
            } else {
                btn.classList.remove('gamepad-focused');
            }
        });
    }
    
    // Listen for gamepad connection
    const gamepadHandler = function(e) {
        gamepadDetectedBeforeStart = true;
        console.log('🎮 Gamepad connected:', e.gamepad.id);
        showToast('🎮 Manette détectée - Utilisez ← → pour naviguer, A pour sélectionner', 3000);
        startModalGamepadNavigation();
    };
    
    window.addEventListener('gamepadconnected', gamepadHandler);
    
    // Check if gamepad already connected
    gamepadDetectedBeforeStart = hasGamepadConnected();
    
    if (gamepadDetectedBeforeStart) {
        showToast('🎮 Manette détectée - Utilisez ← → pour naviguer, A pour sélectionner', 3000);
        startModalGamepadNavigation();
    }
    
    // Gamepad navigation in modal
    function startModalGamepadNavigation() {
        if (modalNavInterval) return;
        
        updateModalFocus(); // Show initial focus
        
        let lastInputTime = 0;
        const INPUT_DELAY = 200;
        
        modalNavInterval = setInterval(() => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
            
            if (!gamepad) return;
            
            const now = Date.now();
            if (now - lastInputTime < INPUT_DELAY) return;
            
            // D-pad left (14) or left stick left
            if ((gamepad.buttons[14] && gamepad.buttons[14].pressed) || 
                (gamepad.axes[0] && gamepad.axes[0] < -0.5)) {
                currentModalButton = Math.max(0, currentModalButton - 1);
                updateModalFocus();
                lastInputTime = now;
            }
            
            // D-pad right (15) or left stick right
            if ((gamepad.buttons[15] && gamepad.buttons[15].pressed) || 
                (gamepad.axes[0] && gamepad.axes[0] > 0.5)) {
                currentModalButton = Math.min(modalButtons.length - 1, currentModalButton + 1);
                updateModalFocus();
                lastInputTime = now;
            }
            
            // A button (0) = confirm
            if (gamepad.buttons[0] && gamepad.buttons[0].pressed) {
                modalButtons[currentModalButton].click();
                lastInputTime = now;
            }
            
            // B button (1) = back
            if (gamepad.buttons[1] && gamepad.buttons[1].pressed) {
                backButton.click();
                lastInputTime = now;
            }
        }, 100);
    }
    
    // Handle back button click
    backButton.addEventListener('click', function() {
        if (modalNavInterval) clearInterval(modalNavInterval);
        window.removeEventListener('gamepadconnected', gamepadHandler);
        window.location.href = '/emulator/' + emulatorId;
    });
    
    // Handle start button click
    startButton.addEventListener('click', function() {
        if (modalNavInterval) clearInterval(modalNavInterval);
        window.removeEventListener('gamepadconnected', gamepadHandler);
        
        // Final check for gamepad
        const hasGamepad = gamepadDetectedBeforeStart || hasGamepadConnected();
        
        // Hide modal
        modal.style.display = 'none';
        
        // Enter fullscreen
        enterFullscreen();
        
        // Load emulator (showControls = mobile device AND no gamepad)
        const showControls = isMobileDevice() && !hasGamepad;
        loadEmulator(emulatorId, romFilename, emulatorJs, showControls);
    });
}

// Load and start the emulator
function loadEmulator(emulatorId, romFilename, emulatorJs, showControls) {
    var gameURL = "/rom/" + emulatorId + "/" + romFilename;
    
    var xhr = new XMLHttpRequest();
    xhr.open("GET", gameURL, true);
    xhr.responseType = "arraybuffer";
    
    xhr.addEventListener("readystatechange", function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var pleaseWait = document.getElementById("loading");
                
                var embedFunction = null;
                
                // Determine which embed function to use
                if (typeof embedNintendo !== 'undefined') embedFunction = embedNintendo;
                else if (typeof embedGameBoy !== 'undefined') embedFunction = embedGameBoy;
                else if (typeof embedGameBoyAdvance !== 'undefined') embedFunction = embedGameBoyAdvance;
                else if (typeof embedSuperNintendo !== 'undefined') embedFunction = embedSuperNintendo;
                else if (typeof embedNintendo64 !== 'undefined') embedFunction = embedNintendo64;
                else if (typeof embedGenesis !== 'undefined') embedFunction = embedGenesis;
                else if (typeof embedDOS !== 'undefined') embedFunction = embedDOS;
                else if (typeof embedMAME !== 'undefined') embedFunction = embedMAME;
                
                if (embedFunction) {
                    try {
                        // Build emulator configuration
                        const emulatorConfig = {
                            container: "game",
                            name: romFilename,
                            rom: xhr.response,
                            soundEnabled: true,
                            showMobileControls: showControls,
                            backText: "RETOUR",
                            soundText: "SON",
                            loadText: "CHARGER",
                            saveText: "SAUVER",
                            backEnabled: false,
                            cbStarted: function() {
                                pleaseWait.style.display = "none";
                                
                                // ============================================================
                                // GAMEPAD TO KEYBOARD MAPPING SYSTEM
                                // ============================================================
                                // Converts gamepad inputs to keyboard events that emulators understand
                                // - Buttons (A/B/X/Y/etc) → mapped to action keys
                                // - Axes (sticks/D-pad) → combined direction system (N/NE/E/SE/S/SW/W/NW)
                                // - Polling runs continuously, auto-detects gamepad connection
                                // - Mobile controls hidden when gamepad is connected
                                // ============================================================
                                
                                let gamepadState = {
                                    buttons: [],
                                    axes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Support up to 10 axes
                                    lastDirection: "C" // Track last combined direction (N, NE, E, SE, S, SW, W, NW, C)
                                };
                                
                                // Standard gamepad button indices
                                const GAMEPAD_BUTTONS = {
                                    A: 0,           // Face button bottom
                                    B: 1,           // Face button right
                                    X: 2,           // Face button left
                                    Y: 3,           // Face button top
                                    L1: 4,          // Left shoulder
                                    R1: 5,          // Right shoulder
                                    L2: 6,          // Left trigger
                                    R2: 7,          // Right trigger
                                    SELECT: 8,      // Select/Back
                                    START: 9,       // Start/Forward
                                    L3: 10,         // Left stick press
                                    R3: 11,         // Right stick press
                                    DPAD_UP: 12,    // D-pad up
                                    DPAD_DOWN: 13,  // D-pad down
                                    DPAD_LEFT: 14,  // D-pad left
                                    DPAD_RIGHT: 15,  // D-pad right
                                    MODE: 16,       // Mode (Xbox button)
                                    EXTRA: 17       // Extra button (some controllers have more)
                                };
                                
                                // Button names for logging
                                const BUTTON_NAMES = {
                                    0: 'A', 1: 'B', 2: 'X', 3: 'Y',
                                    4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2',
                                    8: 'SELECT', 9: 'START',
                                    10: 'L3', 11: 'R3',
                                    12: 'DPAD_UP', 13: 'DPAD_DOWN',
                                    14: 'DPAD_LEFT', 15: 'DPAD_RIGHT',
                                    16: 'MODE', 17: 'EXTRA'
                                };
                                
                                // Map gamepad buttons to emulator controls
                                function getGamepadMapping() {
                                    if (typeof controlsConfig === 'undefined' || !controlsConfig.player1) {
                                        return null;
                                    }
                                    
                                    const p1 = controlsConfig.player1;
                                    return {
                                        // D-pad directions
                                        [GAMEPAD_BUTTONS.DPAD_UP]: p1.up,
                                        [GAMEPAD_BUTTONS.DPAD_DOWN]: p1.down,
                                        [GAMEPAD_BUTTONS.DPAD_LEFT]: p1.left,
                                        [GAMEPAD_BUTTONS.DPAD_RIGHT]: p1.right,
                                        // Face buttons (swap A/B for Nintendo layout)
                                        [GAMEPAD_BUTTONS.B]: p1.a,  // B button = A action
                                        [GAMEPAD_BUTTONS.A]: p1.b,  // A button = B action
                                        // Start/Select
                                        [GAMEPAD_BUTTONS.SELECT]: p1.select,
                                        [GAMEPAD_BUTTONS.START]: p1.start,
                                        // Extra mappings for X/Y buttons
                                        [GAMEPAD_BUTTONS.X]: p1.x || p1.a,
                                        [GAMEPAD_BUTTONS.Y]: p1.y || p1.b,
                                        // Shoulder buttons L1/R1, L2/R2, L3/R3
                                        [GAMEPAD_BUTTONS.L1]: p1.l,
                                        [GAMEPAD_BUTTONS.R1]: p1.r,
                                        [GAMEPAD_BUTTONS.L2]: p1.l2,
                                        [GAMEPAD_BUTTONS.R2]: p1.r2,
                                        [GAMEPAD_BUTTONS.L3]: p1.l3,
                                        [GAMEPAD_BUTTONS.R3]: p1.r3,
                                        // Alternative START button (some controllers use 16)
                                        16: p1.start,
                                        17: p1.select
                                    };
                                }
                                
                                // Convert code to key value and keyCode
                                function getKeyInfo(code) {
                                    // Arrow keys
                                    const arrowKeys = {
                                        'ArrowUp': { key: 'ArrowUp', keyCode: 38 },
                                        'ArrowDown': { key: 'ArrowDown', keyCode: 40 },
                                        'ArrowLeft': { key: 'ArrowLeft', keyCode: 37 },
                                        'ArrowRight': { key: 'ArrowRight', keyCode: 39 }
                                    };
                                    if (arrowKeys[code]) return arrowKeys[code];
                                    
                                    // Special keys
                                    if (code === 'Enter') return { key: 'Enter', keyCode: 13 };
                                    if (code === 'Space') return { key: ' ', keyCode: 32 };
                                    if (code === 'Escape') return { key: 'Escape', keyCode: 27 };
                                    
                                    // Letter keys (KeyA-KeyZ) -> a-z with keyCode 65-90
                                    if (code.startsWith('Key')) {
                                        const letter = code.replace('Key', '');
                                        return { 
                                            key: letter.toLowerCase(), 
                                            keyCode: letter.charCodeAt(0)
                                        };
                                    }
                                    
                                    // Numpad keys
                                    if (code.startsWith('Numpad')) {
                                        const num = code.replace('Numpad', '');
                                        const numpadMap = {
                                            'Divide': { key: '/', keyCode: 111 },
                                            'Multiply': { key: '*', keyCode: 106 },
                                            'Subtract': { key: '-', keyCode: 109 },
                                            'Add': { key: '+', keyCode: 107 },
                                            '0': { key: '0', keyCode: 96 },
                                            '1': { key: '1', keyCode: 97 },
                                            '2': { key: '2', keyCode: 98 },
                                            '3': { key: '3', keyCode: 99 },
                                            '4': { key: '4', keyCode: 100 },
                                            '5': { key: '5', keyCode: 101 },
                                            '6': { key: '6', keyCode: 102 },
                                            '7': { key: '7', keyCode: 103 },
                                            '8': { key: '8', keyCode: 104 },
                                            '9': { key: '9', keyCode: 105 }
                                        };
                                        return numpadMap[num] || { key: num, keyCode: 0 };
                                    }
                                    
                                    return { key: code, keyCode: 0 };
                                }
                                
                                // Simulate keyboard event (compatible with GameBoy emulator)
                                function simulateKeyEvent(code, isPressed) {
                                    if (!code) return; // Skip if no mapping exists
                                    
                                    const eventType = isPressed ? 'keydown' : 'keyup';
                                    const keyInfo = getKeyInfo(code);
                                    
                                    // Create event matching GameBoy's requirements
                                    const eventInit = {
                                        code: code,
                                        key: keyInfo.key,
                                        keyCode: keyInfo.keyCode,
                                        which: keyInfo.keyCode,
                                        bubbles: true,      // MUST bubble to reach document listener
                                        cancelable: false,
                                        shiftKey: false,
                                        ctrlKey: false,
                                        altKey: false
                                    };
                                    
                                    try {
                                        const event = new KeyboardEvent(eventType, eventInit);
                                        document.dispatchEvent(event);
                                    } catch (e) {
                                        console.error('Error simulating key:', e);
                                    }
                                }
                                
                                // Poll gamepad and simulate keyboard events
                                function pollGamepad() {
                                    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                                    const gamepad = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];
                                    
                                    if (!gamepad) return;
                                    
                                    const mapping = getGamepadMapping();
                                    if (!mapping) return;
                                    
                                    // Process buttons
                                    gamepad.buttons.forEach((button, index) => {
                                        const wasPressed = gamepadState.buttons[index];
                                        const isPressed = button.pressed;
                                        
                                        if (wasPressed !== isPressed && mapping[index]) {
                                            simulateKeyEvent(mapping[index], isPressed);
                                        }
                                        
                                        gamepadState.buttons[index] = isPressed;
                                    });
                                    
                                    // Process axes - COMBINED DIRECTION SYSTEM (like virtual joystick)
                                    // This prevents stuck keys by always releasing opposite directions
                                    const axisThreshold = 0.5;
                                    
                                    // Axis names for better logging
                                    const AXIS_NAMES = {
                                        0: 'Left-X', 1: 'Left-Y',
                                        2: 'Right-X', 3: 'Right-Y',
                                        4: 'L2-Analog', 5: 'R2-Analog',
                                        6: 'DPad-X', 7: 'DPad-Y',
                                        9: 'DPad-Combined'
                                    };
                                    
                                    // Log ALL axis movements during detection mode
                                    // Get direction from axis values (like joystick.GetDir())
                                    function getDirectionFromAxes(axisX, axisY) {
                                        var dir = "";
                                        
                                        // Vertical component
                                        if (axisY < -axisThreshold) {
                                            dir = "N"; // North (up)
                                        } else if (axisY > axisThreshold) {
                                            dir = "S"; // South (down)
                                        } else {
                                            dir = "C"; // Center
                                        }
                                        
                                        // Horizontal component
                                        if (axisX < -axisThreshold) {
                                            dir = (dir === "C") ? "W" : dir + "W"; // West (left)
                                        } else if (axisX > axisThreshold) {
                                            dir = (dir === "C") ? "E" : dir + "E"; // East (right)
                                        }
                                        
                                        return dir;
                                    }
                                    
                                    // Combine left stick (axes[0,1]) and D-pad (axes[6,7])
                                    // Priority: D-pad overrides stick (if both are active)
                                    var axisX = gamepad.axes[0] || 0;
                                    var axisY = gamepad.axes[1] || 0;
                                    
                                    // If D-pad axes exist and are active, use them instead
                                    if (gamepad.axes.length > 7) {
                                        const dpadX = gamepad.axes[6] || 0;
                                        const dpadY = gamepad.axes[7] || 0;
                                        
                                        if (Math.abs(dpadX) > axisThreshold || Math.abs(dpadY) > axisThreshold) {
                                            axisX = dpadX;
                                            axisY = dpadY;
                                        }
                                    }
                                    
                                    // Get current and previous direction
                                    const currentDirection = getDirectionFromAxes(axisX, axisY);
                                    const previousDirection = gamepadState.lastDirection || "C";
                                    
                                    // Only update if direction changed
                                    if (currentDirection !== previousDirection) {
                                        // For axis-based directions (stick/D-pad), use REAL directional keys
                                        // NOT button mappings which are for discrete D-pad buttons (12-15)
                                        if (typeof controlsConfig === 'undefined' || !controlsConfig.player1) {
                                            return; // No controls configured
                                        }
                                        
                                        const p1 = controlsConfig.player1;
                                        const keyUp = p1.up;
                                        const keyDown = p1.down;
                                        const keyLeft = p1.left;
                                        const keyRight = p1.right;
                                        
                                        // Apply direction logic (same as virtual joystick)
                                        switch (currentDirection) {
                                            case "N":
                                                simulateKeyEvent(keyUp, true);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                            
                                            case "S":
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, true);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                            
                                            case "W":
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, true);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                            
                                            case "E":
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, true);
                                                break;
                                            
                                            case "NW":
                                                simulateKeyEvent(keyUp, true);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, true);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                            
                                            case "NE":
                                                simulateKeyEvent(keyUp, true);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, true);
                                                break;
                                            
                                            case "SE":
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, true);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, true);
                                                break;
                                            
                                            case "SW":
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, true);
                                                simulateKeyEvent(keyLeft, true);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                            
                                            default: // "C" = center/neutral
                                                simulateKeyEvent(keyUp, false);
                                                simulateKeyEvent(keyDown, false);
                                                simulateKeyEvent(keyLeft, false);
                                                simulateKeyEvent(keyRight, false);
                                                break;
                                        }
                                        
                                        gamepadState.lastDirection = currentDirection;
                                    }
                                    
                                    // Save all axis states for next poll
                                    gamepad.axes.forEach((value, index) => {
                                        gamepadState.axes[index] = value;
                                    });
                                }
                                
                                // Start gamepad polling when connected
                                let gamepadPollInterval = null;
                                
                                function startGamepadPolling() {
                                    if (gamepadPollInterval) return;
                                    gamepadPollInterval = setInterval(pollGamepad, 16); // ~60fps
                                }
                                
                                // Listen for gamepad connection/disconnection
                                window.addEventListener('gamepadconnected', function(e) {
                                    showToast('🎮 Manette connectée: ' + e.gamepad.id, 3000);
                                    // Hide mobile controls when gamepad is connected
                                    setTimeout(function() {
                                        const mobileControls = document.querySelector('.ejs_virtualGamepad');
                                        if (mobileControls) {
                                            mobileControls.style.display = 'none';
                                        }
                                    }, 100);
                                });
                                
                                window.addEventListener('gamepaddisconnected', function(e) {
                                    showToast('❌ Manette déconnectée', 3000);
                                    // Show mobile controls when gamepad is disconnected (only on mobile)
                                    if (isMobileDevice()) {
                                        setTimeout(function() {
                                            const mobileControls = document.querySelector('.ejs_virtualGamepad');
                                            if (mobileControls) {
                                                mobileControls.style.display = 'block';
                                            }
                                        }, 100);
                                    }
                                });
                                
                                // Start gamepad polling immediately
                                startGamepadPolling();
                                
                                // Check if gamepad is already connected
                                setTimeout(function() {
                                    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
                                    for (let i = 0; i < gamepads.length; i++) {
                                        if (gamepads[i]) {
                                            showToast('🎮 Manette détectée: ' + gamepads[i].id, 3000);
                                            const mobileControls = document.querySelector('.ejs_virtualGamepad');
                                            if (mobileControls) {
                                                mobileControls.style.display = 'none';
                                            }
                                            break;
                                        }
                                    }
                                }, 500);
                            },
                            cbError: function(error) {
                                showError("L'émulateur n'a pas pu charger ce jeu. Format de ROM incompatible ou fichier corrompu.");
                            }
                        };
                        
                        // Add controls configuration if available
                        if (typeof controlsConfig !== 'undefined') {
                            if (controlsConfig.player1) {
                                emulatorConfig.player1 = controlsConfig.player1;
                            }
                            if (controlsConfig.player2) {
                                emulatorConfig.player2 = controlsConfig.player2;
                            }
                        }
                        
                        emulatorInstance = embedFunction(emulatorConfig);
                    } catch (error) {
                        showError("Erreur lors de l'initialisation de l'émulateur: " + error.message);
                    }
                } else {
                    showError("Émulateur non chargé correctement. Veuillez rafraîchir la page.");
                }
            } else {
                showError("Erreur HTTP " + xhr.status + ": Impossible de charger la ROM.");
            }
        }
    });
    
    xhr.addEventListener("error", function() {
        showError("Erreur réseau lors du chargement de la ROM.");
    });
    
    xhr.send();
}
