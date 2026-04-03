import pb from '@/lib/pocketbase/client'

export const getProfessionals = async () => {
  return pb.collection('users').getFullList({
    filter: 'role = "professional"',
    sort: 'name',
  })
}

export const getUser = async (id: string) => {
  return pb.collection('users').getOne(id)
}
