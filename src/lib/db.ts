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

export const CATEGORIES = [
  'Electricity','Gas','Water','Internet','Rent','Contents Insurance','Parking',
  'Shared Groceries','Cleaning Supplies','Toiletries','Kitchen Consumables',
  'Repairs/Maintenance','Laundry','Other'
]

export const MONTHS = [
  'All','January','February','March','April','May','June',
  'July','August','September','October','November','December'
]
