import pb from '@/lib/pocketbase/client'

export const getCampaigns = () => pb.collection('campaigns').getFullList({ sort: '-created' })

export const createCampaign = (data: {
  name: string
  slug: string
  source?: string
  medium?: string
}) => pb.collection('campaigns').create(data)

export const deleteCampaign = (id: string) => pb.collection('campaigns').delete(id)

export const trackVisit = (data: {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  origin?: string
  referral_code?: string
}) =>
  pb.send('/backend/v1/track-visit', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })

export const validateReferralCode = (code: string) =>
  pb.send(`/backend/v1/validate-referral/${code}`, { method: 'GET' })
