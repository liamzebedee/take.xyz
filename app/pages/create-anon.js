import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import anonStyles from '../styles/anon.module.css';


/*
Rainbow & wagmi
*/

import {
    getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, useContractWrite, usePrepareContractWrite, useProvider, useSigner, useWaitForTransaction } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core';
import { publicProvider } from 'wagmi/providers/public';

import { ANON_RELAYER_ADDRESS } from '../../lib/config'
const { AnonRelayerABI, AnonTakenameRegistryABI } = require('../../abis')


// const { chains, provider } = configureChains(
//     [polygon],
//     [
//         publicProvider()
//     ]
// );

// const { connectors } = getDefaultWallets({
//     appName: 'take',
//     chains
// });

// const wagmiClient = createClient({
//     autoConnect: true,
//     connectors,
//     provider
// })


/*
UI
*/

import { TakeABI } from '../abis/index.js';
import Header from '../components/header';
import { TakeV3Address } from '../../lib/config';
import { AppLayout } from '../components/layout';
import classNames from 'classnames';
import { ethers } from 'ethers';

const Step = ({ currentStep, step, title, children }) => {
    const isCurrent = currentStep === step
    const isFuture = currentStep < step
    const isDone = currentStep > step

    return <li className={classNames({ 
        [anonStyles.step]: true,
        [anonStyles.isDone]: isDone,
        [anonStyles.isCurrent]: isCurrent,
        [anonStyles.isFuture]: isFuture,
    })}>
        <h3>{title}</h3>
        {isCurrent && children}
    </li>
}

function UI() {
    const account = useAccount()
    const provider = getProvider()
    const { data: signer, isError, isLoading } = useSigner()

    // Contract.
    const takeItContractV1 = getContract({
        address: TakeV3Address,
        abi: TakeABI,
        signerOrProvider: provider
    })

    const [step, setStep] = useState(0)
    const [anonAddress, setAnonAddress] = useState('')

    const onChangeAnonAddress = (e) => {
        setAnonAddress(e.target.value)
    }

    const [anonUsername, setAnonUsername] = useState('')
    const [anonDeposit, setAnonDeposit] = useState('')
    const [mixingStatus, setMixingStatus] = useState('')

    const [depositAmount, setDepositAmount] = useState(ethers.constants.Zero)
    useEffect(() => {
        try {
            const d = ethers.utils.parseEther(anonDeposit)
            console.log(d)
            // Validate amount is a valid BN.
            // d.plus(ethers.constants.One)
            setDepositAmount(ethers.utils.parseEther(anonDeposit))
        } catch(err) {
            console.error(err)
        }
        
    }, [anonDeposit])
    
    const onChangeAnonUsername = (e) => {
        setAnonUsername(e.target.value)
    }

    const onChangeAnonDeposit = (e) => {
        setAnonDeposit(e.target.value)
    }


    const steps = [
        'Create another account in your wallet',
        'Input the address',
        'Select your new anon username and deposit some MATIC',
        'We will mix it so it isn\'t linked'
    ]

    const doStep1 = async () => {
        setStep(1)
    }

    const doStep2 = async () => {
        setStep(2)
    }

    
    const doStep3 = async (write) => {
        // Deposit some MATIC to the Take relay address (trusted).
        // This will be used to pay for gas of creating the anon account.
        // The anon account will be created with the same amount of MATIC - fee.
        setStep(3)
    }

    const doStep4 = async () => {
        // setStep(4)
        write()

        // Now we listen for the NameRegistered event.
        // 

        // Create the contract.
        const anonRelayer = new ethers.Contract(ANON_RELAYER_ADDRESS, AnonRelayerABI, provider)

        // Get the registry address.
        const registryAddress = await anonRelayer.registry()

        // Create the registry contract.
        const anonRegistry = new ethers.Contract(registryAddress, AnonTakenameRegistryABI, provider)

        // Listen to the events.
        anonRegistry.on('NameRegistered', (name, address, blockNumber, event) => {
            if(name == anonUsername) {
                // Update the mint status.
                setMixingStatus({ res: 'done', txhash: event.transactionHash })
            }

            console.log('NameRegistered', name, address, blockNumber, event)
        })
    }


    // Mint the take on click.
    const { config: txConfig } = usePrepareContractWrite({
        chainId: polygon.id,
        address: ANON_RELAYER_ADDRESS,
        abi: AnonRelayerABI,
        signerOrProvider: signer,
        functionName: 'deposit',
        args: [anonUsername],
        overrides: {
            value: depositAmount
        },
        enabled: step === 3,
    })

    const { data, write, isLoading: isWriteLoading } = useContractWrite(txConfig)
    const { isLoading: isTxLoading, isSuccess: isTxSuccess, data: txReceipt } = useWaitForTransaction({
        hash: data && data.hash,
    })

    // const provider = useProvider()
    const getAccounts = async () => {
        const provider = getSigner()
        console.log(provider)
        const accounts = await provider.request({ method: "eth_requestAccounts" });
        console.log(accounts)
    }

    const ui = (
        <div className={styles.containerFeed}>
            <Head>
                <title>take</title>
                <meta name="description" content="hot takes" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <Header />

            <main className={styles.main}>
                <h2>Create an {"anon"}</h2>
                <p>This tool allows you to create an anon take account</p>
                <p>How does it work?</p>
                <ol>
                    <Step step={0} currentStep={step} title="Create another account in your wallet">
                        <button onClick={doStep1}>Done</button>
                    </Step>
                    <Step step={1} currentStep={step} title="Input the address">
                        <input type="text" onChange={onChangeAnonAddress} value={anonAddress} />
                        <button onClick={getAccounts}>Load accounts from wallet</button>
                        <button disabled={!anonAddress.length} onClick={doStep2}>
                            Done
                        </button>
                    </Step>
                    <Step step={2} currentStep={step} title="Select your new anon username and deposit some MATIC">
                        <p>Username</p>
                        <input type="text" placeholder="obama.take" onChange={onChangeAnonUsername} value={anonUsername} />
                        <p>Deposit</p>
                        <input type="text" placeholder="0.01" onChange={onChangeAnonDeposit} value={anonDeposit} />
                        <button disabled={!anonUsername.length || !anonDeposit.length} onClick={doStep3}>
                            Done
                        </button>
                    </Step>
                    <Step step={3} currentStep={step} title="We will mix it so it isn't linked">
                        <button onClick={() => setStep(step-1)}>Back</button><br/>
                        <p>Username: {anonUsername}</p>
                        <p>Deposit: {ethers.utils.formatEther(depositAmount)}</p>
                        <p>Address: {anonAddress}</p>

                        <button disabled={isWriteLoading || isTxLoading} onClick={() => doStep4(write)}>
                            Create anon
                        </button>

                        {isWriteLoading && <p>Creating anon...</p>}
                        {isTxLoading && <p>Waiting for transaction...</p>}
                        {isTxSuccess && <p>Waiting for mixing...</p>}
                        {mixingStatus.res == 'done' && <p>Done! (<a href={`https://polygonscan.com/tx/${mixingStatus.txhash}`}>transaction</a>)</p>}

                    </Step>
                </ol>
            </main>

            <div style={{ paddingBottom: "1rem" }}></div>
        </div>
    )

    return ui
}

const slugify = require('slugify')


UI.layout = AppLayout
export default UI