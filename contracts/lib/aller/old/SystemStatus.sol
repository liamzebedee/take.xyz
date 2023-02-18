// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "./lib/Owned.sol";

contract SystemStatusStorage {
    struct SystemStatusStore {
        bool upgrading;
        bool frozen;
    }

    bytes32 constant STORE_SLOT = bytes32(uint(keccak256("eth.nakamofo.SystemStatus")) - 1);

    function _store() internal pure returns (SystemStatusStore storage store) {
        bytes32 s = STORE_SLOT;
        assembly {
            store.slot := s
        }
    }
}

contract SystemStatus is
    Owned,
    SystemStatusStorage
{
    event UpgradeStarted();
    event UpgradeEnded();
    event Suspended();
    event Resumed();

    constructor(address _owner) Owned(_owner) {}

    function beginUpgrade() external onlyOwner {
        _store().upgrading = true;
        emit UpgradeStarted();
    }

    function endUpgrade() external onlyOwner {
        _store().upgrading = false;
        emit UpgradeEnded();
    }

    function suspend() external onlyOwner {
        _store().frozen = true;
        emit Suspended();
    }

    function resume() external onlyOwner {
        _store().frozen = false;
        emit Resumed();
    }

    function assertGood() external view {
        require(!_store().upgrading, "System is upgrading");
        require(!_store().frozen, "System is suspended");
    }

    modifier isUpgrading() {
        require(!_store().upgrading, "System is upgrading");
        _;
    }

    // modifier isFrozen() {
    //     require(!_store().upgrading, "System is upgrading");
    //     require(!_store().frozen, "System is suspended");
    //     _;
    // }
}