// ============================================================================
// oracle.js - LE PONT FIAT/BLOCKCHAIN (CVNU)
// ============================================================================
const { ethers } = require("ethers");
const oracledb = require("oracledb"); 
const crypto = require("crypto");
const fs = require("fs");

// Configuration (À sécuriser via variables d'environnement en production)
const RPC_URL = "http://127.0.0.1:8545"; 
const CONTRACT_ADDRESS = "0xTON_CONTRAT_TVA_RIB_SYNCHRONIZER";

// Chargement sécurisé de la clé RSA avec Fallback
let PRIVATE_KEY_RSA;
try {
    PRIVATE_KEY_RSA = fs.readFileSync("keys/bank_private_key.pem", "utf8");
} catch (error) {
    console.warn("⚠️ [DEV] Fichier keys/bank_private_key.pem introuvable. Le pont EBICS tournera en mode Simulation.");
    PRIVATE_KEY_RSA = null;
}

// ABI pour écouter l'événement Withdrawal
const ABI = [
    "event Withdrawal(address indexed citizen, uint256 amount, bytes32 indexed ribHash)"
];

class FiatBridgeOracle {
    constructor() {
        this.provider = null;
        this.contract = null;
    }

    async start() {
        try {
            this.provider = new ethers.JsonRpcProvider(RPC_URL);
            
            // Timeout pour éviter de bloquer le démarrage si le nœud est éteint
            const network = await Promise.race([
                this.provider.getNetwork(),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000))
            ]);
            
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, this.provider);
            console.log("🟢 ORACLE DÉMARRÉ : Écoute des événements Withdrawal...");
            
            this.contract.on("Withdrawal", async (citizen, amount, ribHash, event) => {
                console.log(`\n🔔 NOUVEAU VIREMENT DÉTECTÉ [Tx: ${event.log.transactionHash}]`);
                try {
                    const realIbanData = await this.resolveIBANFromHash(ribHash);
                    if (!realIbanData) throw new Error("Hash inconnu dans la base sécurisée.");

                    const xmlContent = this.generateSepaXML(realIbanData, ethers.formatEther(amount), event.log.transactionHash);
                    const signature = this.signXMLWithRSA(xmlContent);
                    await this.transmitToBank(xmlContent, signature, event.log.transactionHash);
                } catch (error) {
                    console.error(`❌ ÉCHEC DU TRAITEMENT : ${error.message}`);
                }
            });
        } catch (error) {
            console.warn("🔴 [WEB3] Blockchain indisponible (Port 8545). Mode simulation uniquement.");
        }
    }

    async resolveIBANFromHash(ribHash) {
        let connection;
        try {
            connection = await oracledb.getConnection({
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                connectString: process.env.DB_CONNECTION_STRING
            });

            const result = await connection.execute(
                `SELECT IBAN_ENCRYPTED, HOLDER_NAME FROM CITIZEN_BANK_RECORDS WHERE RIB_HASH = :hash`,
                [ribHash]
            );

            if (result.rows.length === 0) return null;
            const decryptedIban = this.decryptAES(result.rows[0][0]); 
            return { iban: decryptedIban, name: result.rows[0][1] };
        } catch (err) {
            console.error("DB Error:", err);
            return null;
        } finally {
            if (connection) await connection.close();
        }
    }

    generateSepaXML(recipient, amount, txHash) {
        const msgId = `CVNU-${Date.now()}`;
        return `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
    <CstmrCdtTrfInitn>
        <GrpHdr>
            <MsgId>${msgId}</MsgId>
            <CreDtTm>${new Date().toISOString()}</CreDtTm>
            <NbOfTxs>1</NbOfTxs>
            <CtrlSum>${amount}</CtrlSum>
        </GrpHdr>
        <PmtInf>
            <PmtInfId>PMT-${msgId}</PmtInfId>
            <CdtTrfTxInf>
                <Amt><InstdAmt Ccy="EUR">${amount}</InstdAmt></Amt>
                <Cdtr><Nm>${recipient.name}</Nm></Cdtr>
                <CdtrAcct><Id><IBAN>${recipient.iban}</IBAN></Id></CdtrAcct>
            </CdtTrfTxInf>
        </PmtInf>
    </CstmrCdtTrfInitn>
</Document>`;
    }

    signXMLWithRSA(xmlString) {
        if (!PRIVATE_KEY_RSA) {
            console.log(`🔐 [SIMULATION] Signature RSA générée.`);
            return "SIGNATURE_MOCK_BASE64_DEV_MODE";
        }
        const sign = crypto.createSign('RSA-SHA256');
        sign.update(xmlString);
        sign.end();
        return sign.sign(PRIVATE_KEY_RSA, 'base64');
    }

    decryptAES(encryptedData) {
        return "FR7612345678901234567890123"; 
    }

    async transmitToBank(xml, signature, txHash) {
        console.log(`🏦 TRANSMISSION EBICS SIMULÉE: Ordre de ${txHash} envoyé.`);
        const dir = './archives_sepa';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(`${dir}/SEPA_${txHash}.xml`, xml);
        fs.writeFileSync(`${dir}/SEPA_${txHash}.sig`, signature);
    }
}

module.exports = FiatBridgeOracle;