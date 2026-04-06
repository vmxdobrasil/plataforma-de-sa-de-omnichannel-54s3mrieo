import pb from '@/lib/pocketbase/client'

export const getUnreadNotifications = async (userId: string) => {
  return pb.collection('messages').getFullList({
    filter: `receiver_id = "${userId}" && is_read = false`,
    sort: '-created',
  })
}

export const markAsRead = async (id: string) => {
  return pb.collection('messages').update(id, { is_read: true })
}
