import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import styles from '../../../styles/Home.module.css';


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
import ReactMarkdown from 'react-markdown'

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
import Header from '../../../components/header';

import { AppLayout } from '../../../components/layout';

import { multicall } from '@wagmi/core'

import { TakeABI } from '@takeisxx/lib/src/abis'
import { TakeV3Address, TAKE_API_BASE_URL } from '@takeisxx/lib/src/config'
import { parseTakeURI, fetchTakesBatch } from '@takeisxx/lib/src/chain'

import InfiniteScroll from 'react-infinite-scroller';
import { useRouter } from 'next/router';
import { Btn } from '../../../components/button';
function UI() {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()

    // Contract.
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })


    // Get the user id from the router
    const { query } = useRouter()
    const { id } = query
    console.log(id)

    const apiFetchUserTakes = async () => {
        const url = `${TAKE_API_BASE_URL}/users.json?address=${id}`
        console.log(url)
        const res = await (await fetch(url)).json()
        if (!res.count) throw new Error("not found")
        const data = res.results[0]
        console.log('api', data)
        return data

        // const takeCount = await takeItContractV1.totalSupply()
        // if (pageParam === -1) {
        //     pageParam = takeCount
        // }

        // const takeIds = Array.from(Array(15).keys())
        //     .map(i => BigNumber.from(pageParam).sub(i).toNumber())
        //     .reverse()
        //     .filter(i => i > -1)
        //     .filter(i => i < takeCount)
        //     .reverse();
        // console.log(takeIds)

        // const takes2 = await fetchTakesBatch({ multicall, takeIds, takeItContractV1, provider, takeIds, })

        // takes2.nextCursor = takes2[takes2.length - 1].id - 1
        // if (takes2.nextCursor == -1) takes2.nextCursor = 0
        // takes2.hasNextPage = takes2.nextCursor > 0
        // console.log('next page', pageParam, takes2.nextCursor)

        return takes2
    }


    // Load the takes using useQuery.

    const { data: takeApiData, isSuccess: takeApiSuccess } = useQuery({
        enabled: id != null,
        queryKey: ['users', id],
        queryFn: () => apiFetchUserTakes()
    })


    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>{id} - take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.helpGuide}>
                <h2>{id}</h2>
                <Btn style="outline" onClick={() => follow()}>
                    {'follow'}
                </Btn>
                {' '}
                <Btn style="primary" onClick={() => follow()}>
                    {'dm'}
                </Btn>
            </main>

            <div>
                <h2>Recent takes</h2>
                <div className={styles.grid}>
                    {takeApiSuccess && takeApiData.takes.map(take => (
                        <Link href={`/t/${take.id}`} key={take.id}>
                            <a className={styles.card}>
                                <h3>{take.title}</h3>
                                <p>{take.description}</p>
                            </a>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )

    return ui
}


UI.layout = AppLayout
export default UI