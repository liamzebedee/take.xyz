import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';


/*
Rainbow & wagmi
*/

import {
    getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, useSigner } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber } from 'ethers';
import { useEnsName } from 'wagmi';
import truncateEthAddress from 'truncate-eth-address';



const { chains, provider } = configureChains(
    [polygon],
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

import { TakeABI } from '../abis/index.js';
import Link from 'next/link';
import Header from '../components/header';
import { TakeV3Address } from '../lib/config';
import { AppLayout } from '../components/layout';

import { multicall } from '@wagmi/core'

async function fetchTakesBatch({ takeIds, takeItContractV1, takeId, provider }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const functions = (['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor'])
    const contracts = takeIds
        .map(takeId => functions
            .map(functionName => ({
                abi,
                address,
                functionName,
                args: [takeId]
            }))
        )
        .flat()
    
    // console.log(contracts)

    const data = await multicall({
        contracts,
    })
    console.log(data)

    // Now we have to parse the data.
    // Process in batches of functions.length.
    const takes = data
        .reduce((acc, val, i) => {
            const index = Math.floor(i / functions.length)
            if (!acc[index]) {
                acc[index] = []
            }
            acc[index].push(val)
            return acc
        }, [])
        .map(([
            takeURI,
            owner,
            refsIdsBN,
            author
        ], i) => {
            console.log(takeURI)
            const takeId = takeIds[i]
            const json = atob(takeURI.substring(29))
            const tokenURIJsonBlob = JSON.parse(json)
            const refIds = refsIdsBN.map(id => id.toNumber()).filter(id => id > 0)

            return {
                id: takeId,
                owner,
                takeURI,
                refIds,
                ...tokenURIJsonBlob,
            }
        });

    console.log(takes)
    return takes
}

async function fetchTake2({ takeItContractV1, takeId, provider }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const contracts = ['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor'].map(functionName => ({
        abi,
        address,
        functionName,
        args: [takeId]
    }))

    const data = await multicall({
        contracts,
    })

    const [
        takeURI,
        owner,
        refsIdsBN,
        author
    ] = data
    const json = atob(takeURI.substring(29))
    const tokenURIJsonBlob = JSON.parse(json)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    return {
        id: takeId,
        owner,
        takeURI,
        refIds,
        ...tokenURIJsonBlob,
    }
}

async function fetchTake(takeItContractV1, takeId) {
    const takeURI = await takeItContractV1.tokenURI(takeId)
    const owner = await takeItContractV1.ownerOf(takeId)
    const json = atob(takeURI.substring(29))
    const tokenURIJsonBlob = JSON.parse(json)
    const refsIdsBN = await takeItContractV1.getTakeRefs(takeId)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    return {
        id: takeId,
        owner,
        takeURI,
        refIds,
        ...tokenURIJsonBlob,
    }
}

function UI() {
    const [takes, setTakes] = useState([])

    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()
    
    // Contract.
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })

    // Fetch the latest 10 takes.
    const fetchTakes = async () => {
        const takeCount = await takeItContractV1.totalSupply()
        const from = takeCount
        const takeIds = Array.from(Array(15).keys())
            .map(i => BigNumber.from(from).sub(i).toNumber())
            .reverse()
            .filter(i => i > -1)
            .filter(i => i < takeCount)
            .reverse()

        const takes = await fetchTakesBatch({ takeIds, takeItContractV1, provider })

        // const takes = await Promise.all(takeIds.map(async (takeId) => {
        //     return await fetchTake2({ takeItContractV1, takeId, provider })
        //     // const takeURI = await takeItContractV1.tokenURI(takeId)
        //     // const owner = await takeItContractV1.ownerOf(takeId)
        //     // const json = atob(takeURI.substring(29))
        //     // const tokenURIJsonBlob = JSON.parse(json)
        //     // const refsIdsBN = await takeItContractV1.getTakeRefs(takeId)
        //     // const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

        //     // return {
        //     //     id: takeId,
        //     //     owner,
        //     //     takeURI,
        //     //     refIds,
        //     //     ...tokenURIJsonBlob,
        //     // }
        // }))
        setTakes(takes)
    }

    useEffect(() => {
        if (account.isConnected) {
            fetchTakes()
        }
    }, [account.isConnected, fetchTakes])

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
                    {takes.map(take => <TakeBox key={take.id} take={take}/>)}
                </div>
            </main>

            <div style={{ paddingBottom: "1rem" }}></div>
        </div>
    )

    return ui
}

const slugify = require('slugify')


const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`
    
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
            <Link href={`/t/${slugify(take.description)}-${take.id}`}>
                {take.takeURI && (
                    <div className={styles.mockTakeImg}>
                        <span>{take.description}</span>
                    </div>
                )}
                {/* {take.takeURI && <img className={styles.takeImg} src={take.image} />} */}
            </Link>
        </div>

        <div className={styles.takeMeta}>
            <div>collected by <a href={openseaUrl}><strong>{take.owner && (authorEns || truncateEthAddress(take.owner))}</strong></a></div>
            <div>
            {take.refIds.length > 0 && (
                <span>remixes #{take.refIds[0]}</span>
            )}
            </div>
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

UI.layout = AppLayout
export default UI