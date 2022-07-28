import { mutate, tx } from '@onflow/fcl';
import React, { useState ,useReducer} from 'react'
import ReactDOM from 'react-dom'
import { BASICTOKEN_TRANSFER } from '../flow/transfer.tx';

export const Modal = ({user, message, isOpen, onClose, children }) => {
    const [addr, setAddr] = useState()
    const [amount, setAmount] = useState()
    const [submitted, setSubmitted] = useState(false)
    const submitTx = async () => {
      setSubmitted(true)
      console.log(addr, amount)
      const _amount = parseFloat(amount).toFixed(6)
      try {
        let txId = await mutate({
          cadence:BASICTOKEN_TRANSFER,
          args:(arg,t)=>[arg(addr, t.Address), arg(_amount, t.UFix64)]
        })
        console.log("txId", txId)
        let txStatus = await tx(txId).onceFinalized()
        console.log('txStatus:', txStatus)
      } catch(err){
        console.error(err)
      }
      setSubmitted(false)
    }

    if (!isOpen) return null;
    return ReactDOM.createPortal(
      <div className="modal">
        <div>
          <input style={{"height":"50px", "fontSize": "20px","margin":"5px 5px"}} placeholder='destination account address' onChange={(e)=> setAddr(e.target.value)}/>
        </div>
        <div>
        <input style={{"height":"50px", "fontSize": "20px","margin":"5px 5px"}} placeholder='amount'  onChange={(e)=> setAmount(e.target.value)}/>
        </div>
        <button style={{"height":"50px", "fontSize": "20px","margin":"5px"}} onClick={submitTx} disabled={submitted}>Confirm</button>
        <button style={{"height":"50px", "fontSize": "20px","margin":"5px"}} onClick={onClose}>Close</button>
      </div>,
      document.getElementById("root")
    );
  };

