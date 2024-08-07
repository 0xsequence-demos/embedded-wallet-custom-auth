import { useState, useEffect } from 'react'
import './App.css'
import { sequence } from './config.ts'

function App() {

  const [awaitingEmailCodeInput, setAwaitingEmailCodeInput] = useState(false)
  const [walletAddress, setWalletAddress] = useState<any>('')
  const [email, setEmail] = useState<any>('')
  const [respondWithCode, setRespondWithCode] = useState<((code: string) => Promise<void>) | null>()

  const signIn = async () => {
    setAwaitingEmailCodeInput(true)
    setEmail('')

    if(!awaitingEmailCodeInput){
      const emailResponse = await sequence.signIn({ email }, 'Email Waas Auth')
      setWalletAddress(emailResponse.wallet)
    }
  }

  const signOut = async () => {
    setWalletAddress(null)
    setAwaitingEmailCodeInput(false)
    setEmail(null)
    try {
      const sessions = await sequence.listSessions()
      for(let i = 0; i < sessions.length; i++){
        await sequence.dropSession({ sessionId: sessions[i].id })
      }
    }catch(err){
      console.log(err)
    }
  }

  const setEmailInput = (input: any) => {
    setEmail(input)
  }

  useEffect(() => {
      return sequence.onEmailAuthCodeRequired(async respondWithCode => {
        setRespondWithCode(() => respondWithCode)
      })
  }, [email, setRespondWithCode])

  useEffect(() => {
    setTimeout(async ()=> {
      if(Number.isInteger(Number(email)) && respondWithCode) {
        await respondWithCode(email!)
      }
    })
  }, [email])

  return (
    <>
      <h1>Email WaaS Auth</h1>

      {/* email / code input */}
      {! walletAddress && <input value={email!} onChange={(evt: any) => setEmailInput(evt.target.value!)} className='email-code' placeholder={!awaitingEmailCodeInput ? 'email' : 'email code'}></input> }
      
      {/* email / code button */}
      {! walletAddress && <button onClick={() => signIn()}>{awaitingEmailCodeInput ? 'input code': 'sign in'}</button> }
      
      {/* wallet address */}
      { walletAddress && <span className={'wallet-address'}>{walletAddress}</span> }
      
      {/* sign out button */}
      { walletAddress && <button onClick={() => signOut()}>{'sign out'}</button> }
    </>
  )
}

export default App
