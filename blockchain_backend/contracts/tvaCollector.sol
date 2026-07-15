// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract TVACollector is Ownable {
    event PaymentReceived(address indexed payer, uint256 amount, uint256 tvaAmount);
    event FundsDistributedToCVNU(address indexed recipient, uint256 amount);
    event Withdrawal(address indexed citizen, uint256 amount, bytes32 indexed ribHash);

    uint256 public totalCollectedTVA;
    address public immutable cvnuFundAddress;

    constructor(address _cvnuFundAddress) Ownable(msg.sender) {
        require(_cvnuFundAddress != address(0), "Adresse invalide");
        cvnuFundAddress = _cvnuFundAddress;
    }

    // Vérifie la liquidité du contrat
    function withdrawFunds(uint256 _amount) internal view {
        require(address(this).balance >= _amount, "Solde contrat insuffisant");
    }

    // Permet au contrat de recevoir de l'ETH (TVA)
    receive() external payable {
        totalCollectedTVA += msg.value;
    }
}