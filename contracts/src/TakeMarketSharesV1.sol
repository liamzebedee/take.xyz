
// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {ERC20} from "./lib/ERC20.sol";
// import {Initializable} from "../../lib/openzeppelin-contracts-upgradeable/contracts/proxy/utils/Initializable.sol";
// import {Initializable} from "./lib/Initializable.sol";
// import {Owned} from "./lib/Owned.sol";
import {MixinResolver} from "@aller/lib/MixinResolver.sol";
import {Utils} from "./lib/Utils.sol";

contract TakeMarketSharesV1 is 
    MixinResolver,
    ERC20
{
    uint256 public takeId = 0;

    constructor(address _resolver) MixinResolver(_resolver) {
    }

    function initialize_TakeMarketSharesV1(address _owner, uint256 _id) public {
        takeId = _id;

        // TODO: I cbf figuring out OZ's shitty Initializer code rn.
        ERC20._initialize_ERC20(
            // Take #0 Shares.
            string(abi.encodePacked("Take #", Utils.toString(_id), " Shares")),
            // TAKE-SHARES-0
            string(abi.encodePacked("TAKE-SHARES-", Utils.toString(_id))), 
            18
        );
    }

    function setNameAndSymbol(string memory name, string memory symbol) external {
        _setNameAndSymbol(name, symbol);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address to, uint256 amount) external {
        _burn(to, amount);
    }
}