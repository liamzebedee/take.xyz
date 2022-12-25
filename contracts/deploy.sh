set -ex

source .env

RPC_URL=https://polygon-rpc.com

GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)
echo gas price: $GAS_PRICE

FORGE_CREATE_ARGS="--private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL --gas-price $GAS_PRICE --verify"
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/Take.sol:Take
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/AnonTakename.sol:AnonTakenameRegistry --gas-price $GAS_PRICE --verify
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/AnonRelayer.sol:AnonRelayer --gas-price $GAS_PRICE --verify
# forge create $FORGE_CREATE_ARGS src/HYPE.sol:HYPE

forge create $FORGE_CREATE_ARGS src/TakeRewardsV1.sol:TakeRewardsV1
