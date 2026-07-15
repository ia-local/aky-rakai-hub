/**
 * @file telemetry.js
 * @description Gestion des logs, du terminal visuel et synchronisation mémoire
 * @module Telemetry
 */

const terminalNode = document.querySelector('#terminal-output pre code');
const terminalContainer = document.getElementById('terminal-drawer');

export function initTelemetry() {
    appendLog("[SYS] Module Télémétrie activé.");
    syncSoupMemory();
}

/**
 * Ajoute une ligne de log dans le terminal virtuel et force le scroll vers le bas
 * @param {string} message 
 */
export function appendLog(message) {
    if (!terminalNode) return;
    
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const newLog = `\n[${timestamp}] ${message}`;
    
    // Ajout au DOM
    terminalNode.insertAdjacentText('beforeend', newLog);
    
    // Auto-scroll physique pour simuler un terminal réel
    if (terminalContainer) {
        terminalContainer.scrollTop = terminalContainer.scrollHeight;
    }
}

/**
 * Tente de lire l'état actuel de soup.md via l'API pour confirmer la connexion
 */
async function syncSoupMemory() {
    try {
        const response = await fetch('http://localhost:3145/api/memory/soup');
        const data = await response.json();
        
        if (data.success) {
            appendLog("[MEM] Fichier soup.md synchronisé. Prêt pour l'écriture.");
            // On pourrait optionnellement injecter un extrait de la mémoire ici
        } else {
            appendLog("[MEM_ERR] Fichier soup.md introuvable sur le serveur.");
        }
    } catch (error) {
        appendLog("[NET_WARN] API Mémoire injoignable. Le serveur Node.js est-il lancé ?");
    }
}