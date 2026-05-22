import pb from '@/lib/pocketbase/client'

export const createAsaasPayment = async (data: {
  amount: number
  billingType: string
  description: string
  transactionId?: string
  split?: { walletId: string; percentage: number }
  creditCard?: any
  creditCardHolderInfo?: any
}) => {
  return await pb.send('/backend/v1/asaas/pay', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
