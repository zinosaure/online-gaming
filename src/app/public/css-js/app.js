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

/**
 * ================================================
 * SCAN FUNCTIONALITY
 * ================================================
 */

/**
 * Lance le scan des ROMs
 */
async function scanRoms() {
    const button = document.getElementById('scanButton');
    if (!button) return;
    
    // Désactiver le bouton pendant le scan
    button.disabled = true;
    button.textContent = '⏳ Scan en cours...';
    
    try {
        const response = await fetch('/scan');
        const data = await response.json();
        
        if (data.status === 'success') {
            showToast(`✅ ${data.games_count} jeux scannés avec succès!`, 'success');
            
            // Si on est sur la page d'accueil avec recherche, rafraîchir les résultats
            if (typeof performSearch === 'function') {
                const searchInput = document.getElementById('searchInput');
                if (searchInput && searchInput.value.trim()) {
                    performSearch(searchInput.value);
                }
            }
        } else {
            showToast('❌ Erreur lors du scan', 'error');
        }
    } catch (error) {
        console.error('Erreur scan:', error);
        showToast('❌ Erreur de connexion', 'error');
    } finally {
        button.disabled = false;
        button.textContent = '🔍 Scan';
    }
}

/**
 * Recherche des jeux
 * @param {string} query - Terme de recherche
 */
async function performSearch(query) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            return data.results;
        } else if (data.status === 'error' && data.message.includes('Index not found')) {
            showToast('⚠️ Veuillez d\'abord scanner les jeux', 'info');
            return [];
        }
        return [];
    } catch (error) {
        console.error('Erreur recherche:', error);
        return [];
    }
}

/**
 * Génère les initiales pour un placeholder
 * @param {string} name - Nom du jeu
 * @returns {string}
 */
function getInitials(name) {
    const words = name.replace(/[_-]/g, ' ').split(' ').filter(w => w.length > 0);
    return words.map(w => w[0].toUpperCase()).slice(0, 3).join('');
}

/**
 * ================================================
 * EVENT LISTENERS
 * ================================================
 */

// Initialisation quand le DOM est chargé
document.addEventListener('DOMContentLoaded', function() {
    // Bouton Scan
    const scanButton = document.getElementById('scanButton');
    if (scanButton) {
        scanButton.addEventListener('click', scanRoms);
    }
    
    // Lien À propos
    const aboutLink = document.getElementById('aboutLink');
    if (aboutLink) {
        aboutLink.addEventListener('click', function(e) {
            e.preventDefault();
            showToast('Console de jeux rétro • Version 2.0', 'info', 4000);
        });
    }
});

// Log de chargement
console.log('🎮 Retro Gaming Console loaded');
