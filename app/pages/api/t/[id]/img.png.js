import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import styles from '../../../../styles/Home.module.css';
const slugify = require('slugify')
import truncateEthAddress from 'truncate-eth-address';

/*
Rainbow & wagmi
*/

import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from 'wagmi';
import Header from '../../../../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core'
import { AppLayout } from '../../../../components/layout';


// import useSigner
import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ethers } from 'ethers';
import { TakeV3Address, TAKE_BASE_URL } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { fetchTake2 } from '@takeisxx/lib/src/chain';

import domtoimage from 'dom-to-image';

/*
UI
*/


async function getServerSideProps(context) {
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

import * as ReactDOMServer from 'react-dom/server';

async function render(id) {
    const context = {
        query: { id }
    }
    const { props } = await getServerSideProps(context)
    
    // Now render JSX to HTML.
    // const el = ReactDOMServer.renderToString(<TakeBoxSVG take={props.take} />)
    const el = ReactDOMServer.renderToString(<TakeBox take={props.take} />)
    // console.log(el)
    return el

    // Now render HTML to PNG.
    // const elPng = await domtoimage.toPng(elHtml)

}


export const TakeBoxSVG = ({ take }) => {
    return <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 300 300">
        <style>
        {`
        .base {
            fill: white; 
            font-family: sans-serif;
            font-size: 18px;
        }
        `}
        </style>
        <rect width="100%" height="100%" fill="#E31C79" />
        <text x="10" y="20" className="base">{take.description}</text>
    </svg>
}

const TWITTER_CARD = {
    dimensions: {
        width: 1200,
        height: 675
    }
}

const getENSUsername = async (ensProvider, address) => {
    try {
        const ens = await ensProvider.lookupAddress(address)
        if (ens) return ens
    } catch (err) {
    }

    return truncateEthAddress(address)
}

export const TakeBox = ({ take }) => {
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
        {/* <div className={""}>
            <strong>take #{take.id}</strong>
        </div> */}

        <div className='root'>
            <div className='takebox'>
                <span>{take.description}</span>
                <footer>#{take.id} {`-`} minted by {take.username}</footer>
            </div>
        </div>

        {/* <div className={styles.takeMeta}>
            collected by <a href={openseaUrl}><strong>{authorEns || truncateEthAddress(take.owner)}</strong></a>
        </div> */}

        {/* <p>
            <button className={styles.takeItBtn} onClick={remix}>like</button>
            <button className={styles.takeItBtn} onClick={remix}>remix</button>
        </p> */}

        {/* <p className={styles.description}>
            {take.text}
        </p> */}
        </body>
    </html>
}

// const svgexport = require('svgexport');
// import { svg2png } from 'svg-png-converter'
// const svg2img = require('svg2img');




// import { app, BrowserWindow } from 'electron'
// const fs = require('fs')
// const path = require('path')
// console.log(app)

const puppeteer = require('puppeteer');

async function svg2Png(svg) {
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

async function html2Png(svg) {
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

    await browser.close();

    return buf
}


// async function svg2Png(svg) {
//     return await new Promise((res, rej) => {
//         app.whenReady().then(() => {
//             // app.disableHardwareAcceleration()

//             win = new BrowserWindow({ 
//                 width: 1000,
//                 height: 1000,
//                 webPreferences: { offscreen: true } 
//             })

//             win.loadURL(`data:image/svg+xml,${encodeURIComponent(svg)}`)

//             win.webContents.on('paint', (event, dirty, image) => {
//                 const buf = image.toPNG()
//                 res(buf)
//             })

//             win.webContents.setFrameRate(60)
//             // if (BrowserWindow.getAllWindows().length === 0) {
//             //     app.quit()
//             // }
//         })
//     })
// }



export default async function handler(req, res) {
    const { id } = req.query

    // http://localhost:3000/api/t/249/img.png

    const svg = await render(id)
    // const opts = { 
    //     resvg: {
    //         font: {
    //             loadSystemFonts: true,
    //             sansSerifFamily: "Arial",
    //         },
    //         textRendering: 1,
    //         fitTo: {
    //             mode: 'width', // or height
    //             value: 600,
    //         },
    //     }
    // }

    // const data = await new Promise((res, rej) => svg2img(svg, opts, function (error, buffer) {
    //     if(error) rej(error)
    //     res(buffer)
    // }))

    // const data = await svg2Png(svg)
    const data = await html2Png(svg)

    // const data = await svg2png({
    //     input: svg,
    //     encoding: 'buffer',
    //     width: 1024,
    //     height: 1024,
    //     quality: 1,
    //     format: 'png',
    // })

    // const data = await new Promise((res, rej) => {
    //     svgexport.render(`data:image/svg+xml,`+svg, data => {
    //         res(data)
    //     });
    // })
    // console.log(data)

    // console.log(body)
    res
        // .setHeader('Content-Type', 'image/svg+xml')
        // .setHeader()
        .status(200)
        .send(data)
}