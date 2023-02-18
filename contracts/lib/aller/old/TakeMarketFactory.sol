pragma solidity 0.5.17;

import "./TakeMarketShares.sol";
import "../Clones.sol";
import "../MixinResolver.sol";

/// @title Deposit Factory
/// @notice Factory for the creation of new deposit clones.
/// @dev We avoid redeployment of deposit contract by using the clone factory.
/// Proxy delegates calls to Deposit and therefore does not affect deposit state.
/// This means that we only need to deploy the deposit contracts once.
/// The factory provides clean state for every new deposit clone.
contract TakeMarketFactory is MixinResolver {

    constructor(address _systemAddress)
        public
        TBTCSystemAuthority(_systemAddress)
    {}

    function create(uint256 _id)
        external
        payable
        returns (address)
    {
        address cloneAddress = createClone(masterDepositAddress);
        emit DepositCloneCreated(cloneAddress);

        TBTCDepositToken(tbtcDepositToken).mint(
            msg.sender,
            uint256(cloneAddress)
        );

        TakeMarketShares i = TakeMarketShares(address(uint160(cloneAddress)));
        deposit.initialize(address(this));
        deposit.initializeDeposit.value(msg.value)(
            tbtcSystem,
            tbtcToken,
            tbtcDepositToken,
            feeRebateToken,
            vendingMachineAddress,
            _lotSizeSatoshis
        );

        return cloneAddress;
    }
}