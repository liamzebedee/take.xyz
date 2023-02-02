import Head from 'next/head';
import { useEffect, useState } from 'react';
import styles from '../../styles/Home.module.css';


/*
Rainbow & wagmi
*/
import { useAccount, useContractWrite, usePrepareContractWrite, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../../components/header';

import { useRouter } from 'next/router';

import { AppLayout } from '../../components/layout';
import { useDebounce } from '../../components/util';
import { ethers } from 'ethers';
import { polygon } from 'wagmi/chains';
import { parseTake, compileTake } from '@takeisxx/lib/src/parser';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { TakeV3Address, TAKE_LENGTH } from '@takeisxx/lib/src/config';

/*
UI
*/
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

    const [variablesState, setVariablesState] = useState({
    })

    // Listen to the input changes.
    const onVariableInputChange = (k) => {
        return (e) => {
            setVariablesState({
                ...variablesState,
                [k]: e.target.value
            })
        }
    }

    // Detect each type of take placeholder.
    let takeVariables = []
    if(ogTake) {
        const tokens = parseTake(ogTake.description)
        takeVariables = tokens.filter(token => token.type == 'var')
    }
    
    // Compile the take
    useEffect(() => {
        if(!ogTake) return

        setTake(compileTake(ogTake.description, variablesState))
    }, [input1, input2, ogTake])

    // Validate input, enable button.
    useEffect(() => {
        setCanTakeIt(account.isConnected && take.length > 0)
    }, [account, take])

    // Render the templated take.
    const renderCompiledTake = (take) => {
        const tokens = parseTake(take)
        console.log('tokens2', tokens)

        return <>
            <p className={styles.description}>
                {tokens.map((token, i) => {
                    if (token.type == 'string') {
                        return <span key={i}>{token.string}</span>
                    } else if (token.type == 'var') {
                        return <span key={i} className={styles.var}>{token.string}</span>
                    }
                })}
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
                <title>remix take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                <p className={styles.description}>
                    <strong>remix take{' '}</strong>
                </p>

                {renderCompiledTake(take)}
                {/* <RenderedTakeText take={take}/> */}

                {
                    takeVariables.length && takeVariables.map((token, i) => {
                        return <p key={i} className={styles.description}>
                            <input className={styles.takeInput} onChange={onVariableInputChange(token.variableName)} maxLength={TAKE_LENGTH} type="text" placeholder={token.variableName}></input>
                        </p>
                    })
                }

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
