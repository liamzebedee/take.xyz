// import { useEnsName } from 'wagmi';

import { useQuery } from "@tanstack/react-query"
import { ethers } from "ethers"
import truncateEthAddress from 'truncate-eth-address'


const ensProvider = new ethers.providers.AlchemyProvider('homestead', "enrTyPA6vUOBNhU7u0wOtKQWCBWAetx9")
export const getENSUsername = async (ensProvider, address) => {
    try {
        const ens = await ensProvider.lookupAddress(address)
        if (ens) return ens
    } catch (err) {
    }

    return truncateEthAddress(address)
}

export const useEnsName = ({ address, chainId }) => {
    // TODO: idk why `chainId` is even here in the wagmi api.
    const query = useQuery({
        queryKey: ['ensName', address],
        queryFn: () => getENSUsername(ensProvider, address),
        enabled: !!address,
    })

    return query
}