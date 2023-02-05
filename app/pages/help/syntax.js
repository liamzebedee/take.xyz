import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';


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
import Header from '../../components/header';

import { AppLayout } from '../../components/layout';

import { multicall } from '@wagmi/core'

import { TakeABI } from '@takeisxx/lib/src/abis'
import { TakeV3Address } from '@takeisxx/lib/src/config'
import { parseTakeURI, fetchTakesBatch } from '@takeisxx/lib/src/chain'

import InfiniteScroll from 'react-infinite-scroller';

const content = `
![](https://pbs.twimg.com/profile_images/1604318789780152320/wyza_3zQ_400x400.jpg)

# Take guide.

here's a guide on how to make memes on take

## Templates.

if you put text in square brackets, you make a template that others can remix. 
   
for example:

1. you make a template - [your honor please, my client was simply [xx] ](https://take-xyz.vercel.app/t/your-honor-please-my-client-was-simply-xx-58)
2. others remix! - [your honor please, my client was simply very sorry that he fucked up](https://take-xyz.vercel.app/t/your-honor-please-my-client-was-simply-very-sorry-that-he-fucked-up-76)

you can put multiple placeholders for people to fill in, and they can have names too:

 * the template - [[so] [you] [are] [telling] [me] [there] [is] [a] [chance] [!]](https://take-xyz.vercel.app/t/so-you-are-telling-me-there-is-a-chance-!-351)
 * the remix - [[so] qsteak.eth is [telling] [me] [there] [is] [a] [chance] [!]](https://take-xyz.vercel.app/t/so-qsteak.eth-is-telling-me-there-is-a-chance-!-352)

note also - you don't even have to fill in all the variables! this makes things interesting

## Quoting other takes

you can even quote other takes inside a take

simply dial take# followed by the take ID of the take you want to quote. then the text from that take will display in yours

for example, if you wanted to use the text of take #369 - [takeception](https://take-xyz.vercel.app/t/-366) - you just write "take#369" in your take.

e.g. **Steady lads, deploying more take#369** -> [Steady lads, deploying more takeception](https://take-xyz.vercel.app/t/Steady-lads-deploying-more-take366-369)

quote takes of quoting takes of quoting takes-

- take: [I used up all my MATIC when I realized takeception is where [it's] at](https://take-xyz.vercel.app/t/I-used-up-all-my-MATIC-when-I-realized-take367-368)
- the quote: [takeception is where [it's] at](https://take-xyz.vercel.app/t/-367)
- the quote of the quote! [takeception](https://take-xyz.vercel.app/t/-366)
`

function UI() {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()

    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>syntax</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.helpGuide}>
                <ReactMarkdown
                    components={{
                        // open new tab <a href="" target="_blank">
                        a: ({ node, ...props }) => <Link href={props.href}>{props.children}</Link>,
                        img: ({ node, ...props }) => <a href={props.src} rel="noreferrer" target="_blank"><img {...props} alt="" style={{ maxWidth: '100%' }} /></a>
                    }}>
                    {content}
                </ReactMarkdown>
            </main>

            <div style={{ paddingBottom: "1rem" }}></div>
        </div>
    )

    return ui
}


UI.layout = AppLayout
export default UI