import pb from '@/lib/pocketbase/client'

export const getProducts = () => {
  return pb.collection('products').getFullList({ sort: 'category,name' })
}

export const getSubscriptions = (userId: string) => {
  return pb.collection('subscriptions').getFullList({
    filter: `user_id = "${userId}"`,
    expand: 'product_id',
  })
}

export const subscribeToProduct = (productId: string, userId: string) => {
  const validUntil = new Date()
  validUntil.setFullYear(validUntil.getFullYear() + 1)

  return pb.collection('subscriptions').create({
    user_id: userId,
    product_id: productId,
    status: 'active',
    valid_until: validUntil.toISOString(),
  })
}

export const getBrandKit = async (userId: string) => {
  try {
    return await pb.collection('brand_kits').getFirstListItem(`user_id="${userId}"`)
  } catch {
    return null
  }
}

export const saveBrandKit = async (userId: string, data: any) => {
  const existing = await getBrandKit(userId)
  if (existing) {
    return pb.collection('brand_kits').update(existing.id, data)
  } else {
    return pb.collection('brand_kits').create({ ...data, user_id: userId })
  }
}
