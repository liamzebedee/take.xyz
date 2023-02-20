

import { ethers } from 'ethers';
import { TakeABI } from './abis/index.js';
import { addContextToTokens, parseTake } from './parser.js';
const atob = require('atob');

/*
Rainbow & wagmi
*/

// Fix for invalidly formatted / broken take URI's.
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

async function fetchSubtakes({ takeId, tokens, provider, takeItContractV1, depth }) {
    if(depth == 0) return []

    let subtakes = []
    try {
        subtakes = await Promise.all(tokens.filter(token => token.type === 'takelink').map(async token => {
            // fetch the take's text
            const { takeId } = token
            console.log('getting subtake', takeId)
            const text = await takeItContractV1.getTakeText(String(takeId))

            console.log('subtake', token, takeId)

            const subtakes = await fetchSubtakes({
                takeId,
                text,
                provider,
                takeItContractV1,
                depth: depth - 1
            })
            
            return {
                id: takeId,
                token,
                take: { text, id: takeId, subtakes },
            }
        }));
    } catch (err) {
        console.error('error getting subtake', err)
        return []
    }
    console.log('subtakes', subtakes)
    return subtakes
}

export async function fetchTake2({ multicall, takeItContractV1, takeId, provider, fetchRefs }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const functions = (['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor', 'getTakeText'])
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
        author,
        text
    ] = data
    const tokenURIJsonBlob = parseTakeURI(takeURI)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    const tokens = addContextToTokens(text, parseTake(text))
    const subtakes = await fetchSubtakes({
        takeId,
        tokens,
        provider,
        takeItContractV1,
        depth: 2
    })

    let refs = null
    if (fetchRefs) {
        refs = await Promise.all(refIds.map(async refId => {
            const id = refId
            
            // get the owner
            const owner = await takeItContractV1.ownerOf(id)
            const takeURI = await takeItContractV1.tokenURI(id)
            const author = await takeItContractV1.getTakeAuthor(id)
            const text = await takeItContractV1.getTakeText(id)
            const tokenURIJsonBlob = parseTakeURI(takeURI)

            return {
                id,
                owner,
                takeURI,
                author,
                ...tokenURIJsonBlob,
                text,
                subtakes,
            }
        }))
    }

    return {
        id: takeId,
        owner,
        takeURI,
        author,
        text,
        refIds,
        refs,
        tokens,
        subtakes,
        ...tokenURIJsonBlob,
    }
}


export async function fetchTakesBatch({ multicall, takeIds, takeItContractV1, takeId, provider }) {
    const { address } = takeItContractV1
    const abi = TakeABI

    const functions = (['tokenURI', 'ownerOf', 'getTakeRefs', 'getTakeAuthor', 'getTakeText'])
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
            author,
            text
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
                author,
                ...tokenURIJsonBlob,
                text,
            }
        });

    // console.log(takes)
    return takes
}

export function formatUnits(bn) {
    return ethers.utils.parseEther(bn+'')
}

export function renderBalance(bn) {
    let balance = Number(ethers.utils.formatUnits(bn, 18)).toFixed(0)
    return Number(balance)
}