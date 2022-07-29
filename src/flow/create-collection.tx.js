export const CREATE_COLLECTION = `
import DappyCollection from 0xDappy
transaction {
    prepare(acct: AuthAccount) {
        let collection <- DappyCollection.createEmptyCollection()
        acct.save<@DappyCollection.Collection>(<- collection, to: DappyCollection.CollectionStoragePath)
        acct.link<&DappyCollection.Collection{DappyCollection.CollectionPublic,DappyCollection.Provider,DappyCollection.Receiver}>(DappyCollection.CollectionPublicPath, target: DappyCollection.CollectionStoragePath)
    }
}
`