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

export const updateUser = async (id: string, data: any) => {
  return pb.collection('users').update(id, data)
}

export const getDependents = async (parentId: string) => {
  return pb.collection('users').getFullList({
    filter: `parent_id = "${parentId}"`,
    sort: 'name',
  })
}
