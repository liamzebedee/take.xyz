const fs = require('fs-extra');
const mustache = require('mustache');
import { ethers } from 'ethers'
import { TakeV3Address, TakeV3DeploymentBlock } from '@takeisxx/lib'

const {
  ETH_RPC_URL
} = process.env

if (!ETH_RPC_URL) {
  throw new Error("ETH_RPC_URL must be defined")
}


async function main() {
  const provider = new ethers.providers.JsonRpcProvider(ETH_RPC_URL)
  let network = await provider.getNetwork()
  let chainId = network.chainId
  console.log(`Resolving contracts for chainID: ${chainId}`)

  const templateData = {
    network: {
      [1]: 'mainnet',
      [42]: 'mainnet',
      [137]: 'mainnet', // Polygon
      [4]: 'mainnet',
      [77]: 'poa-sokol',
      [100]: 'xdai',
    }[chainId] || 'mainnet'
  };

  templateData['Take'] = {
    address: TakeV3Address,
    addressLowerCase: TakeV3Address.toLowerCase(),
    startBlock: TakeV3DeploymentBlock
  }

  for (const templatedFileDesc of [
    ['subgraph', 'yaml'],
    // ['src/utils/token', 'ts'],
  ]) {
    const template = fs.readFileSync(`${templatedFileDesc[0]}.template.${templatedFileDesc[1]}`).toString();
    fs.writeFileSync(
      `${templatedFileDesc[0]}.${templatedFileDesc[1]}`,
      mustache.render(template, templateData),
    );
  }
}


module.exports = main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
