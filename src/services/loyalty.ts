import pb from '@/lib/pocketbase/client'

export const getLoyaltyHistory = (userId: string) =>
  pb.collection('loyalty_points_history').getFullList({
    filter: `user_id = "${userId}"`,
    sort: '-created',
  })

export const getAllLoyaltyHistory = () =>
  pb.collection('loyalty_points_history').getFullList({ sort: '-created' })
