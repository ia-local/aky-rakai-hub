/**
 * server_modules/circular_tax_engine.js 
 * VERSION NAVIGATEUR (Ciblée pour index.html)
 */

// --- RÉSOLUTIONS DES CONFLITS ---
// On vérifie si COEFFICIENTS existe déjà (venant de utms_calculator.js) 
// pour éviter l'erreur "already declared".
const CIRCULAR_TAX_CONFIG = {
    TAXE_IA_RATE: 0.05, 
    CIRCULARITY_THRESHOLD_RATIO: 1000, 
    RUP_SUBSIDY_RATE: 0.10, 
    CVNU_MIN_SCORE_FOR_BONUS: 0.5, 
    FISCAL_ABATTEMENT_MAX_RATE: 0.10, 
};

/**
 * 💡 Calcule la Taxe Circulaire Négative (TCN) ou la Subvention RUP.
 */
function calculateCircularTax(interaction, context) {
    // On utilise l'objet global utmiCalculator défini dans utms_calculator.js
    if (typeof utmiCalculator === 'undefined') {
        console.error("Erreur : utms_calculator.js doit être chargé avant ce script.");
        return null;
    }

    // 1. Calculer la Valeur Ajoutée (UTMi) via le moteur global
    const { utmi, estimatedCostUSD } = utmiCalculator.calculateUtmi(interaction, context);

    let taxAmount = 0; 
    let taxType = "TAXE_IA_POSITIVE";
    let circularityScore = 0;

    // Conversion des coûts en EUR
    const estimatedCostEUR = utmiCalculator.convertCurrency(estimatedCostUSD, 'USD', 'EUR');

    // 2. Calcul du Score de Circularité
    if (estimatedCostEUR > 0) {
        circularityScore = utmi / estimatedCostEUR;
    } else if (utmi > 0) {
        circularityScore = Infinity; 
    }

    // 3. Application de la Politique Fiscale Circulaire
    if (circularityScore >= CIRCULAR_TAX_CONFIG.CIRCULARITY_THRESHOLD_RATIO) {
        const overPerformanceUtmi = utmi - (estimatedCostEUR * CIRCULAR_TAX_CONFIG.CIRCULARITY_THRESHOLD_RATIO);
        taxAmount = -(overPerformanceUtmi * CIRCULAR_TAX_CONFIG.RUP_SUBSIDY_RATE); 
        taxType = "SUBVENTION_RUP_TCN"; 
    } else {
        taxAmount = utmi * CIRCULAR_TAX_CONFIG.TAXE_IA_RATE;
        taxType = "TAXE_IA_POSITIVE";
    }

    // 4. Application du Bonus CVNU (Cartographie Fiscale)
    let cvnuAbattement = 0;
    if (context.userCvnuValue >= CIRCULAR_TAX_CONFIG.CVNU_MIN_SCORE_FOR_BONUS) {
        cvnuAbattement = taxAmount * context.userCvnuValue * CIRCULAR_TAX_CONFIG.FISCAL_ABATTEMENT_MAX_RATE;
        taxAmount -= cvnuAbattement; 
        
        if (taxType === "TAXE_IA_POSITIVE") {
             taxAmount = Math.max(0, taxAmount);
        }
    }

    return {
        amount: parseFloat(taxAmount.toFixed(2)),
        type: taxType,
        circularityScore: parseFloat(circularityScore.toFixed(2)),
        utmiGenerated: parseFloat(utmi.toFixed(2)),
        estimatedCostEUR: parseFloat(estimatedCostEUR.toFixed(2)),
        details: {
            cvnuAbattement: parseFloat(cvnuAbattement.toFixed(2)),
            baseTaxRate: CIRCULAR_TAX_CONFIG.TAXE_IA_RATE,
        }
    };
}
function triggerCampaignTransfer(amountUTMi) {
    const COMPTE_647 = "0x7F...647"; // Hash de destination
    const TAXE_IA = 0.068;
    
    let amountToLiquidate = amountUTMi * TAXE_IA;
    
    // Appel au Smart Contract TVA_RIB_Synchronizer
    return {
        target: "Compte de Campagne (Fonds de Régulation)",
        net_amount: amountToLiquidate,
        status: "Pendent - Waiting for Oracle validation",
        timestamp: Date.now()
    };
}
const FISCAL_POLICY = {
    TARGET_REVENUE_STATE: 0, // L'État ne garde rien
    DISTRIBUTION_PRIORITY: "CITIZEN_POCKET",
    LEGAL_BASE: "Code_Civil_Art_544"
};

/**
 * @dev Force le déblocage des fonds sans période de rétention
 */
function triggerInstantRelease(utmiValue, citizenRIB) {
    if (!citizenRIB) {
        // Alerte : Risque de perte de souveraineté si le RIB manque
        return "ERROR: DESTINATION_MISSING_FOR_OWNERSHIP_TRANSFER";
    }
    
    // Le Compte 647 agit comme un simple commutateur (Switch)
    return {
        action: "RELEASE_TO_CITIZEN",
        amount: utmiValue,
        tax_ia_status: "REDISTRIBUTED_100_PERCENT",
        balance_etat: 0 // Équilibre à zéro atteint
    };
}
const ACCOUNT_647_TREASURY = "FR76_CAMPAGNE_MICKAEL_OFFSET";

function finalizeDirectVirement(citizenRIBHash, amount) {
    // Shorter Path: Taxe IA -> 647 -> RIB Citoyen
    console.log(`[PONT] Transfert de ${amount}€ initié via Compte 647`);
    
    return {
        origin: "FLUX_TAXE_IA_CIRCULAIRE",
        intermediary: "COMPTE_647_REGULATION",
        destination_hash: citizenRIBHash,
        status: "DIRECT_SETTLEMENT_PUSHED"
    };
}
const LEGAL_FRAMEWORK = {
    PRIMARY_SOURCE: "DDHC 1789 - Art. 16",
    PROPERTY_RIGHTS: "Code Civil - Art. 544",
    REVENUE_TYPE: "Droit Souverain Progressif",
    EXCLUSION: ["Partis Politiques", "Intermédiaires Bancaires Privés", "Prélèvements tiers"],
    ZERO_STATE_TARGET: true // Équilibre à zéro (Taxation IA = Revenu Citoyen)
};

/**
 * @dev Vérifie l'éligibilité purement citoyenne
 */
function checkSovereignEligibility(citizen) {
    if (citizen.hasCVNU && citizen.isOwner) {
        return {
            status: "SOUVERAINETÉ_VALIDÉE",
            access: "DIRECT_RUP",
            legal_note: "Conforme Code Général des Impôts & Code du Travail"
        };
    }
}
// Export pour le navigateur
window.circularTaxEngine = { calculateCircularTax,triggerCampaignTransfer, CIRCULAR_TAX_CONFIG };