set -ex

source .env

RPC_URL=https://polygon-rpc.com

GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)
echo gas price: $GAS_PRICE

FORGE_CREATE_ARGS="--private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL --gas-price $GAS_PRICE --verify"
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/Take.sol:Take
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/AnonTakename.sol:AnonTakenameRegistry --gas-price $GAS_PRICE --verify
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $RPC_URL src/AnonRelayer.sol:AnonRelayer --gas-price $GAS_PRICE --verify

# forge create $FORGE_CREATE_ARGS src/Take.sol:Take
# forge create $FORGE_CREATE_ARGS src/HYPE.sol:HYPE
# forge create $FORGE_CREATE_ARGS src/TakeRewardsV1.sol:TakeRewardsV1

forge create $FORGE_CREATE_ARGS src/TakeMarketV1.sol:TakeMarketV1 --constructor-args 0xC315841328D8409f17c3f886A7bec9A37e6d0fa6 0x913fd60887e7b99f2ee9115a79f3c5886ad2d47a
