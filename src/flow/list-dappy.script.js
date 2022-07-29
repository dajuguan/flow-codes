export const LIST_DAPPIES = `
import DappyCollection from 0xDappy
pub fun main(addr:Address): {UInt32:DappyCollection.Template}{
    let acct = getAccount(addr)
    let collectionRef = acct.getCapability(DappyCollection.CollectionPublicPath).borrow<&DappyCollection.Collection{DappyCollection.CollectionPublic}>()?? panic("cannot borrow collection")
    let dappies = collectionRef.listDappys()
    return dappies
}
`