/**
 * ================================================
 * RETRO GAMING CONSOLE - APP.JS
 * ================================================
 * Fonctions JavaScript communes à toutes les pages
 */

/**
 * Détecte si l'appareil est mobile
 * @returns {boolean}
 */
function isMobileDevice() {
    return !!(
        navigator.userAgent.match(/Android/i) ||
        navigator.userAgent.match(/iPhone/i) ||
        navigator.userAgent.match(/iPad/i) ||
        navigator.userAgent.match(/iPod/i)
    );
}

/**
 * Détecte si l'appareil est tactile
 * @returns {boolean}
 */
function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Affiche un message toast (notification temporaire)
 * @param {string} message - Le message à afficher
 * @param {string} type - Type de message ('success', 'error', 'info')
 * @param {number} duration - Durée en ms (défaut: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Démarre le mode plein écran
 */
function requestFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

/**
 * Quitte le mode plein écran
 */
function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

/**
 * Toggle plein écran
 */
function toggleFullscreen() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        requestFullscreen();
    } else {
        exitFullscreen();
    }
}

/**
 * Sauvegarde une donnée dans localStorage
 * @param {string} key - Clé de stockage
 * @param {any} value - Valeur à sauvegarder
 */
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        console.error('Erreur localStorage:', e);
        return false;
    }
}

/**
 * Récupère une donnée depuis localStorage
 * @param {string} key - Clé de stockage
 * @param {any} defaultValue - Valeur par défaut si absent
 * @returns {any}
 */
function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Erreur localStorage:', e);
        return defaultValue;
    }
}

/**
 * Formate un nom de fichier pour l'affichage
 * @param {string} filename - Nom du fichier
 * @returns {string}
 */
function formatFilename(filename) {
    // Retire l'extension et nettoie le nom
    return filename
        .replace(/\.[^/.]+$/, '')
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Animations CSS à ajouter dynamiquement
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Log de chargement
console.log('🎮 Retro Gaming Console loaded');
