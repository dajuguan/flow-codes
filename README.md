# flow-codes
learn flow with codes
项目的第一个大阶段的目标是实现一个NFT收藏品平台，最终的页面可以[参见这里](https://flow-codes.vercel.app/).

本课程假设开发者已经对前端开发，尤其是React框架已经很熟悉。

> 本次的目标是学习NFT收藏品DappyCollection合约的创建。整体来看，合约的内容主要包括几个部分:
```
| var templates:{UInt32: Template}：用于存储所有的NFT模板
|- Template结构体：用于管理NFT模板的metadata
|- Admin资源：用于创建NFT
|- Dappy资源: 包含template数据和mintDappy函数，使用于可以mint
|- Collection资源: 
    |- var ownedDappies: @{UInt32: Dappy} 用于存储所有的Dappy NFT资源
    |- fun deposit(token: @Dappy) 用于接收NFT资源
    |- fun withdraw(dappyId: UInt32): @Dappy 用于取出NFT资源
    |- fun listDappys(): {UInt32: Template} 列出自己所有的NFT
```

# Template和Admin资源
## 合约实现
创建`cadence\contracts\DappyCollection.cdc`:
```
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

    
    init() {
        let temp1 = Template(_templateID: 0,  _name: "Angry Pat",_dna: "FF5A9D.FFE922.60C5E5.0", _price: 0.1)
        let temp2 = Template(_templateID: 1,  _name: "Happy Pat",_dna: "FD5A9D.FFE922.60C5E5.1", _price: 0.1)
        self.templates = {0:temp1, 1:temp2}
        self.nextTemplateID = 2

        self.AdminAddr = self.account.address
        self.AdminPublicPath =  /public/DappyCollectionContractAdmin
        self.AdminStoragePath = /storage/DappyCollectionContractAdmin
        self.account.save<@Admin>(<- create Admin(), to: self.AdminStoragePath)
        self.account.link<&Admin>(self.AdminPublicPath , target: self.AdminStoragePath)
    }
```
基本的思路就是：
1. 创建Template数据结构，并创建字典存储所有的templates，在init中初始化两个templates
2. 创建Admin资源，只有合约创建者才有权限createTemplate，且每次创建nextTemplateID+1

需要注意的是Cadence中字典中存储资源后整个字典也变成了资源，因此需要采用
> 由于Flow中合约增加变量是不允许更新的，只能删除合约重新部署，但目前测试网关闭了删除合约权限，所以等后文所有的合约写完后再部署！

## 前端读取
1. 创建`src\flow\list-dappy-template.script.js`，以读取所有的templates:
```
export const CREATE_TEMPLATE = `
import DappyCollection from 0xDappy
transaction(dna: String, name: String){
    prepare(acct:AuthAccount){
        let templateRef = acct.getCapability(DappyCollection.AdminPublicPath).borrow<&DappyCollection.Admin>() ?? panic("cannot borrow admin")
        templateRef.createTemplate(dna:dna,name:name)
    }
}
`
```
2. 
更改`src\hooks\use-dappy-templates.hook.js`读取所有的templates:
```
import {query} from "@onflow/fcl"

import {LISRT_DAPPY_TEMPLATES} from "../flow/list-dappy-template.script"

export default function useDappyTemplates() {
  const [state, dispatch] = useReducer(defaultReducer, { loading: false, error: false, data: [] })

  useEffect(() => {
    const fetchDappyTemplates = async () => {
      dispatch({ type: 'PROCESSING' })
      try {
        let res = await query({
          cadence: LISRT_DAPPY_TEMPLATES,
        })
        let mappedDappies = Object.values(res).map(d => {
          return new DappyClass(d?.templateID, d?.dna, d?.name, d?.price)
        })
        console.log(mappedDappies)
        dispatch({ type: 'SUCCESS', payload: mappedDappies })
      } catch (err) {
        dispatch({ type: 'ERROR' })
      }
    }
    fetchDappyTemplates()
  }, [])

  return state
}
```

# Dappy合约
Dappy合约需要用到`BasicToken`合约让用户付款，因此需要先引入[上节](https://github.com/dajuguan/flow-codes/tree/lesson-0x004)创建的合约.
```
import BasicToken from "./BasicToken.cdc"
pub contract DappyCollection {
    ...
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
```
 # Collection合约

 ## 合约实现
 对于每一个Dappy的NFT如果都需要存到一个地址会比较麻烦，并且其他人想给你发NFT接受起来也比较麻烦，所以在Flow中可通过Collection来管理。

 ```
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
        self.totalDappys = 0
        //self.account.save(<- BasicToken.createVault(), to:/storage/BasicTokenVault)
        //self.account.link<&BasicToken.Vault>( /public/BasicTokenVault,target:/storage/BasicTokenVault )

        self.CollectionPublicPath = /public/DappyCollectionContractPublicPath
        self.CollectionStoragePath = /storage/DappyCollectionContractStoragePath
        self.account.save(<- DappyCollection.createEmptyCollection(), to: DappyCollection.CollectionStoragePath) 
        self.account.link<&DappyCollection.Collection{CollectionPublic,Provider,Receiver}>(DappyCollection.CollectionPublicPath, target: DappyCollection.CollectionStoragePath)
    }
```

主要实现Collection的创建`createEmptyCollection`,以及对Dappy的存deposit、取withdraw和读取listDappies函数,并在自己的地址init存储和链接该Collection.

## 合约部署
至此所有的合约已经开发完毕。配置`flow.json`:
```
    ...
	"contracts": {
		"DappyCollection": "./cadence/contracts/DappyCollection.cdc",
		"BasicToken": {
			"source": "./cadence/contracts/BasicToken.cdc",
			"aliases": {
				"testnet": "0xe223d8a629e49c68"
			}
		},
        ...
```

配置`flow.testnet.json`:

```
  "deployments": {
    "testnet": {
      "testnet-account": [
        "DappyCollection",
        "BasicToken"
      ]
    }
  }
```
部署:
```
npm run deploy
```

## 前端代码-EnableCollection
对于没有创建Collection的用户，他是无法mint和接收Dappy的，所以需要先为其创建空的Collection资源。
创建`src\flow\create-collection.tx.js`:

```
export const CREATE_COLLECTION = `
import DappyCollection from 0xDappy
transaction {
    prepare(acct: AuthAccount) {
        let collection <- DappyCollection.createEmptyCollection()
        acct.save<@DappyCollection.Collection>(<- collection, to: DappyCollection.CollectionStoragePath)
        acct.link<&DappyCollection.Collection{DappyCollection.CollectionPublic,DappyCollection.Provider,DappyCollection.Receiver}>(DappyCollection.CollectionPublicPath, target: DappyCollection.CollectionStoragePath)
    }
}`
```

同样分别创建`src\flow\check-collection.script.js`读取Collection:

```
export const CHECK_COLLECTION = `
    import DappyCollection from 0xDappy
    pub fun main(addr:Address):Bool{
    let ref = getAccount(addr).getCapability<&{DappyCollection.CollectionPublic}>(DappyCollection.CollectionPublicPath).check()
    return ref
    }
    `
```

创建`src\flow\delete-collection.tx.js`删除Collection:

```
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
```

在Hook中创建、读取和销毁Collection的接口`src\hooks\use-collection.hook.js`:
```
import { CHECK_COLLECTION } from '../flow/check-collection.script'
import { CREATE_COLLECTION } from '../flow/create-collection.tx'
import { DELETE_COLLECTION } from '../flow/delete-collection.tx'

export default function useCollection(user) {
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState(false)
  useEffect( () => {
    setLoading(true)
    if (!user?.addr) return
    const checkCollection = async ()=>{
      try {
        let res = await query({
          cadence : CHECK_COLLECTION,
          args:(arg, t)=> [arg(user?.addr, t.Address)]
        })
        console.log(res)
        setCollection(res)
        setLoading(false)
      } catch (err) {
        console.log(err)
        setLoading(false)
      }
    }
    checkCollection()
  }, [])
  

  const createCollection = async () => {
    try {
      setLoading(true)
      let txId  = await mutate({
        cadence: CREATE_COLLECTION,
        limit: 75
      });
      console.log("tx id is:", txId)
      const txStatus = await tx(txId).onceSealed();
      console.log('tx status:',txStatus) // The transactions status and events after being sealed
      setCollection(true)
    } catch (err){
      console.error(err)
      setLoading(false)
    }
 
  }

  const deleteCollection = async () => {
    try {
      setLoading(true)
      let txId  = await mutate({
        cadence: DELETE_COLLECTION,
        limit: 75
      });
      console.log("tx id is:", txId)
      const txStatus = await tx(txId).onceSealed();
      console.log('tx status:',txStatus) // The transactions status and events after being sealed
      setCollection(false)
    } catch (err){
      console.error(err)
    }
    window.location.reload()
  }
  ```

## 前端代码-mintDappy和listDappies

创建`src\flow\mint-dappy.tx.js`：以允许mint
```
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
```

创建`src\flow\list-dappy.script.js`以显示所有购买的Dappy NFT:
```
export const LIST_DAPPIES = `
import DappyCollection from 0xDappy
pub fun main(addr:Address): {UInt32:DappyCollection.Template}{
    let acct = getAccount(addr)
    let collectionRef = acct.getCapability(DappyCollection.CollectionPublicPath).borrow<&DappyCollection.Collection{DappyCollection.CollectionPublic}>()?? panic("cannot borrow collection")
    let dappies = collectionRef.listDappys()
    return dappies
}
`
```

修改`src\hooks\use-user-dappies.hook.js`：
```
import { MINT_DAPPY } from '../flow/mint-dappy.tx'
import { LIST_DAPPIES } from '../flow/list-dappy.script'

export default function useUserDappies(user, collection, getFUSDBalance) {
  const [state, dispatch] = useReducer(userDappyReducer, {
    loading: false,
    error: false,
    data: []
  })

  useEffect(() => {
    const fetchUserDappies = async () => {
      console.log("fetching:")
      dispatch({ type: 'PROCESSING' })
      try {
        let res = await query({
          cadence: LIST_DAPPIES,
          args:(arg,t)=> [arg(user?.addr, t.Address)]
        })
        console.log("my dappies:", res)
        let mappedDappies = []
        for (let key in res){
          const el = res[key]
          let dappy = new DappyClass(
            el.templateID,
            el.dna,
            el.name,
            el.price
          )
          mappedDappies.push(dappy)
        }
        dispatch({ type: 'SUCCESS', payload: mappedDappies })
      } catch (err) {
        dispatch({ type: 'ERROR' })
      }
    }
    fetchUserDappies()
    //eslint-disable-next-line
  }, [])

  const mintDappy = async (templateID, amount) => {
    if(!collection) {
      alert("Please Go to Collection page, and enable the collection first!")
      return
    }
    try {
      let txID = await mutate({
        cadence:MINT_DAPPY,
        args:(arg,t) => [arg(templateID, t.UInt32),arg(amount, t.UFix64)]
      })
      console.log("txID:", txID)
      let txStatus = await tx(txID).onceSealed()
      console.log("txStatus:", txStatus)
      await getFUSDBalance();
      //await addDappy(templateID)
    } catch (error) {
      console.log(error)
    }
  }
  ...
```

## Have fun!访问
访问http://localhost:3000/, 玩玩上述实现的功能吧!
- 在Collection页面Enable Collection
- 在Dappies页面mint
- 刷新Collection页面就可以看到mint的Dappy了 


# 运行

- Linux: `sh run.sh`
- Win: 在gitbash打开 `sh run.sh`

# 希望你能学会
- authenticate users with a blockchain wallet
- query blockchain data with scripts
- interact with smart contracts by us
ing transactions
- write, test and deploy your own smart contracts
- and sell your own digital assets by integrate easy payment onramps and a marketplace to your application
