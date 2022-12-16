import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState } from 'react'
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
import { configureChains, createClient, useAccount, WagmiConfig, useSigner } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core'
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber } from 'ethers';
import { useEnsName } from 'wagmi'
import truncateEthAddress from 'truncate-eth-address'
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
    // Manually compute the active page
    const router = useRouter()
    const isHome = router.pathname == "/"
    const isFeed = router.pathname == "/feed"

    return <header className={styles.header}>
        <div className={styles.menu}>
            <ul>
                <li className={isHome && styles.menuLiActive}>
                    <Link href="/">home</Link>
                </li>
                <li className={isFeed && styles.menuLiActive}>
                    <Link href="/feed">feed</Link>
                </li>
            </ul>
        </div>
        <div className={styles.account}>
            <ConnectButton chainStatus="none" />
        </div>
    </header>
}