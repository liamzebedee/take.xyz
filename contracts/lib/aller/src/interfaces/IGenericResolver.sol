// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

abstract contract IGenericResolver {
    // Internal functions.
    function requireAndGetAddress(bytes32 name) internal view virtual returns (address);
    function getAddress(bytes32 name) internal view virtual returns (address);

    // External functions.
    function resolverAddressesRequired() external virtual view returns (bytes32[] memory addresses);
}