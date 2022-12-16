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
import Header from '../components/header';


const { chains, provider } = configureChains(
  [polygon, mainnet],
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

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);

function UI() {
  const [take, setTake] = useState('')
  const [canTakeIt, setCanTakeIt] = useState(false)

  const account = useAccount()
  const { data: signer, isError, isLoading } = useSigner()

  // Handle input change.
  useEffect(() => {
    const input = document.querySelector('input')
    input.addEventListener('input', (e) => {
      setTake(e.target.value)
    })
  }, [])

  // Validate input, enable button.
  useEffect(() => {
    setCanTakeIt(account.isConnected && take.length > 0)
  }, [account, take])

  // Mint the take on click.
  // const provider = getProvider()
  const takeItContractV1 = getContract({
    address: '0xC343497721e61FD96B1E3C6e6DeBE5C2450d563c',
    abi: [
      "function mint(string memory _take) public",
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
    ],
    signerOrProvider: signer
  })
  const takeIt = async () => {
    const tx = await takeItContractV1.mint(take)
    const receipt = await tx.wait()
    console.log(receipt)
    // extract ERC721 mint event from receipt
    // 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
    // const event = receipt.events[0]
    // decode hex tokenId arg into tokenId number
    // const tokenId = parseInt(event.args[2])
    const event = receipt.events.find(e => e.event === 'Transfer')
    const tokenId = event.args.tokenId
    // redirect to take page
    window.location.href = `/take/${tokenId}`
  }

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
          <strong>mint your hot take{' '}</strong>
        </p>

        <p className={styles.description}>
          <input className={styles.takeInput} maxLength={60} type="text"></input>
        </p>

        <div className={styles.grid}>
          <button disabled={!canTakeIt} className={styles.takeItBtn} onClick={takeIt}>take it</button>
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

export default function Home() {
  return (

    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider modalSize="compact"  chains={chains}>
        <UI/>
      </RainbowKitProvider>
    </WagmiConfig>

  )
}
