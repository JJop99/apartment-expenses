import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')

  let rows
  if (month && month !== 'all' && year) {
    rows = await sql`
      SELECT * FROM entries
      WHERE type = 'expense'
        AND EXTRACT(MONTH FROM date) = ${parseInt(month)}
        AND EXTRACT(YEAR  FROM date) = ${parseInt(year)}
      ORDER BY date DESC, created_at DESC
    `
  } else if (year && (!month || month === 'all')) {
    rows = await sql`
      SELECT * FROM entries
      WHERE type = 'expense'
        AND EXTRACT(YEAR FROM date) = ${parseInt(year)}
      ORDER BY date DESC, created_at DESC
    `
  } else {
    rows = await sql`
      SELECT * FROM entries WHERE type = 'expense'
      ORDER BY date DESC, created_at DESC
    `
  }
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { date, paid_by, category, description, amount, split } = body

  if (!date || !paid_by || !category || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const amt = parseFloat(amount)
  const jacopoShare = split === 'Amin' ? 0 : split === 'Jacopo' ? amt : amt / 2
  const aminShare   = split === 'Jacopo' ? 0 : split === 'Amin'   ? amt : amt / 2

  const rows = await sql`
    INSERT INTO entries (date, paid_by, category, description, amount, jacopo_share, amin_share, split, type)
    VALUES (${date}, ${paid_by}, ${category}, ${description || ''}, ${amt}, ${jacopoShare}, ${aminShare}, ${split || '50/50'}, 'expense')
    RETURNING *
  `
  return NextResponse.json(rows[0], { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await sql`DELETE FROM entries WHERE id = ${parseInt(id)}`
  return NextResponse.json({ success: true })
}
