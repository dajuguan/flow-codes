import React from 'react'

import useDappyTemplates from '../hooks/use-dappy-templates.hook'
import DappyList from '../components/DappyList'
import Header from '../components/Header'
import ErrorLoadingRenderer from '../components/ErrorLoadingRenderer'
import { useAuth } from '../providers/AuthProvider'
import { mutate, tx } from '@onflow/fcl'
import { CREATE_TEMPLATE } from '../flow/create-template.tx'
import { createRandomDappies } from '../utils/dappies.utils'

export default function Dappies() {
  const { data: dappyTemplates, loading, error } = useDappyTemplates()
  const {user} = useAuth()

  const addnewTemplate = async()=> {
    try{
      let dappy = createRandomDappies()[0]
      let txID = await mutate({
        cadence:CREATE_TEMPLATE,
        args:(arg,t)=>[arg(dappy.dna, t.String), arg(dappy.name, t.String)]
      })
      console.log("txID:",txID)
      let txStatus = await tx(txID).onceSealed()
      console.log(txStatus)
    } catch(err){
      console.error(err)
    }
  }
  return (
    <>
      <Header
        title={<><span className="highlight">Dappy</span>Store</>}
        subtitle={<>Buy individual <span className="highlight">dappies</span> in our store</>}
      />
      <ErrorLoadingRenderer loading={loading} error={error}>
        <DappyList dappies={dappyTemplates} store />
      </ErrorLoadingRenderer>
      {
      user.addr == process.env.REACT_APP_DAPPY_CONTRACT ?
        <button onClick={addnewTemplate}> Add new Template</button>:null
      }
    </>
  )
}
