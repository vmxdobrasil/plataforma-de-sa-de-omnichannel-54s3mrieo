import pb from '@/lib/pocketbase/client'

export interface GenerateContentParams {
  topic: string
  specialty: string
  content_type: string
  tone: string
  audience?: string
}

export const generateContent = async (params: GenerateContentParams) => {
  return pb.send('/backend/v1/social-ai/generate', {
    method: 'POST',
    body: JSON.stringify(params),
    headers: { 'Content-Type': 'application/json' },
  })
}

export const saveGeneratedContent = async (data: any) => {
  return pb.collection('generated_content').create(data)
}

export const getGeneratedContent = async () => {
  return pb.collection('generated_content').getFullList({
    sort: '-created',
  })
}

export const deleteGeneratedContent = async (id: string) => {
  return pb.collection('generated_content').delete(id)
}
