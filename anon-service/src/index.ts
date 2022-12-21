#!/usr/bin/env node
import * as yargs from 'yargs'
import * as ethers from 'ethers'

// @ts-ignore
import { ANON_RELAYER_ADDRESS  } from '../../lib/config'
const { AnonRelayerABI } = require('../../abis')

async function createAccount(argv: any) {
    const wallet = ethers.Wallet.createRandom()
    const msg = `Account created!\nAddress: ${wallet.address}\nPrivate key: ${wallet.privateKey}`
    console.log(msg)
}

async function startRelayer() {
    const {
        ALCHEMY_KEY_MATIC,
        RELAYER_PRIVATE_KEY,
        // RELAYER_CONTRACT_ADDRESS
    } = process.env

    if (!ALCHEMY_KEY_MATIC) {
        throw new Error('ALCHEMY_KEY_MATIC is not defined')
    }

    if (!RELAYER_PRIVATE_KEY) {
        throw new Error('RELAYER_PRIVATE_KEY is not defined')
    }

    // if (!RELAYER_CONTRACT_ADDRESS) {
    //     throw new Error('RELAYER_CONTRACT_ADDRESS is not defined')
    // }

    const RELAYER_CONTRACT_ADDRESS = ANON_RELAYER_ADDRESS

    const provider = new ethers.providers.AlchemyProvider('matic', ALCHEMY_KEY_MATIC)
    const signer = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider)

    console.log('RPC URL:', provider.connection.url)
    console.log('Relayer address:', signer.address)
    console.log('Relayer contract address:', RELAYER_CONTRACT_ADDRESS)
    console.log('Listening for deposits...')

    // Create the relayer contract.
    const relayer = new ethers.Contract(
        RELAYER_CONTRACT_ADDRESS,
        AnonRelayerABI,
        provider
    )

    // Get past Deposit events.
    const depositEvents = await relayer.queryFilter('Deposit')
    console.log('Past deposit events:', depositEvents)

    // Get past events.
    const events = await relayer.queryFilter({})
    console.log('Past events:', events)


    relayer.on('Deposit', async function(user: string, amount: ethers.BigNumber, name: string, ev) {
        console.log('Deposit event detected')
        
        // Now we process it and mint them a name.
        const tx = await relayer.createAnonAccount(0, user, name)
        await tx.wait(1)
    })

}

async function main() {
    yargs
        .scriptName("anon-service")
        .usage('$0 <cmd> [args]')

        .command('create-account', 'create the relayer account', (yargs) => {
            return
        }, createAccount)

        .command('start', 'start the relayer server', (yargs) => {
            return
        }, startRelayer)

        .help()
        .demandCommand()
        .argv
}

main()