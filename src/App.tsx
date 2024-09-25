import { useState, useEffect } from 'react'
import './App.css'
import { sequence } from './config.ts'

function App() {

  const [awaitingEmailCodeInput, setAwaitingEmailCodeInput] = useState(false)
  const [walletAddress, setWalletAddress] = useState<any>('')
  const [email, setEmail] = useState<any>('')
  const [otpAnswer, setOtpAnswer] = useState<any>('')
  const [respondWithCode, setRespondWithCode] = useState<((code: string) => Promise<void>) | null>()

  const signIn = async () => {
    setAwaitingEmailCodeInput(true)
    setEmail('')

    if(!awaitingEmailCodeInput){
      const emailResponse = await sequence.signIn({ email }, 'Email Waas Auth')
      console.log(emailResponse)
      setWalletAddress(emailResponse.wallet)
    }
  }

  const signOut = async () => {
    setWalletAddress(null)
    setAwaitingEmailCodeInput(false)
    setEmail(null)
    try {
      const sessions = await sequence.listSessions()
      await sequence.dropSession({ sessionId: sessions[0].id })
    }catch(err){
      console.log(err)
    }
  }

  const setEmailInput = (input: any) => {
    if(!awaitingEmailCodeInput){
      setEmail(input)
    } else {
      setOtpAnswer(input)
    }
  }

  useEffect(() => {
      sequence.onEmailAuthCodeRequired(async respondWithCode => {
        setRespondWithCode(() => respondWithCode)
      })
  }, [otpAnswer, setRespondWithCode])

  useEffect(() => {
    setTimeout(async ()=> {
      if(Number.isInteger(Number(otpAnswer)) && respondWithCode) {
        console.log(otpAnswer)
        await respondWithCode(otpAnswer!)
      }
    })
  }, [otpAnswer])

  return (
    <>
      <h1>Email WaaS Auth</h1>

      {/* email / code input */}
      {! walletAddress && <input value={awaitingEmailCodeInput ? otpAnswer : email!} onChange={(evt: any) => setEmailInput(evt.target.value!)} className='email-code' placeholder={!awaitingEmailCodeInput ? 'email' : 'email code'}></input> }
      
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