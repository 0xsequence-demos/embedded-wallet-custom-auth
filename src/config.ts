import { SequenceWaaS } from '@0xsequence/waas'

export const projectAccessKey = import.meta.env.VITE_PROJECT_ACCESS_KEY
export const waasConfigKey = import.meta.env.VITE_WAAS_CONFIG_KEY

export const sequence = new SequenceWaaS({
  projectAccessKey: projectAccessKey,
  waasConfigKey: waasConfigKey,
  network: 'immutable-zkevm-testnet'
})