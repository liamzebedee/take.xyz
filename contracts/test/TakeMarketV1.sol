// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/TakeMarketV1.sol";
import "../src/TakeMarketSharesV1.sol";
import "../src/HYPE.sol";

contract TakeMarketV1Test is Test {
    TakeMarketSharesV1 takeMarketSharesV1;
    HYPE hype;
    TakeMarketV1 takeMarketV1;

    function setUp() public {
        hype = new HYPE(address(0));
        address fee_address = address(0x1);
        takeMarketV1 = new TakeMarketV1(address(hype), fee_address);
    }

    function testNumberIs42() public {
        assertTrue(takeMarketV1.TakeMarketSharesV1_() != address(0));

        uint bal1 = 1000 * 1e18;
        hype.mint(address(this), bal1);
        hype.approve(address(takeMarketV1), uint(1e60));

        // Test factory.
        uint256 takeId = 1;
        takeMarketV1.getOrCreateTakeSharesContract(takeId);
        assertTrue(address(takeMarketV1.getTakeSharesContract(takeId)) != address(0));
        assertTrue(takeMarketV1._initialized());

        // Deposit.
        // uint256 takeId = 1;
        uint deposit = 99 * 1e18;
        takeMarketV1.swap(takeId, int256(deposit));
        assertEq(takeMarketV1.getBalanceForMarket(takeId, address(this)), deposit);
        assertEq(hype.balanceOf(address(this)), bal1 - deposit);

        // Withdraw.
        int256 withdraw = -int256(deposit);
        // takeMarketV1.swap(takeId, withdraw);
        takeMarketV1.withdraw(takeId, deposit);
        assertEq(takeMarketV1.getBalanceForMarket(takeId, address(this)), 0);
        uint256 hypeBal2 = takeMarketV1.hypeAfterFee(deposit);
        emit log_named_uint("hypeBal2", hypeBal2);
        emit log_named_int("withdraw", withdraw);
        emit log_named_uint("balanceOf", hype.balanceOf(address(this)));
        assertEq(hype.balanceOf(address(this)), bal1 - deposit + hypeBal2);
    }
}
