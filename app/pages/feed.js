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
        
        const takes2 = await fetchTakesBatch({ multicall, takeIds, takeItContractV1, provider, takeIds,  })
        
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


    // useEffect(() => {
    //     const handleScroll = () => {
            
    //     }

    //     const bottom = Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight + 20;
    //     if (bottom && !isFetchingNextPage) {
    //         console.log('bottom')
    //         fetchNextPage()
    //     }

    //     handleScroll()
    // }, [isFetchingNextPage, fetchNextPage])

    // return status === 'loading' ? (
    //     <p>Loading...</p>
    // ) : status === 'error' ? (
    //     <p>Error: {error.message}</p>
    // ) : (
    //     <>
    //         <InfiniteScroll
    //             pageStart={0}
    //             loadMore={fetchNextPage}
    //             hasMore={true || false}
    //             loader={<div className="loader" key={0}>Loading ...</div>}
    //         >
    //                     {data.pages.map((group, i) => (
    //                         <React.Fragment key={i}>
    //                             {group.map(res => (
    //                                 <span>{res.id},</span>
    //                             ))}
    //                         </React.Fragment>
    //                     ))}
    //         </InfiniteScroll>
    //         {/* {data.pages.map((group, i) => (
    //             <React.Fragment key={i}>
    //                 {group.map(res => (
    //                     <span>{res.id},</span>
    //                 ))}
    //             </React.Fragment>
    //         ))} */}
    //         <div>
    //             <button
    //                 onClick={() => fetchNextPage()}
    //                 disabled={!hasNextPage || isFetchingNextPage}
    //             >
    //                 {isFetchingNextPage
    //                     ? 'Loading more...'
    //                     : hasNextPage
    //                         ? 'Load More'
    //                         : 'Nothing more to load'}
    //             </button>
    //         </div>
    //         <div>{isFetching && !isFetchingNextPage ? 'Fetching...' : null}</div>
    //     </>
    // )

    // if(data) console.log(data.pageParams, data.pages)
    // console.log('data', data)

    // Add the ability to load more when you reach the bottom of the page.

    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                { isFetched && (<div>
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
                    
                </div>) }

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


const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`
    
    // Load the .eth name for the author.
    // const { data: authorEns, isError, isLoading } = useEnsName({
    //     address: take.owner,
    //     chainId: 1,
    // })
    let authorEns = null

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