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
import { useEnsName } from '../../../hooks';
import Header from '../../../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core'
import { AppLayout } from '../../../components/layout';


// import useSigner
import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ethers } from 'ethers';
import { TakeV3Address, TAKE_API_BASE_URL, TAKE_BASE_URL, TAKE_OPENGRAPH_SERVICE_BASE_URL } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { fetchTake2 } from '@takeisxx/lib/src/chain';
import { useQuery } from '@tanstack/react-query';
import { canRemixTake, parseTake, addContextToTokens } from '@takeisxx/lib/src/parser';
import Image from 'next/image';

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
    // const [ twitterImage, take ] = await Promise.all([
    //     fetchTwitterImage(),
    //     fetchTakeData()
    // ])

    return {
        props: {
            take: {},
            meta: {
                // twitterImage
            }
        },
    }
}

// const aiData = require('../../../../ai/images/results/experiment-1/index.json')

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

    const [takeId, setTakeId] = useState(null)

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
        setTakeId(takeId)
        if (takeId != take.id) loadTake(takeId)

    }, [router, provider, take.id, takeItContractV1])

    // Remix the take.
    const remix = async () => {
        // navigate to the remix page using the router
        const obj = {
            description: takeApiData.text
        }
        // encode obj as a base64 string
        const base64 = Buffer.from(JSON.stringify(obj)).toString('base64')
        // encode the base64 string as a URI component
        const uri = `data:application/json;base64,${base64}`
        router.push(`/remix/${take.id}?takeURI=${uri}`)
    }

    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    async function apiFetchTake() {
        const url = `${TAKE_API_BASE_URL}/takes.json?nft_id=${Number(takeId)}`
        const res = await (await fetch(url)).json()
        if(!res.count) throw new Error("not found")
        const data = res.results[0]
        console.log('api', data)
        return data
    }

    const { data: takeApiData, isSuccess: takeApiSuccess } = useQuery({
        enabled: takeId != null,
        queryKey: ['take-api', 'take', takeId],
        queryFn: () => apiFetchTake()
    })

    // Load the .eth name for the author.
    // TODO.
    const { data: ownerEns } = useEnsName({
        address: take.owner,
        chainId: 1,
    })

    const { data: authorEns } = useEnsName({
        address: takeApiData && takeApiData.creator.address,
        chainId: 1,
    })

    // Remixing is enabled if the take contains [xx] or [yy] template vars,
    // or it is a remix of another take.
    const canRemix = takeApiData
        && canRemixTake(takeApiData.text)
    const isARemixedTake = takeApiData && takeApiData.sources.length > 0
    
    // let TAKE_BASE_URL = TAKE_BASE_URL
    // if(process.env.NODE_ENV == 'development') {
    //     // Run localtunnel to get this URL below.
    //     // lt --port 3000
    //     TAKE_BASE_URL = `https://metal-tables-kick-101-188-157-210.loca.lt`
    // }

    const renderTake = (take) => {
        console.log(take)

        // Interpolate subtakes.
        const tokens = addContextToTokens(take.text, parseTake(take.text))

        return tokens.map((token, i) => {
            let subtake

            // Subtake.
            if (token.type == 'takelink') {
                // TODO: implement using the new API backend.
                if(!take.subtakes) {
                    subtake = {
                        take: { text: "" }
                    }
                } else {
                    subtake = take.subtakes.find(subtake => subtake.id == token.takeId)
                }
            }

            return <span key={i}>
                {token.type == 'takelink' && subtake.take.text.length > 0 && <Link href={`/t/-${token.takeId}`}>{subtake.take.text}</Link>}
                {token.type == 'takelink' && subtake.take.text.length === 0 && token.string}
                {token.type == 'string' && token.string}
                {token.type == 'var' && token.string}
            </span>
        })
        // return <span>{take.text}</span>
    }


    // Find the take in aiData.
    // const aiTake = aiData.find(t => t.take.nft_id == takeId) || { image_paths: [] }

    // const [aiImageIndex, setAiImageIndex] = useState(0)
    // const cycleImage = () => setAiImageIndex((aiImageIndex + 1) % aiTake.image_paths.length)

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
                        <strong>take #{takeId}</strong>
                    </p>

                    {/* <div>
                        {aiTake && aiTake.image_paths.map((url, i) => {
                            // cd /take.xyz/ai/images
                            // python3 -m http.server 9000
                            if(i != aiImageIndex) return
                            const src = `http://localhost:9000/${url.replace('results/experiment-1/', '')}`
                            return <img onClick={cycleImage} src={src} width={250} height={250} key={i} />
                        })}
                    </div> */}

                    <p className={styles.takeLeadText}>{takeApiSuccess && renderTake(takeApiData)}</p>

                    <footer>
                        {takeApiSuccess && (
                            <span><DateString date={new Date(takeApiData.created_at)}/><br/></span>
                        )}
                        {takeApiSuccess && (
                            <span>minted by <Link href={`/u/${takeApiData.creator.address}`}><strong>{authorEns || truncateEthAddress(takeApiData.creator.address)}</strong></Link><br /></span>
                        )}
                        {
                            <span>owned by {take.owner ? <Link href={`/u/${take.owner}`}><strong>{ownerEns || truncateEthAddress(take.owner)}</strong></Link> : '...'}</span>
                        }
                    </footer>
                </div>

                <p>
                    <button disabled={!canRemix} className={styles.takeItBtn} style={{ padding: '0.5rem', fontSize: "1.2rem" }} onClick={remix}>remix</button>
                    
                    {/* <button disabled={!canRemix} className={styles.takeItBtn} style={{ padding: '0.5rem', fontSize: "1.2rem" }} onClick={remix}>collect</button> */}
                    {/* a button for sending a take NFT to an address */}
                    {/* <SendButton takeId={take.id} takeOwner={take.owner} /> */}
                </p>



                <div className={styles.remixedFrom}>
                    <h3>remixes ({takeApiSuccess && "" + takeApiData.remixes.length})</h3>
                    <ul>
                        {takeApiSuccess && takeApiData.remixes.map(remix => {
                            return <li key={remix.nft_id}>
                                <div className={styles.inlineTake}>
                                    <Link href={`/t/${slugify(remix.text)}-${remix.nft_id}`}>{remix.text}</Link>
                                </div>
                            </li>
                        }) }
                    </ul>
                </div>


                <div className={styles.remixedFrom}>
                    <h3>source</h3>
                    {!isARemixedTake && <EmptyTakeBox/>}
                    {isARemixedTake && takeApiData.sources.map(source => (
                        <TakeBox showHeader={false} key={source.nft_id} take={source} />
                    ))}
                </div>
                <br />
                <br />
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

const DateString = ({ date }) => {
    console.log(date)
    let months = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "Jun", "Jul",
        "Aug", "Sep", "Oct",
        "Nov", "Dec"
    ].map(month => month.toLowerCase())

    let dayNumeral = date.getDate()
    let month = months[date.getMonth()]

    return <span>{month} {dayNumeral}</span>
}

// Render a token parsed from a take string.
const TakeToken = () => {

}

export const InlineTake = ({ take }) => {
    return <div className={styles.takeBox}>
        <div>
            <Link href={`/t/${slugify(take.text)}-${take.nft_id}`}>
                <div className={styles.mockTakeImg}>
                    <span>{take.text}</span>
                </div>
            </Link>
        </div>
    </div>
}

export const TakeBox = ({ take, showHeader }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    // Load the .eth name for the author.
    const { data: authorEns, isError, isLoading } = useEnsName({
        address: take.owner,
        chainId: 1,
    })

    const remix = async () => { }

    return <div className={styles.takeBox}>
        {showHeader && 
            <div className={styles.takeHeader}>
                <strong>take #{take.id}</strong>
            </div>}
        

        <div>
            <Link href={`/t/${slugify(take.text)}-${take.nft_id}`}>
                <div className={styles.mockTakeImg}>
                    <span>{take.text}</span>
                </div>
            </Link>
        </div>
    </div>
}

export const EmptyTakeBox = () => {
    let phrases = [
        // 'it was given to me by god',
        'i made it up',
        // 'divine inspiration',
        // 'divine persperation',
        // 'asinine intervention'
    ]
    // pick random phrase
    let phrase = phrases[Math.floor(Math.random() * phrases.length)]

    return <div className={styles.takeBoxEmpty}>
        <div>
            <span>{phrase}</span>
        </div>
    </div>
}

const RenderedTakeText = ({ take }) => {
    async function render() {
        const tokens = parseTake(take.text)

    }

    return renderCompiledTake(take)
}


UI.layout = AppLayout
export default UI