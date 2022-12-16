import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'


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
import { BigNumber } from 'ethers';
import { useEnsName } from 'wagmi'
import truncateEthAddress from 'truncate-eth-address'



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

import takeABI from '../abis/take.json'
import Link from 'next/link';
import Header from '../components/header';

function UI() {
    const [takes, setTakes] = useState([])

    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()
    
    // Contract.
    const takeItContractV1 = getContract({
        address: '0xC343497721e61FD96B1E3C6e6DeBE5C2450d563c',
        abi: takeABI,
        signerOrProvider: provider
    })

    // Fetch the latest 10 takes.
    const fetchTakes = async () => {
        const takeCount = await takeItContractV1.takeCount()
        const from = takeCount
        const takeIds = Array.from(Array(10).keys())
            .map(i => BigNumber.from(from).sub(i).toNumber())
            .reverse()
            .filter(i => i > -1)
            .filter(i => i < takeCount)
        console.log(takeIds)

        const takes = await Promise.all(takeIds.reverse().map(async (takeId) => {
            const takeURI = await takeItContractV1.tokenURI(takeId)
            const owner = await takeItContractV1.ownerOf(takeId)
            const json = atob(takeURI.substring(29));
            const tokenURIJsonBlob = JSON.parse(json);
            return {
                id: takeId,
                owner,
                takeURI,
                ...tokenURIJsonBlob,
            }
        }))
        setTakes(takes)
    }

    useEffect(() => {
        if (account.isConnected) {
            fetchTakes()
        }
    }, [account.isConnected])

    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                {!takes.length && (
                    <div className={styles.loading}>
                        <div>loading...</div>
                    </div>
                )}

                <div className={styles.takesGrid}>
                    {takes.map(take => <TakeBox take={take}/>)}
                </div>
            </main>

            <div style={{ paddingBottom: "1rem" }}></div>
        </div>
    )

    return ui
}

const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/0xc343497721e61fd96b1e3c6e6debe5c2450d563c/${take.id}`
    
    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.owner,
        chainId: 1,
    })

    const remix = async () => {}

    return <div className={styles.takeBox}>
        <div className={styles.takeHeader}>
            <strong>take #{take.id}</strong>
        </div>

        <div>
            <Link href={`/take/${take.id}`}>
                {take.takeURI && (
                    <div className={styles.mockTakeImg}>
                        <span>{take.description}</span>
                    </div>
                )}
                {/* {take.takeURI && <img className={styles.takeImg} src={take.image} />} */}
            </Link>
        </div>

        <div className={styles.takeMeta}>
            collected by <a href={openseaUrl}><strong>{authorEns || truncateEthAddress(take.owner)}</strong></a>
        </div>

        {/* <p>
            <button className={styles.takeItBtn} onClick={remix}>like</button>
            <button className={styles.takeItBtn} onClick={remix}>remix</button>
        </p> */}

        {/* <p className={styles.description}>
                    {take.text}
                </p> */}
    </div>
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
