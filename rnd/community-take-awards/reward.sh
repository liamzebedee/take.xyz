set -ex
source .env

NAME=$1
ADDRESS=$(cast resolve-name --rpc-url https://cloudflare-eth.com/ $NAME)

RPC_URL=https://polygon-rpc.com
GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)

cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY 0xC315841328D8409f17c3f886A7bec9A37e6d0fa6 --gas-price $GAS_PRICE "mint(address,uint)" $ADDRESS $(cast --to-wei 69)