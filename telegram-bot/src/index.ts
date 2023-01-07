import { TakeV3Address } from '@takeisxx/lib'
import { CHAT_ID_TEST } from './config'
import { Context } from './context'
import { listenToTokenTransfers } from './handlers/hype-transfer'
import { listenToNewTakes } from './handlers/new-take'
import { listenToTakeMarkets } from './handlers/take-markets'
import { listenToTakeRewards, printRewardsSummary } from './handlers/take-rewards'
import { printTelegramBotInfo } from './helpers'

const TG = require('telegram-bot-api')
const { ethers } = require('ethers')

// Configure.
let { TELEGRAM_TOKEN, CHAT_ID } = process.env
if(process.env.NODE_ENV != 'production') {
    CHAT_ID = CHAT_ID_TEST
}

// Check if TELEGRAM_TOKEN is set
if (!TELEGRAM_TOKEN) {
    throw new Error('TELEGRAM_TOKEN is not set')
}
printTelegramBotInfo(TELEGRAM_TOKEN)

async function main() {
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`TakeV3Address: ${TakeV3Address}`)
    console.log(`CHAT_ID: ${CHAT_ID}`)

    const api = new TG({
        token: TELEGRAM_TOKEN
    })
    
    const provider = new ethers.providers.AlchemyProvider('matic', process.env.ALCHEMY_KEY_MATIC)
    const ensProvider = new ethers.providers.AlchemyProvider('homestead', process.env.ALCHEMY_KEY_HOMESTEAD)

    await provider.getBlock('latest')
    await ensProvider.getBlock('latest')

    // printTakeDeploymentInfo()
    const ctx: Context = { 
        api,
        provider,
        ensProvider,
        chatId: CHAT_ID
    }
    
    await listenToTakeRewards(ctx)
    // Every 8h, print the rewards summary.
    setInterval(async () => {
        await printRewardsSummary(ctx)
    }, 1000 * 60 * 60 * 24)
    listenToTakeMarkets(ctx)
    listenToTokenTransfers(ctx)
    listenToNewTakes(ctx)
}






main()