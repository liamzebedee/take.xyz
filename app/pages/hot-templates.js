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
import { useEnsName } from 'wagmi';
import truncateEthAddress from 'truncate-eth-address';


const slugify = require('slugify')
import {
    useQuery,
    useQueryClient,
    QueryClient,
    QueryClientProvider,
    useInfiniteQuery,
} from '@tanstack/react-query'

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

    const HOT_TEMPLATES_IDS = [
        'https://take-xyz.vercel.app/t/your-honor-please-my-client-was-simply-xx-58',
        'https://take-xyz.vercel.app/t/my-pronouns-are-xxyy-68',
        'http://localhost:3000/t/I-am-once-again-xx-200',
        'http://localhost:3000/t/I-like-to-eat-xx-food-168',
        'http://localhost:3000/t/the-xx-greater-yy-pipeline-304',
        'http://localhost:3000/t/your-honor-please-my-client-was-simply-xx-58'
    ].map(url => {
        const takeId = url.split('/').pop().split('-').pop()
        return Number(takeId)
    })

    const fetchTakes = async ({ pageParam = -1 }) => {
        const takeCount = await takeItContractV1.totalSupply()
        if (pageParam === -1) {
            pageParam = takeCount
        }

        const takeIds = HOT_TEMPLATES_IDS
        console.log(takeIds)

        const takes2 = await fetchTakesBatch({ multicall, takeIds, takeItContractV1, provider, takeIds, })
        takes2.nextCursor = 0 // prevent pagineation

        // takes2.nextCursor = takes2[takes2.length - 1].id - 1
        // if (takes2.nextCursor == -1) takes2.nextCursor = 0
        // takes2.hasNextPage = takes2.nextCursor > 0
        // console.log('next page', pageParam, takes2.nextCursor)

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
        queryKey: ['hot-templates'],
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



const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`
    let authorEns = null

    const remix = async () => { }

    return <div className={styles.takeBox}>
        <div className={styles.takeHeader}>
            <strong>take #{take.id}</strong>
        </div>

        <div>
            <Link href={`/t/${slugify(take.text)}-${take.id}`}>
                {take.takeURI && (
                    <div className={styles.mockTakeImg}>
                        <span>{take.text}</span>
                    </div>
                )}
            </Link>
        </div>

        <div className={styles.takeMeta}>
            <div>minted by <a href={openseaUrl}><strong>{take.owner && (authorEns || truncateEthAddress(take.owner))}</strong></a></div>
            <div>
                {take.refIds.length > 0 && (
                    <span>remixes #{take.refIds[0]}</span>
                )}
            </div>
        </div>
    </div>
}

UI.layout = AppLayout
export default UI