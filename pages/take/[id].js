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
import { useEnsName } from 'wagmi'
import Header from '../../components/header';


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

function UI() {
    const [take, setTake] = useState({})
    const account = useAccount()

    const provider = getProvider()
    const takeItContractV1 = getContract({
        address: '0xC343497721e61FD96B1E3C6e6DeBE5C2450d563c',
        abi: [
            "function takeCount() public view returns (uint256)",
            "function mint(string memory _take) public",
            "function tokenURI(uint256 tokenId) public view returns (string memory)",
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
            "function ownerOf(uint256 tokenId) public view returns (address)"
        ],
        signerOrProvider: provider
    })

    // Load the take.
    useEffect(() => {
        const loadTake = async () => {
            // Get the take ID from the URL.
            const takeId = window.location.pathname.split('/').pop()
            
            // Handle non-existent take.
            const takeCount = await takeItContractV1.takeCount()
            if (takeCount.toNumber() < Number(takeId)) {
                const takeURI = await takeItContractV1.tokenURI(takeId)
                setTake({
                    id: "not-found",
                    takeURI
                })
                return
            }

            // Load the take.
            const takeURI = await takeItContractV1.tokenURI(takeId)
            const owner = await takeItContractV1.ownerOf(takeId)
            const json = atob(takeURI.substring(29));
            const tokenURIJsonBlob = JSON.parse(json);
            console.log(tokenURIJsonBlob)
            
            setTake({
                id: takeId,
                owner,
                takeURI,
                ...tokenURIJsonBlob,
            })
        }
        loadTake()
    }, [])

    // Remix the take.
    const remix = async () => {
    }


    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.owner,
        chainId: 1,
    })

    const openseaUrl = `https://opensea.io/assets/matic/0xc343497721e61fd96b1e3c6e6debe5c2450d563c/${take.id}`

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header/>

            <main className={styles.main}>
                <p className={styles.description}>
                    <strong>take #{take.id}</strong>
                </p>

                { take.takeURI && <img className={styles.takeImg} src={take.image}/> }

                <p>
                    collected by <a href={openseaUrl}><strong>{authorEns || take.owner}</strong></a>
                </p>

                <p>
                    <button className={styles.takeItBtn} onClick={remix}>like</button>
                    <button className={styles.takeItBtn} onClick={remix}>remix</button>
                </p>

                {/* <p className={styles.description}>
                    {take.text}
                </p> */}
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
