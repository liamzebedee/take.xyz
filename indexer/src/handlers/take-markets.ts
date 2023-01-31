// import { HYPETokenAddress, renderBalance, TakeRewardsV1Address, TakeMarketV1Address } from "@takeisxx/lib"
// import { ethers } from "ethers"
// import { getENSUsername } from "../helpers"
// import { Context } from '../context'
// import { TAKE_APP_BASE_URL } from "@takeisxx/lib"
// import { TakeMarketV1ABI } from "@takeisxx/lib/build/abis"


// export async function listenToTakeMarkets(ctx: Context) {
//     const { provider, ensProvider, api } = ctx

//     // Get the HYPE contract.
//     const TakeMarket = new ethers.Contract(
//         TakeMarketV1Address,
//         TakeMarketV1ABI,
//         provider
//     )

//     TakeMarket.on('Swap', async (
//         takeId: ethers.BigNumber, 
//         account: string, 
//         inn: boolean,
//         amount: ethers.BigNumber,
//         fee: ethers.BigNumber
//     ) => {
//         await processSwap(ctx, { takeId, account, inn, amount, fee })
//     })
// }

// interface SwapArgs {
//     takeId: ethers.BigNumber,
//     account: string,
//     inn: boolean,
//     amount: ethers.BigNumber,
//     fee: ethers.BigNumber
// }

// async function processSwap(
//     ctx: Context, 
//     args: SwapArgs
// ) {
//     const { ensProvider, api, chatId } = ctx

//     let user
//     user = await getENSUsername(ensProvider, args.account)

//     // const balance = await HypeToken.balanceOf(to)
//     const verb = args.inn ? 'buys' : 'sells'
//     await api.sendMessage({
//         chat_id: chatId,
//         parse_mode: 'HTML',
//         disable_web_page_preview: 'true',
//         text: `👀 ${user} ${verb} shares in <strong><a href="${TAKE_APP_BASE_URL}/t/-${args.takeId.toString()}">take #${args.takeId.toString()}</a></strong> for <strong>${renderBalance(args.amount)} HYPE</strong>.`
//     })
// }