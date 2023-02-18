// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity >=0.8.0;

import {Owned} from "./lib/Owned.sol";
import {ClonesUpgradeable} from "../lib/openzeppelin-contracts-upgradeable/contracts/proxy/ClonesUpgradeable.sol";
import {IERC20} from "../lib/forge-std/src/interfaces/IERC20.sol";
import {TakeMarketSharesV1} from "./TakeMarketSharesV1.sol";
import {Initializable} from "./lib/Initializable.sol";

interface ITakeMarketSharesV1 {
    function initialize_TakeMarketSharesV1(address _owner, uint256 _id) external;

    function mint(address to, uint256 amount) external;
    function burn(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

// The Take market is an automated market maker (AMM) which allows anyone
// to buy/sell shares of a take using HYPE.
// 
// Unlike your typical NFT project, the take market is not based on
// this idea of "unique ownership" of a take. Instead, the take market is
// based on the idea of "access" to a take.
// 
// Anyone can swap their HYPE for shares of a stake. And at any time,
// they can sell their shares back for HYPE.
// 
// There is no total supply of shares.
// 
// The market maker levies a fee based on the time that the shares
// have been held. The longer the shares are held, the higher the fee.
// This is similar to the perpetual contracts pioneered by BitMEX, but
// applied to NFT's.
// 
// Finally, the fee goes towards the operator of the take market. This
// operator in the V1 is the Take DAO. This fee on providing services for
// speculation is redirected back into the ecosystem, in order to fund
// the longer-term contributors who are not just in it "for the money".
contract TakeMarketV1 is 
    Initializable,
    Owned
{
    address public operator;
    uint256 constant ONE = 1e18;
    uint256 public feeRateBps = ONE/10000*420; // 4.20%
    uint256 public feeRateInterval = 1 days;

    // Master implementation of the TakeMarketSharesV1 contract.
    address public TakeMarketSharesV1_;

    // HYPE token.
    IERC20 public HypeToken;

    event Swap(uint256 indexed takeId, address account, int256 amount, uint256 fee);
    event Fee (uint256 indexed takeId, address operator, uint256 amount, uint256 fee);

    constructor(address _HypeToken, address _operator) {
        initialize_TakeMarketV1(_HypeToken, _operator);
    }

    function initialize_TakeMarketV1(address _HypeToken, address _operator) public initializer {
        HypeToken = IERC20(_HypeToken);
        operator = _operator;
        
        // Deploy the master implementation of the TakeMarketSharesV1 contract.
        TakeMarketSharesV1 takeMarketSharesV1 = new TakeMarketSharesV1(address(0));
        takeMarketSharesV1.initialize_TakeMarketSharesV1(address(this), 0);
        TakeMarketSharesV1_ = address(takeMarketSharesV1);

        Owned.initialize_Owned(msg.sender);
    }

    function setOperator(address newOperator) external onlyOwner {
        operator = newOperator;
    }

    function getOrCreateTakeSharesContract(uint256 takeId) public returns (ITakeMarketSharesV1) {
        bytes32 salt = keccak256(abi.encodePacked(takeId));
        address instance = ClonesUpgradeable.predictDeterministicAddress(TakeMarketSharesV1_, salt, address(this));
        if(instance.code.length == 0) {
            // Deploy.
            instance = ClonesUpgradeable.cloneDeterministic(TakeMarketSharesV1_, salt);
            ITakeMarketSharesV1 i = ITakeMarketSharesV1(instance);
            i.initialize_TakeMarketSharesV1(address(this), takeId);
        }
        return ITakeMarketSharesV1(instance);
    }

    // Deposit shares of a take.
    function deposit(uint256 take, uint256 amount) public {
        ITakeMarketSharesV1 shares = getOrCreateTakeSharesContract(uint256(take));
        shares.mint(msg.sender, amount);

        // Take the HYPE.
        HypeToken.transferFrom(msg.sender, address(this), amount);

        emit Swap(take, msg.sender, int256(amount), 0);
    }

    // Withdraw shares of a take.
    function withdraw(uint256 take, uint256 amount) public {
        ITakeMarketSharesV1 shares = getOrCreateTakeSharesContract(uint256(take));
        shares.burn(msg.sender, amount);

        // Send back the HYPE, minus the fee.
        uint256 fee = amount * feeRateBps / ONE;
        uint256 amountMinusFee = amount - fee;

        HypeToken.transfer(msg.sender, amountMinusFee);
        HypeToken.transfer(operator, fee);

        emit Swap(take, msg.sender, -int256(amount), fee);
        emit Fee(take, operator, amount, fee);
    }

    function swap(uint256 take, int256 amount) public {
        require(amount != 0, "INVALID_AMOUNT");
        // If amount is -ve, withdraw.
        if (amount < 0) {
            withdraw(take, uint256(-amount));
        
        // If amount is +ve, deposit.
        } else {
            deposit(take, uint256(amount));
        }
    }

    function setFeeRateBps(uint256 newFeeRateBps) external onlyOwner {
        feeRateBps = newFeeRateBps;
    }

    function hypeAfterFee(uint256 amount) public view returns (uint256) {
        return amount * (ONE - feeRateBps) / ONE;
    }

    function getTakeSharesContract(uint256 takeId) public view returns (ITakeMarketSharesV1) {
        bytes32 salt = keccak256(abi.encodePacked(takeId));
        address instance = ClonesUpgradeable.predictDeterministicAddress(TakeMarketSharesV1_, salt, address(this));
        return ITakeMarketSharesV1(instance);
    }

    function getBalanceForMarket(uint256 take, address account) public view returns (uint256) {
        ITakeMarketSharesV1 shares = getTakeSharesContract(uint256(take));
        return shares.balanceOf(account);
    }
}