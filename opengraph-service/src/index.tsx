import truncateEthAddress from 'truncate-eth-address';
import slugify from 'slugify'

/*
Rainbow & wagmi
*/

// import { multicall } from '@wagmi/core';
// import { multicall } from '@takeisxx/lib';
import * as React from 'react'

import * as ReactDOMServer from 'react-dom/server';
// import useSigner
import { ethers } from 'ethers';
import { TakeV3Address } from '@takeisxx/lib';
import { abis } from '@takeisxx/lib';
const { TakeABI  } = abis
import { fetchTake2 } from '@takeisxx/lib';

/*
UI
*/

async function getServerSideProps(context: any) {
    // Construct the Alchemy provider.
    const ensProvider = new ethers.providers.AlchemyProvider('mainnet', 'enrTyPA6vUOBNhU7u0wOtKQWCBWAetx9')
    const provider = new ethers.providers.AlchemyProvider('matic', 'aPWRA4EZ6QMbPKs_L6DNo_w-avrXNGrm')

    // Construct the Take contract.
    const takeItContractV1 = new ethers.Contract(TakeV3Address, TakeABI, provider)

    const takeId = context.query.id.split('-').pop()
    const take = await fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs: false })

    const ensUsername = await getENSUsername(ensProvider, take.owner)
    take.username = ensUsername
    // console.log(take)

    return {
        props: {
            take,
        },
    }
}


async function render(id: string) {
    const context = {
        query: { id: '-'+id }
    }
    const { props } = await getServerSideProps(context)

    // Now render JSX to HTML.
    // const el = ReactDOMServer.renderToString(<TakeBoxSVG take={props.take} />)
    const el = ReactDOMServer.renderToString(<TakeBox take={props.take} />)
    // console.log(el)
    return el
}


// export const TakeBoxSVG = ({ take }) => {
//     return <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 300 300">
//         <style>
//             {`
//         .base {
//             fill: white; 
//             font-family: sans-serif;
//             font-size: 18px;
//         }
//         `}
//         </style>
//         <rect width="100%" height="100%" fill="#E31C79" />
//         <text x="10" y="20" className="base">{take.description}</text>
//     </svg>
// }

const TWITTER_CARD = {
    dimensions: {
        width: 1200,
        height: 675
    }
}

const getENSUsername = async (ensProvider: any, address: any) => {
    try {
        const ens = await ensProvider.lookupAddress(address)
        if (ens) return ens
    } catch (err) {
    }

    return truncateEthAddress(address)
}

export const TakeBox = ({ take }: any) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`
    console.log(take)

    return <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        </head>
        <body>
            <style>
                {`
            * {
                box-sizing: border-box;
            }
            html, body, .root {
                padding: 0;
                margin: 0;
                text-rendering: optimizeLegibility;
                font-family: "Helvetica Neue", sans-serif;
            }
            body {
                font-size: calc(0.75rem, 0, + 1vmin);
                max-zoom: 1;
                height: 100vh;
                width: 100vw;
            }
            .root {
                display: flex;
                height: 100%;
                width: 100%;
                align-items: center;
                align-content: center;
                justify-content: center;
                justify-items: center;
                flex-direction: column;
            }
            .takebox {
                flex: 1;
                display: inline-block;
                font-size: 4.5rem;
                background: #ff2a8d;
                padding: 4rem 3rem;
                color: white;
                font-family: sans-serif;
                vertical-align: middle;
            }
            .takebox footer {
                font-size: 3rem;
                padding-top: 1rem;
                opacity: 0.6;
            }
            `}
            </style>

            <div className='root'>
                <div className='takebox'>
                    <span>{take.description}</span>
                    <footer>#{take.id} {`-`} minted by {take.username}</footer>
                </div>
            </div>

        </body>
    </html>
}



const puppeteer = require('puppeteer');


async function svg2Png(svg: string) {
    // 1. Launch the browser
    const browser = await puppeteer.launch();

    // 2. Open a new page
    const page = await browser.newPage();

    // 3. Navigate to URL
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`
    await page.goto(url);

    // 4. Take screenshot
    const buf = await page.screenshot()

    await browser.close();

    return buf
}

async function html2Png(svg: string) {
    // 1. Launch the browser
    const browser = await puppeteer.launch({
        headless: true,
        // make the window large
        defaultViewport: {
            width: TWITTER_CARD.dimensions.width,
            height: TWITTER_CARD.dimensions.height
        }
    });

    // 2. Open a new page
    const page = await browser.newPage();

    // 3. Navigate to URL
    const url = `data:text/html,${encodeURIComponent(svg)}`
    await page.goto(url);

    // 4. Take screenshot
    const buf = await page.screenshot()
    browser.close();

    return buf
}


import { multicall } from "@wagmi/core"

async function main() {
    const provider = new ethers.providers.AlchemyProvider('matic', 'aPWRA4EZ6QMbPKs_L6DNo_w-avrXNGrm')

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


    // Process missed take ID's.
    const lastProcessedTake = parseInt(process.env.LASTTAKE) || totalTakes - 1
    for (let i = lastProcessedTake; i < totalTakes; i++) {
        console.log(`processing missed take: ${i}`)
        await processNewTake({ Take, takeId: i })
    }


    // Now listen to the Take contract for new takes.
    Take.on('Transfer', async (from, to, id) => {
        console.log(`New take: ${id}`)
        await processNewTake({ Take, takeId: id })
    })

}

const { writeFileSync } = require('node:fs')
import { join } from 'node:path'

async function processNewTake({ takeId }: any) {
    const svg = await render(takeId)
    const data = await html2Png(svg)

    writeFileSync(join(__dirname, 'imgs/twitter/', `${takeId}.png`), data)
}

main()