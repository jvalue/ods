import * as fs from 'fs'
import path from 'path'

async function deleteContracts (): Promise<void> {
  const contractsPath = path.resolve(process.cwd(), '..', 'pacts')
  const contractRegex = /^ui-.*[.]json$/

  fs.readdirSync(contractsPath)
    .filter(contractFile => contractRegex.test(contractFile))
    .map(matchedContractFile => fs.unlinkSync(path.resolve(contractsPath, matchedContractFile)))
}

export default deleteContracts
