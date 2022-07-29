export const CREATE_TEMPLATE = `
import DappyCollection from 0xDappy
transaction(dna: String, name: String){
    prepare(acct:AuthAccount){
        let templateRef = acct.getCapability(DappyCollection.AdminPublicPath).borrow<&DappyCollection.Admin>() ?? panic("cannot borrow admin")
        templateRef.createTemplate(dna:dna,name:name)
    }
}
`
