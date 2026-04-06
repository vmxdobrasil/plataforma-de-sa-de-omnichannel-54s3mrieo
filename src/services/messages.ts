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

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string,
  file?: File,
) => {
  const formData = new FormData()
  formData.append('sender_id', senderId)
  formData.append('receiver_id', receiverId)
  formData.append('content', content)
  formData.append('is_read', 'false')
  if (file) {
    formData.append('file', file)
  }
  return pb.collection('messages').create(formData)
}
