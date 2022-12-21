

async function main() {
    const provider = new ethers.providers.AlchemyProvider('matic', process.env.ALCHEMY_KEY_MATIC)
    // const ensProvider = new ethers.providers.AlchemyProvider('homestead', process.env.ALCHEMY_KEY_HOMESTEAD)

    await provider.getBlock('latest')
    await ensProvider.getBlock('latest')

    // get list of all people who have made takes.
    
}