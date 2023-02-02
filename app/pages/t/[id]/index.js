import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import styles from '../../../styles/Home.module.css';
const slugify = require('slugify')
import truncateEthAddress from 'truncate-eth-address';

/*
Rainbow & wagmi
*/

import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from 'wagmi';
import Header from '../../../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core'
import { AppLayout } from '../../../components/layout';


// import useSigner
import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ethers } from 'ethers';
import { TakeV3Address, TAKE_BASE_URL, TAKE_OPENGRAPH_SERVICE_BASE_URL } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { fetchTake2 } from '@takeisxx/lib/src/chain';
import { useQuery } from '@tanstack/react-query';
import { canRemixTake, parseTake } from '@takeisxx/lib/src/parser';

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

export async function getServerSideProps(context) {
    const takeId = context.query.id.split('-').pop()

    async function fetchTwitterImage() {
        // Check if this is the twitter bot.
        const twitterImageUrl = `${TAKE_OPENGRAPH_SERVICE_BASE_URL}/api/t/${takeId}/img.png`

        let twitterImage = null

        // Check if header includes Twitterbot
        if (context.req.headers['user-agent'].includes('Twitterbot')) {
            // Prefetch the image.
            // Fetch the binary twitter image from the API.
            const image = await fetch(twitterImageUrl)
            // Encode it into a data: URI.
            const imageBuffer = await image.buffer()
            const imageBase64 = imageBuffer.toString('base64')
            twitterImage = `data:image/png;base64,${imageBase64}`
        } else {
            twitterImage = twitterImageUrl
        }

        return twitterImage
    }

    async function fetchTakeData() {
        // Construct the Alchemy provider.
        const provider = new ethers.providers.AlchemyProvider('matic', 'aPWRA4EZ6QMbPKs_L6DNo_w-avrXNGrm')

        // Construct the Take contract.
        const takeItContractV1 = new ethers.Contract(TakeV3Address, TakeABI, provider)

        const take = await fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs: false })
        take.from = 'server'
        console.log(take)
        return take
    }

    // Fetch in parallel to speed things up.
    const [ twitterImage, take ] = await Promise.all([
        fetchTwitterImage(),
        fetchTakeData()
    ])

    return {
        props: {
            take,
            meta: {
                twitterImage
            }
        },
    }
}


function UI(props) {
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

    // Remixing is enabled if the take contains [xx] or [yy] template vars,
    // or it is a remix of another take.
    const canRemix = take.takeURI 
        && canRemixTake(take.text)

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

    //x let TAKE_BASE_URL = TAKE_BASE_URL
    // if(process.env.NODE_ENV == 'development') {
    //     // Run localtunnel to get this URL below.
    //     // lt --port 3000
    //     TAKE_BASE_URL = `https://metal-tables-kick-101-188-157-210.loca.lt`
    // }

    const renderTake = (take) => {
        console.log(take)
        // Interpolate subtakes.
        const tokens = parseTake(take.text)
        return tokens.map(token => {
            const { start, end } = token

            const context = {
                string: take.text.substring(start, end + 1),
                subtake: null,
            }

            // Subtake.
            if (token.type == 'takelink') {
                const subtake = take.subtakes.find(subtake => subtake.takeId == token.takeId)
                if (subtake) {
                    context.subtake = subtake
                }
            }

            return <span>
                {token.type == 'takelink' && <Link href={`/t/-${context.subtake.takeId}`}>{context.subtake.take.text}</Link>}
                {token.type == 'string' && context.string}
                {token.type == 'var' && context.string}
            </span>
        })
        // return <span>{take.text}</span>
    }

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />

                {/* Why the hell do we need this? */}
                {/* https://take-xyz.vercel.app/t/rachel-and-ross-were-on-a-break-28 */ }
                
                {/* <meta property="og:type" content="article" />
                <meta property="og:title" content={`${take.text} - take #${take.id}`} />
                <meta property="og:description" content={`hot takes, on chain`} />
                <meta property="og:image" content={`${TAKE_BASE_URL}/api/t/${take.id}/img.png`} /> */}
                {/* <meta property="og:image" content={`${TAKE_BASE_URL}/0.png`} /> */}
                {/* <meta property="og:url" content={`${TAKE_OPENGRAPH_SERVICE_BASE_URL}/t/${slugify(take.text)}-${take.id}`} /> */}

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@takeisxx" />
                <meta name="twitter:title" content={`${props.take.text} - take #${props.take.id}`} />
                <meta name="twitter:description" content={`hot takes, on chain. remix and make magic internet money`} />
                <meta name="twitter:image" content={props.meta.twitterImage} />
            </Head>

            <Header/>

            <main className={styles.viewTake}>

                <div className={styles.takeLead}>
                    <p className={styles.text}>
                        <strong>take #{take.id}</strong>
                    </p>

                    <p className={styles.takeLeadText}>{take.takeURI && renderTake(take)}</p>


                    <footer>
                        {/* owned by <a href={openseaUrl}><strong>{take.owner && truncateEthAddress(take.owner) }</strong></a> */}
                        {take.author && (
                            <span>minted by <a href={openseaUrl}><strong>{authorEns || truncateEthAddress(take.author)}</strong></a><br /></span>
                        )}
                        {take.owner && (
                            <span>owned by <a href={openseaUrl}><strong>{ownerEns || truncateEthAddress(take.owner)}</strong></a></span>
                        )}
                    </footer>
                </div>

                {/* <div> */}
                    {/* <Link href={`/t/${slugify(take.text)}-${take.id}`}> */}
                        {/* {take.takeURI && (
                            <div className={styles.mockTakeImg}>
                                
                            </div>
                        )} */}
                        {/* {take.takeURI && <img className={styles.takeImg} src={take.image} />} */}
                    {/* </Link> */}
                {/* </div> */}

                <p>
                    <button disabled={!canRemix} className={styles.takeItBtn} style={{ padding: '0.5rem', fontSize: "1.2rem" }} onClick={remix}>remix</button>
                    {/* a button for sending a take NFT to an address */}
                    {/* <SendButton takeId={take.id} takeOwner={take.owner} /> */}
                </p>

                <div className={styles.remixedFrom}>
                    <h3>remixed from</h3>
                    {!isARemixedTake && 'none'}
                    {isARemixedTake && take.refs.map(ref => (
                        <TakeBox key={ref.id} take={ref}/>
                    ))}
                </div>

                {/* <p className={styles.text}>
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
            <Link href={`/t/${slugify(take.text)}-${take.id}`}>
                {take.takeURI && (
                    <div className={styles.mockTakeImg}>
                        <span>{take.text}</span>
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

        {/* <p className={styles.text}>
            {take.text}
        </p> */}
    </div>
}

const RenderedTakeText = ({ take }) => {
    // { renderCompiledTake(take) }
    // const [takeRefs, setTakeRefs] = useState(null)

    async function render() {
        const tokens = parseTake(take.text)

    }

    return renderCompiledTake(take)
}


UI.layout = AppLayout
export default UI