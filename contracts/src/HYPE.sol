// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC20} from "./lib/ERC20.sol";
import {Initializable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
import {Owned} from "./lib/Owned.sol";

contract HYPE is 
    Initializable,
    Owned,
    ERC20
{
    constructor() {
        initialize_HYPE();
    }

    function initialize_HYPE() public initializer {
        ERC20.initialize_ERC20("Hyperculture", "HYPE v1", 18);
        Owned.initialize_Owned(msg.sender);
    }

    function setNameAndSymbol(string memory name, string memory symbol) external onlyOwner {
        _setNameAndSymbol(name, symbol);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}