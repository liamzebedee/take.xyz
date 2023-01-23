import { TakeABI } from "@takeisxx/lib/src/abis";
import { fetchTakesBatch } from "@takeisxx/lib/src/chain";
import { TakeV3Address } from "@takeisxx/lib/src/config";
import { configureChains, multicall } from '@wagmi/core'

import * as ethers from "ethers"
import { createClient, useAccount, useSigner } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber } from 'ethers';
import { useEnsName } from 'wagmi';
import truncateEthAddress from 'truncate-eth-address';


const { chains, provider } = configureChains(
    [polygon],
    [
        publicProvider()
    ]
);

// const { connectors } = getDefaultWallets({
//     appName: 'take',
//     chains
// });

const wagmiClient = createClient({
    autoConnect: true,
    connectors: [],
    provider
})


export default async function handler(req, res) {
    const { page } = req.query

    const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com")
    const takeContract = new ethers.Contract(TakeV3Address, TakeABI, provider)
    
    let pageParam = parseInt(page) || -1
    const takeCount = await takeContract.totalSupply()
    if (pageParam === -1) {
        pageParam = takeCount
    }

    const takeIds = Array.from(Array(15).keys())
        .map(i => BigNumber.from(pageParam).sub(i).toNumber())
        .reverse()
        .filter(i => i > -1)
        .filter(i => i < takeCount)
        .reverse();

    const takes2 = await fetchTakesBatch({ multicall, takeIds, takeItContractV1: takeContract, provider, takeIds, })

    takes2.nextCursor = takes2[takes2.length - 1].id - 1
    if (takes2.nextCursor == -1) takes2.nextCursor = 0
    takes2.hasNextPage = takes2.nextCursor > 0
    console.log('next page', pageParam, takes2.nextCursor)

    const data = takes2

    res
        .status(200)
        .send(data)
}