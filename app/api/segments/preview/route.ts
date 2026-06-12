import { NextRequest, NextResponse } from 'next/server'
import { applyFilters } from '../route'

// POST /api/segments/preview — preview filter results without saving
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { filters } = body

  if (!filters) {
    return NextResponse.json({ error: 'filters are required' }, { status: 400 })
  }

  const customers = await applyFilters(filters)

  return NextResponse.json({
    matchedCount: customers.length,
    customers,
  })
}