import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year  = searchParams.get('year')

  let rows
  if (month && month !== 'all' && year) {
    rows = await sql`
      SELECT * FROM entries
      WHERE type = 'reimbursement'
        AND EXTRACT(MONTH FROM date) = ${parseInt(month)}
        AND EXTRACT(YEAR  FROM date) = ${parseInt(year)}
      ORDER BY date DESC, created_at DESC
    `
  } else {
    rows = await sql`
      SELECT * FROM entries WHERE type = 'reimbursement'
      ORDER BY date DESC, created_at DESC
    `
  }
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, paid_by, to, amount, description } = body

  if (!date || !paid_by || !to || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (paid_by === to) {
    return NextResponse.json({ error: 'paid_by and to cannot be the same' }, { status: 400 })
  }

  const amt = parseFloat(amount)
  const jacopoShare = paid_by === 'Jacopo' ? amt : 0
  const aminShare   = paid_by === 'Amin'   ? amt : 0

  const rows = await sql`
    INSERT INTO entries (date, paid_by, category, description, amount, jacopo_share, amin_share, split, type)
    VALUES (
      ${date}, ${paid_by},
      ${'Reimbursement → ' + to},
      ${description || ''},
      ${amt}, ${jacopoShare}, ${aminShare},
      ${paid_by}, 'reimbursement'
    )
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await sql`DELETE FROM entries WHERE id = ${parseInt(id)} AND type = 'reimbursement'`
  return NextResponse.json({ success: true })
}
