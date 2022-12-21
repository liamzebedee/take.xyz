set -ex

source .env

MATIC_RPC_URL=https://polygon-rpc.com

GAS_PRICE=$(cast gas-price --rpc-url $MATIC_RPC_URL)
echo gas price: $GAS_PRICE

# forge create --force --private-key $PRIVATE_KEY --chain polygon --rpc-url $MATIC_RPC_URL src/Take.sol:Take
# forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $MATIC_RPC_URL src/AnonTakename.sol:AnonTakenameRegistry --gas-price $GAS_PRICE --verify
forge create --private-key $PRIVATE_KEY --chain polygon --rpc-url $MATIC_RPC_URL src/AnonRelayer.sol:AnonRelayer --gas-price $GAS_PRICE --verify

