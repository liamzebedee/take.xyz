
export function printTelegramBotInfo(TELEGRAM_TOKEN) {
    console.log(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/getUpdates`)
}

export function printTakeDeploymentInfo({ TakeV3Address }) {
    const takeDeploymentInfoPage = `https://polygonscan.com/txs?a=${TakeV3Address}`
    console.log(`Take deployment info: ${takeDeploymentInfoPage}`)
}


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

export async function fetchTake({ takeContract: Take, takeId }) {
    const takeURI = await Take.tokenURI(takeId)
    const owner = await Take.ownerOf(takeId)
    const author = await Take.getTakeAuthor(takeId)
    const tokenURIJsonBlob = parseTakeURI(takeURI)
    const refsIdsBN = await Take.getTakeRefs(takeId)
    const refIds = await Promise.all(refsIdsBN.map(id => id.toNumber()).filter(id => id > 0))

    return {
        id: takeId,
        owner,
        author,
        takeURI,
        refIds,
        ...tokenURIJsonBlob,
    }
}

