import pb from '@/lib/pocketbase/client'

export const getMessages = async (userId: string, peerId: string) => {
  return pb.collection('messages').getFullList({
    filter: `(sender_id = "${userId}" && receiver_id = "${peerId}") || (sender_id = "${peerId}" && receiver_id = "${userId}")`,
    sort: 'created',
    expand: 'sender_id,receiver_id',
  })
}

export const sendMessage = async (data: {
  sender_id: string
  receiver_id: string
  content: string
}) => {
  return pb.collection('messages').create(data)
}

export const getUnreadNotifications = async (userId: string) => {
  return pb.collection('messages').getFullList({
    filter: `receiver_id = "${userId}" && is_read = false`,
    sort: '-created',
    expand: 'sender_id',
  })
}

export const markAsRead = async (messageId: string) => {
  return pb.collection('messages').update(messageId, { is_read: true })
}
