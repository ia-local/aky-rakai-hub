// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./tvaCollector.sol";
import "./CVNU.sol";

contract TVA_RIB_Synchronizer is TVACollector {
    CVNU public cvnuContract;
    mapping(address => bytes32) public citizenRIB;

    // Utilisation de address payable pour le contrat CVNU car il hérite de TVACollector (payable)
    constructor(address payable _cvnuContractAddress, address _cvnuFundAddress) 
        TVACollector(_cvnuFundAddress) 
    {
        cvnuContract = CVNU(_cvnuContractAddress);
    }

    // Synchronisation du RIB (haché pour la confidentialité)
    function synchronizeRIB(bytes32 _ribHash) public {
        citizenRIB[msg.sender] = _ribHash;
    }

    // Fonction de distribution réelle vers l'adresse du citoyen
    function distributeFunds(address payable _citizen) public onlyOwner {
        require(citizenRIB[_citizen] != bytes32(0), "RIB non synchronise");
        
        uint256 rupAmount = cvnuContract.calculateRup(_citizen);
        require(rupAmount > 0, "Montant invalide");

        // Vérification de la solvabilité via le parent
        withdrawFunds(rupAmount);
        
        // Virement sur la blockchain (vers le proc EBICS lié à IBAN du RIB)
        _citizen.transfer(rupAmount);

        // Signal pour Telegram / Serveur Express
        emit Withdrawal(_citizen, rupAmount, citizenRIB[_citizen]);
    }
}