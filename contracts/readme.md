@takeisxx/contracts
===================

Install [Foundry](https://github.com/foundry-rs/foundry).

```sh
# Develop.
anvil

forge build

forge create --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 src/Take.sol:Take

# Test.
(base) ➜  contracts git:(main) ✗ node decode_uri.js $(cast call 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 "tokenURI(uint)(string)" 0)
data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHByZXNlcnZlQXNwZWN0UmF0aW89InhNaW5ZTWluIG1lZXQiIHZpZXdCb3g9IjAgMCA1MDAgNTAwIj48c3R5bGU+LmJhc2UgeyBmaWxsOiB3aGl0ZTsgZm9udC1mYW1pbHk6IHNhbnMtc2VyaWY7IGZvbnQtc2l6ZTogMThweDsgfTwvc3R5bGU+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI0UzMUM3OSIgLz48dGV4dCB4PSIxMCIgeT0iMjAiIGNsYXNzPSJiYXNlIj5UaGUgZmlyc3QgdGFrZS48L3RleHQ+PHRleHQgeD0iMTAiIHk9IjQwIiBjbGFzcz0iYmFzZSI+PC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSI2MCIgY2xhc3M9ImJhc2UiPjwvdGV4dD48dGV4dCB4PSIxMCIgeT0iODAiIGNsYXNzPSJiYXNlIj48L3RleHQ+PHRleHQgeD0iMTAiIHk9IjEwMCIgY2xhc3M9ImJhc2UiPjwvdGV4dD48dGV4dCB4PSIxMCIgeT0iMTIwIiBjbGFzcz0iYmFzZSI+PC90ZXh0Pjx0ZXh0IHg9IjEwIiB5PSIxNDAiIGNsYXNzPSJiYXNlIj48L3RleHQ+PHRleHQgeD0iMTAiIHk9IjE2MCIgY2xhc3M9ImJhc2UiPjwvdGV4dD48L3N2Zz4=

# Deploy.
(base) ➜  contracts git:(main) ✗ forge create -i --rpc-url https://polygon-rpc.com src/Take.sol:Take --verify
[⠰] Compiling...
No files changed, compilation skipped
Enter private key:
Deployer: 0x913Fd60887e7b99F2EE9115a79F3C5886ad2d47A
Deployed to: 0xC343497721e61FD96B1E3C6e6DeBE5C2450d563c
Transaction hash: 0xea00aa4a648e663ac87006b09746741654afd19e1d99a4df9d3c8794d5b1eef9


forge create -i --rpc-url https://polygon-rpc.com src/AnonTakename.sol:AnonTakenameRegistry --verify --gas

# Flatten.
# forge flatten --output flat/Take.sol src/Take.sol

# Verify
# forge verify-contract 0xdbaEFaa91EdABDE9caD37644faC931C3bd44326f src/Take.sol:Take --chain polygon --rpc-url https://polygon-rpc.com
```