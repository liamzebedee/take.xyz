const TG = require('telegram-bot-api')
const slugify = require('slugify')

const { TELEGRAM_TOKEN } = process.env
const CHAT_ID = "-801845949"
const TAKE_APP_BASE_URL = "https://take-xyz.vercel.app"
printTelegramBotInfo()

// Check if TELEGRAM_TOKEN is set
if (!TELEGRAM_TOKEN) {
    throw new Error('TELEGRAM_TOKEN is not set')
}

async function main() {
    const api = new TG({
        token: TELEGRAM_TOKEN
    })
    // printTakeDeploymentInfo()
    listenToNewTakes({ api })
}

// import TakeABI and ethers
const { ethers } = require('ethers')
const { TakeABI } = require('../../abis')
// import take deployment address
const { TakeV3Address } = require('../../lib/config')

const { default: truncateEthAddress } = require('truncate-eth-address')


function printTelegramBotInfo() {
    console.log(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`)
}

function printTakeDeploymentInfo() {
    const takeDeploymentInfoPage = `https://polygonscan.com/txs?a=${TakeV3Address}`
    console.log(`Take deployment info: ${takeDeploymentInfoPage}`)
}

async function fetchTake({ takeContract: Take, takeId }) {
    const takeURI = await Take.tokenURI(takeId)
    const owner = await Take.ownerOf(takeId)
    const author = await Take.getTakeAuthor(takeId)
    const json = atob(takeURI.substring(29))
    const tokenURIJsonBlob = JSON.parse(json)
    const refsIdsBN = await Take.getTakeRefs(takeId)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    return {
        id: takeId,
        owner,
        author,
        takeURI,
        refIds,
        ...tokenURIJsonBlob,
    }
}


// Create a Polygon RPC provider.
const provider = new ethers.providers.JsonRpcProvider(
    'https://polygon-rpc.com'
)
const ensProvider = new ethers.providers.InfuraProvider()
const getENSUsername = async (address) => {
    try {
        return await ensProvider.lookupAddress(address)
    } catch(err) {
    }

    console.log(address)
    return truncateEthAddress(address)
}

async function listenToNewTakes({ api }) {
    // const address = await ensProvider.lookupAddress('0xca65Fd88c2d0b4A012F38c6677f45bbc4186AcF5');
    // console.log(address)

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
    console.log(`Last 5 takes:`)
    const last5 = events.slice(-5)
    last5.forEach(async event => {
        const takeId = event.args.id.toNumber()
        console.log(await getNewTakeAnnouncement({ Take, takeId: lastTakeId }))
    })

    // Print a non-template take.
    // console.log(await getNewTakeAnnouncement({ Take, takeId: 0 }))
    // Print a remixed take.
    // console.log(await getNewTakeAnnouncement({ Take, takeId: 39 }))
    

    api.sendMessage({
        chat_id: CHAT_ID,
        parse_mode: 'HTML',
        text: await getNewTakeAnnouncement({ Take, takeId: 0 }),
    })

    api.sendMessage({
        chat_id: CHAT_ID,
        parse_mode: 'HTML',
        text: await getNewTakeAnnouncement({ Take, takeId: 39 }),
    })

    // Now listen to the Take contract for new takes.
    // Take.on('Transfer', async (from, to, tokenId) => {
    //     console.log(`New take: ${tokenId}`)

    //     // // Load the take.
    //     // const take = await fetchTake({ takeContract: take, takeId: tokenId })
    //     // // Load any takes we have remixed.
    //     // const refs = await Promise.all(take.refIds.map(id => fetchTake({ takeContract: take, takeId: id })))

    //     // // Now log it
    //     // console.log(take)
    //     // console.log(refs)
    // })
}

async function getNewTakeAnnouncement({ Take, takeId }) {
    // Load the take.
    const take = await fetchTake({ takeContract: Take, takeId })
    // Load any takes we have remixed.
    const refs = await Promise.all(take.refIds.map(id => fetchTake({ takeContract: Take, takeId: id })))

    // Now log it
    // console.log(take)
    // console.log(refs)

    // Detect if take is template.
    const isTemplate = (take.description.includes('[xx]') || take.description.includes('[yy]'))
    const isRemix = refs.length > 0
    let msg

    const takeShortUrl = `${TAKE_APP_BASE_URL}/t/-${takeId}`
    const takeLongUrl = `${TAKE_APP_BASE_URL}/t/${slugify(take.description)}-${takeId}`

    // take is currently building a telegram bot
    // nakamofo.eth remixed himself



    if (isTemplate) {
        // msg = `new template - <a href="${takeLongUrl}">${take.description}</a>`
        msg = `<b>${take.description}</b> <a href="${takeLongUrl}">[remix]</a>`
    } else if (isRemix) {
        // Resolve ens names:
        // - author of take
        // - author of og take
        const author = await getENSUsername(take.author)
        const authorOg = await getENSUsername(refs[0].author)
        const ogTake = refs[0]
        const ogTakeLongUrl = `${TAKE_APP_BASE_URL}/t/${slugify(ogTake.description)}-${ogTake.id}`
        const selfRemix = author === authorOg
        
        const remixed = `<a href="${takeLongUrl}">remixed</a>`
        const remixBio = selfRemix ? `himself` : `${remixed} ${authorOg}`
        const link = `<a href="${takeLongUrl}">link</a>`

        msg += `${author} remixed ${authorOg}!`
        msg += "\n"
        msg = `<b>${take.description}</b> <a href="${ogTakeLongUrl}">[remix]</a>`
        // msg += ` by ${authorOg}`
        // msg += `remix of #${refs[0].id} by ${authorOg}`

        // msg += `by ${author}, remixes ${authorOg}`
        // msg += `#${takeId} - remix of ${authorOg} #${refs[0].id}`

        // take is currently building a tg bot
        // by nakamofo, remixes nakamofo

        // msg += `${author} ${remixed} ${selfRemix ? 'themself' : }`

        // msg = `${take.description}\nremixed by ${author} (<a href="${takeLongUrl}">link</a>))`
        // msg = `take is currently building a telegram bot\nremixed by ${author} (<a href="${takeLongUrl}">link</a>))`
        // msg = `${author} remixed ${authorOg}'s - <a href="${takeLongUrl}">${take.description}</a>`
        // msg = [`${author} remixed ${authorOg}`, `<a href="${takeLongUrl}">${take.description}</a>`]
    } else {
        msg = `<b>${take.description}</b> <a href="${takeLongUrl}">[remix]</a>`
    }
    
    return msg

    // let message = `new template!\n`
    // message += 
}



main()