import Head from 'next/head';
import { useEffect, useState } from 'react';
import { AppLayout } from '../components/layout';
import styles from '../styles/Home.module.css';

import { useAccount, useContractWrite, usePrepareContractWrite, useSigner, useWaitForTransaction } from 'wagmi';
import { getContract } from '@wagmi/core';
import Header from '../components/header';
import { useDebounce } from '../components/util';
import { ethers } from 'ethers';
import { polygon } from 'wagmi/chains';
import { TakeV3Address, TAKE_LENGTH } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';

/*
UI
*/

const compose = (...fns) => x => fns.reduceRight((y, f) => f(y), x);
const slugify = require('slugify')

function UI() {
  const [take, setTake] = useState('')
  const debouncedTake = useDebounce(take, 150)
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
  const { config: mintConfig } = usePrepareContractWrite({
    chainId: polygon.id,
    address: TakeV3Address,
    abi: TakeABI,
    signerOrProvider: signer,
    functionName: 'mint',
    args: [debouncedTake, [0, 0, 0]],
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
  }, [signer, isTxSuccess])

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
          <strong>mint your take{' '}</strong>
        </p>
          <br /><small><a href="https://gist.github.com/liamzebedee/feee38ba38141d8a7c0f47dfab603623">(syntax)</a></small>

        <p className={styles.description}>
          <input className={styles.takeInput} maxLength={TAKE_LENGTH} type="text"></input>
        </p>

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
