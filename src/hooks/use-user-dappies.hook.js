import { useEffect, useReducer } from 'react'
import { userDappyReducer } from '../reducer/userDappyReducer'
import DappyClass from '../utils/DappyClass'
import { DEFAULT_DAPPIES } from '../config/dappies.config'
import { mutate, query, tx } from '@onflow/fcl'
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

  const addDappy = async (templateID) => {
    try {
      const dappy = DEFAULT_DAPPIES.find(d => d?.templateID === templateID)
      const newDappy = new DappyClass(dappy.templateID, dappy.dna, dappy.name)
      dispatch({ type: 'ADD', payload: newDappy })
    } catch (err) {
      console.log(err)
    }
  }

  const batchAddDappies = async (dappies) => {
    try {
      const allDappies = DEFAULT_DAPPIES
      const dappyToAdd = allDappies.filter(d => dappies.includes(d?.templateID))
      const newDappies = dappyToAdd.map(d => new DappyClass(d.templateID, d.dna, d.name))
      for (let index = 0; index < newDappies.length; index++) {
        const element = newDappies[index];
        dispatch({ type: 'ADD', payload: element })
      }
    } catch (err) {
      console.log(err)
    }
  }

  return {
    ...state,
    mintDappy,
    addDappy,
    batchAddDappies
  }
}
