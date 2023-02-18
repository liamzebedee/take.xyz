import { ethers } from "ethers"

const { default: truncateEthAddress } = require('truncate-eth-address')

export function printTelegramBotInfo(TELEGRAM_TOKEN: string) {
    console.log(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`)
}

export function printTakeDeploymentInfo({ TakeV3Address }: any) {
    const takeDeploymentInfoPage = `https://polygonscan.com/txs?a=${TakeV3Address}`
    console.log(`Take deployment info: ${takeDeploymentInfoPage}`)
}


export const parseTakeURI = (uri: string) => {
    const safeUri = `data:application/json;base64,eyJuYW1lIjogIkhvdCBUYWtlICMxMyIsICJkZXNjcmlwdGlvbiI6ICIiLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhCeVpYTmxjblpsUVhOd1pXTjBVbUYwYVc4OUluaE5hVzVaVFdsdUlHMWxaWFFpSUhacFpYZENiM2c5SWpBZ01DQXpNREFnTXpBd0lqNDhjM1I1YkdVK0xtSmhjMlVnZXlCbWFXeHNPaUIzYUdsMFpUc2dabTl1ZEMxbVlXMXBiSGs2SUhOaGJuTXRjMlZ5YVdZN0lHWnZiblF0YzJsNlpUb2dNVGh3ZURzZ2ZUd3ZjM1I1YkdVK1BISmxZM1FnZDJsa2RHZzlJakV3TUNVaUlHaGxhV2RvZEQwaU1UQXdKU0lnWm1sc2JEMGlJMFV6TVVNM09TSWdMejQ4ZEdWNGRDQjRQU0l4TUNJZ2VUMGlNakFpSUdOc1lYTnpQU0ppWVhObElqNDhMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpRd0lpQmpiR0Z6Y3owaVltRnpaU0krUEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSTJNQ0lnWTJ4aGMzTTlJbUpoYzJVaVBqd3ZkR1Y0ZEQ0OGRHVjRkQ0I0UFNJeE1DSWdlVDBpT0RBaUlHTnNZWE56UFNKaVlYTmxJajQ4TDNSbGVIUStQSFJsZUhRZ2VEMGlNVEFpSUhrOUlqRXdNQ0lnWTJ4aGMzTTlJbUpoYzJVaVBqd3ZkR1Y0ZEQ0OGRHVjRkQ0I0UFNJeE1DSWdlVDBpTVRJd0lpQmpiR0Z6Y3owaVltRnpaU0krUEM5MFpYaDBQangwWlhoMElIZzlJakV3SWlCNVBTSXhOREFpSUdOc1lYTnpQU0ppWVhObElqNDhMM1JsZUhRK1BIUmxlSFFnZUQwaU1UQWlJSGs5SWpFMk1DSWdZMnhoYzNNOUltSmhjMlVpUGp3dmRHVjRkRDQ4TDNOMlp6ND0ifQ==`

    try {
        const json = atob(uri.substring(29))
        const tokenURIJsonBlob = JSON.parse(json)
        return tokenURIJsonBlob
    } catch {
        const json = atob(safeUri.substring(29))
        const tokenURIJsonBlob = JSON.parse(json)
        return tokenURIJsonBlob
    }
}

export async function fetchTake({ takeContract: Take, takeId }: any) {
    const event = await Take.queryFilter(Take.filters.Transfer(ethers.constants.AddressZero, null, takeId), 0, 'latest')
    const block = await Take.provider.getBlock(event[0].blockNumber)
    const createdAt = block.timestamp
    const txHash = event[0].transactionHash

    const takeURI = await Take.tokenURI(takeId)
    const owner = await Take.ownerOf(takeId)
    const text = await Take.getTakeText(takeId)
    const author = await Take.getTakeAuthor(takeId)
    const tokenURIJsonBlob = parseTakeURI(takeURI)
    const refsIdsBN = await Take.getTakeRefs(takeId)
    const refIds = await Promise.all(refsIdsBN.map((id: ethers.BigNumber) => id.toNumber()).filter((id: number) => id > 0))

    return {
        id: takeId,
        ...tokenURIJsonBlob,
        owner,
        text,
        author,
        takeURI,
        refIds,
        createdAt,
        txHash
    }
}

export class Msg {
    buf = ''
    write(line = '') {
        this.buf += line + '\n'
    }
}

export const getENSUsername = async (ensProvider: ethers.providers.Provider, address: string) => {
    try {
        const ens = await ensProvider.lookupAddress(address)
        if (ens) return ens
    } catch (err) {
    }

    return truncateEthAddress(address)
}