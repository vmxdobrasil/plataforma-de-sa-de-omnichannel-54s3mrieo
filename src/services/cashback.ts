import pb from '@/lib/pocketbase/client'

export const getCashbackRules = async () => {
  return await pb.collection('regras_cashback').getFullList({ sort: 'category' })
}

export const updateCashbackRule = async (
  id: string,
  data: {
    percentage?: number
    is_active?: boolean
  },
) => {
  return await pb.collection('regras_cashback').update(id, data)
}

export const getCashbackHistory = async (userId: string) => {
  return await pb.collection('loyalty_points_history').getFullList({
    filter: `user_id = "${userId}" && reason = 'cashback'`,
    sort: '-created',
  })
}

export const getPointsValue = (points: number) => points / 100

export const redeemPoints = async (userId: string, pointsToRedeem: number) => {
  return await pb.send('/backend/v1/points/redeem', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, points: pointsToRedeem }),
    headers: { 'Content-Type': 'application/json' },
  })
}
