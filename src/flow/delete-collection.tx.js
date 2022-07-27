export const DELETE_COLLECTION = `
import DappyContract from 0xDappy
transaction {
    prepare(acct: AuthAccount) {
        let collection <- acct.load<@DappyContract.Collection>(from: DappyContract.CollectionStoragePath)
        destroy collection
        acct.unlink(DappyContract.CollectionPublicPath)
    }
}
`