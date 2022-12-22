import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';
const slugify = require('slugify')
import truncateEthAddress from 'truncate-eth-address';

/*
Rainbow & wagmi
*/

import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from 'wagmi';
import Header from '../../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core'
import { AppLayout } from '../../components/layout';


// import useSigner
import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ethers } from 'ethers';
import { TakeV3Address } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { fetchTake2 } from '@takeisxx/lib/src/chain';

/*
UI
*/

const SendButton = ({ takeId, takeOwner }) => {
    const [toAddress, setToAddress] = useState(null)

    const account = useAccount()
    const { data: signer } = useSigner()
    const { config } = usePrepareContractWrite({
        chainId: polygon.id,
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: signer,
        functionName: 'transferFrom',
        args: [account.address, toAddress, takeId],
        enabled: account.address && toAddress && takeId,
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(config)
    const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })
    

    // Send the take to an ethereum address.
    const sendNft = useCallback(async (from) => {
        // prompt for the address to send to
        const address = prompt('Enter the address to send to')
        setToAddress(address)
        write()
    }, [write])

    const isOwner = takeOwner === account.address

    // useEffect(() => {
    //     if (!toAddress) return
    //     // now fkn send it
    // }, [toAddress, write])

    return (
        <button 
            disabled={!isOwner || (isWriteLoading || isTxLoading)}
            className={styles.takeItBtn} 
            onClick={() => sendNft(account.address)}>
            send
        </button>
    )
}

function UI() {
    const [take, setTake] = useState({})
    const account = useAccount()

    const provider = getProvider()
    


    const { data: signer } = useSigner()
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })

    // get a version of the conract which isn't read only
    const takeItContractV1Write = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: signer
    })


    // Load the take.
    const router = useRouter()

    useEffect(() => {
        const loadTake = async (takeId) => {
            // Handle non-existent take.
            const takeCount = await takeItContractV1.totalSupply()
            if (takeCount.toNumber() < Number(takeId)) {
                const takeURI = await takeItContractV1.tokenURI(takeId)
                setTake({
                    id: "not-found",
                    takeURI
                })
                return
            }

            // Load the take.
            const take = await fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs: true })
            
            setTake({
                id: takeId,
                ...take,
            })
        }


        // Get the take ID from the URL.

        // the URL looks like:
        // http://localhost:3000/t/this-is-such-a-meme-123123
        // we need to extract the 123123
        if (!router.query.id) return

        let takeId = router.query.id.split('-').pop()
        if (takeId != take.id) loadTake(takeId)

    }, [router])

    // Remix the take.
    const remix = async () => {
        // navigate to the remix page using the router
        router.push(`/remix/${take.id}?takeURI=${take.takeURI}`)
    }

    const likeTake = async () => {
        // request signature over call to like abi
        
    }



    // Remixing is enabled if the take contains [xx] or [yy] template vars,
    // or it is a remix of another take.
    const canRemix = take.takeURI 
        && (
            (take.description.includes('[xx]') || take.description.includes('[yy]'))
            // || take.refs.length > 0
        )

    // Load the .eth name for the author.
    // TODO.
    const { data: ownerEns } = useEnsName({
        address: take.owner,
        chainId: 1,
    })
    const { data: authorEns } = useEnsName({
        address: take.author,
        chainId: 1,
    })

    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`
    const isARemixedTake = take.refs && take.refs.length > 0

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />

                {/* Why the hell do we need this? */}
                {/* https://take-xyz.vercel.app/t/rachel-and-ross-were-on-a-break-28 */ }
                {/* <meta property="og:title" content={} />
                <meta property="og:description" content="Get from SEO newbie to SEO pro in 8 simple steps." />
                <meta property="og:image" content="https://ahrefs.com/blog/wp-content/uploads/2019/12/fb-how-to-become-an-seo-expert.png" /> */}
            </Head>

            <Header/>

            <main className={styles.main}>
                <p className={styles.description}>
                    <strong>take #{take.id}</strong>
                </p>

                <div>
                    {/* <Link href={`/t/${slugify(take.description)}-${take.id}`}> */}
                        {take.takeURI && (
                            <div className={styles.mockTakeImg}>
                                <span>{take.description}</span>
                            </div>
                        )}
                        {/* {take.takeURI && <img className={styles.takeImg} src={take.image} />} */}
                    {/* </Link> */}
                </div>

                <p>
                    {/* owned by <a href={openseaUrl}><strong>{take.owner && truncateEthAddress(take.owner) }</strong></a> */}
                    { take.author && (
                        <span>minted by <a href={openseaUrl}><strong>{authorEns || truncateEthAddress(take.author)}</strong></a><br /></span>
                    )}
                    {take.owner && (
                        <span>owned by <a href={openseaUrl}><strong>{ownerEns || truncateEthAddress(take.owner)}</strong></a></span>
                    )}
                </p>

                <p>
                    {/* <button disabled={false} className={styles.takeItBtn} onClick={remix}>copy (wip)</button> */}
                    <button disabled={!canRemix} className={styles.takeItBtn} onClick={remix}>remix</button>
                    {/* <button disabled={true} className={styles.takeItBtn} onClick={likeTake}>like</button> */}
                    {/* a button for sending a take NFT to an address */}
                    <SendButton takeId={take.id} takeOwner={take.owner} />
                </p>

                <h3>remixed from</h3>
                {!isARemixedTake && 'none'}
                {isARemixedTake && take.refs.map(ref => (
                    <TakeBox key={ref.id} take={ref}/>
                ))}

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



export const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.owner,
        chainId: 1,
    })

    const remix = async () => { }

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


UI.layout = AppLayout
export default UI