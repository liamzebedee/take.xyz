import { formatUnits } from "./chain"

// 131a61edb37e33be823682eba5d9aa14c899a426
export const TakeV1Address = '0xC343497721e61FD96B1E3C6e6DeBE5C2450d563c'
export const TakeV2Address = '0xdbaEFaa91EdABDE9caD37644faC931C3bd44326f'

// Current.
export const TakeV3Address = '0x8aBb83aBc180Ad1E96f75884CA24d45CC7560af2'

export const HYPETokenAddress = '0xC315841328D8409f17c3f886A7bec9A37e6d0fa6'
export const TakeRewardsV1Address = '0x5b2D78f219EF07317C5775d2a08292B03dF5F13B'

// Misc.
// 

// LOL magic constanttt.
export const TAKE_LENGTH = 170
export const ANON_RELAYER_ADDRESS = '0x86f37df4fB439636184549FfF06812Ae7e8eF6d4'

export const TAKE_BASE_URL = `https://take-xyz.vercel.app`
export const TAKE_OPENGRAPH_SERVICE_BASE_URL = `http://15.165.74.200:3000`
export const TAKE_API_BASE_URL = "http://localhost:8000"

export const rewardsFor = {
    remix: {
        take: formatUnits(5),
        og: formatUnits("2.5")
    },
    template: formatUnits(3),
    take: formatUnits(3)
}