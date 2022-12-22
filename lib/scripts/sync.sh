
cat ../contracts/out/Take.sol/Take.json                         | jq .abi > ./abis/Take.json
cat ../contracts/out/AnonTakename.sol/AnonTakenameRegistry.json | jq .abi > ./abis/AnonTakenameRegistry.json
cat ../contracts/out/AnonRelayer.sol/AnonRelayer.json           | jq .abi > ./abis/AnonRelayer.json
cat ../contracts/out/HYPE.sol/HYPE.json                         | jq .abi > ./abis/HYPE.json