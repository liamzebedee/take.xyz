import { TakeV3Address } from '@takeisxx/lib'
import { Context } from './context'
// import { listenToTokenTransfers } from './handlers/hype-transfer'
import { listenToNewTakes } from './handlers/new-take'
// import { listenToTakeMarkets } from './handlers/take-markets'
// import { listenToTakeRewards, printRewardsSummary } from './handlers/take-rewards'

const { ethers } = require('ethers')

// Configure.
let { API_ENDPOINT, API_KEY } = process.env
if(process.env.NODE_ENV != 'production') {
    API_ENDPOINT = "http://127.0.0.1:8000"
    API_KEY = "jfaidfhadiasj383ur83ueiadjasd98qw983ru983u9r33"
}

async function main() {
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`TakeV3Address: ${TakeV3Address}`)
    console.log(`API_ENDPOINT: ${API_ENDPOINT}`)

    const provider = new ethers.providers.AlchemyProvider('matic', process.env.ALCHEMY_KEY_MATIC)
    // const ensProvider = new ethers.providers.AlchemyProvider('homestead', process.env.ALCHEMY_KEY_HOMESTEAD)
    const ensProvider = new ethers.providers.InfuraProvider()

    await provider.getBlock('latest')
    await ensProvider.getBlock('latest')

    // printTakeDeploymentInfo()
    const ctx: Context = { 
        provider,
        ensProvider,
        apiEndpoint: API_ENDPOINT,
        apiKey: API_KEY,
    }
    
    // await listenToTakeRewards(ctx)
    // // Every 8h, print the rewards summary.
    // setInterval(async () => {
    //     await printRewardsSummary(ctx)
    // }, 1000 * 60 * 60 * 24)
    // listenToTakeMarkets(ctx)
    // listenToTokenTransfers(ctx)
    listenToNewTakes(ctx)
}






main()