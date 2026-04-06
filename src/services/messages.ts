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

export const getMessages = async (userId1?: string, userId2?: string) => {
  if (userId1 && userId2) {
    return pb.collection('messages').getFullList({
      filter: `(sender_id = "${userId1}" && receiver_id = "${userId2}") || (sender_id = "${userId2}" && receiver_id = "${userId1}")`,
      sort: 'created',
    })
  }
  return pb.collection('messages').getFullList({ sort: 'created' })
}

export const sendMessage = async (senderId: string, receiverId: string, content: string) => {
  return pb.collection('messages').create({
    sender_id: senderId,
    receiver_id: receiverId,
    content,
    is_read: false,
  })
}
