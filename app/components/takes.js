import Head from 'next/head';
import { useCallback, useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
const slugify = require('slugify')
import truncateEthAddress from 'truncate-eth-address';

/*
Rainbow & wagmi
*/

import { useAccount, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { getContract, getProvider } from '@wagmi/core';
import { useEnsName } from '../hooks';
import Header from '../components/header';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { multicall } from '@wagmi/core'
import { AppLayout } from '../components/layout';


// import useSigner
import { useSigner } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { ethers } from 'ethers';
import { TakeV3Address, TAKE_API_BASE_URL, TAKE_BASE_URL, TAKE_OPENGRAPH_SERVICE_BASE_URL } from '@takeisxx/lib/src/config';
import { TakeABI } from '@takeisxx/lib/src/abis';
import { fetchTake2 } from '@takeisxx/lib/src/chain';
import { useQuery } from '@tanstack/react-query';
import { canRemixTake, parseTake, addContextToTokens } from '@takeisxx/lib/src/parser';


export const InlineTakeList = ({ takes }) => {
    return <div className={styles.remixedFrom}>
        <ul>
            {takes.map(remix => {
                return <li key={remix.nft_id}>
                    <div className={styles.inlineTake}>
                        <Link href={`/t/${slugify(remix.text)}-${remix.nft_id}`}>{remix.text}</Link>
                    </div>
                </li>
            })}
        </ul>
    </div>
}
