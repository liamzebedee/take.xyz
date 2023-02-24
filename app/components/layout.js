
/*
Rainbow & wagmi
*/
import '@rainbow-me/rainbowkit/styles.css';

import {
    ConnectButton,
    createAuthenticationAdapter,
    getDefaultWallets,
    RainbowKitAuthenticationProvider,
    RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, WagmiConfig, useSigner } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core'
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';
import Header from '../components/header';

import { useNetwork } from 'wagmi'
import { useEffect, useState  } from 'react'
import { SiweMessage  } from 'siwe'

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


const authenticationAdapter = ({ onVerify }) => createAuthenticationAdapter({
    getNonce: async () => {
        return '1'.repeat(16)
        const response = await fetch('/api/nonce');
        return await response.text();
    },

    createMessage: ({ nonce, address, chainId }) => {
        const domain = window.location.host;
        const origin = window.location.origin;
        return new SiweMessage({
            domain,
            address,
            statement: 'Sign in with Ethereum to the app.',
            uri: origin,
            version: '1',
            chainId,
            nonce,
        });
    },

    getMessageBody: ({ message }) => {
        return message.prepareMessage();
    },

    verify: async ({ message, signature }) => {
        const verifyRes = await fetch(`/api/v1/auth/login/`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                // 'X-CSRFToken': document.getElementsByName('csrfmiddlewaretoken')[0].value,
            },
            body: JSON.stringify({ message, signature }),
            credentials: 'include'
        });

        const res = await verifyRes.json()
        // onVerify(true)
        onVerify(res.ok)

        return res.ok
    },

    signOut: async () => {
        await fetch('/api/logout');
    },
});


export const AppLayout = ({ children }) => {
    const [authStatus, setAuthStatus] = useState('unauthenticated')
    const onVerify = (ok) => {
        setAuthStatus(ok ? 'authenticated' : 'unauthenticated')
    }

    return (
        <WagmiConfig client={wagmiClient}>
            <RainbowKitAuthenticationProvider
                adapter={authenticationAdapter({ onVerify })}
                status={authStatus}
                appInfo={{
                    appName: 'Dappnet Install Point',
                }}
            >
                <RainbowKitProvider modalSize="compact" chains={chains} initialChain={polygon}>
                    <Body>{children}</Body>
                </RainbowKitProvider>

            </RainbowKitAuthenticationProvider>
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