/**
 * @file controller.js
 * @description Gestion des inputs utilisateur et appels API (Omniscient Guide)
 * @module Controller
 */

import { appendLog } from './telemetry.js';

export function initController() {
    const btnAnalyze = document.getElementById('btn-analyze');
    const selectBehavior = document.getElementById('behavior-select');
    const oracleOutput = document.getElementById('oracle-output');

    if (!btnAnalyze || !selectBehavior || !oracleOutput) return;

    btnAnalyze.addEventListener('click', async () => {
        // Extraction des données du select (ex: "DOG:haletement_rapide")
        const [species, behavior] = selectBehavior.value.split(':');
        
        // État de chargement UI
        oracleOutput.innerHTML = `<p class="text-muted font-mono animate-pulse">Analyses sensorielles en cours de transmission...</p>`;
        appendLog(`[AGI_REQ] Transmission du pattern : ${behavior}`);

        try {
            // Appel à notre API Node.js locale
            const response = await fetch('http://localhost:3145/api/omniscient-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ species, behavior, context_note: "Saisie via HUD Central" })
            });

            const data = await response.json();

            if (data.success) {
                const insight = data.oracle_insight;
                // Formatage de la réponse dans la carte
                oracleOutput.innerHTML = `
                    <h4 class="highlight-cyan font-mono mb-sm">🎯 ENTITÉ : ${insight.entity}</h4>
                    <p class="mb-md text-main">${insight.analysis}</p>
                    <div class="bg-cyan p-sm radius-sm text-base font-mono inline-block">
                        ${insight.cvnu_impact}
                    </div>
                `;
                appendLog(`[AGI_RES] Analyse confirmée. ${insight.cvnu_impact}`);
            } else {
                throw new Error("Rejet de l'Oracle");
            }
        } catch (error) {
            oracleOutput.innerHTML = `<p class="highlight-orange font-mono">⚠️ Erreur de connexion au noeud serveur (Port 3145).</p>`;
            appendLog(`[SYS_ERR] Échec de la requête AGI : ${error.message}`);
        }
    });
}