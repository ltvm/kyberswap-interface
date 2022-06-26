import React, { useState } from 'react'
import styled from 'styled-components'
import { SectionTitle, SectionWrapper } from './styled'
import { Trans, t } from '@lingui/macro'
import { Flex, Box } from 'rebass'
import useTheme from 'hooks/useTheme'
import { MouseoverTooltip } from 'components/Tooltip'
import { ButtonOutlined, ButtonPrimary } from 'components/Button'
import DollarSignInCircle from 'components/Icons/DollarSignInCircle'
import MultiUser from 'components/Icons/MultiUser'
import DotInCircle from 'components/Icons/DotInCircle'
import greenBackground from 'assets/images/luxury-green-background.jpg'
import { useMedia } from 'react-use'

const TokenLabel = styled.div`
  font-size: 24px;
  line-height: 28px;
`

const USDLabel = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
  line-height: 20px;
  margin-top: 8px;
`

const CardWrapper = styled(Box)<{ hasGreenBackground?: boolean }>`
  background: ${({ theme }) => theme.background};
  border-radius: 20px;
  height: 140px;
  padding: 20px;
  ${({ hasGreenBackground }) => hasGreenBackground && `background-image: url(${greenBackground});`}
  background-size: 100% 100%;
  background-repeat: no-repeat;
  background-position: bottom;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    button {
      width: 100%;
      margin-top: 20px;
    }
  `}
`

const CardTitle = styled.div<{ backgroundImage?: any }>`
  font-size: 16px;
  padding-bottom: 4px;
  border-bottom: 1px dotted ${({ theme }) => theme.subText};
`

export default function DashboardSection() {
  const theme = useTheme()
  const [claimable, setClaimable] = useState(true)
  const above768 = useMedia('(min-width: 768px)')

  return (
    <SectionWrapper>
      <SectionTitle>
        <Trans>Dashboard</Trans>
      </SectionTitle>
      <Flex style={{ gap: '24px' }} flexDirection={above768 ? 'row' : 'column'}>
        <Flex style={{ gap: '24px' }} flex={6} order={above768 ? 1 : 2}>
          <CardWrapper flex={1}>
            <Flex marginBottom={'20px'} justifyContent={'space-between'}>
              <CardTitle>
                <MouseoverTooltip
                  placement="top"
                  width="234px"
                  size={12}
                  text={t`Your total earnings from referring new users to KyberSwap`}
                >
                  <Trans>Your Earnings</Trans>
                </MouseoverTooltip>
              </CardTitle>
              <DotInCircle size={20} color={theme.subText} />
            </Flex>
            <TokenLabel>0 KNC</TokenLabel>
            <USDLabel>$0</USDLabel>
          </CardWrapper>
          <CardWrapper flex={1}>
            <Flex marginBottom={'20px'} justifyContent={'space-between'}>
              <CardTitle>
                <MouseoverTooltip placement="top" size={12} text={t`Your total number of referrals to KyberSwap`}>
                  <Trans>Number of Referrals</Trans>
                </MouseoverTooltip>
              </CardTitle>
              <MultiUser size={20} color={theme.subText} />
            </Flex>
            <TokenLabel>0</TokenLabel>
          </CardWrapper>
        </Flex>
        <CardWrapper flex={4} hasGreenBackground={claimable} order={above768 ? 2 : 1}>
          <Flex marginBottom={'20px'} justifyContent={'space-between'}>
            <CardTitle>
              <MouseoverTooltip
                placement="top"
                width="290px"
                size={12}
                text={t`Rewards you can claim instantly. Note: You will have to switch to Polygon network to claim your rewards`}
              >
                <Trans>Your Claimable Rewards</Trans>
              </MouseoverTooltip>
            </CardTitle>
            <DollarSignInCircle size={20} color={claimable ? theme.primary : theme.subText} />
          </Flex>
          <Flex justifyContent={'space-between'} alignItems={'center'} flexDirection={above768 ? 'row' : 'column'}>
            <div>
              <TokenLabel>0 KNC</TokenLabel>
              <USDLabel>$0</USDLabel>
            </div>
            {claimable ? (
              <ButtonPrimary width={'104px'} height={'44px'}>
                <Trans>Claim</Trans>
              </ButtonPrimary>
            ) : (
              <ButtonOutlined disabled width={'104px'} height={'44px'}>
                <Trans>Claim</Trans>
              </ButtonOutlined>
            )}
          </Flex>
        </CardWrapper>
      </Flex>
    </SectionWrapper>
  )
}