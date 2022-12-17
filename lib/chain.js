

import { TakeABI } from '../abis/index.js';
import Link from 'next/link';
import Header from '../components/header';
import { TakeV3Address } from '../lib/config';
import { AppLayout } from '../components/layout';

import { multicall } from '@wagmi/core'
import Head from 'next/head';
import { useEffect, useState } from 'react';

/*
Rainbow & wagmi
*/

import {
    getDefaultWallets
} from '@rainbow-me/rainbowkit';
import { configureChains, createClient, useAccount, useSigner } from 'wagmi';
import { mainnet, polygon } from 'wagmi/chains';
import { getContract, getProvider } from '@wagmi/core';
import { publicProvider } from 'wagmi/providers/public';
import { BigNumber } from 'ethers';
import { useEnsName } from 'wagmi';
import truncateEthAddress from 'truncate-eth-address';

export async function fetchTake2({ takeItContractV1, takeId, provider, details }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const functions = (['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor'])
    const contracts = functions.map(functionName => ({
        abi,
        address,
        functionName,
        args: [takeId]
    }))

    const data = await multicall({
        contracts,
    })

    const [
        takeURI,
        owner,
        refsIdsBN,
        author
    ] = data
    const json = atob(takeURI.substring(29))
    const tokenURIJsonBlob = JSON.parse(json)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    const refs = await Promise.all(refIds.map(async refId => {
        const id = refId
        
        // get the owner
        const owner = await takeItContractV1.ownerOf(id)
        const takeURI = await takeItContractV1.tokenURI(id)
        const author = await takeItContractV1.getTakeAuthor(id)

        const json = atob(takeURI.substring(29));
        const tokenURIJsonBlob = JSON.parse(json);

        return {
            id,
            owner,
            takeURI,
            author,
            ...tokenURIJsonBlob,
        }
    }))

    return {
        id: takeId,
        owner,
        takeURI,
        refIds,
        refs,
        ...tokenURIJsonBlob,
    }
}