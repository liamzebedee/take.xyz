import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';


/*
Rainbow & wagmi
*/
import '@rainbow-me/rainbowkit/styles.css';

import { useAccount } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from 'wagmi';
import Header from '../../components/header';
import { useRouter } from 'next/router';
import { TakeV2Address } from '../../lib/config';
import { TakeABI } from '../../abis';
import Link from 'next/link';
import { AppLayout } from '../../components/layout';


/*
UI
*/

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

function UI() {
    const [take, setTake] = useState({})
    const account = useAccount()

    const provider = getProvider()
    const takeItContractV1 = getContract({
        address: TakeV2Address,
        abi: TakeABI,
        signerOrProvider: provider
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
            const takeURI = await takeItContractV1.tokenURI(takeId)
            const owner = await takeItContractV1.ownerOf(takeId)
            const author = await takeItContractV1.getTakeAuthor(takeId)
            const refsIds = await takeItContractV1.getTakeRefs(takeId)
            const refs = await Promise.all(refsIds.filter(refId => refId.toNumber() > 0).map(async refId => {
                const id = refId.toNumber()
                
                const takeURI = await takeItContractV1.tokenURI(id)
                const author = await takeItContractV1.getTakeAuthor(id)

                const json = atob(takeURI.substring(29));
                const tokenURIJsonBlob = JSON.parse(json);
                
                return {
                    id,
                    owner,
                    takeURI,
                    author,
                    ...tokenURIJsonBlob,
                }
            }))
            
            const json = atob(takeURI.substring(29));
            const tokenURIJsonBlob = JSON.parse(json);
            console.log(tokenURIJsonBlob)
            
            setTake({
                id: takeId,
                owner,
                takeURI,
                author,
                refs,
                ...tokenURIJsonBlob,
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
        && (
            (take.description.includes('[xx]') || take.description.includes('[yy]'))
            // || take.refs.length > 0
        )

    // Load the .eth name for the author.
    const { data: ownerEns } = useEnsName({
        address: take.owner,
        chainId: 1,
    })
    const { data: authorEns } = useEnsName({
        address: take.author,
        chainId: 1,
    })

    const openseaUrl = `https://opensea.io/assets/matic/${TakeV2Address}/${take.id}`

    const isARemixedTake = take.refs && take.refs.length > 0

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
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
                    taken by <a href={openseaUrl}><strong>{authorEns || take.author}</strong></a>
                    {/* collected by <a href={openseaUrl}><strong>{ownerEns || take.owner}</strong></a> */}
                </p>

                <p>
                    {/* <button disabled={true} className={styles.takeItBtn} onClick={remix}>like (wip)</button> */}
                    {/* <button disabled={false} className={styles.takeItBtn} onClick={remix}>copy (wip)</button> */}
                    <button disabled={!canRemix} className={styles.takeItBtn} onClick={remix}>remix</button>
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

const slugify = require('slugify')


export const TakeBox = ({ take }) => {
    const openseaUrl = `https://opensea.io/assets/matic/${TakeV2Address}/${take.id}`

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