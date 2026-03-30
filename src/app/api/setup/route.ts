import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id          SERIAL PRIMARY KEY,
        date        DATE NOT NULL,
        paid_by     VARCHAR(50) NOT NULL,
        category    VARCHAR(100) NOT NULL,
        description TEXT DEFAULT '',
        amount      NUMERIC(10,2) NOT NULL,
        jacopo_share NUMERIC(10,2) NOT NULL,
        amin_share   NUMERIC(10,2) NOT NULL,
        split        VARCHAR(20) DEFAULT '50/50',
        type         VARCHAR(20) DEFAULT 'expense',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
