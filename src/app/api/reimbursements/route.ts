import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

const MONTHS = ['All','January','February','March','April','May','June','July','August','September','October','November','December']

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || 'All'
    const year  = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
    const m     = MONTHS.indexOf(month)
    const rows = m > 0
      ? await sql`SELECT * FROM entries WHERE type='reimbursement' AND EXTRACT(MONTH FROM date)=${m} AND EXTRACT(YEAR FROM date)=${year} ORDER BY date DESC, created_at DESC`
      : await sql`SELECT * FROM entries WHERE type='reimbursement' AND EXTRACT(YEAR FROM date)=${year} ORDER BY date DESC, created_at DESC`
    return NextResponse.json(rows, { headers: { 'Cache-Control': 'no-store' } })
  } catch(e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const { date, paid_by, to_person, amount, note } = await req.json()
    if (!date || !paid_by || !to_person || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (paid_by === to_person) return NextResponse.json({ error: 'Same person' }, { status: 400 })
    const amt = parseFloat(amount)
    const j = paid_by === 'Jacopo' ? amt : 0
    const a = paid_by === 'Amin' ? amt : 0
    const rows = await sql`INSERT INTO entries (date,paid_by,category,description,amount,jacopo_share,amin_share,split,type) VALUES (${date},${paid_by},${'Reimbursement → '+to_person},${note||''},${amt},${j},${a},${paid_by},'reimbursement') RETURNING *`
    return NextResponse.json(rows[0], { status: 201 })
  } catch(e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    await sql`DELETE FROM entries WHERE id=${parseInt(id)}`
    return NextResponse.json({ ok: true })
  } catch(e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
