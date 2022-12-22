

import { TakeABI } from './abis/index.js';

/*
Rainbow & wagmi
*/

export const parseTakeURI = (uri) => {
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

export async function fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs }) {
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
    const tokenURIJsonBlob = parseTakeURI(takeURI)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    let refs
    if (fetchRefs) {
        refs = await Promise.all(refIds.map(async refId => {
            const id = refId
            
            // get the owner
            const owner = await takeItContractV1.ownerOf(id)
            const takeURI = await takeItContractV1.tokenURI(id)
            const author = await takeItContractV1.getTakeAuthor(id)
            const tokenURIJsonBlob = parseTakeURI(takeURI)

            return {
                id,
                owner,
                takeURI,
                author,
                ...tokenURIJsonBlob,
            }
        }))
    }

    return {
        id: takeId,
        owner,
        takeURI,
        author,
        refIds,
        refs,
        ...tokenURIJsonBlob,
    }
}


export async function fetchTakesBatch({ multicall, takeIds, takeItContractV1, takeId, provider }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const functions = (['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor'])
    const contracts = takeIds
        .map(takeId => functions
            .map(functionName => ({
                abi,
                address,
                functionName,
                args: [takeId]
            }))
        )
        .flat()

    // console.log(contracts)

    const data = await multicall({
        contracts,
    })
    // console.log(data)

    // Now we have to parse the data.
    // Process in batches of functions.length.
    const takes = data
        .reduce((acc, val, i) => {
            const index = Math.floor(i / functions.length)
            if (!acc[index]) {
                acc[index] = []
            }
            acc[index].push(val)
            return acc
        }, [])
        .map(([
            takeURI,
            owner,
            refsIdsBN,
            author
        ], i) => {
            // console.log(takeURI)
            const takeId = takeIds[i]

            const tokenURIJsonBlob = parseTakeURI(takeURI)
            const refIds = refsIdsBN.map(id => id.toNumber()).filter(id => id > 0)

            return {
                id: takeId,
                owner,
                takeURI,
                refIds,
                ...tokenURIJsonBlob,
            }
        });

    // console.log(takes)
    return takes
}

async function fetchTake(takeItContractV1, takeId) {
    const takeURI = await takeItContractV1.tokenURI(takeId)
    const owner = await takeItContractV1.ownerOf(takeId)
    const json = atob(takeURI.substring(29))
    const tokenURIJsonBlob = JSON.parse(json)
    const refsIdsBN = await takeItContractV1.getTakeRefs(takeId)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    return {
        id: takeId,
        owner,
        takeURI,
        refIds,
        ...tokenURIJsonBlob,
    }
}