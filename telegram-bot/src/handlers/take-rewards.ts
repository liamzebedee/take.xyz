import { TakeRewardsV1Address } from "@takeisxx/lib"
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

    TakeRewards.on('Rewards', async (user1: string, user2: string, amount1: BigNumber, amount2: BigNumber, takeId: BigNumber) => {
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
            reward: amount1.toNumber(),
            isRemix: false,
            wasRemixed: false
        }

        rewardsEntries.push(reward)

    } else {
        // Reward for remix.
        const rewardRemix = {
            user: user1,
            reward: amount1.toNumber(),
            isRemix: true,
            wasRemixed: false
        }

        const rewardOg = {
            user: user2,
            reward: amount2.toNumber(),
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
    const { api, ensProvider } = ctx

    // Reduce the rewards to a list of users each with their reward.
    let rewards: Record<string, RewardsSummary> = {}
    const defaultEntry = {
        username: '',
        totalRewards: 0,
        totalRemixes: 0,
        totalRemixesByOthers: 0,
        totalTakes: 0
    }

    for (const rewardEntry of rewardsEntries) {
        const { user } = rewardEntry
        
        let entry = _.get(rewards, user, defaultEntry)

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

    // Print the table.
    let msg = new Msg
    table.map(({ fromUsername, totalRewards, totalRemixes, totalRemixesByOthers }: any, i) => {
        // get ens
        msg.write(`#${i} <b>${fromUsername}</b> - made ${totalRemixes} takes, remixed ${totalRemixesByOthers} times. +${totalRewards} HYPE`)
    })

    console.log(msg.buf)
}

