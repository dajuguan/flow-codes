export const CHECK_BALANCE = `
import BasicToken from 0xToken
pub fun main(addr:Address):UFix64 {
    let acctRef = getAccount(addr).getCapability(/public/BasicTokenVault).borrow<&BasicToken.Vault>() ?? panic("Coult not borrow TokenContract")
    log(acctRef.balance)
    return acctRef.balance
}
`