export const CHECK_COLLECTION = `
    import DappyCollection from 0xDappy
    pub fun main(addr:Address):Bool{
    let ref = getAccount(addr).getCapability<&{DappyCollection.CollectionPublic}>(DappyCollection.CollectionPublicPath).check()
    return ref
    }
    `