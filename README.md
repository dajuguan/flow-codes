# flow-codes
learn flow with codes
项目的第一个大阶段的目标是实现一个NFT收藏品平台，最终的页面可以[参见这里](https://flow-codes.vercel.app/).

本课程假设开发者已经对前端开发，尤其是React框架已经很熟悉。

> 本次的目标是学习带参数的脚本和第一个交易脚本

# 带参数的脚本

目标是读取用户的Collection内容。这里面涉及到两个知识点：
1.在Cadence里面读取的权限实际上是通过Capability进行细粒度控制的(Solidity则是通过msg.sender)；
2.用户信息的读取可以使用FLow的`getAccount()` [API](https://docs.onflow.org/flow-go-sdk/#get-account)来实现

## 第一步将`user`信息传递到`use-collection`的hook里面
修改 `src\providers\UserProvider.js`:

```
import {useAuth} from "./AuthProvider"

const UserContext = createContext()

export default function UserProvider({ children }) {
  const {user} = useAuth()
  const { collection, createCollection, deleteCollection } = useCollection(user)
  ...
```

## 第二步创建查询的脚本，并执行

### 查询脚本构建
创建`src\flow\check-collection.script.js`脚本，其中`&{DappyContract.CollectionPublic}`表示查询结果的数据类型, `DappyContract.CollectionPublicPath`是`0xDappy`合约里面存储Collection的地址
> Flow里面的用户数据是存在个人的路径上面,如`public/DappyCollectionPublic`,它分为Public和Private路径，Public路径只能查询里面的资源而不能修改。这点和Solidity有很大的区别，他的数据都存放在公共的合约里面。
```
export const CHECK_COLLECTION = `
    import DappyContract from 0xDappy
    pub fun main(addr:Address):Bool{
    let ref = getAccount(addr).getCapability<&{DappyContract.CollectionPublic}>(DappyContract.CollectionPublicPath).check()
    return ref
    }
    `
```

### 执行交易
在`src\hooks\use-collection.hook.js`中添加如下脚本，查询登陆用户`user`的地址下是否有`Collection`：

```
import { CHECK_COLLECTION } from '../flow/check-collection.script'

export default function useCollection(user) {
  const [loading, setLoading] = useState(true)
  const [collection, setCollection] = useState(false)
  console.log(user)
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
        setLoading(false)
      } catch (err) {
        console.log(err)
        setLoading(false)
      }

    }
    checkCollection()
  }, [])
```
其中`args:(arg, t)`中的`arg`是参数，`t`则是参数的类型，当查询到res为false的时候就说明带参数的合约执行没有问题了


# 第一个交易脚本
在本节我们会添加和删除一个Colletion
## 添加Collection
这里会用到FCL的交易[相关API](https://docs.onflow.org/fcl/reference/transactions/#authorizing-a-transaction)。交易api为`mutate`合约语法与`query`不同的地方在于，交易提供了`prepare`这个函数用来获取授权的用户信息上下文(类似于msg.sender),同时可以在交易中更改合约的状态，这点在脚本中是无法做到的。

首先创建`src\flow\create-collection.tx.js`脚本，这里我们`tx`作为第二个后缀以区分脚本和交易。
```
export const CREATE_COLLECTION = `
import DappyContract from 0xDappy
transaction {
    prepare(acct: AuthAccount) {
        let collection <- DappyContract.createEmptyCollection()
        acct.save<@DappyContract.Collection>(<- collection, to: DappyContract.CollectionStoragePath)
        acct.link<&{DappyContract.CollectionPublic}>(DappyContract.CollectionPublicPath, target: DappyContract.CollectionStoragePath)
    }
}
`
```

## 执行CreateCollection交易
在`src\hooks\use-collection.hook.js`中采用FCL的`mutate` API来执行交易，同时然后等待交易被打包之后更新交易状态。
> 需要注意的是需要设置`limit`来执行交易，这类似于以太坊的gas，limit设置值可以参考[文档](https://docs.onflow.org/concepts/variable-transaction-fees/#configuring-execution-limits)。
```
import { CREATE_COLLECTION } from '../flow/create-collection.tx'
...

  const createCollection = async () => {
    try {
      setLoading(true)
      let txId  = await mutate({
        cadence: CREATE_COLLECTION,
        limit: 55
      });
      console.log("tx id is:", txId)
      const txStatus = await tx(txId).onceSealed();  #等待交易打包
      console.log('tx status:',txStatus) // The transactions status and events after being sealed
      setCollection(true)
    } catch (err){
      console.error(err)
      setLoading(false)
    }
 
  }
```

## 删除collection
类似地创建`src\flow\delete-collection.tx.js`：

```
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
```

然后在`src\hooks\use-collection.hook.js`中采用FCL的`mutate` API来执行删除交易:

```
import { DELETE_COLLECTION } from '../flow/delete-collection.tx'
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

## Have fun!访问
访问http://localhost:3000/collection, 点击`enable colletion`后就能console下下面的交易id被打印出来，同时按钮也被变成`delete collection`。这个过程会很长，大概10秒，耐心等待。


# 运行

- Linux: `sh run.sh`
- Win: 在gitbash打开 `sh run.sh`

# 希望你能学会
- authenticate users with a blockchain wallet
- query blockchain data with scripts
- interact with smart contracts by using transactions
- write, test and deploy your own smart contracts
- and sell your own digital assets by integrate easy payment onramps and a marketplace to your application
