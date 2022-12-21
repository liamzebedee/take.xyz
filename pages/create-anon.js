import Head from 'next/head';
import React, { useState } from 'react';
import styles from '../styles/Home.module.css';
import anonStyles from '../styles/anon.module.css';


/*
Rainbow & wagmi
*/

import {
    getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core';
import { publicProvider } from 'wagmi/providers/public';


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

import { TakeABI } from '../abis/index.js';
import Header from '../components/header';
import { TakeV3Address } from '../lib/config';
import { AppLayout } from '../components/layout';
import classNames from 'classnames';

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

    
    const doStep3 = async () => {
        // Deposit some MATIC to the Take relay address (trusted).
        // This will be used to pay for gas of creating the anon account.
        // The anon account will be created with the same amount of MATIC - fee.
        

        setStep(3)
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
                        <p>Username: {anonUsername}</p>
                        <p>Deposit: {anonDeposit}</p>
                        <p>Address: {anonAddress}</p>

                        <button onClick={doStep3}>
                            Create anon
                        </button>

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