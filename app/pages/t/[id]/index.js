import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import styles from '../../../styles/Home.module.css';
import truncateEthAddress from 'truncate-eth-address';
const slugify = require('slugify')

/*
Rainbow & wagmi
*/

import { ethers } from 'ethers';
import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from '../../../hooks';


import Header from '../../../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core';
import { AppLayout } from '../../../components/layout';

import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { HYPETokenAddress, TakeMarketV1Address, TakeV3Address, TAKE_OPENGRAPH_SERVICE_BASE_URL } from '@takeisxx/lib/src/config';
import { HYPEABI, TakeABI, TakeMarketSharesV1ABI, TakeMarketV1ABI } from '@takeisxx/lib/src/abis';
import { fetchTake2, formatUnits, renderBalance } from '@takeisxx/lib/src/chain';
import { useQuery } from '@tanstack/react-query';

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
    const [hypeAllowanceForTakeMarkets, setHypeAllowanceForTakeMarkets] = useState({})
    const account = useAccount()
    const provider = getProvider()

    const { data: signer } = useSigner()
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })

    const takeMarketV1Contract = getContract({
        address: TakeMarketV1Address,
        abi: TakeMarketV1ABI,
        signerOrProvider: provider
    })

    // get a version of the conract which isn't read only
    const takeItContractV1Write = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: signer
    })

    const hypeContract = getContract({
        address: HYPETokenAddress,
        abi: HYPEABI,
        signerOrProvider: provider,
    })


    // Load the take.
    const router = useRouter()

    const [takeId, setTakeId] = useState(null)
    useEffect(() => {
        // Get the take ID from the URL.
        // the URL looks like:
        // http://localhost:3000/t/this-is-such-a-meme-123123
        // we need to extract the 123123
        if (!router.query.id) return

        let takeId = router.query.id.split('-').pop()
        setTakeId(takeId)
    }, [router])



    const getTake = async (takeId) => {
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

        loadAllowance()

        // Load the take.
        const take = await fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs: true })

        return {
            id: takeId,
            ...take,
        }
    }

    const loadTakeShares = async (takeId) => {
        // I want an ethers.js multicall thing.
        // where I can just buffer up all my calls
        // then call them, and they all resolve at once

        // Load the take shares.
        const takeSharesContract = await takeMarketV1Contract.getTakeSharesContract(takeId)

        let shares = ethers.constants.Zero
        let totalSupply = ethers.constants.One
        let ownershipPct = ethers.constants.Zero
        try {
            if (takeSharesContract == ethers.constants.AddressZero) throw new Error('no shares contract')

            const contract = getContract({
                address: takeSharesContract,
                abi: TakeMarketSharesV1ABI,
                signerOrProvider: provider
            })
            shares = await contract.balanceOf(account.address)
            totalSupply = await contract.totalSupply()
            ownershipPct = shares.mul(100).div(totalSupply)
        } catch (err) {
            // market doesn't exist
        }

        return {
            shares,
            contract: takeSharesContract,
            totalSupply,
            ownershipPct
        }
    }

    const loadAllowance = async () => {
        // Check the HYPE allowance to the TakeMarketV1 contract.
        const hypeAllowanceForTakeMarkets = await hypeContract.allowance(account.address, TakeMarketV1Address)
        const isZero = hypeAllowanceForTakeMarkets.eq(ethers.constants.Zero)
        setHypeAllowanceForTakeMarkets({
            allowed: hypeAllowanceForTakeMarkets,
            isZero
        })
    }

    const takeQuery = useQuery({ 
        queryKey: ['take', 'view', takeId], 
        queryFn: () => getTake(takeId),
        enabled: !!takeId,
        placeholderData: {},
    })
    const { data: take, isSuccess } = takeQuery

    const takeSharesQuery = useQuery({
        queryKey: ['take', 'shares', takeId],
        queryFn: () => loadTakeShares(takeId),
        enabled: !!takeId,
        placeholderData: {},
    })
    const { data: takeShares } = takeSharesQuery
    
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
    const takeSharesContractUrl = `https://polygonscan.com/address/${takeShares && takeShares.contract}`
    const isARemixedTake = take.refs && take.refs.length > 0

    //x let TAKE_BASE_URL = TAKE_BASE_URL
    // if(process.env.NODE_ENV == 'development') {
    //     // Run localtunnel to get this URL below.
    //     // lt --port 3000
    //     TAKE_BASE_URL = `https://metal-tables-kick-101-188-157-210.loca.lt`
    // }

    console.log(takeShares.ownershipPct)
    // if (takeLoading) return <></>
    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />

                {/* Why the hell do we need this? */}
                {/* https://take-xyz.vercel.app/t/rachel-and-ross-were-on-a-break-28 */ }
                
                {/* <meta property="og:type" content="article" />
                <meta property="og:title" content={`${take.description} - take #${take.id}`} />
                <meta property="og:description" content={`hot takes, on chain`} />
                <meta property="og:image" content={`${TAKE_BASE_URL}/api/t/${take.id}/img.png`} /> */}
                {/* <meta property="og:image" content={`${TAKE_BASE_URL}/0.png`} /> */}
                {/* <meta property="og:url" content={`${TAKE_OPENGRAPH_SERVICE_BASE_URL}/t/${slugify(take.description)}-${take.id}`} /> */}

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@takeisxx" />
                <meta name="twitter:title" content={`${props.take.description} - take #${props.take.id}`} />
                <meta name="twitter:description" content={`hot takes, on chain. remix and make magic internet money`} />
                <meta name="twitter:image" content={props.meta.twitterImage} />
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
                    { take.author && (
                        <span>minted by <a href={openseaUrl}><strong>{authorEns || truncateEthAddress(take.author)}</strong></a><br /></span>
                    )}
                    {take.owner && (
                        <span>owned by <a href={openseaUrl}><strong>{ownerEns || truncateEthAddress(take.owner)}</strong></a><br /></span>
                    )}
                    {takeShares.contract && (
                        <span>you own <a href={takeSharesContractUrl}><strong>{renderBalance(takeShares.shares)} shares</strong></a> ({ takeShares.ownershipPct + "%" })</span>
                    )}
                </p>

                <p>
                    {/* <button disabled={false} className={styles.takeItBtn} onClick={remix}>copy (wip)</button> */}
                    <button disabled={!canRemix} className={styles.takeItBtn} onClick={remix}>remix</button>
                    {/* <button disabled={true} className={styles.takeItBtn} onClick={likeTake}>like</button> */}
                    
                    { hypeAllowanceForTakeMarkets && (
                        hypeAllowanceForTakeMarkets.isZero 
                        ? <ApproveTakeMarketsButton />
                        : <SwapButton takeId={take.id} refetchTakeShares={takeSharesQuery.refetch} />
                    )}
                    
                    {/* a button for sending a take NFT to an address */}
                    {/* <SendButton takeId={take.id} takeOwner={take.owner} /> */}
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

export const ApproveTakeMarketsButton = ({ take }) => {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer } = useSigner()
    const { config } = usePrepareContractWrite({
        chainId: polygon.id,
        address: HYPETokenAddress,
        abi: HYPEABI,
        signerOrProvider: signer,
        functionName: 'approve',
        args: [TakeMarketV1Address, ethers.constants.MaxUint256],
        enabled: account.address,
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(config)
    const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })

    const swapTakeshares = async () => {
        write()
    }

    return <>
        <button disabled={isWriteLoading || isTxLoading} className={styles.takeItBtn} onClick={() => swapTakeshares()}>
            {isTxLoading ? 'approving HYPE' : 'invest'}
        </button>
    </>
}


export const SwapButton = ({ takeId, refetchTakeShares }) => {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer } = useSigner()

    const balanceCheck = useQuery({
        queryKey: ['balanceOf', account.address],
        queryFn: async () => {
            const contract = new ethers.Contract(HYPETokenAddress, HYPEABI, provider)
            const balance = await contract.balanceOf(account.address)
            return balance
        },
        enabled: !!account.address,
    })

    const MIN_INVESTMENT = formatUnits(10)
    const { config } = usePrepareContractWrite({
        chainId: polygon.id,
        address: TakeMarketV1Address,
        abi: TakeMarketV1ABI,
        signerOrProvider: signer,
        functionName: 'deposit',
        args: [takeId, MIN_INVESTMENT],
        enabled: balanceCheck.isSuccess && balanceCheck.data.gt(MIN_INVESTMENT),
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(config)
    const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })

    const swapTakeshares = async () => {
        await write()
        await refetchTakeShares()
    }
    
    const balanceTooLow = !(balanceCheck.isSuccess && balanceCheck.data.gt(MIN_INVESTMENT))
    const disabled = isWriteLoading || isTxLoading || balanceTooLow

    return <>
        <button disabled={disabled} className={styles.takeItBtn} onClick={() => swapTakeshares()}>
            {isTxLoading ? 'buying shares...' : 'invest'}
        </button>
    </>
}



export const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV3Address}/${take.id}`

    // Load the .eth name for the author.
    const { data: authorEns } = useEnsName({
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