// This script reads all .json in the ./abis/ directory, and then export them as a single object in index.js.
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')

function main() {
    // Glob all .json files in the ./abis/ directory
    const files = require('glob').sync('./abis/*.json')
    // Read all .json files
    const abis = files.map(file => readFileSync(file, 'utf8'))
    // Convert to a single object
    const abiObject = abis.reduce((acc, abi, i) => {
        const name = files[i].replace('./abis/', '').replace('.json', '')
        acc[name+"ABI"] = JSON.parse(abi)
        return acc
    }, {})
    // Write to index.js
    writeFileSync(join(__dirname, 'index.js'), `module.exports = ${JSON.stringify(abiObject, null, 4)}`)
}

main()