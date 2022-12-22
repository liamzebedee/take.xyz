import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';


/*
Rainbow & wagmi
*/
import { useAccount, useContractWrite, usePrepareContractWrite, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../../components/header';
import { TakeABI } from '../../../abis';
import { useRouter } from 'next/router';
import { TakeV3Address, TAKE_LENGTH } from '../../../lib/config';
import { AppLayout } from '../../components/layout';
import { useDebounce } from '../../components/util';
import { ethers } from 'ethers';
import { polygon } from 'wagmi/chains';


/*
UI
*/

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const slugify = require('slugify')

function parseTakeURI(uri) {
    const json = atob(uri.substring(29));
    const tokenURIJsonBlob = JSON.parse(json);
    return tokenURIJsonBlob
}

function UI() {
    // Get the take ID we're remixing from the URL.
    const router = useRouter()
    
    // The URL looks like:
    // http://localhost:3000/remix/16?takeURI=data:application/json;base64,1puUGc9PSJ9
    const ogTake = router.query.takeURI ? parseTakeURI(router.query.takeURI) : null
    const ogTakeId = router.query.id ? router.query.id.split('-').pop() : null
    console.log(ogTakeId)

    const [take, setTake] = useState('')
    const debouncedTake = useDebounce(take, 150)
    const [input1, setInput1] = useState('')
    const [input2, setInput2] = useState('')
    const [input3, setInput3] = useState('')
    const [canTakeIt, setCanTakeIt] = useState(false)

    const account = useAccount()
    const { data: signer, isError, isLoading } = useSigner()

    // Listen to the input changes.
    const onInput1Change = (e) => {
        setInput1(e.target.value)
    }
    const onInput2Change = (e) => {
        setInput2(e.target.value)
    }
    const onInput3Change = (e) => {
        setInput3(e.target.value)
    }

    // Detect each type of take placeholder.
    const hasXX = ogTake && ogTake.description.includes('[xx]')
    const hasYY = ogTake && ogTake.description.includes('[yy]')
    const hasZZ = ogTake && ogTake.description.includes('[zz]')

    // Compile the take
    useEffect(() => {
        if(!ogTake) return

        // Replace any [xx] and [yy] with the input values.
        let xx = input1 || '[xx]'
        let yy = input2 || '[yy]'
        let zz = input3 || '[zz]'
        const take = ogTake.description.replace(/\[xx\]/g, xx).replace(/\[yy\]/g, yy).replace(/\[zz\]/g, zz)
        setTake(take)
    }, [input1, input2, ogTake])

    // Validate input, enable button.
    useEffect(() => {
        setCanTakeIt(account.isConnected && take.length > 0)
    }, [account, take])

    // Render the templated take.
    const renderTemplateTake = (take) => {
        let spans = []
        let isVar = false
        for(let i = 0; i < take.length; i++) {
            let c = take[i]
            // I fucking love that GPT just wrote this for me.
            if(c === '[') {
                isVar = true
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else if(c === ']') {
                isVar = false
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else if(isVar) {
                spans.push(<span className={styles.var} key={i}>{c}</span>)
            } else {
                spans.push(<span key={i}>{c}</span>)
            }
        }
        return <>
            <p className={styles.description}>
                {spans}
            </p>
        </>
    }

    const { config: mintConfig } = usePrepareContractWrite({
        chainId: polygon.id,
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: signer,
        functionName: 'mint',
        args: [debouncedTake, [parseInt(ogTakeId) || 0, 0, 0]],
        enabled: canTakeIt,
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(mintConfig)
    const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })

    useEffect(() => {
        async function redirectOnMint() {
            const iface = new ethers.utils.Interface(TakeABI);
            const logs = txReceipt.logs
                .map((log) => {
                    try {
                        return iface.parseLog(log)
                    } catch (e) {
                        return null
                    }
                })
                .filter((log) => log !== null)

            // Extract ERC721 Mint event.
            const log = logs.find(log => log.name === 'Transfer');
            const tokenId = log.args.id

            // Redirect to take page
            window.location.href = `/t/${slugify(debouncedTake)}-${tokenId}`
        }

        if (isTxSuccess) {
            redirectOnMint()
        }
    }, [signer, isTxSuccess, debouncedTake, txReceipt])

    const ui = (
        <div className={styles.container}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                <p className={styles.description}>
                    <strong>remix take{' '}</strong>
                </p>

                {/* <p className={styles.description}>
                    {ogTake.description}
                </p> */}

                {renderTemplateTake(take)}

                {
                    hasXX && (<p className={styles.description}>
                        <input className={styles.takeInput} onChange={onInput1Change} maxLength={TAKE_LENGTH} type="text" disabled={!hasXX}></input>
                    </p>)
                }

                {
                    hasYY && (<p className={styles.description}>
                        <input className={styles.takeInput} onChange={onInput2Change} maxLength={TAKE_LENGTH} type="text" disabled={!hasYY}></input>
                    </p>)
                }

                {
                    hasZZ && (<p className={styles.description}>
                        <input className={styles.takeInput} onChange={onInput3Change} maxLength={TAKE_LENGTH} type="text" disabled={!hasZZ}></input>
                    </p>)
                }


                {/* <p className={styles.description}>
                    {take}
                </p> */}

                <div className={styles.grid}>
                    <button disabled={isWriteLoading || isTxLoading || !canTakeIt} className={styles.takeItBtn} onClick={() => write()}>
                        {isTxLoading ? 'minting...' : 'mint'}
                    </button>
                </div>
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


UI.layout = AppLayout
export default UI
