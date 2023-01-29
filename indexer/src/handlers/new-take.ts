import { TakeV3Address, TakeV3DeploymentBlock } from "@takeisxx/lib"
import { TakeABI } from "@takeisxx/lib/build/abis"
import { ethers } from "ethers"
import slugify from "slugify"
import { TAKE_APP_BASE_URL } from "../config"
import { Context } from "../context"
import { fetchTake, Msg } from "../helpers"
import { getENSUsername } from "../helpers"
import * as fetch from "node-fetch"

export async function listenToNewTakes(ctx: Context) {
    const { provider, ensProvider } = ctx

    // Get the Take contract.
    const Take = new ethers.Contract(
        TakeV3Address,
        TakeABI,
        provider
    )

    // Test the contract by getting the total number of takes.
    const totalTakes = await Take.totalSupply()
    console.log(`Total takes: ${totalTakes}`)

    // Get the most recent minted take from the Transfer events.
    const filter = Take.filters.Transfer(null, null, null)
    // Query from the block which the Take contract was deployed.
    // See: printTakeDeploymentInfo()
    const events = await Take.queryFilter(filter, TakeV3DeploymentBlock, 'latest')

    // Print the latest take ID.
    const lastTakeId = events[events.length - 1].args.id.toNumber()
    console.log(`Last take: ${lastTakeId}`)

    // Process missed take ID's.
    const lastProcessedTake = process.env.FROM_TAKE || totalTakes
    for (let i = lastProcessedTake; i < totalTakes; i++) {
        console.log(`processing missed take: ${i}`)
        await processNewTake(ctx, { Take, takeId: i })
    }

    // Now listen to the Take contract for new takes.
    Take.on('Transfer', async (from, to, id) => {
        console.log(`New take: ${id}`)
        await processNewTake(ctx, { Take, takeId: id })
    })
}

async function processNewTake(ctx: Context, { Take, takeId }: any) {
    const { apiEndpoint } = ctx

    // Load the take.
    let take
    try {
        take = await fetchTake({ takeContract: Take, takeId })
    } catch (err) {
        console.log(err)
        return
    }

    // Post the take to the API.
    const res = await fetch(`${apiEndpoint}/v0/indexer/on_new_take`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            apiKey: "jfaidfhadiasj383ur83ueiadjasd98qw983ru983u9r33",
            nft_id: takeId,
            text: take.description,
            creator_address: take.author,
            sources: take.refIds,
        }),
    })
    // check status
    if (!res.ok) {
        console.log(`Error: ${res.status} ${res.statusText}`)
        return
    }
    const body = await res.json()
    console.log(body)

    // Load any takes we have remixed.
    // const refs = await Promise.all(take.refIds.map((id: string) => fetchTake({ takeContract: Take, takeId: id })))
}
