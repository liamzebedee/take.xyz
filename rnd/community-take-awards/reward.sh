set -ex
source .env

# nazih.eth

NAME=$1
if [[ "$NAME" =~ ^[0x] ]]; then
    ADDRESS=$NAME
else
    echo "Looking up name";
    ADDRESS=$(cast resolve-name --rpc-url https://cloudflare-eth.com/ $NAME);
fi

RPC_URL=https://polygon-rpc.com
GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)
GAS_PRICE=$(echo "$GAS_PRICE * 1.2" | bc | cut -f1 -d'.')

cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY 0xC315841328D8409f17c3f886A7bec9A37e6d0fa6 --gas-price $GAS_PRICE "mint(address,uint)" $ADDRESS $(cast --to-wei 42)