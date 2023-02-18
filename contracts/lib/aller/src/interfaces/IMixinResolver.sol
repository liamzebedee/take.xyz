// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {IGenericResolver} from "./IGenericResolver.sol";

abstract contract IMixinResolver is IGenericResolver {
    // External functions.
    function isResolverCached() external virtual view returns (bool);
    function rebuildCache() external virtual;
    
    // Events.
    event CacheUpdated(bytes32 name, address destination);
}