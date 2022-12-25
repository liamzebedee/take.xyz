import { ethers } from "ethers"

// Create a Polygon RPC provider.
let provider
let ensProvider


export type Context = {
    provider: ethers.providers.Provider
    api: any
    ensProvider: ethers.providers.Provider
    chatId: string
}

export {
}