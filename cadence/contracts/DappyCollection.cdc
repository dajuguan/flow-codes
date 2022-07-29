import BasicToken from "./BasicToken.cdc"
pub contract DappyCollection {
    access(self) var templates:{UInt32: Template}

    pub var nextTemplateID: UInt32
    pub let AdminStoragePath:StoragePath
    pub let AdminPublicPath: PublicPath
    pub let AdminAddr: Address

//------------------------Template Start----------------------------------//
    pub struct Template {
        pub let templateID: UInt32
        pub let name:String
        pub let dna:String
        pub let price: UFix64
        init(_templateID: UInt32, _name:String, _dna:String, _price: UFix64) {
            self.templateID = _templateID
            self.name = _name
            self.dna = _dna
            self.price = _price
        }
    }

    pub resource Admin {
        pub fun createTemplate(dna: String, name: String): UInt32{
            pre {
                dna.length > 0 : "Could not create template: dna is required."
                name.length > 0 : "Could not create template: name is required."
            }
            let nextTemplateID = DappyCollection.nextTemplateID
            DappyCollection.templates[nextTemplateID] = Template(_templateID:nextTemplateID, _name: name, _dna:dna, _price: 0.500)
            DappyCollection.nextTemplateID = nextTemplateID + 1
            return nextTemplateID
        }
        pub fun destroyTemplate(dappyID: UInt32) {
            pre {
                DappyCollection.templates[dappyID] != nil : "Could not delete template: template does not exist."
            }
            DappyCollection.templates.remove(key: dappyID)
        }
    }

    pub fun listTemplates(): {UInt32: Template}{
        return self.templates
    }
//------------------------Template End----------------------------------//

//------------------------Dappy Start----------------------------------//
    pub var totalDappys: UInt32
    pub resource Dappy {
        pub let id: UInt32
        pub let data:Template
        init(templateID:UInt32) {
            pre {
                DappyCollection.templates[templateID] != nil : "Could not create Dappy: Template does not exist!"
            }
            let dappy = DappyCollection.templates[templateID]!
            DappyCollection.totalDappys = DappyCollection.totalDappys + 1
            self.id = DappyCollection.totalDappys
            self.data = dappy
        }
    }

    pub fun mintDappy(templateID: UInt32, paymentVault: @BasicToken.Vault): @Dappy{
        pre {
            DappyCollection.templates[templateID] != nil : "Could not mint Dappy: Template does not exist!"
            paymentVault.balance >= DappyCollection.templates[templateID]!.price : "Could not mint dappy: payment balance insufficient."
        }
        let vaultRef = getAccount(DappyCollection.AdminAddr).getCapability(/public/BasicTokenVault).borrow<&BasicToken.Vault>() ?? panic("Could not mint dappy:Admin vault is not valid")
        vaultRef.deposit(from:<-paymentVault)
        return <- create Dappy(templateID:templateID)
    }

//------------------------Dappy End----------------------------------//

//------------------------Collection Start----------------------------------//
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub resource interface CollectionPublic {
        pub fun deposit(token: @Dappy)
        pub fun listIDs(): [UInt32]
        pub fun listDappys(): {UInt32: Template}
    }

    pub resource interface Provider{
        pub fun withdraw(dappyId: UInt32): @Dappy
    }

    pub resource interface Receiver{
        pub fun deposit(token: @Dappy)
    }

    pub resource Collection: CollectionPublic,Provider,Receiver{
        pub var ownedDappies: @{UInt32: Dappy}
        pub fun withdraw(dappyId: UInt32): @Dappy {
            let token <- self.ownedDappies.remove(key: dappyId) ?? panic("Cannot withdraw: Dappy id does not exist")
            return <- token
        }

        pub fun deposit(token: @Dappy){
            let oldToken <- self.ownedDappies[token.id] <- token
            destroy  oldToken
        }
        
        pub fun listIDs(): [UInt32]{
            return self.ownedDappies.keys
        }

        pub fun listDappys(): {UInt32: Template}{
            var dappyTempplates: {UInt32: Template} = {}
            for key in self.ownedDappies.keys {
                let el = (&self.ownedDappies[key] as &Dappy?)!
                dappyTempplates.insert(key: el.id, el.data)
            }
            return dappyTempplates
        }

        init(){
            self.ownedDappies <- {}
        }

        destroy (){
            destroy self.ownedDappies
        }
    }

    pub fun createEmptyCollection(): @Collection{
        return <- create Collection()
    }

//------------------------Collection End----------------------------------//

    init() {
        let temp1 = Template(_templateID: 0,  _name: "Angry Pat",_dna: "FF5A9D.FFE922.60C5E5.0", _price: 0.1)
        let temp2 = Template(_templateID: 1,  _name: "Happy Pat",_dna: "FD5A9D.FFE922.60C5E5.1", _price: 0.1)
        self.templates = {0:temp1, 1:temp2}
        self.nextTemplateID = 2

        self.totalDappys = 0
        //self.account.save(<- BasicToken.createVault(), to:/storage/BasicTokenVault)
        //self.account.link<&BasicToken.Vault>( /public/BasicTokenVault,target:/storage/BasicTokenVault )

        self.CollectionPublicPath = /public/DappyCollectionContractPublicPath
        self.CollectionStoragePath = /storage/DappyCollectionContractStoragePath
        self.account.save(<- DappyCollection.createEmptyCollection(), to: DappyCollection.CollectionStoragePath) 
        self.account.link<&DappyCollection.Collection{CollectionPublic,Provider,Receiver}>(DappyCollection.CollectionPublicPath, target: DappyCollection.CollectionStoragePath)

        self.AdminAddr = self.account.address
        self.AdminPublicPath =  /public/DappyCollectionContractAdmin
        self.AdminStoragePath = /storage/DappyCollectionContractAdmin
        self.account.save<@Admin>(<- create Admin(), to: self.AdminStoragePath)
        self.account.link<&Admin>(self.AdminPublicPath , target: self.AdminStoragePath)
    }
    
}