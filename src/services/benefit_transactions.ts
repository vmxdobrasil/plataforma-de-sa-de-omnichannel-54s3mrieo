import pb from '@/lib/pocketbase/client'

export const getEmployeeTransactions = async (employeeId: string) => {
  return pb.collection('benefit_transactions').getFullList({
    filter: `employee_id = "${employeeId}"`,
    sort: '-created',
  })
}
