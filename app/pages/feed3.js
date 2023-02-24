import Head from 'next/head';
import React, { useEffect, useState } from 'react';
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
import { useEnsName } from '../hooks';
import truncateEthAddress from 'truncate-eth-address';


import {
    useQuery,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
    useInfiniteQuery,
} from '@tanstack/react-query'


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


import Link from 'next/link';
import Header from '../components/header';

import { AppLayout } from '../components/layout';

import { multicall } from '@wagmi/core'

import { TakeABI } from '@takeisxx/lib/src/abis'
import { TakeV3Address } from '@takeisxx/lib/src/config'
import { parseTakeURI, fetchTakesBatch } from '@takeisxx/lib/src/chain'

import InfiniteScroll from 'react-infinite-scroller';


function UI() {
    // const [takes, setTakes] = useState([])

    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()

    // Contract.
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })

    const fetchTakes = async ({ pageParam = -1 }) => {
        const takeCount = await takeItContractV1.totalSupply()
        if (pageParam === -1) {
            pageParam = takeCount
            pageParam = 250
        }

        const takeIds = Array.from(Array(15).keys())
            .map(i => BigNumber.from(pageParam).sub(i).toNumber())
            .reverse()
            .filter(i => i > -1)
            .filter(i => i < takeCount)
            .reverse();
        console.log(takeIds)

        const takes2 = await fetchTakesBatch({ multicall, takeIds, takeItContractV1, provider, takeIds, })

        takes2.nextCursor = takes2[takes2.length - 1].id - 1
        if (takes2.nextCursor == -1) takes2.nextCursor = 0
        takes2.hasNextPage = takes2.nextCursor > 0
        console.log('next page', pageParam, takes2.nextCursor)

        return takes2
    }


    const queryClient = useQueryClient()

    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetching,
        isFetchingNextPage,
        isFetched,
        status,
    } = useInfiniteQuery({
        queryKey: ['feed'],
        queryFn: fetchTakes,
        getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    })

    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                {isFetched && (<div>
                    <InfiniteScroll
                        pageStart={0}
                        className={styles.takesGrid}
                        loadMore={fetchNextPage}
                        hasMore={data.pages[data.pages.length - 1].hasNextPage}
                    >
                        {data.pages.map((group, i) => (
                            <React.Fragment key={i}>
                                {group.map(take => (
                                    <TakeBox key={take.id} take={take} />
                                ))}
                            </React.Fragment>
                        ))}
                    </InfiniteScroll>

                </div>)}

                {isFetching && (
                    <div className={styles.loading}>
                        <div>loading...</div>
                    </div>
                )}
            </main>

            <div style={{ paddingBottom: "1rem" }}></div>
        </div>
    )

    return ui
}

const slugify = require('slugify')


const aiData = require('../../ai/images/results/experiment-1/index.json')

const TakeBox = ({ take }) => {

    // Find the take in aiData.
    const aiTake = aiData.find(t => t.take.nft_id == take.id) || { image_paths: [""] }

    const [aiImageIndex, setAiImageIndex] = useState(0)
    const cycleImage = () => setAiImageIndex((aiImageIndex + 1) % aiTake.image_paths.length)

    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.author,
        chainId: 1,
    })

    const remix = async () => { }

    return <div className={styles.takeBox}>
        {/* <div className={styles.takeHeader}>
            <strong>take #{take.id}</strong>
        </div> */}

        <div>
            <Link href={`/t/${slugify(take.text)}-${take.id}`}>
                {(() => {
                    const url = aiTake.image_paths[aiImageIndex]
                    const src = `http://localhost:9000/${url.replace('results/experiment-1/', '')}`
                    return <img className={styles.takeImage} src={src} />
                })()}
                
                {/* <span>{take.text}</span> */}
            </Link>
        </div>

        <div className={styles.takeMeta}>
            {/* <div>minted by <Link href={`/u/${take.author}`}><strong>{take.author && (authorEns || truncateEthAddress(take.author))}</strong></Link></div> */}
            {/* <div>
                {take.refIds.length > 0 && (
                    <span>remixes #{take.refIds[0]}</span>
                )}
            </div> */}
        </div>

        {/* <p>
            <button className={styles.takeItBtn} onClick={remix}>like</button>
            <button className={styles.takeItBtn} onClick={remix}>remix</button>
        </p> */}

        {/* <p className={styles.text}>
                    {take.text}
                </p> */}
    </div>
}

UI.layout = AppLayout
export default UI