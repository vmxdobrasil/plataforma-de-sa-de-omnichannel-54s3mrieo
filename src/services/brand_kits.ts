import pb from '@/lib/pocketbase/client'
import type { RecordModel } from 'pocketbase'

export const getBrandKit = async (userId: string): Promise<RecordModel | null> => {
  try {
    return await pb.collection('brand_kits').getFirstListItem(`user_id="${userId}"`)
  } catch (error) {
    return null
  }
}

export const saveBrandKit = async (
  userId: string,
  data: FormData | Record<string, any>,
  existingId?: string,
) => {
  if (existingId) {
    return await pb.collection('brand_kits').update(existingId, data)
  } else {
    if (data instanceof FormData) {
      data.append('user_id', userId)
    } else {
      data.user_id = userId
    }
    return await pb.collection('brand_kits').create(data)
  }
}
