set -ex

# source .env

# RPC_URL=https://polygon-rpc.com
RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)
echo gas price: $GAS_PRICE

forge create --private-key $PRIVATE_KEY src/Take.sol:Take
forge create --private-key $PRIVATE_KEY src/AnonTakename.sol:AnonTakenameRegistry
forge create --private-key $PRIVATE_KEY src/AnonRelayer.sol:AnonRelayer
forge create --private-key $PRIVATE_KEY src/HYPE.sol:HYPE

