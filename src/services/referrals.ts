import pb from '@/lib/pocketbase/client'

export const getTopReferrers = async () => {
  const result = await pb.collection('users').getList(1, 20, {
    filter: 'referral_code != ""',
    sort: '-loyalty_points',
  })
  return result.items
}

export const getLandingVisitsCount = async () => {
  const result = await pb.collection('landing_visits').getList(1, 1)
  return result.totalItems
}
