import { Trans } from '@lingui/macro'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import React from 'react'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import { SUPPORTED_WALLET, SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React } from 'hooks'
import { useIsAcceptedTerm, useIsDarkMode } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { isEVMWallet, isOverriddenWallet, isSolanaWallet } from 'utils'
import checkForBraveBrowser from 'utils/checkForBraveBrowser'

import { C98OverrideGuide } from './WarningBox'

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  transition: all 0.2s;

  & > img,
  span {
    height: 20px;
    width: 20px;
  }
  ${({ theme }) => theme.mediaWidth.upToMedium`
    align-items: flex-end;
  `};
`

const HeaderText = styled.div`
  ${({ theme }) => theme.flexRowNoWrap};
  color: ${({ theme }) => theme.subText};
  font-size: 12px;
  font-weight: 500;
`

const OptionCardClickable = styled.button<{
  connected: boolean
  installLink?: string
  isDisabled: boolean
  isCorrectChain: boolean
  overridden: boolean
}>`
  width: 100%;
  border: 1px solid transparent;
  border-radius: 42px;
  &:nth-child(2n) {
    margin-right: 0;
  }
  padding: 0;
  display: flex;
  gap: 4px;
  flex-direction: row;
  align-items: center;
  margin-top: 2rem;
  margin-top: 0;
  padding: 10px 8px;
  transition: all 0.2s;
  background-color: ${({ theme }) => theme.buttonBlack};

  cursor: ${({ isDisabled, installLink, overridden }) =>
    !isDisabled && !installLink && !overridden ? 'pointer' : 'not-allowed'};

  ${({ isCorrectChain, connected, theme }) =>
    isCorrectChain && connected
      ? `
      background-color: ${theme.primary};
      & ${HeaderText} {
        color: ${theme.darkText} !important;
      }
    `
      : ''}

  &:hover {
    text-decoration: none;
    ${({ installLink, isDisabled, overridden, theme }) =>
      installLink || isDisabled || overridden ? '' : `border: 1px solid ${theme.primary};`}
  }

  ${({ isCorrectChain, installLink, overridden, theme }) =>
    isCorrectChain && (installLink || overridden)
      ? `
      filter: grayscale(100%);
      & ${HeaderText} {
        color: ${theme.border};
      }
    `
      : ''}

  opacity: ${({ isDisabled }) => (isDisabled ? '0.5' : '1')};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    margin: 0 0 8px 0;
  `};
`

const OptionCardLeft = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap};
  justify-content: center;
  height: 100%;
`

const StyledLink = styled(ExternalLink)`
  width: 100%;
  &:hover {
    text-decoration: none;
  }
`

const Option = ({
  walletKey,
  readyState,
  isSupportCurrentChain,
  onSelected,
}: {
  walletKey: SUPPORTED_WALLET
  isSupportCurrentChain: boolean
  readyState?: WalletReadyState
  onSelected?: (walletKey: SUPPORTED_WALLET) => any
}) => {
  const isDarkMode = useIsDarkMode()
  const { walletKey: walletKeyConnected, isEVM } = useActiveWeb3React()
  const isBraveBrowser = checkForBraveBrowser()
  const [isAcceptedTerm] = useIsAcceptedTerm()

  const wallet = SUPPORTED_WALLETS[walletKey]
  const isConnected = !!walletKeyConnected && walletKey === walletKeyConnected

  const overridden = isOverriddenWallet(walletKey)
  const installLink = readyState === WalletReadyState.NotDetected ? wallet.installLink : undefined
  const icon = isDarkMode ? wallet.icon : wallet.iconLight

  const content = (
    <OptionCardClickable
      id={`connect-${walletKey}`}
      onClick={
        onSelected &&
        !isConnected &&
        (readyState === WalletReadyState.Installed ||
          (readyState === WalletReadyState.Loadable && isSolanaWallet(wallet))) &&
        isAcceptedTerm &&
        isSupportCurrentChain &&
        !overridden &&
        !(walletKey === 'BRAVE' && !isBraveBrowser)
          ? () => onSelected(walletKey)
          : undefined
      }
      connected={isConnected}
      isDisabled={!isAcceptedTerm || !isSupportCurrentChain || (walletKey === 'COIN98' && !window.ethereum?.isCoin98)}
      installLink={installLink}
      overridden={overridden}
      isCorrectChain={isSupportCurrentChain}
    >
      <IconWrapper>
        <img src={icon} alt={'Icon'} />
      </IconWrapper>
      <OptionCardLeft>
        <HeaderText>{wallet.name}</HeaderText>
      </OptionCardLeft>
    </OptionCardClickable>
  )

  if (!isAcceptedTerm) return content

  if (readyState === WalletReadyState.Loadable && isEVMWallet(wallet) && wallet.href) {
    return (
      <MouseoverTooltip placement="top" text={<Trans>Install ${wallet.name} extension</Trans>}>
        <StyledLink href={wallet.href}>{content}</StyledLink>
      </MouseoverTooltip>
    )
  }

  if (!isSupportCurrentChain) {
    return (
      <MouseoverTooltip
        placement="top"
        text={<Trans>Please select another wallet that is {isEVM ? 'EVM' : 'Solana'} compatible</Trans>}
      >
        {content}
      </MouseoverTooltip>
    )
  }

  if (walletKey === 'BRAVE' && !isBraveBrowser) {
    return (
      <MouseoverTooltip
        placement="top"
        text={
          <Trans>
            Brave wallet can only be used in Brave Browser. Download it{' '}
            <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
          </Trans>
        }
      >
        {content}
      </MouseoverTooltip>
    )
  }
  if (overridden) {
    return (
      <MouseoverTooltip
        width="500px"
        text={
          walletKey === 'COIN98' ? (
            <Trans>
              You need to enable <b>&quot;Override Wallet&quot;</b> in Coin98 settings.
            </Trans>
          ) : (
            <C98OverrideGuide walletKey={walletKey} />
          )
        }
        placement="top"
      >
        {content}
      </MouseoverTooltip>
    )
  }

  if (readyState === WalletReadyState.NotDetected) {
    return (
      <MouseoverTooltip
        placement="top"
        text={
          <Trans>
            You will need to install {wallet.name} extension/dapp before you can connect with it on KyberSwap. Get it{' '}
            <ExternalLink href={wallet.installLink || ''}>here↗</ExternalLink>
          </Trans>
        }
      >
        {content}
      </MouseoverTooltip>
    )
  }

  return (
    <MouseoverTooltip placement="top" text={<Trans>Switch to {wallet.name} wallet</Trans>}>
      {content}
    </MouseoverTooltip>
  )
}

export default React.memo(Option)
