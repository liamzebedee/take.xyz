// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.13;

import {IGenericResolver} from "../interfaces/IGenericResolver.sol";

// Inheritance
import {Owned} from "./Owned.sol";

// Internal references
import {AddressResolver} from "../AddressResolver.sol";

// A version of the resolver mixin which doesn't have a cache. Instead, it just calls out dynamically
// to the resolver for every resolution of a dependency.
// 
// This is useful for factory contracts - in a scenario where you might have 10's of thousands of
// contracts deployed, it becomes costly and infeasible to update their caches. Instead, they can
// just call out to the resolver directly.
contract MixinResolverStatic is
    IGenericResolver
{
    AddressResolver public resolver;

    constructor(address _resolver) {
        resolver = AddressResolver(_resolver);
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function _initialize(address _resolver) internal {
        resolver = AddressResolver(_resolver);
    }

    function combineArrays(bytes32[] memory first, bytes32[] memory second)
        internal
        pure
        returns (bytes32[] memory combination)
    {
        combination = new bytes32[](first.length + second.length);

        for (uint i = 0; i < first.length; i++) {
            combination[i] = first[i];
        }

        for (uint j = 0; j < second.length; j++) {
            combination[first.length + j] = second[j];
        }
    }

    /* ========== PUBLIC FUNCTIONS ========== */

    function resolverAddressesRequired() external view override returns (bytes32[] memory addresses) {}

    // rebuildCache is implemented so we can detect if we're using a static resolver.
    function rebuildCache() pure public {
        revert("ERR_STATIC_RESOLVER");
    }

    /* ========== INTERNAL FUNCTIONS ========== */

    function requireAndGetAddress(bytes32 name) internal view override returns (address) {
        address _foundAddress =
                resolver.requireAndGetAddress(name, string(abi.encodePacked("Resolver missing target: ", name)));
        require(_foundAddress != address(0), string(abi.encodePacked("Missing address: ", name)));
        return _foundAddress;
    }

    function getAddress(bytes32 name) internal view override returns (address) {
        return resolver.getAddress(name);
    }
}
