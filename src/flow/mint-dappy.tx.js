export const MINT_DAPPY = `
import DappyCollection from 0xDappy
import BasicToken from 0xToken
transaction(templateID:UInt32,amount: UFix64) {
  prepare(acct:AuthAccount) {
      let vaultRef = acct.getCapability(/public/BasicTokenVault).borrow<&BasicToken.Vault>() ?? panic("cannot borrow")
      let newVault <- vaultRef.withdraw(amount:amount)
      let dappy <- DappyCollection.mintDappy(templateID: templateID, paymentVault: <-newVault)
      let collectionRef = acct.getCapability(DappyCollection.CollectionPublicPath).borrow<&DappyCollection.Collection{DappyCollection.Receiver}>() ?? panic("cannot borrow collection")
      collectionRef.deposit(token:<-dappy)
  }
  execute{
  }
}
`