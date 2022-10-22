import { useMemo } from 'react'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useBridgeContract, useSwapBTCContract, useSwapETHContract } from 'hooks/useContract'
import { useBridgeOutputValue, useBridgeState } from 'state/bridge/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useCurrencyBalance, useETHBalances } from 'state/wallet/hooks'
import { isAddress } from 'utils'

const NOT_APPLICABLE = {
  execute: async () => {
    //
  },
  inputError: false,
}

export default function useBridgeCallback(
  inputAmount: string | undefined,
  inputToken: string | undefined,
  routerToken: string | undefined,
  isNative: boolean,
  toAddress: string | undefined | null,
) {
  const { execute: onRouterSwap, inputError: wrapInputErrorBridge } = useRouterSwap(
    routerToken,
    inputToken,
    inputAmount,
    isNative,
  )
  const { execute: onBridgeSwap, inputError: wrapInputErrorCrossBridge } = useBridgeSwap(
    toAddress,
    inputToken,
    inputAmount,
  )
  return useMemo(() => {
    return {
      execute: async (useSwapMethods: string) => {
        const isBridge =
          useSwapMethods.includes('transfer') ||
          useSwapMethods.includes('sendTransaction') ||
          useSwapMethods.includes('Swapout')
        return isBridge ? onBridgeSwap() : onRouterSwap(useSwapMethods)
      },
      inputError: wrapInputErrorBridge || wrapInputErrorCrossBridge,
    }
  }, [onBridgeSwap, onRouterSwap, wrapInputErrorBridge, wrapInputErrorCrossBridge])
}

function useRouterSwap(
  routerToken: string | undefined,
  inputToken: string | undefined,
  typedValue: string | undefined,
  isNative: boolean,
) {
  const [{ tokenOut, tokenIn, chainIdOut, currencyIn, currencyOut }] = useBridgeState()
  const outputInfo = useBridgeOutputValue(typedValue ?? '0')
  const { account, chainId } = useActiveWeb3React()
  const bridgeContract = useBridgeContract(isAddress(routerToken), chainIdOut && isNaN(chainIdOut) ? 'V2' : '')

  const ethBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const anyBalance = useCurrencyBalance(account ?? undefined, currencyIn)
  const balance = isNative ? ethBalance : anyBalance

  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn ?? undefined), [currencyIn, typedValue])
  const addTransactionWithType = useTransactionAdder()
  return useMemo(() => {
    if (!bridgeContract || !chainId || !tokenIn || !account || !chainIdOut) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)
    return {
      execute: async (useSwapMethods: string) => {
        console.log(useSwapMethods, tokenIn, tokenOut)
        let txHash = ''
        try {
          if (!sufficientBalance || !inputAmount) return Promise.reject('insufficient Balance')
          let promise
          const params = [inputToken, account, `0x${inputAmount.quotient.toString(16)}`, tokenOut?.chainId]
          if (useSwapMethods.includes('anySwapOutNative')) {
            promise = bridgeContract.anySwapOutNative(inputToken, account, tokenOut?.chainId, {
              value: `0x${inputAmount.quotient.toString(16)}`,
            })
          } else if (useSwapMethods.includes('anySwapOutUnderlying')) {
            promise = bridgeContract.anySwapOutUnderlying(...params)
          } else if (useSwapMethods.includes('anySwapOut')) {
            promise = bridgeContract.anySwapOut(...params)
          }

          let txReceipt
          if (promise) {
            txReceipt = await promise
          } else {
            return Promise.reject('router wrong method')
          }

          txHash = txReceipt?.hash
          if (txHash) {
            const from_network = NETWORKS_INFO[chainId].name
            const to_network = NETWORKS_INFO[chainIdOut].name
            addTransactionWithType(txReceipt, {
              type: 'Bridge',
              summary: `${inputAmount.toSignificant(6)} ${tokenIn.symbol} (${from_network}) to ${tryParseAmount(
                outputInfo.outputAmount.toString(),
                currencyOut ?? undefined,
              )?.toSignificant(6)} ${tokenOut?.symbol} (${to_network})`,
              arbitrary: {
                from_token: tokenIn?.symbol,
                to_token: tokenOut?.symbol,
                bridge_fee: outputInfo.fee,
                from_network,
                to_network,
                trade_qty: typedValue,
              },
            })
          }
          return txHash ?? ''
        } catch (error) {
          console.error('Could not swap', error)
          return Promise.reject(error || 'router unknown error')
        }
      },
      inputError: !sufficientBalance,
    }
  }, [
    outputInfo.fee,
    typedValue,
    bridgeContract,
    balance,
    chainId,
    inputAmount,
    inputToken,
    addTransactionWithType,
    tokenIn,
    account,
    chainIdOut,
    tokenOut,
    currencyOut,
    outputInfo.outputAmount,
  ])
}

function useBridgeSwap(
  toAddress: string | undefined | null,
  inputToken: string | undefined,
  typedValue: string | undefined,
) {
  const [{ tokenOut, chainIdOut, tokenIn, currencyIn, currencyOut }] = useBridgeState()
  const addTransactionWithType = useTransactionAdder()
  const outputInfo = useBridgeOutputValue(typedValue ?? '0')
  const { chainId, account, library } = useActiveWeb3React()

  const tokenBalance = useCurrencyBalance(account ?? undefined, currencyIn)
  const ethBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const balance = tokenIn && tokenIn?.tokenType !== 'NATIVE' ? tokenBalance : ethBalance

  const inputAmount = useMemo(() => tryParseAmount(typedValue, currencyIn), [currencyIn, typedValue])
  const contractBTC = useSwapBTCContract(isAddress(inputToken) ? inputToken : undefined)
  const contractETH = useSwapETHContract(isAddress(inputToken) ? inputToken : undefined)
  return useMemo(() => {
    if (!chainId || !toAddress || !chainIdOut || !library || !account) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    return {
      execute: async () => {
        try {
          if (!sufficientBalance || !inputAmount) return Promise.reject('insufficient balance')
          let txReceipt
          if (tokenOut?.type === 'swapin') {
            if (isAddress(inputToken) && tokenIn?.tokenType !== 'NATIVE') {
              if (contractETH) {
                txReceipt = await contractETH.transfer(toAddress, `0x${inputAmount.quotient.toString(16)}`)
              } else {
                return Promise.reject('not found contractETH')
              }
            } else {
              const data = {
                from: account,
                to: toAddress,
                value: `0x${inputAmount.quotient.toString(16)}`,
              }
              const hash = await library.send('eth_sendTransaction', [data])
              txReceipt = hash && hash.toString().indexOf('0x') === 0 ? { hash } : ''
            }
          } else {
            if (chainIdOut && isNaN(chainIdOut)) {
              if (contractBTC) {
                txReceipt = await contractBTC.Swapout(`0x${inputAmount.quotient.toString(16)}`, toAddress)
              } else {
                return Promise.reject('not found contractBTC')
              }
            } else {
              if (contractETH) {
                txReceipt = await contractETH.Swapout(`0x${inputAmount.quotient.toString(16)}`, toAddress)
              } else {
                Promise.reject('not found contractETH')
              }
            }
          }
          const txHash = txReceipt?.hash
          if (txHash) {
            const from_network = NETWORKS_INFO[chainId].name
            const to_network = NETWORKS_INFO[chainIdOut].name
            addTransactionWithType(txReceipt, {
              type: 'Bridge',
              summary: `${inputAmount.toSignificant(6)} ${tokenIn?.symbol} (${from_network}) to ${tryParseAmount(
                outputInfo.outputAmount.toString(),
                currencyOut ?? undefined,
              )?.toSignificant(6)} ${tokenOut?.symbol} (${to_network})`,
              arbitrary: {
                from_token: tokenIn?.symbol,
                to_token: tokenOut?.symbol,
                bridge_fee: outputInfo.fee,
                from_network,
                to_network,
                trade_qty: typedValue,
              },
            })
          }
          return txHash ?? ''
        } catch (error) {
          console.log('Could not swapout', error)
          return Promise.reject(error || 'bridge unknown error')
        }
      },
      inputError: !sufficientBalance,
    }
  }, [
    outputInfo.fee,
    typedValue,
    chainId,
    addTransactionWithType,
    tokenOut?.symbol,
    outputInfo.outputAmount,
    currencyOut,
    contractBTC,
    tokenOut?.type,
    contractETH,
    tokenIn,
    inputAmount,
    balance,
    account,
    toAddress,
    inputToken,
    chainIdOut,
    library,
  ])
}