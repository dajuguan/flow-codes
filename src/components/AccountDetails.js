import React, { useState } from 'react'

import { useAuth } from '../providers/AuthProvider'
import { useUser } from '../providers/UserProvider'
import './AccountDetails.css'
import { Modal } from "./Modal"

export default function Wallet() {
  const { user, logOut } = useAuth()
  const { balance, createFUSDVault } = useUser()
  const [open, changeOpen] = useState(false)

  return (
    <div className="wallet__popup">
      <div className="wallet__item">
        👛 {user?.addr}
      </div>
      {!balance ?
        <div className="btn btn-small" onClick={() => createFUSDVault()}>
          ⚠️ Enable FUSD
        </div>
        :
        <div className="wallet__item">
          💰 FUSD: {balance.slice(0, -6)}
          <button onClick={() => changeOpen(true)}>Transfer</button>
        </div>
      }
      <Modal
        user={user}
        message="Hello World!"
        isOpen={open}
        onClose={() => changeOpen(false)}
      />
      <div className="btn btn-small" onClick={() => logOut()}>👋 Logout</div>
    </div>
  )
}
