import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || 'All'
    const year  = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const m     = MONTHS.indexOf(month)

    const byCategory = m > 0
      ? await sql`SELECT category, SUM(amount)::float AS total, SUM(jacopo_share)::float AS jacopo_owes, SUM(amin_share)::float AS amin_owes FROM entries WHERE type='expense' AND EXTRACT(MONTH FROM date)=${m} AND EXTRACT(YEAR FROM date)=${year} GROUP BY category ORDER BY total DESC`
      : await sql`SELECT category, SUM(amount)::float AS total, SUM(jacopo_share)::float AS jacopo_owes, SUM(amin_share)::float AS amin_owes FROM entries WHERE type='expense' AND EXTRACT(YEAR FROM date)=${year} GROUP BY category ORDER BY total DESC`

    const rows = m > 0
      ? await sql`SELECT
          COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Jacopo' THEN amount ELSE 0 END),0)::float AS jacopo_paid,
          COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Amin'   THEN amount ELSE 0 END),0)::float AS amin_paid,
          COALESCE(SUM(CASE WHEN type='expense' THEN jacopo_share ELSE 0 END),0)::float AS jacopo_owes,
          COALESCE(SUM(CASE WHEN type='expense' THEN amin_share   ELSE 0 END),0)::float AS amin_owes,
          COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Jacopo' THEN amount ELSE 0 END),0)::float AS jacopo_reimbursed,
          COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Amin'   THEN amount ELSE 0 END),0)::float AS amin_reimbursed
        FROM entries WHERE EXTRACT(MONTH FROM date)=${m} AND EXTRACT(YEAR FROM date)=${year}`
      : await sql`SELECT
          COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Jacopo' THEN amount ELSE 0 END),0)::float AS jacopo_paid,
          COALESCE(SUM(CASE WHEN type='expense' AND paid_by='Amin'   THEN amount ELSE 0 END),0)::float AS amin_paid,
          COALESCE(SUM(CASE WHEN type='expense' THEN jacopo_share ELSE 0 END),0)::float AS jacopo_owes,
          COALESCE(SUM(CASE WHEN type='expense' THEN amin_share   ELSE 0 END),0)::float AS amin_owes,
          COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Jacopo' THEN amount ELSE 0 END),0)::float AS jacopo_reimbursed,
          COALESCE(SUM(CASE WHEN type='reimbursement' AND paid_by='Amin'   THEN amount ELSE 0 END),0)::float AS amin_reimbursed
        FROM entries WHERE EXTRACT(YEAR FROM date)=${year}`

    const t = rows[0]
    const bycat: Record<string,{total:number;jacopo_owes:number;amin_owes:number}> = {}
    for (const row of byCategory) bycat[row.category] = { total: row.total, jacopo_owes: row.jacopo_owes, amin_owes: row.amin_owes }
    const net = t.jacopo_paid - t.jacopo_owes - t.jacopo_reimbursed + t.amin_reimbursed
    return NextResponse.json({ byCategory: bycat, totals: { ...t, net } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
