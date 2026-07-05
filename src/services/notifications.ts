import pb from '@/lib/pocketbase/client'

export const getNotificationLogs = async (page = 1, perPage = 50, recipientId?: string) => {
  const filter = recipientId ? `recipient_id = "${recipientId}"` : ''
  return pb.collection('notification_logs').getList(page, perPage, {
    filter,
    sort: '-created',
    expand: 'recipient_id',
  })
}

export const retryNotification = async (id: string) => {
  return pb.send(`/backend/v1/notifications/${id}/retry`, { method: 'POST' })
}

export const sendNotification = async (data: {
  template_slug: string
  recipient_id: string
  variables?: Record<string, string>
  priority?: string
}) => {
  return pb.send('/backend/v1/notifications/send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const getNotificationTemplates = async () => {
  return pb.collection('notification_templates').getFullList({
    filter: 'is_active = true',
  })
}
