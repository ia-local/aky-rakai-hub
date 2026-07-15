// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./tvaCollector.sol";

contract CVNU is TVACollector {
    struct Competence {
        uint256 level;
        uint256 experience;
        bool isCertified;
    }

    mapping(address => Competence[]) public citizenCV;
    uint256 public constant MIN_RUP = 750;
    uint256 public constant MAX_RUP = 7500;

    constructor(address _cvnuFundAddress) TVACollector(_cvnuFundAddress) {}

    // Enregistrement des preuves de travail/compétences
    function updateCompetence(address _citizen, uint256 _level, uint256 _exp, bool _cert) external onlyOwner {
        citizenCV[_citizen].push(Competence(_level, _exp, _cert));
    }

    // Calcul du montant à verser basé sur l'expérience
    function calculateRup(address _citizen) public view returns (uint256) {
        Competence[] memory cv = citizenCV[_citizen];
        if (cv.length == 0) return MIN_RUP;
        uint256 totalScore = 0;
        for (uint i = 0; i < cv.length; i++) {
            totalScore += (cv[i].level * cv[i].experience);
        }
        uint256 finalRup = MIN_RUP + (totalScore * 10); 
        return finalRup > MAX_RUP ? MAX_RUP : finalRup;
    }
}