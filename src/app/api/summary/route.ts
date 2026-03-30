import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year  = searchParams.get('year') || new Date().getFullYear().toString()

  const filter =
    month && month !== 'All' && month !== 'all'
      ? sql`AND EXTRACT(MONTH FROM date) = ${parseInt(month)} AND EXTRACT(YEAR FROM date) = ${parseInt(year)}`
      : sql`AND EXTRACT(YEAR FROM date) = ${parseInt(year)}`

  const byCategory = await sql`
    SELECT category, SUM(amount) AS total, SUM(jacopo_share) AS jacopo_owes, SUM(amin_share) AS amin_owes
    FROM entries WHERE type = 'expense' ${filter}
    GROUP BY category ORDER BY total DESC
  `

  const [totals] = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Jacopo' THEN amount ELSE 0 END),0) AS jacopo_paid,
      COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Amin'   THEN amount ELSE 0 END),0) AS amin_paid,
      COALESCE(SUM(CASE WHEN type='expense' THEN jacopo_share ELSE 0 END),0) AS jacopo_owes,
      COALESCE(SUM(CASE WHEN type='expense' THEN amin_share   ELSE 0 END),0) AS amin_owes,
      COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Jacopo' THEN amount ELSE 0 END),0) AS jacopo_reimbursed,
      COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Amin'   THEN amount ELSE 0 END),0) AS amin_reimbursed
    FROM entries WHERE 1=1 ${filter}
  `

  const bycat: Record<string, {total:number;jacopo_owes:number;amin_owes:number}> = {}
  for (const row of byCategory) {
    bycat[row.category] = { total: Number(row.total), jacopo_owes: Number(row.jacopo_owes), amin_owes: Number(row.amin_owes) }
  }

  const net = Number(totals.jacopo_paid) - Number(totals.jacopo_owes) - Number(totals.jacopo_reimbursed) + Number(totals.amin_reimbursed)
  return NextResponse.json({ byCategory: bycat, totals: { ...totals, net } })
}
