import Head from 'next/head'
import Image from 'next/image'
import { createContext, useContext, useEffect, useState } from 'react'
import styles from '../styles/Home.module.css'


/*
Rainbow & wagmi
*/
import '@rainbow-me/rainbowkit/styles.css';

import {
    ConnectButton,
    getDefaultWallets,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, WagmiConfig, useSigner, useProvider } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core'
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber, ethers } from 'ethers';
import { useEnsName } from 'wagmi'
import truncateEthAddress from 'truncate-eth-address'
import Link from 'next/link';
import { useRouter } from 'next/router';
const { TakeABI, HYPEABI, AnonRelayerABI, AnonTakenameRegistryABI } = require('@takeisxx/lib/src/abis')
const { TakeV3Address, HYPETokenAddress, ANON_RELAYER_ADDRESS } = require('@takeisxx/lib/src/config')
const classNames = require('classnames');

const {
    menuLiActive,
    menuLiLiterallyAnythingElse
} = styles

const HYPEStatusContext = createContext()

const HYPEStatus = ({ }) => {
    // As soon as account is enabled, we fetch the HYPE balance and
    // listen to transfers on it.
    const account = useAccount()
    const provider = getProvider()
    const ctx = useContext(HYPEStatusContext)
    
    const { data: signer, isError, isLoading } = useSigner()

    const [hypeBalance, setHypeBalance] = useState(null)
    const [hypeBalanceLoading, setHypeBalanceLoading] = useState(false)
    const [hypeBalanceError, setHypeBalanceError] = useState(null)
    const [hypeBalanceListener, setHypeBalanceListener] = useState(null)

    useEffect(() => {
        if(hypeBalance) return

        if (!account.isConnected) {
            return
        }

        if (hypeBalanceLoading || hypeBalance) {
            return
        }

        const fetchHypeBalance = async () => {
            setHypeBalanceLoading(true)
            try {
                const hypeContract = getContract({
                    chainId: polygon.id,
                    address: HYPETokenAddress,
                    abi: HYPEABI,
                    signerOrProvider: provider,
                })
                
                const balance = await hypeContract.balanceOf(account.address)
                console.log(balance)
                setHypeBalance(balance)
            } catch (e) {
                setHypeBalanceError(e)
            }
            setHypeBalanceLoading(false)

            // Listen to transfers
            const hypeContract = getContract({
                chainId: mainnet.id,
                address: HYPETokenAddress,
                abi: HYPEABI,
                signerOrProvider: provider,
            })
            const listener = hypeContract.on('Transfer', (from, to, amount, event) => {
                if (from == account.address || to == account.address) {
                    setHypeBalance(amount)
                }
            })

            setHypeBalanceListener(listener)

            return () => {
                hypeContract.off(listener)
            }
        }

        if(!hypeBalance) fetchHypeBalance()
    }, [account, isLoading, hypeBalance, hypeBalanceLoading, hypeBalanceError, hypeBalanceListener, provider])

    

    if (hypeBalanceLoading || hypeBalanceError || !hypeBalance) {
        return <span className={styles.hypeStatus}>HYPE</span>
    }
    let balance = Number(ethers.utils.formatUnits(hypeBalance, 18)).toFixed(0)

    const navigate = () => {
        // open new tab
        window.open('https://polygonscan.com/token/0xc315841328d8409f17c3f886a7bec9a37e6d0fa6', '_blank')
    }
    return <span className={styles.hypeStatus} onClick={navigate}>
        {balance || 'XXX'} HYPE
    </span>
}

export default function Header() {
    // Manually compute the active page
    const router = useRouter()
    const isHome = router.pathname == "/"
    const isFeed = router.pathname == "/feed"
    const isHotTemplates = router.pathname == "/hot-templates"
    const isLiterallyAnythingElse = !isHome && !isFeed

    return <header className={styles.header}>
        <div className={styles.menu}>
            <ul>
                <li className={classNames({ [menuLiActive]: isHome })}>
                    <Link href="/">home</Link>
                </li>
                <li className={classNames({ [menuLiActive]: isFeed })}>
                    <Link href="/feed">feed</Link>
                </li>
                <li>
                    <Link href="https://t.me/+l_mrM707TIg1ZTA9">tg chat</Link>
                </li>
                <li className={classNames({ [menuLiActive]: isLiterallyAnythingElse, [menuLiLiterallyAnythingElse]: true })}>
                    <span>✴✴✴</span>
                </li>
            </ul>
        </div>
{/* 
        <div className={styles.mobileMenu}>
            <Image src="/hamburger.png" width={22} height={22} />

            <ul>
                <li className={classNames({ [menuLiActive]: isHome })}>
                    <Link href="/">home</Link>
                </li>
                <li className={classNames({ [menuLiActive]: isFeed })}>
                    <Link href="/feed">feed</Link>
                </li>
                <li className={classNames({ [menuLiActive]: isHotTemplates })}>
                    <Link href="/hot-templates">hot templates</Link>
                </li>
                <li>
                    <Link href="https://t.me/+l_mrM707TIg1ZTA9">tg chat</Link>
                </li>
                <li className={classNames({ [menuLiActive]: isLiterallyAnythingElse, [menuLiLiterallyAnythingElse]: true })}>
                    <span>✴✴✴</span>
                </li>
            </ul>
        </div>
         */}
        <div className={styles.mainStatus}>
            <HYPEStatus />
        </div>

        <div className={styles.account}>
            <div className={styles.accountUserProfile}>
                <Image src="/user.png" width={32} height={32}/>
            </div>
            <ConnectButton chainStatus="name" />
        </div>
    </header>
}