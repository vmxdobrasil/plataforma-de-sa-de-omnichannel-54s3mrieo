import pb from '@/lib/pocketbase/client'

export const getSplitConfig = async () => {
  try {
    return await pb.collection('configuracoes_split').getFirstListItem('is_active = true')
  } catch {
    return null
  }
}

export const updateSplitConfig = async (
  id: string,
  data: {
    default_commission?: number
    consultation_percentage?: number
    exam_percentage?: number
    pharmacy_percentage?: number
    is_active?: boolean
  },
) => {
  return await pb.collection('configuracoes_split').update(id, data)
}

export const createSplitConfig = async (data: {
  default_commission: number
  consultation_percentage: number
  exam_percentage: number
  pharmacy_percentage: number
  is_active: boolean
}) => {
  return await pb.collection('configuracoes_split').create(data)
}
