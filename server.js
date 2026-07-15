/**
 * @file server.js
 * @description Serveur Node.js / Express (Hub Aky & Rakai) + Pont Web3 (CVNU)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

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

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'docs')));

// 1. CHARGEMENT DU NOYAU CVNU (Mise à jour du chemin vers core/)
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
    // Si le noyau est connecté, on renvoie ses vraies valeurs, sinon on simule le MVP
    const data = (CVNU_CORE && CVNU_CORE.STATE && CVNU_CORE.STATE.USER_CVNU) 
        ? {
            level: CVNU_CORE.STATE.USER_CVNU.level,
            value_points: CVNU_CORE.STATE.USER_CVNU.value_points,
            tax_ai: CVNU_CORE.STATE.TREASURY ? CVNU_CORE.STATE.TREASURY.total_collected : 0
        }
        : { level: 1, value_points: 750, tax_ai: 51.00 }; // Simulation MVP

    res.json({ success: true, data });
});

// Démarrage du serveur et du pont Web3
app.listen(PORT, async () => {
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║ 🚀 OMNISCIENT NODE & WEB3 ACTIVE - PORT: ${PORT}              ║`);
    console.log(`║ 📡 HUB: Aky (Hack-Ki) & Rakai (MPD218)                     ║`);
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    // Lancement de l'Oracle
    if (FiatBridgeOracle) {
        try {
            const oracle = new FiatBridgeOracle();
            await oracle.start(); // Lance l'écoute des Smart Contracts
        } catch (error) {
            console.error("🔴 [WEB3] Erreur de connexion à la Blockchain :", error.message);
        }
    }
});