import pb from '@/lib/pocketbase/client'

export const getDocuments = async (userId: string, sort: string = '-created') => {
  return pb.collection('documents').getFullList({
    filter: `patient_id = "${userId}" || professional_id = "${userId}"`,
    sort,
    expand: 'patient_id,professional_id,appointment_id',
  })
}

export const getRecentDocuments = async (userId: string) => {
  return pb
    .collection('documents')
    .getList(1, 5, {
      filter: `patient_id = "${userId}" || professional_id = "${userId}"`,
      sort: '-created',
      expand: 'patient_id,professional_id,appointment_id',
    })
    .then((res) => res.items)
}

export const uploadDocument = async (formData: FormData) => {
  return pb.collection('documents').create(formData)
}

export const deleteDocument = async (id: string) => {
  return pb.collection('documents').delete(id)
}
