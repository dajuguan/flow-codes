import { useEffect, useReducer } from 'react'
import { defaultReducer } from '../reducer/defaultReducer'
import DappyClass from '../utils/DappyClass'

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
