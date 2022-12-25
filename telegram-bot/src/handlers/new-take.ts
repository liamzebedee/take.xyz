import { TakeV3Address } from "@takeisxx/lib"
import { TakeABI } from "@takeisxx/lib/build/abis"
import { ethers } from "ethers"
import slugify from "slugify"
import { TAKE_APP_BASE_URL } from "../config"
import { Context } from "../context"
import { fetchTake, Msg } from "../helpers"
import { getENSUsername } from "../helpers"

export async function listenToNewTakes(ctx: Context) {
    const { provider, ensProvider, api } = ctx

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
    const TakeDeploymentBlock = 36967571
    const events = await Take.queryFilter(filter, TakeDeploymentBlock, 'latest')

    // Print the latest take ID.
    const lastTakeId = events[events.length - 1].args.id.toNumber()
    console.log(`Last take: ${lastTakeId}`)

    // Get the last 5 and print them.
    // console.log(`Last 5 takes:`)
    // const last5 = events.slice(-5)
    // last5.forEach(async event => {
    //     const takeId = event.args.id.toNumber()
    //     // console.log(await getNewTakeAnnouncement({ Take, takeId: lastTakeId }))
    // })

    // Print a non-template take.
    // console.log(await getNewTakeAnnouncement({ Take, takeId: 0 }))
    // Print a remixed take.
    // console.log(await getNewTakeAnnouncement({ Take, takeId: 39 }))


    // if(process.env.NODE_ENV !== 'production') {
    //     // Take.
    //     await processNewTake({ api, Take, takeId: 0 })

    //     // Template.
    //     // https://take-xyz.vercel.app/t/take-is-xx-23
    //     await processNewTake({ api, Take, takeId: 23 })

    //     // Remix.
    //     await processNewTake({ api, Take, takeId: 39 })
    // }

    // Process missed take ID's.
    const lastProcessedTake = process.env.LASTTAKE || totalTakes
    for (let i = lastProcessedTake; i < totalTakes; i++) {
        console.log(`processing missed take: ${i}`)
        await processNewTake(ctx, { Take, takeId: i })
    }


    // Now listen to the Take contract for new takes.
    Take.on('Transfer', async (from, to, id) => {
        console.log(`New take: ${id}`)
        await processNewTake(ctx, { Take, takeId: id })
        // setTimeout(async () => {
        //     // VM Exception while processing transaction: reverted with reason string "NOT_MINTED"
        //     // Appears we're running into race conditions with the contract.
        //     // Wait 1000ms might solve.
        // }, 1000)
    })

}

async function processNewTake(ctx: Context, { Take, takeId }: any) {
    const { api, chatId } = ctx

    try {
        const msg = await getNewTakeMessage(ctx, { Take, takeId })
        await api.sendMessage({
            chat_id: chatId,
            parse_mode: 'HTML',
            text: msg.buf,
        })
    } catch (ex) {
        console.log(ex)
    }
}

async function getNewTakeMessage(ctx: Context, { Take, takeId }: any) {
    const { ensProvider } = ctx
    
    // Load the take.
    let take
    try {
        take = await fetchTake({ takeContract: Take, takeId })
    } catch (err) {
        console.log(err)
        return
    }

    // Load any takes we have remixed.
    const refs = await Promise.all(take.refIds.map((id: string) => fetchTake({ takeContract: Take, takeId: id })))

    // Now log it
    // console.log(take)
    // console.log(refs)

    // Detect if take is template.
    const isTemplate = (take.description.includes('[xx]') || take.description.includes('[yy]'))
    const isRemix = refs.length > 0

    const takeShortUrl = `${TAKE_APP_BASE_URL}/t/-${takeId}`
    const takeLongUrl = `${TAKE_APP_BASE_URL}/t/${slugify(take.description)}-${takeId}`

    let msg = new Msg()

    const author = await getENSUsername(ensProvider, take.author)
    if (isTemplate) {
        // msg = `new template - <a href="${takeLongUrl}">${take.description}</a>`
        // msg.write("<b>New template!</b>")
        msg.write(`new template from ${author} - <b>${take.description}</b>\n<a href="${takeLongUrl}">remix</a>`)
        // msg.write(`<a href="${takeLongUrl}">take/${take.id}</a>`)

    } else if (isRemix) {
        // Resolve ens names:
        // - author of take
        // - author of og take
        const authorOg = await getENSUsername(ensProvider, refs[0].author)
        const ogTake = refs[0]

        // URL.
        const ogTakeLongUrl = `${TAKE_APP_BASE_URL}/t/${slugify(ogTake.description)}-${ogTake.id}`
        const selfRemix = author === authorOg

        msg.write(`new remix from ${author} - <b>${take.description}</b>\n<a href="${takeLongUrl}">link</a>`)

        // let msg2 = Message()
        // msg2.write(`<b>${author} remixed ${authorOg}'s take!</b>`)

        // msgs.push(msg2)
        // msg.write(`<b> ${take.description}</b>`)

        // msg.write(`<b>${author} remixed ${authorOg}!</b>`)
        // msg.write(`${take.description}`)
        // msg.write(`<a href="${takeLongUrl}">[remix]</a>`)
    } else {
        msg.write(`new take from ${author} - <b>${take.description}</b>\n<a href="${takeLongUrl}">link</a>`)

        // msg.write("<b>New take!</b>")
        // msg.write(`${take.description}`)
        // msg.write(`<a href="${takeLongUrl}">[take]</a>`)
    }

    // msgs.push(msg)

    return msg
}

