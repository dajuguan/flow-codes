export const CREATE_FUSDVAULT = `
import BasicToken from 0xToken
transaction {
    prepare (acct: AuthAccount) {
        acct.save(<- BasicToken.createVault(), to:/storage/BasicTokenVault)
        acct.link<&BasicToken.Vault>( /public/BasicTokenVault,target:/storage/BasicTokenVault )
    }
}
`
