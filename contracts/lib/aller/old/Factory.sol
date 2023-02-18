// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity ^0.8.13;

// An implementation of a proxy.
// The proxy forwards all calls to the implementation.
// The proxy has an admin.

import "./Clones.sol";

contract FactoryStorage {
    struct FactoryStore {
        address template;
        uint256 cloneCount;
    }

    bytes32 constant STORE_SLOT = bytes32(uint(keccak256("eth.nakamofo.factory")) - 1);

    function _store() internal pure returns (FactoryStore storage store) {
        bytes32 s = STORE_SLOT;
        assembly {
            store.slot := s
        }
    }
}


// interface IInstance {
//     function getFactory() external view returns (address);
//     function initialize(address factory) external;
// }

contract InstanceStorage {
    struct InstanceStore {
        address factory;
    }

    bytes32 constant STORE_SLOT = bytes32(uint(keccak256("eth.nakamofo.factory")) - 1);

    function _store() internal pure returns (InstanceStore storage store) {
        bytes32 s = STORE_SLOT;
        assembly {
            store.slot := s
        }
    }
}

abstract contract Instance is InstanceStorage {
    function getFactory() external view returns (address) {
        return InstanceStorage._store().factory;
    }

    function initialize(address factory, bytes memory initializeData) public virtual {
        InstanceStorage.InstanceStore storage store = InstanceStorage._store();
        store.factory = factory;
    }
}

contract Factory is 
    FactoryStorage
{
    constructor() {}

    event InstanceCreated(address indexed implementation);

    function create(bytes32 salt, bytes memory initializeData) public returns (address) {
        address template = _store().template;
        _store().cloneCount++;
        address clone = Clones.cloneDeterministic(template, salt);

        // call initialize on template.
        Instance(clone).initialize(address(this), initializeData);

        emit InstanceCreated(clone);
        return clone;
    }

    // function setProxyAdmin(address _admin) public {
    //     require(msg.sender == _store().admin, "ERR_UNAUTHORISED");
    //     emit AdminChanged(_store().admin, _admin);
    //     _store().admin = _admin;
    // }

    // function upgrade(address _implementation, bytes memory initializeData) public {
    //     require(msg.sender == _store().admin, "ERR_UNAUTHORISED");
    //     emit Upgraded(_implementation);
    //     _store().implementation = _implementation; 
    // }
}