// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

interface IAnonTakenameRegistry {
    function registerName(string memory name) external returns (uint256);
    function transferFrom(
        address from,
        address to,
        uint256 id
    ) external;
}

contract AnonRelayer {
    event Deposit(address indexed user, uint256 amount, string name);
    event OperatorChanged(address indexed operator);

    address public operator;
    IAnonTakenameRegistry public registry = IAnonTakenameRegistry(0x51F0751Adbe7A36aEBeF700ca2aaD93b29ee884a);

    mapping(address => string) public anons;

    constructor() {
        operator = msg.sender;
    }

    function setOperator(address _operator) public {
        require(tx.origin == operator || msg.sender == operator, "only operator");
        operator = _operator;
        emit OperatorChanged(_operator);
    }

    function setRegistry(address _registry) public {
        require(tx.origin == operator || msg.sender == operator, "only operator");
        registry = IAnonTakenameRegistry(_registry);
    }
    
    function deposit(string memory name) public payable {
        // deposit matic to this addy
        // then we mix it and you get other matic
        emit Deposit(msg.sender, msg.value, name);
    }

    function createAnonAccount(uint256 depositAmount, address owner, string memory name) public {
        require(tx.origin == operator || msg.sender == operator, "only operator");
        
        // Mint them the name they want.
        uint id = registry.registerName(name);
        // Send them the name.
        registry.transferFrom(address(this), owner, id);
        // Send them the deposit.
        (bool sent, ) = owner.call{value: depositAmount}("");
        require(sent, "Failed to send Ether");
    }
}