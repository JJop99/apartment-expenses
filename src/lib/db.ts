import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export type Split = '50/50' | 'Jacopo' | 'Amin'
export type EntryType = 'expense' | 'reimbursement'

export interface Entry {
  id: number
  date: string
  paid_by: string
  category: string
  description: string
  amount: number
  jacopo_share: number
  amin_share: number
  split: string
  type: EntryType
  created_at: string
}
