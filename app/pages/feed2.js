import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import styles from '../styles/feed.module.css';


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
import { useRouter } from 'next/router';


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

            <main className={styles.feed}>
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

const BSIcon = () => {

}

const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.author,
        chainId: 1,
    })

    const remix = async () => { }

    const [likeHover, setLikeHover] = useState(false)
    const [remixHover, setRemixHover] = useState(false)

    const router = useRouter()
    const openTake = () => {
        router.push(`/t/${slugify(take.text)}-${take.id}`)
    }

    return <div className={styles.feedItem}>
        <div className={styles.takeHeader}>
            
        </div>

        <div>
            <Link href={`/t/${slugify(take.text)}-${take.id}`}>
                <span>
                    <span className={styles.feedItemTakeText}>{take.text}</span>
                </span>
            </Link>

            <div className={styles.takeActionsMiddot}>
                <span className={styles.feedItemUsername}><Link href={`/u/${take.author}`}>{(authorEns) && (authorEns.split('.eth')[0] || truncateEthAddress(take.author))}</Link></span>
                <span>
                    {take.refIds.length > 0 && <span><Link href={`/t/${take.refIds[0]}`}>remixes <strong>#{take.refIds[0]}</strong></Link></span>}
                    {take.refIds.length === 0 && <span>og</span>}
                </span>
            </div>

            {/* <div className={styles.takeActions}>
                <span
                    onMouseEnter={() => setLikeHover(true)}
                    onMouseLeave={() => setLikeHover(false)}>
                    <i className={`bi bi-heart${likeHover ? '-fill' : ''}`}></i> like
                </span>

                <span
                    onMouseEnter={() => setRemixHover(true)}
                    onMouseLeave={() => setRemixHover(false)}>
                    <i className={`bi bi-easel${remixHover ? '-fill' : ''}`}></i> remix
                </span>
            </div> */}
        </div>
    </div>
}

UI.layout = AppLayout
export default UI