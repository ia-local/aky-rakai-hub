/**
 * @file main.js
 * @description Orchestrateur Front-End du Hub Aky & Rakai
 * @module Main
 */

import { initController } from './controller.js';
import { initTelemetry } from './telemetry.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log("✅ [SYSTEM] Boot sequence initiated. HUD modules loading...");
    
    // 1. Synchronisation de l'Horloge Système
    const dateDisplay = document.getElementById('sys-date');
    if (dateDisplay) {
        const updateClock = () => {
            const now = new Date();
            dateDisplay.textContent = now.toLocaleString('fr-FR', { 
                weekday: 'short', year: 'numeric', month: 'short', 
                day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
            });
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    // 2. Initialisation des Sous-Systèmes
    initTelemetry();
    initController();
    
    console.log("✅ [SYSTEM] HUD fully operational.");
});