// import { HYPETokenAddress, renderBalance, TakeRewardsV1Address, TakeMarketV1Address } from "@takeisxx/lib"
// import { HYPEABI } from "@takeisxx/lib/build/abis"
// import { ethers } from "ethers"
// import { getENSUsername } from "../helpers"
// import { Context } from '../context'


// export async function listenToTokenTransfers(ctx: Context) {
//     const { provider, ensProvider, api } = ctx

//     // Get the HYPE contract.
//     const HypeToken = new ethers.Contract(
//         HYPETokenAddress,
//         HYPEABI,
//         provider
//     )

//     HypeToken.on('Transfer', async (from: string, to: string, amount: ethers.BigNumber) => {
//         await processHypeTransfer(ctx, { HypeToken, from, to, amount })
//     })
// }


// async function processHypeTransfer(ctx: Context, { HypeToken, from, to, amount }: any) {
//     const { ensProvider, api, chatId } = ctx

//     let fromUsername
//     fromUsername = await getENSUsername(ensProvider, from)
//     if (from == ethers.constants.AddressZero) {
//         fromUsername = 'HypeDAO'
//     }
//     if (from == TakeMarketV1Address) {
//         // Ignore.
//         return;
//     }

//     const toUsername = await getENSUsername(ensProvider, to)

//     const hypeTransfer = {
//         from,
//         fromUsername,
//         to,
//         toUsername,
//         amount,
//     }

//     if (fromUsername == 'HypeDAO') {
//         const balance = await HypeToken.balanceOf(to)
//         await api.sendMessage({
//             chat_id: chatId,
//             parse_mode: 'HTML',
//             disable_web_page_preview: 'true',
//             text: `🎉 ${toUsername} you have earnt <b>${renderBalance(amount)} HYPE</b>. Your balance is now <b>${renderBalance(balance)} HYPE</b>\n<a href="https://polygonscan.com/token/${HYPETokenAddress}?a=${from}">View on PolygonScan</a>`
//         })
//     } else if (from == TakeRewardsV1Address) {
//     } else {
//         await api.sendMessage({
//             chat_id: chatId,
//             parse_mode: 'HTML',
//             disable_web_page_preview: 'true',
//             text: `🎉 ${fromUsername} sent <b>${renderBalance(amount)} HYPE</b> to ${toUsername}\n<a href="https://polygonscan.com/token/${HYPETokenAddress}?a=${from}">View on PolygonScan</a>`
//         })
//     }


// }