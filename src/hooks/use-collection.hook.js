import { mutate, query, tx } from '@onflow/fcl'
import { useEffect, useState } from 'react'
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
        limit: 55
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

  return {
    loading,
    collection,
    createCollection,
    deleteCollection
  }
}
