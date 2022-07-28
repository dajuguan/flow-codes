export const BASICTOKEN_TRANSFER = `
import BasicToken from 0xToken
transaction(to:Address,amount:UFix64) {
    prepare (acct: AuthAccount) {
        let vaultRef = acct.borrow<&BasicToken.Vault>(from: /storage/BasicTokenVault) ?? panic("Could not borrow account")
        let vault <- vaultRef.withdraw(amount:amount)
        let account2 = getAccount(to).getCapability(/public/BasicTokenVault).borrow<&BasicToken.Vault>()?? panic("Could not borrow account2")
        account2.deposit(from:<-vault)
    }
}
`