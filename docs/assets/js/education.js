/**
 * CORE_SYSTEM: education.js
 * Module de gestion de la matrice d'apprentissage et du dictionnaire lexical.
 * Gère le rendu DOM et la communication avec le serveur Node.js pour l'écriture JSON.
 */

// État global de l'application
let appState = { exercises: [], lexicon: [] };

// --- 1. CHARGEMENT DEPUIS LE FICHIER JSON ---

async function initializeData() {
    try {
        // Chargement depuis le nouveau répertoire
        const response = await fetch('assets/json/education.json');
        
        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        appState = await response.json(); 
        renderAll(); 
    } catch (error) {
        console.error("Erreur de chargement du fichier JSON :", error);
        document.getElementById('exercise-grid').innerHTML = `<p style="color:var(--color-accent-orange)">Erreur : Impossible de charger assets/json/education.json. Vérifiez le chemin ou l'état du serveur.</p>`;
    }
}

// --- 2. SAUVEGARDE AUTOMATIQUE VERS LE SERVEUR NODE.JS ---

async function saveToServer() {
    try {
        // Envoi des données au serveur Node.js via une route API
        const response = await fetch('/api/save-education', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(appState)
        });

        if (!response.ok) {
            console.error("Erreur lors de la sauvegarde sur le serveur.");
        } else {
            console.log("Progression sauvegardée dans assets/json/education.json");
        }
    } catch (error) {
        console.error("Erreur de communication avec le serveur :", error);
    }
}

// --- 3. LOGIQUE MÉTIER ET RENDU DOM ---

function getColorByProgress(value) {
    if(value >= 80) return 'green';
    if(value >= 30) return 'cyan';
    return 'orange';
}

// Fonction simplifiée : Uniquement de l'incrémentation (+5%)
function incrementProgress(type, index) {
    let targetArray = type === 'exercise' ? appState.exercises : appState.lexicon;
    
    let newVal = targetArray[index].progress + 5;
    if (newVal > 100) newVal = 100; // Bloque à 100%
    
    targetArray[index].progress = newVal;
    targetArray[index].color = getColorByProgress(newVal);

    // Rendu UI et sauvegarde automatique
    if (type === 'exercise') renderExercises();
    else renderLexicon();
    
    saveToServer(); 
}

function renderExercises() {
    const gridContainer = document.getElementById('exercise-grid');
    if(!gridContainer) return;

    gridContainer.innerHTML = ''; 
    appState.exercises.forEach((exo, index) => {
        gridContainer.innerHTML += `
            <div class="card bg-surface border-standard radius-md p-sm flex-col justify-between">
                <div>
                    <h3 class="font-mono text-main mb-xs">0${exo.id}. ${exo.title}</h3>
                    <p class="small-text text-muted mb-sm" style="min-height: 36px;">${exo.desc}</p>
                </div>
                <div>
                    <div class="progress-bar-container radius-sm bg-base mb-xs">
                        <div class="progress-bar bg-${exo.color} radius-sm" style="width: ${exo.progress}%; height: 6px; transition: width 0.3s ease;"></div>
                    </div>
                    <div class="hud-controls">
                        <span class="small-text highlight-${exo.color} font-mono">${exo.progress}%</span>
                        <button class="hud-btn" onclick="incrementProgress('exercise', ${index})">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderLexicon() {
    const lexiconContainer = document.getElementById('lexicon-grid');
    if(!lexiconContainer) return;

    lexiconContainer.innerHTML = '';
    appState.lexicon.forEach((lex, index) => {
        lexiconContainer.innerHTML += `
            <div class="bg-base border-standard radius-sm p-sm flex-col justify-between">
                <div>
                    <span class="font-mono highlight-${lex.color}" style="font-size: 1.1rem;">"${lex.word}"</span>
                    <p class="small-text text-muted m-0 mb-sm" style="min-height: 36px;">${lex.desc}</p>
                </div>
                <div>
                    <div class="progress-bar-container radius-sm bg-surface mb-xs">
                        <div class="progress-bar bg-${lex.color} radius-sm" style="width: ${lex.progress}%; height: 4px; transition: width 0.3s ease;"></div>
                    </div>
                    <div class="hud-controls" style="margin-top: 4px;">
                        <span class="small-text highlight-${lex.color} font-mono">${lex.progress}%</span>
                        <button class="hud-btn" onclick="incrementProgress('lexicon', ${index})">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderAll() {
    renderExercises();
    renderLexicon();
}

// Lancement au chargement
document.addEventListener('DOMContentLoaded', initializeData);