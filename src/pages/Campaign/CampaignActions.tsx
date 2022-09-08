/**
 * These actions are: Enter Now -> Swap Now -> Claim
 */
import { useSelector } from 'react-redux'

import { BIG_INT_ZERO } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import useTemporaryClaimedRefsManager from 'hooks/campaigns/useTemporaryClaimedRefsManager'
import CampaignButtonEnterNow from 'pages/Campaign/CampaignButtonEnterNow'
import CampaignButtonWithOptions from 'pages/Campaign/CampaignButtonWithOptions'
import { AppState } from 'state'
import {
  CampaignData,
  CampaignLeaderboard,
  CampaignState,
  CampaignStatus,
  CampaignUserInfoStatus,
} from 'state/campaigns/actions'

type Size = 'small' | 'large'
export default function CampaignActions({
  campaign,
  leaderboard,
  size = 'large',
  hideWhenDisabled = false,
}: {
  campaign?: CampaignData
  leaderboard?: CampaignLeaderboard
  size?: Size
  hideWhenDisabled?: boolean
}) {
  const { account } = useActiveWeb3React()

  const { selectedCampaign, selectedCampaignLeaderboard } = useSelector((state: AppState) => state.campaigns)

  const campaignInfo = campaign || selectedCampaign
  const leaderboardInfo = leaderboard || selectedCampaignLeaderboard

  const [temporaryClaimedRefs, addTemporaryClaimedRefs] = useTemporaryClaimedRefsManager()

  if (!campaignInfo || !account || !leaderboardInfo) return null

  if (
    campaignInfo.status === CampaignStatus.ONGOING &&
    selectedCampaign?.userInfo?.status === CampaignUserInfoStatus.Ineligible
  ) {
    return <CampaignButtonEnterNow size={size} />
  }

  if (campaignInfo.status === CampaignStatus.UPCOMING) {
    return null
  }

  if (campaignInfo.status === CampaignStatus.ONGOING) {
    return <CampaignButtonWithOptions size={size} campaign={campaignInfo} type="swap_now" />
  }

  if (
    campaignInfo.status === CampaignStatus.ENDED &&
    (campaignInfo.campaignState === CampaignState.CampaignStateReady ||
      campaignInfo.campaignState === CampaignState.CampaignStateFinalizedLeaderboard)
  ) {
    return hideWhenDisabled ? null : (
      <CampaignButtonWithOptions size={size} campaign={campaignInfo} type="claim_rewards" disabled />
    )
  }

  if (campaignInfo.campaignState === CampaignState.CampaignStateDistributedRewards) {
    let isUserClaimedRewardsInThisCampaign = true
    if (leaderboardInfo?.rewards?.length) {
      leaderboardInfo.rewards.forEach(reward => {
        if (
          reward.rewardAmount.greaterThan(BIG_INT_ZERO) &&
          !reward.claimed &&
          !temporaryClaimedRefs.includes(reward.ref)
        ) {
          isUserClaimedRewardsInThisCampaign = false
        }
      })
    }

    return isUserClaimedRewardsInThisCampaign && hideWhenDisabled ? null : (
      <CampaignButtonWithOptions
        size={size}
        campaign={campaignInfo}
        type="claim_rewards"
        disabled={isUserClaimedRewardsInThisCampaign}
        addTemporaryClaimedRefs={addTemporaryClaimedRefs}
      />
    )
  }

  return null
}
