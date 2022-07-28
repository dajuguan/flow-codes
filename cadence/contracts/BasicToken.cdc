pub contract BasicToken {
    pub resource Vault {
        pub var balance: UFix64;
        init(_balance:UFix64){
            self.balance = _balance;
        }

        pub fun deposit(from:@Vault) {
            self.balance = self.balance + from.balance;
            destroy  from;
        }

        pub fun withdraw(amount: UFix64) : @Vault {
            self.balance = self.balance - amount
            return <- create Vault(_balance: amount)
        }
    }

    pub fun createVault(): @Vault{
        return <-create Vault(_balance: 30.0)
    }

    init(){
        self.account.save(<- self.createVault(), to:/storage/BasicTokenVault)
        self.account.link<&BasicToken.Vault>( /public/BasicTokenVault,target:/storage/BasicTokenVault )
    }
}