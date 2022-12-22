
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
import Header from '../components/header';

import { useNetwork } from 'wagmi'
import { useEffect  } from 'react'

const { chains, provider } = configureChains(
    [polygon],
    [
        publicProvider()
    ]
);

const { connectors } = getDefaultWallets({
    appName: 'take',
    chains: [polygon]
});

const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider
})

export const AppLayout = ({ children }) => {
    return (
        <WagmiConfig client={wagmiClient}>
            <RainbowKitProvider modalSize="compact" chains={chains} initialChain={polygon}>
                <Body>{children}</Body>
            </RainbowKitProvider>
        </WagmiConfig>
    )
}

const Body = ({ children }) => {
    // check isConnected
    // const { isConnected } = useAccount()
    // const { chain } = useNetwork()
    // // const x = useNetwork()
    // const { chains, error, isLoading, pendingChainId, switchNetwork } =
    //     useSwitchNetwork()

    // console.log(x)
    // console.log(switchNetwork)
    
    // // switch to polygon if not already on it
    // useEffect(() => {
    //     if (chain?.id !== polygon.id || pendingChainId !== polygon.id) {
    //         switchNetwork(polygon)
    //     }
    // }, [chain, switchNetwork])


    // const { chain } = useNetwork()
    
    // switch to polygon if not already on it
    // useEffect(() => {
    //     if (chain?.id !== polygon.id || pendingChainId !== polygon.id) {
    //         switchNetwork(polygon)
    //     }
    // }, [chain, switchNetwork])

    return <>
        {children}
    </>
}