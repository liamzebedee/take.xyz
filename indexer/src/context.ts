import { ethers } from "ethers"

export type Context = {
    // Polygon provider.
    provider: ethers.providers.Provider
    // Ethereum mainnet provider.
    ensProvider: ethers.providers.Provider
    apiEndpoint: string
    apiKey: string
}

export {
}