/**
 * @file server.js
 * @description Serveur Node.js / Express (Hub Aky & Rakai) + Pont Web3 (CVNU)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
// Remplacement de exec par spawn pour un processus persistant
const { spawn } = require('child_process'); 
const Groq = require('groq-sdk');

// Import de l'Oracle Blockchain (Pont Web3)
let FiatBridgeOracle = null;
try {
    FiatBridgeOracle = require('./blockchain_backend/oracle.js');
} catch (e) {
    console.warn("⚠️ Oracle Blockchain non trouvé ou erreur :", e.message);
}

// Initialisation de l'application
const app = express();
const PORT = 3145;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// =========================================================================
// 🚀 PROCESSUS ZSH PERSISTANT (Chargement du .zshrc UNE SEULE FOIS)
// =========================================================================
const zshShell = spawn('zsh', [], { env: process.env }); 
let shellResolve = null;
let shellBuffer = "";
const END_MARKER = "___AGI_CMD_END___"; // Délimiteur de fin de commande

// Écoute de la sortie standard (stdout)
zshShell.stdout.on('data', (data) => {
    shellBuffer += data.toString();
    
    // Détection du marqueur de fin d'exécution
    if (shellBuffer.includes(END_MARKER)) {
        const cleanOutput = shellBuffer.replace(END_MARKER + '\n', '').replace(END_MARKER, '').trim();
        if (shellResolve) {
            shellResolve(cleanOutput);
            shellResolve = null;
        }
        shellBuffer = ""; // Réinitialisation pour la commande suivante
    }
});

// Écoute des erreurs natives (stderr)
zshShell.stderr.on('data', (data) => {
    shellBuffer += data.toString();
});

// Vidage du buffer initial après 2 secondes
setTimeout(() => { 
    shellBuffer = ""; 
    console.log("✅ [TERMINAL] Processus ZSH persistant initialisé avec succès.");
}, 2000); 
// =========================================================================
// =========================================================================
// 🛡️ SÉCURITÉ : GESTION DES CRASHES ET FERMETURE PROPRE (GRACEFUL SHUTDOWN)
// =========================================================================

// Si le terminal ZSH crash tout seul
zshShell.on('error', (error) => {
    console.error("🚨 [TERMINAL AGI] Le processus ZSH a crashé :", error);
});

zshShell.on('exit', (code) => {
    console.log(`🛑 [TERMINAL AGI] Processus ZSH terminé avec le code ${code}`);
});

// Intercepter Ctrl+C (SIGINT) et les arrêts système (SIGTERM)
const shutdownServer = () => {
    console.log("\n🛑 [SYSTÈME] Arrêt du Hub demandé. Nettoyage en cours...");
    
    // Tuer le processus enfant persistant
    if (zshShell && !zshShell.killed) {
        zshShell.kill('SIGKILL');
        console.log("💀 [TERMINAL AGI] Processus ZSH zombie éliminé.");
    }
    
    // Fermer Node.js proprement
    console.log("👋 [SYSTÈME] Déconnexion réussie. À bientôt !");
    process.exit(0);
};

process.on('SIGINT', shutdownServer);
process.on('SIGTERM', shutdownServer);
// =========================================================================

// 1. CHARGEMENT DU NOYAU CVNU
let CVNU_CORE = null;
try {
    CVNU_CORE = require('./docs/core/CORE_SYSTEM_CVNU.js');
    console.log("✅ Noyau CVNU chargé avec succès depuis docs/core/.");
} catch (e) {
    console.warn("⚠️ CORE_SYSTEM_CVNU.js introuvable :", e.message);
}

// 2. BIBLIOTHÈQUE LINGUISTIQUE (Chien & Chat)
const PetLinguistics = {
    DOG: {
        "haletement_rapide": { meaning: "Thermorégulation, excitation ou décompression", val_rup: 2 },
        "posture_sur_le_dos": { meaning: "Soumission apaisée, confiance totale", val_rup: 5 },
        "morsure_inhibee": { meaning: "Contrôle de la mâchoire (Exercice 10)", val_rup: 10 },
        "reponse_nom": { meaning: "Focus immédiat acquis", val_rup: 5 },
        "toilette": { meaning: "Association du lieu pour les besoins", val_rup: 8 }
    },
    CAT: {
        "observation_distante": { meaning: "Curiosité saine sans agressivité", val_rup: 5 },
        "frappe_sans_griffe": { meaning: "Fixation des limites territoriales", val_rup: 3 },
        "promenade_partagee": { meaning: "Cohabitation et harmonie de meute", val_rup: 15 }
    }
};

// 3. ENDPOINT : LE GUIDE OMNISCIENT
app.post('/api/omniscient-guide', (req, res) => {
    const { species, behavior, context_note } = req.body;
    let interpretation = "Analyse AGI en cours...";
    let rewardPoints = 0;
    
    if (species && behavior && PetLinguistics[species.toUpperCase()][behavior]) {
        const data = PetLinguistics[species.toUpperCase()][behavior];
        interpretation = data.meaning;
        rewardPoints = data.val_rup;
        
        if (CVNU_CORE && CVNU_CORE.system) {
            CVNU_CORE.system.addCVNUPoints(rewardPoints);
        }
    }

    const oracleResponse = {
        timestamp: new Date().toISOString(),
        entity: species === 'DOG' ? 'AKY (Hack-Ki)' : 'RAKAI (MPD218)',
        analysis: interpretation,
        context: context_note || "Observation standard",
        cvnu_impact: `+${rewardPoints} UTMi générés.`
    };

    if (CVNU_CORE && CVNU_CORE.system) {
        CVNU_CORE.system.logInteraction('GUIDE_OMNISCIENT', JSON.stringify(oracleResponse));
    }

    res.json({ success: true, oracle_insight: oracleResponse });
});

// 4. ENDPOINT : GESTION DE LA MÉMOIRE (soup.md)
app.get('/api/memory/soup', (req, res) => {
    const soupPath = path.join(__dirname, 'soup.md');
    if (fs.existsSync(soupPath)) {
        const content = fs.readFileSync(soupPath, 'utf8');
        res.json({ success: true, content });
    } else {
        res.json({ success: false, error: "Fichier soup.md introuvable." });
    }
});

app.post('/api/memory/soup', (req, res) => {
    const { new_entry } = req.body;
    const soupPath = path.join(__dirname, 'soup.md');
    
    try {
        const timestamp = `\n\n### [${new Date().toISOString()}]\n`;
        fs.appendFileSync(soupPath, timestamp + new_entry, 'utf8');
        res.json({ success: true, message: "Mémoire synchronisée." });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// 5. ENDPOINT : ÉTAT DU CVNU (Pour le Défi 28 Jours)
app.get('/api/cvnu/status', (req, res) => {
    const data = (CVNU_CORE && CVNU_CORE.STATE && CVNU_CORE.STATE.USER_CVNU) 
        ? {
            level: CVNU_CORE.STATE.USER_CVNU.level,
            value_points: CVNU_CORE.STATE.USER_CVNU.value_points,
            tax_ai: CVNU_CORE.STATE.TREASURY ? CVNU_CORE.STATE.TREASURY.total_collected : 0
        }
        : { level: 1, value_points: 750, tax_ai: 51.00 }; 

    res.json({ success: true, data });
});

// Route pour lister les images dynamiquement
app.get('/api/gallery/images', (req, res) => {
    const imgDir = path.join(__dirname, 'docs', 'assets', 'img');
    
    fs.readdir(imgDir, (err, files) => {
        if (err) {
            console.error("Erreur lecture dossier img :", err);
            return res.status(500).json({ error: "Impossible de lire le dossier." });
        }
        const images = files.filter(f => /\.(jpg|png|jpeg|webp)$/i.test(f));
        res.json(images);
    });
});

// Route pour écouter la sauvegarde automatique de l'éducation
app.post('/api/save-education', express.json(), (req, res) => {
    const filePath = path.join(__dirname, 'docs','assets', 'json', 'education.json');
    
    try {
        fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), 'utf8');
        res.status(200).json({ success: true, message: "Fichier mis à jour avec succès." });
    } catch (error) {
        console.error("Erreur d'écriture JSON :", error);
        res.status(500).json({ success: false, error: "Impossible de modifier le fichier." });
    }
});

/**
 * ROUTE : /api/terminal-agi
 * Rôle : Pont entre le Frontend, le Terminal ZSH (PERSISTANT) et le LLM Local.
 */
app.post('/api/terminal-agi', async (req, res) => {
    const { command } = req.body;

    if (!command) {
        return res.status(400).json({ error: 'Commande vide.' });
    }

    console.log(`[TERMINAL AGI] Exécution demandée : ${command}`);

    try {
        // Exécution dans le processus persistant
        const rawOutput = await new Promise((resolve) => {
            shellResolve = resolve;
            shellBuffer = ""; // Sécurité : on vide le buffer avant la nouvelle commande
            
            // Envoi de la commande + redirection des erreurs + echo du marqueur de fin
            zshShell.stdin.write(`${command} 2>&1; echo "${END_MARKER}"\n`);
        });

        console.log(`[TERMINAL AGI] Résultat brut capturé (${rawOutput.length} caractères)`);

        // Transmission à l'IA pour formatage
        const aiInterpretation = await interpretWithAGI(command, rawOutput);
        res.json({ ai_interpretation: aiInterpretation });

    } catch (error) {
        console.error("[TERMINAL AGI] Erreur critique du processus ZSH:", error);
        res.status(500).json({ ai_interpretation: `<span class="highlight-orange">Erreur interne : Le processus shell a échoué.</span>` });
    }
});

/**
 * FONCTION : interpretWithAGI
 * Rôle : Préparer le prompt et interroger le modèle IA via Groq SDK
 */
async function interpretWithAGI(cmd, rawOutput) {
    const prompt = `
        L'utilisateur a exécuté la commande bash/zsh suivante : ${cmd}
        
        Voici le retour brut du terminal :
        ${rawOutput}
        
        Tâche : Formate ce résultat pour qu'il soit lisible dans une interface web (utilise des balises HTML comme <strong>, <br>, ou <code>). Si c'est une erreur, explique-la brièvement. Garde un ton technique, synthétique et analytique. Ne renvoie QUE le code HTML, sans introduction markdown ni balises de bloc de code.
    `;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es l'Intelligence Artificielle du Hub, un agent AGI expert en systèmes terminaux. Tu réponds UNIQUEMENT en code HTML valide et brut."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2, 
            max_tokens: 1500
        });

        let aiResponse = chatCompletion.choices[0].message.content;
        aiResponse = aiResponse.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        return aiResponse;

    } catch (e) {
        console.error("🔴 [TERMINAL AGI] Erreur de connexion au modèle Groq :", e.message);

        const safeOutput = rawOutput.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 1000);
        const isError = rawOutput.toLowerCase().includes("command not found") || rawOutput.toLowerCase().includes("error");
        
        return `
            <div style="margin-bottom: 0.5rem;">
                <strong class="${isError ? 'highlight-orange' : 'highlight-cyan'}">Analyse système (Mode Dégradé) :</strong> <code>${cmd}</code>
            </div>
            <div class="bg-surface p-sm radius-sm border-standard font-mono text-muted" style="white-space: pre-wrap; font-size: 0.85rem; max-height: 150px; overflow-y: auto;">${safeOutput}${rawOutput.length > 1000 ? '\n...[Output tronqué]' : ''}</div>
            <div style="margin-top: 0.5rem;">
                <span class="highlight-green">Diagnostic :</span> ${isError ? 'Action requise. La commande a échoué.' : 'Exécution terminale validée par le noyau.'}
                <br><small class="text-muted highlight-orange">Attention: Analyse AGI indisponible (Erreur réseau/API).</small>
            </div>
        `;
    }
}

/**
 * ROUTE : /api/chat-agi
 * Rôle : Mode Conversationnel (Langage naturel). L'IA répond normalement sans exécuter de commande.
 */
app.post('/api/chat-agi', async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: 'Message vide.' });
    }

    console.log(`[CHAT AGI] Message reçu : ${message}`);

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Tu es l'Intelligence Artificielle du Hub Aky & Rakai. L'utilisateur te parle en langage naturel. Réponds de manière concise, intelligente et amicale. Formate tes réponses directement en HTML brut (ex: utilise <strong>, <em>, <br> ou <span class='highlight-cyan'>) pour une belle intégration web. Ne renvoie AUCUNE balise Markdown comme ```html."
                },
                {
                    role: "user",
                    content: message
                }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.6, 
            max_tokens: 800
        });

        let aiResponse = chatCompletion.choices[0].message.content;
        aiResponse = aiResponse.replace(/^```html\n?/, '').replace(/\n?```$/, '');
        res.json({ response: aiResponse });

    } catch (e) {
        console.error("🔴 [CHAT AGI] Erreur Groq :", e.message);
        res.status(500).json({ response: `<span class="highlight-orange">Connexion aux serveurs cognitifs interrompue.</span>` });
    }
});

// Démarrage du serveur et du pont Web3
app.listen(PORT, async () => {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║ 🚀 OMNISCIENT NODE & WEB3 ACTIVE - PORT: ${PORT}              ║`);
    console.log(`║ 📡 HUB: Aky (Hack-Ki) & Rakai (MPD218)                     ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    if (FiatBridgeOracle) {
        try {
            const oracle = new FiatBridgeOracle();
            await oracle.start(); 
        } catch (error) {
            console.error("🔴 [WEB3] Blockchain indisponible, mais serveur opérationnel.");
        }
    }
});