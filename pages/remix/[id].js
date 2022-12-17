import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../../styles/Home.module.css'


/*
Rainbow & wagmi
*/
import '@rainbow-me/rainbowkit/styles.css';

import {
    ConnectButton,
    getDefaultWallets,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, WagmiConfig, useSigner } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core'
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import Header from '../../components/header';
import { TakeABI } from '../../abis';
import { useRouter } from 'next/router';
import { TakeV2Address } from '../../lib/config';


const { chains, provider } = configureChains(
    [polygon, mainnet],
    [
        publicProvider()
    ]
);

const { connectors } = getDefaultWallets({
    appName: 'take',
    chains
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
})


/*
UI
*/

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const slugify = require('slugify')

function parseTakeURI(uri) {
    const json = atob(uri.substring(29));
    const tokenURIJsonBlob = JSON.parse(json);
    return tokenURIJsonBlob
}

function UI() {
    // Get the take ID we're remixing from the URL.
    const router = useRouter()
    const { takeURI } = router.query
    let ogTake = {}
    if (takeURI) {
        ogTake = parseTakeURI(takeURI)
        console.log(ogTake)
    }

    // the URL looks like:
    // http://localhost:3000/remix/1231?takeURI=this-is-such-a-meme-123123
    // we need to extract the 123123
    const ogTakeId = router.query.id ? router.query.id.split('-').pop() : null
    console.log(ogTakeId)

    const [take, setTake] = useState('')
    const [input1, setInput1] = useState('')
    const [input2, setInput2] = useState('')
    const [canTakeIt, setCanTakeIt] = useState(false)

    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()

    // Listen to the input changes.
    const onInput1Change = (e) => {
        setInput1(e.target.value)
    }
    const onInput2Change = (e) => {
        setInput2(e.target.value)
    }

    // Compile the take
    useEffect(() => {
        if(!ogTake.description) return

        // Replace any [xx] and [yy] with the input values.
        let xx = input1 || '[xx]'
        let yy = input2 || '[yy]'
        const take = ogTake.description.replace(/\[xx\]/g, xx).replace(/\[yy\]/g, yy)
        setTake(take)
    }, [input1, input2])

    // Validate input, enable button.
    useEffect(() => {
        setCanTakeIt(account.isConnected && take.length > 0)
    }, [account, take])

    // Mint the take on click.
    // const provider = getProvider()
    const takeItContractV1 = getContract({
        address: TakeV2Address,
        abi: TakeABI,
        signerOrProvider: signer
    })
    const takeIt = async () => {
        try {
            const tx = await takeItContractV1.mint(take, [parseInt(ogTakeId) || 0, 0, 0])
            const receipt = await tx.wait()
            console.log(receipt)
            
            // extract ERC721 mint event from receipt
            // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
            // const event = receipt.events[0]
            // decode hex tokenId arg into tokenId number
            // const tokenId = parseInt(event.args[2])
            const event = receipt.events.find(e => e.event === 'Transfer')
            const tokenId = event.args.id
            // redirect to take page
            window.location.href = `/t/${slugify(take)}-${tokenId}`

        } catch (err) {
            console.error(err)
            return
        }
    }

    const renderTemplateTake = (take) => {
        let spans = []
        let isVar = false
        for(let i = 0; i < take.length; i++) {
            let c = take[i]
            // I fucking love that GPT just wrote this for me.
            if(c === '[') {
                isVar = true
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else if(c === ']') {
                isVar = false
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else if(isVar) {
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else {
                spans.push(<span key={i}>{c}</span>)
            }
        }
        return <>
            <p className={styles.description}>
                {spans}
            </p>
        </>
    }

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                <p className={styles.description}>
                    <strong>remix take{' '}</strong>
                </p>

                {/* <p className={styles.description}>
                    {ogTake.description}
                </p> */}

                <p className={styles.description}>
                    {renderTemplateTake(take)}
                </p>

                <p className={styles.description}>
                    <input className={styles.takeInput} onChange={onInput1Change} maxLength={60} type="text"></input>
                </p>

                <p className={styles.description}>
                    <input className={styles.takeInput} onChange={onInput2Change} maxLength={60} type="text"></input>
                </p>

                {/* <p className={styles.description}>
                    {take}
                </p> */}

                <div className={styles.grid}>
                    <button disabled={!canTakeIt} className={styles.takeItBtn} onClick={takeIt}>take it</button>
                </div>
            </main>

            <footer className={styles.footer}>
                <a
                    href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Powered by wordcels
                </a>
            </footer>
        </div>
    )


    return ui
}

export default function Home() {
    return (

        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider modalSize="compact" chains={chains}>
                <UI />
            </RainbowKitProvider>
        </WagmiConfig>

    )
}
