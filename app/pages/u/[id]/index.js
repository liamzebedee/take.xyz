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
import { TakeV3Address } from '@takeisxx/lib/src/config'
import { parseTakeURI, fetchTakesBatch } from '@takeisxx/lib/src/chain'

import InfiniteScroll from 'react-infinite-scroller';
import { useRouter } from 'next/router';
import { Btn } from '../../../components/button';
function UI() {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()

    // Get the user id from the router
    const { query } = useRouter()
    const { id } = query

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
        </div>
    )

    return ui
}


UI.layout = AppLayout
export default UI