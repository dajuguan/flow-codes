export const DELETE_COLLECTION = `
import DappyCollection from 0xDappy
transaction {
    prepare(acct: AuthAccount) {
        let collection <- acct.load<@DappyCollection.Collection>(from: DappyCollection.CollectionStoragePath)
        destroy collection
        acct.unlink(DappyCollection.CollectionPublicPath)
    }
}
`