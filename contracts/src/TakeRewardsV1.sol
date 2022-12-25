// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {Owned} from "./lib/Owned.sol";

interface HYPEToken {
    function transferFrom(address from, address to, uint256 amount) external;
}

contract TakeRewardsV1 is
    Owned
{
    HYPEToken public hypeToken = HYPEToken(0xC315841328D8409f17c3f886A7bec9A37e6d0fa6);
    bool public enabled = true;

    constructor() {
        Owned.initialize_Owned(msg.sender);
    }

    event Reward(address indexed user1, address indexed user2, uint amount1, uint amount2, uint takeId);

    function setEnabled(bool _enabled) external onlyOwner {
        enabled = _enabled;
    }

    function reward(
        address user1, 
        address user2, 
        uint amount1, 
        uint amount2, 
        uint takeId
    )
        external
        onlyOwner
    {
        hypeToken.transferFrom(address(this), user1, amount1);
        if(user2 != address(0)) {
            hypeToken.transferFrom(address(this), user2, amount2);
        }

        emit Reward(user1, user2, amount1, amount2, takeId);
    }

}