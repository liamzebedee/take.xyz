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

// const convertFloatToUint256 = (f) => ethers.utils.parseUnits("" + f, 18).toString()
const convertFloatToUint256 = (f) => Math.max(Math.round(parseFloat(f)), 1)

export default async function handler(req, res) {
    const { page } = req.query

    // const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com")

    const feeData = await (await fetch(`https://gasstation-mainnet.matic.network/v2`)).json()
    
    const { safeLow, standard, fast, estimatedBaseFee } = feeData

    safeLow.maxFee = convertFloatToUint256(safeLow.maxFee)
    safeLow.maxPriorityFee = convertFloatToUint256(safeLow.maxPriorityFee)

    standard.maxFee = convertFloatToUint256(standard.maxFee)
    standard.maxPriorityFee = convertFloatToUint256(standard.maxPriorityFee)

    fast.maxFee = convertFloatToUint256(fast.maxFee)
    fast.maxPriorityFee = convertFloatToUint256(fast.maxPriorityFee)



    let data = {
        safeLow,
        standard,
        fast,
        estimatedBaseFee: convertFloatToUint256(estimatedBaseFee)
    }

    res
        .status(200)
        .send(data)
}