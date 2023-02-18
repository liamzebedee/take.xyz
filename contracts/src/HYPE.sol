// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC20} from "./lib/ERC20.sol";
// import {Initializable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
// import {Initializable} from "./lib/Initializable.sol";
// import {Owned} from "./lib/Owned.sol";
import {MixinResolver} from "@aller/lib/MixinResolver.sol";

contract HYPE is 
    MixinResolver,
    ERC20
{
    constructor(address _resolver) MixinResolver(_resolver) {
        ERC20.initialize_ERC20("Hyperculture", "HYPE v1", 18);
    }

    function setNameAndSymbol(string memory name, string memory symbol) external {
        _setNameAndSymbol(name, symbol);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}