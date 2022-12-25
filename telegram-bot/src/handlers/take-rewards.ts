import { renderBalance, TakeRewardsV1Address } from "@takeisxx/lib"
import { TakeRewardsV1ABI } from "@takeisxx/lib/build/abis"
import { BigNumber, ethers } from "ethers"
import { Context } from "../context"
import _, { sortBy } from 'lodash'
import { Msg } from "../helpers"
import { getENSUsername } from "../helpers"

export async function listenToTakeRewards(ctx: Context) {
    const { provider, api } = ctx

    // Get the HYPE contract.
    const TakeRewards = new ethers.Contract(
        TakeRewardsV1Address,
        TakeRewardsV1ABI,
        provider
    )

    // get old rewards
    const filter = TakeRewards.filters.Reward(null, null, null, null, null)
    // Query from the block which the Take contract was deployed.
    const TakeDeploymentBlock = 36967571
    const events = await TakeRewards.queryFilter(filter, TakeDeploymentBlock, 'latest')
    events.forEach(async event => {
        await processTakeReward(ctx, event.args as unknown as RewardsArgs)
    })


    TakeRewards.on('Reward', async (user1: string, user2: string, amount1: BigNumber, amount2: BigNumber, takeId: BigNumber) => {
        await processTakeReward(ctx, { user1, user2, amount1, amount2, takeId })
    })
}

interface RewardEntry {
    user: string
    reward: number
    isRemix: boolean
    wasRemixed: boolean
}

let rewardsEntries: RewardEntry[] = []

type RewardsArgs = { user1: string, user2: string, amount1: BigNumber, amount2: BigNumber, takeId: BigNumber  }
async function processTakeReward(ctx: Context, { user1, user2, amount1, amount2, takeId }: RewardsArgs) {
    if (user2 == ethers.constants.AddressZero) {
        // Reward for single take.
        const reward = {
            user: user1,
            reward: renderBalance(amount1),
            isRemix: false,
            wasRemixed: false
        }

        rewardsEntries.push(reward)

    } else {
        // Reward for remix.
        const rewardRemix = {
            user: user1,
            reward: renderBalance(amount1),
            isRemix: true,
            wasRemixed: false
        }

        const rewardOg = {
            user: user2,
            reward: renderBalance(amount2),
            isRemix: false,
            wasRemixed: true
        }


        rewardsEntries.push(rewardRemix)
        rewardsEntries.push(rewardOg)
    }
}


interface RewardsSummary {
    username: string
    totalRewards: number
    totalRemixes: number
    totalRemixesByOthers: number
    totalTakes: number
}

export async function printRewardsSummary(ctx: Context) {
    const { api, ensProvider, chatId } = ctx

    // Reduce the rewards to a list of users each with their reward.
    let rewards: Record<string, RewardsSummary> = {}

    for (const rewardEntry of rewardsEntries) {
        const { user } = rewardEntry
        
        let entry = _.get(rewards, user, {
            username: '',
            totalRewards: 0,
            totalRemixes: 0,
            totalRemixesByOthers: 0,
            totalTakes: 0
        })

        // entry.username = user

        // Get the username.
        if (!entry.username.length) {
            const username = await getENSUsername(ensProvider, user)
            entry.username = username
        }
        entry.totalRewards += +rewardEntry.reward
        entry.totalRemixes += +rewardEntry.isRemix
        entry.totalRemixesByOthers += +rewardEntry.wasRemixed
        entry.totalTakes += 1

        _.set(rewards, user, entry)
    }

    // Now we create a leaderboard.
    // Sort the table by the highest scoring user.
    let table = sortBy(
        Object
            .entries(rewards)
            .map(([user, scores]) => ({ user, ...scores })),
        ['totalRewards'],
    )
    .reverse() // sort descending

    if(!table.length) return

    // Print the table.
    let msg = new Msg
    msg.write("🏆 <b>Take Rewards Leaderboard</b> 🏆\n\n")
    table.map(({ username, totalRewards, totalTakes, totalRemixes, totalRemixesByOthers }, i) => {
        // get ens
        const pluralize = (word: string, num: number) => {
            if(word == 'remix') {
                return num == 1 ? word : word + 'es'
            }
            return num == 1 ? word : word + 's'
        }
        msg.write(`${i + 1}. <b>${username}</b> - +${totalRewards} HYPE. Made ${totalTakes} ${pluralize('take', totalTakes)}, ${totalRemixes} ${pluralize('remix', totalRemixes)}, remixed ${totalRemixesByOthers} ${pluralize('time', totalRemixesByOthers)}.`)
    })

    await api.sendMessage({
        chat_id: chatId,
        parse_mode: 'HTML',
        disable_web_page_preview: 'true',
        text: msg.buf
    })

    // Clear the rewards.
    rewardsEntries = []

    console.log(msg.buf)
}

