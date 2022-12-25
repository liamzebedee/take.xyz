
import { fetchTake } from './helpers'
import { abis, rewardsFor } from "@takeisxx/lib"
const { HYPEABI, TakeABI, TakeRewardsV1ABI } = abis

import { ethers } from 'ethers'
import { TakeV3Address, HYPETokenAddress, renderBalance, formatUnits, TakeRewardsV1Address } from '@takeisxx/lib'

const { default: truncateEthAddress } = require('truncate-eth-address')

// Configure.
let { PRIVATE_KEY } = process.env

// Check if PRIVATE_KEY is set
if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY is not set')
}


// Create a Polygon RPC provider.
let provider: ethers.providers.Provider, 
    ensProvider: ethers.providers.Provider, 
    signer: ethers.Signer


const getENSUsername = async (address: string) => {
    try {
        const ens = await ensProvider.lookupAddress(address)
        if (ens) return ens
    } catch (err) {
    }

    return truncateEthAddress(address)
}



async function main() {
    provider = new ethers.providers.AlchemyProvider('matic', process.env.ALCHEMY_KEY_MATIC)
    ensProvider = new ethers.providers.AlchemyProvider('homestead', process.env.ALCHEMY_KEY_HOMESTEAD)
    signer = new ethers.Wallet(PRIVATE_KEY, provider)

    await provider.getBlock('latest')
    await ensProvider.getBlock('latest')

    console.log(`TakeRewardsV1: ${TakeRewardsV1Address}`)

    // printTakeDeploymentInfo()
    listenToNewTakes({  })
}

const TakeDeploymentBlock = 36967571
async function listenToNewTakes({ }) {
    // Get the HYPE contract.
    const HypeToken = new ethers.Contract(
        HYPETokenAddress,
        HYPEABI,
        signer
    )

    // Get the Take contract.
    const Take = new ethers.Contract(
        TakeV3Address,
        TakeABI,
        provider
    )

    const TakeRewardsV1 = new ethers.Contract(
        TakeRewardsV1Address,
        TakeRewardsV1ABI,
        signer
    )

    // Test the contract by getting the total number of takes.
    const totalTakes = await Take.totalSupply()
    console.log(`Total takes: ${totalTakes}`)

    // Get the most recent minted take from the Transfer events.
    const filter = Take.filters.Transfer(null, null, null)
    // Query from the block which the Take contract was deployed.
    // See: printTakeDeploymentInfo()
    const events = await Take.queryFilter(filter, TakeDeploymentBlock, 'latest')

    // Print the latest take ID.
    const lastTakeId = events[events.length - 1].args.id.toNumber()
    console.log(`Last take: ${lastTakeId}`)

    // Process missed take ID's.
    const lastProcessedTake = process.env.LASTTAKE || totalTakes
    for (let i = lastProcessedTake; i < totalTakes; i++) {
        console.log(`processing missed take: ${i}`)
        await processNewTake({ Take, HypeToken, TakeRewardsV1, takeId: i })
    }


    // Now listen to the Take contract for new takes.
    Take.on('Transfer', async (from: string, to: string, id: ethers.BigNumberish) => {
        console.log(`New take: ${id}`)
        await processNewTake({ Take, HypeToken, TakeRewardsV1, takeId: id })
    })
}

type ProcessTakeArgs = {
    Take: ethers.Contract
    TakeRewardsV1: ethers.Contract
    HypeToken: ethers.Contract
    takeId: ethers.BigNumberish
}

async function processNewTake(args: ProcessTakeArgs) {
    try {
        const msg = await rewardNewTakes(args)
    } catch (ex) {
        console.log(ex)
    }
}

async function rewardNewTakes({ Take, TakeRewardsV1, HypeToken, takeId }: ProcessTakeArgs) {
    // Load the take.
    let take
    try {
        take = await fetchTake({ takeContract: Take, takeId })
    } catch (err) {
        console.log(err)
        return
    }

    // Load any takes we have remixed.
    const refs = await Promise.all(take.refIds.map((id: any) => fetchTake({ takeContract: Take, takeId: id })))

    // Detect if take is template.
    const isTemplate = (take.description.includes('[xx]') || take.description.includes('[yy]') || take.description.includes('[zz]'))
    const isRemix = refs.length > 0

    const author = await getENSUsername(take.author)
    if (isTemplate) {
        // New template.
        const reward = rewardsFor.template
        console.log(`${take.id} - rewarding template with ${renderBalance(reward)} HYPE`)
        const tx = await TakeRewardsV1.reward(
            take.author, 
            ethers.constants.AddressZero,
            reward, 
            ethers.constants.Zero,
            take.id,
            await getGas()
        )
        await tx.wait(1)

    } else if (isRemix) {
        // New remix.
        const og = refs[0]
        const authorOg = await getENSUsername(refs[0].author)
        const ogTake = refs[0]
        const selfRemix = author === authorOg

        if(!selfRemix) {
            const reward = rewardsFor.remix.take
            const ogReward = rewardsFor.remix.og

            console.log(`${take.id} - rewarding remixer with ${renderBalance(reward)} HYPE`)
            console.log(`${take.id} - rewarding remix (${og.id}) with ${renderBalance(ogReward)} HYPE`)

            // Mint reward.
            const tx = await TakeRewardsV1.reward(
                take.author,
                og.author,
                reward,
                ogReward,
                take.id,
                await getGas()
            )
            await tx.wait(1)

        } else {
            // const reward = formatUnits(1);

            // console.log(`${take.id} - rewarding remixer with ${renderBalance(reward)} HYPE`)
            // console.log(`${take.id} - rewarding remix (${og.id}) with ${renderBalance(ogReward)} HYPE`)

            // console.log(`${take.id} - rewarding self-remix with ${renderBalance(reward)} HYPE`)

            // let tx = await HypeToken.mint(take.author, reward)
            // await tx.wait(1)
        }

    } else {
        // New take.
        const reward = rewardsFor.take
        console.log(`${take.id} - rewarding take with ${renderBalance(reward)} HYPE`)

        const tx = await TakeRewardsV1.reward(
            take.author,
            ethers.constants.AddressZero,
            reward,
            ethers.constants.Zero,
            take.id,
            await getGas()
        )
        await tx.wait(1)
        
    }
}

// https://github.com/ethers-io/ethers.js/issues/2828
async function getGas() {
    const feeData = await provider.getFeeData()
    return { gasPrice: feeData.gasPrice }
}



main()