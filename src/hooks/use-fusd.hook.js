import { mutate, query, tx } from '@onflow/fcl';
import { useEffect, useReducer } from 'react'
import { defaultReducer } from '../reducer/defaultReducer'
import { CHECK_BALANCE } from '../flow/check-balance.script';
import { CREATE_FUSDVAULT } from '../flow/create-fusdvault.tx';

export default function useFUSD(user) {
  console.log(user)
  const [state, dispatch] = useReducer(defaultReducer, {
    loading: true,
    error: false,
    data: null
  })

  useEffect(() => {
    getFUSDBalance();
    //eslint-disable-next-line 
  }, [])

  const getFUSDBalance = async () => {
    if (!user?.addr) return
    dispatch({ type: 'PROCESSING' })
    try {
      const checkBlance = async ()=> {
        try {
          let res = await query({
            cadence : CHECK_BALANCE,
            args:(arg, t)=> [arg(user?.addr, t.Address)]
          })
          console.log("user balance:",res)
          dispatch({ type: 'SUCCESS', payload: res})
        } catch {
          alert ('Please enable your FUSD')
        }
      }
      checkBlance()
    } catch (err) {
      dispatch({ type: 'ERROR' })
      console.log(err)
    }
  }

  const createFUSDVault = async()=> {
    let txId = await mutate({
      cadence:CREATE_FUSDVAULT
    })
    let txStatus = await tx(txId).onceExecuted()
    console.log("txStatus:", txStatus)
    await getFUSDBalance();
  }


  return {
    ...state,
    getFUSDBalance,
    createFUSDVault
  }
}
