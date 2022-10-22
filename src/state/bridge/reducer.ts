import { ChainId } from '@kyberswap/ks-sdk-core'
import { createReducer } from '@reduxjs/toolkit'

import { MultiChainTokenInfo } from 'pages/Bridge/type'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'

import { resetBridgeState, setBridgePoolInfo, setBridgeState } from './actions'

export type PoolValueOutMap = { [address: string]: string | number }
export interface BridgeState {
  tokenIn: MultiChainTokenInfo | undefined
  tokenOut: MultiChainTokenInfo | undefined
  currencyIn: WrappedTokenInfo | undefined
  currencyOut: WrappedTokenInfo | undefined

  chainIdOut: ChainId | undefined
  listChainIn: ChainId[]
  listTokenIn: WrappedTokenInfo[]
  listTokenOut: WrappedTokenInfo[]
  loadingToken: boolean

  poolValueOut: PoolValueOutMap
}

const DEFAULT_STATE: BridgeState = {
  tokenIn: undefined,
  tokenOut: undefined,
  currencyIn: undefined,
  currencyOut: undefined,

  chainIdOut: undefined,
  listTokenIn: [],
  listChainIn: [],
  listTokenOut: [],
  loadingToken: true,

  poolValueOut: {},
}

export default createReducer(DEFAULT_STATE, builder =>
  builder
    .addCase(
      setBridgeState,
      (state, { payload: { tokenIn, tokenOut, chainIdOut, listChainIn, listTokenIn, listTokenOut, loadingToken } }) => {
        if (tokenIn !== undefined) {
          state.tokenIn = tokenIn?.multichainInfo
          state.currencyIn = tokenIn
        }
        if (tokenOut !== undefined) {
          state.tokenOut = tokenOut?.multichainInfo
          state.currencyOut = tokenOut
        }

        if (chainIdOut !== undefined) state.chainIdOut = chainIdOut
        if (listChainIn !== undefined) state.listChainIn = listChainIn
        if (listTokenIn !== undefined) state.listTokenIn = listTokenIn
        if (listTokenOut !== undefined) state.listTokenOut = listTokenOut
        if (loadingToken !== undefined) state.loadingToken = loadingToken
      },
    )
    .addCase(setBridgePoolInfo, (state, { payload: { poolValueOut } }) => {
      state.poolValueOut = poolValueOut
    })
    .addCase(resetBridgeState, state => {
      state.tokenIn = undefined
      state.tokenOut = undefined
      state.currencyIn = undefined
      state.currencyOut = undefined
      state.chainIdOut = undefined
      state.listTokenIn = []
      state.listTokenOut = []
    }),
)
