import { useState, useEffect } from 'react'
import './App.css'
import { sequence } from './config.ts'
import { ethers } from 'ethers'

function App() {

  const [awaitingEmailCodeInput, setAwaitingEmailCodeInput] = useState(false)
  const [walletAddress, setWalletAddress] = useState<any>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [otpAnswer, setOtpAnswer] = useState<string>('')
  const [respondWithCode, setRespondWithCode] = useState<((code: string) => Promise<void>) | null>()
  const [isTransactionInProgress, setIsTransactionInProgress] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [transactionError, setTransactionError] = useState<string | null>(null)

  const signIn = async () => {
    setAwaitingEmailCodeInput(true)
    setEmail('')

    console.log('signing in')

    if(!awaitingEmailCodeInput){
      // We're ignoring password validation as per requirement to accept any password
      // but still passing the email to the sequence signIn
      const emailResponse = await sequence.signIn({ email }, 'Email Waas Auth')
      console.log(emailResponse)
      setWalletAddress(emailResponse.wallet)
      setOtpAnswer('') // Reset OTP answer after successful authentication
    }
  }

  const signOut = async () => {
    setWalletAddress(null)
    setAwaitingEmailCodeInput(false)
    setEmail('')
    setPassword('')
    setOtpAnswer('') // Reset OTP answer when signing out
    setTransactionHash(null)
    setTransactionError(null)
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
    } else{
      setOtpAnswer(input)
    }
  }

  const setPasswordInput = (input: any) => {
    setPassword(input)
  }

  const sendTransaction = async () => {
    if (!walletAddress) return
    
    try {
      setTransactionError(null)
      setTransactionHash(null)
      setIsTransactionInProgress(true)
      
      // Send transaction with 0 value to the authenticated wallet
      const tx = await sequence.sendTransaction({
        transactions: [
          {
            to: walletAddress,
            value: ethers.parseEther("0") // 0 value transaction
          }
        ]
      })

      console.log('Transaction response:', tx)
      
      // Check transaction response based on Sequence WaaS SDK structure
      if (tx && tx.data && tx.data.txHash) {
        setTransactionHash(tx.data.txHash)
      } else if (tx && tx.data && tx.data.error) {
        setTransactionError(tx.data.error)
      } else {
        setTransactionError('Unknown error occurred')
      }
    } catch (e) {
      console.error('Transaction error:', e)
      setTransactionError(e instanceof Error ? e.message : 'Unknown error occurred')
    } finally {
      setIsTransactionInProgress(false)
    }
  }

  useEffect(() => {
      sequence.onEmailAuthCodeRequired(async respondWithCode => {
        setRespondWithCode(() => respondWithCode)
      })
  }, [otpAnswer, setRespondWithCode])

  useEffect(() => {
    setTimeout(async ()=> {
      if(Number.isInteger(Number(otpAnswer)) && respondWithCode && otpAnswer.length == 6) {
        console.log(otpAnswer)
        try {
          await respondWithCode(otpAnswer!)
          setOtpAnswer('') // Reset OTP after successful verification
        }catch(err){
          console.log(err)
        }
      }
    })
  }, [otpAnswer])

  return (
    <>
      <h1>Username / Password Authentication Flow</h1>

      {!walletAddress && !awaitingEmailCodeInput && (
        <div className="login-container">
          <h2>Use your email & password:</h2>
          <div className="login-form">
            <input 
              type="email"
              value={email} 
              onChange={(evt: any) => setEmailInput(evt.target.value)} 
              className='login-input'
              placeholder="Email"
            />
            <input 
              type="password"
              value={password} 
              onChange={(evt: any) => setPasswordInput(evt.target.value)} 
              className='login-input'
              placeholder="Password"
            />
            <button className="login-button" onClick={() => signIn()}>LET'S GO!</button>
          </div>
        </div>
      )}

      {!walletAddress && awaitingEmailCodeInput && (
        <div className="wallet-container">
          <h2>Enter Verification Code</h2>
          <div className="login-form">
            <input 
              value={otpAnswer} 
              onChange={(evt: any) => setEmailInput(evt.target.value)} 
              className="login-input"
              placeholder="Enter your OTP"
            />
          </div>
        </div>
      )}
      
      {/* wallet address and sign out */}
      {walletAddress && (
        <div className="wallet-container">
          <h2>Your Wallet</h2>
          <div className="wallet-info">
            <div className="wallet-field">
              <label className="wallet-label">Wallet Address:</label>
              <span className="wallet-address">{walletAddress}</span>
            </div>
            
            <button 
              className="login-button" 
              onClick={sendTransaction}
              disabled={isTransactionInProgress}
            >
              {isTransactionInProgress ? 'SENDING...' : 'SEND TRANSACTION'}
            </button>
            
            {transactionHash && (
              <div className="transaction-success">
                <span className="transaction-label">Transaction Successful:</span>
                <div className="transaction-hash-container">
                  <span className="transaction-hash">{transactionHash}</span>
                  <a 
                    href={`https://explorer.testnet.immutable.com/tx/${transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="explorer-link"
                  >
                    View on Immutable Explorer
                  </a>
                </div>
              </div>
            )}
            
            {transactionError && (
              <div className="transaction-error">
                <span className="transaction-label">Transaction Failed:</span>
                <span className="error-message">{transactionError}</span>
              </div>
            )}
            
            <button className="login-button logout-button" onClick={() => signOut()}>SIGN OUT</button>
          </div>
        </div>
      )}
    </>
  )
}

export default App