import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/segments — list all segments
export async function GET() {
  const segments = await prisma.segment.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ segments })
}

// POST /api/segments — create a segment from filters
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, description, filters } = body

  if (!name || !filters) {
    return NextResponse.json(
      { error: 'name and filters are required' },
      { status: 400 }
    )
  }

  // Apply filters to find matching customers
  const customers = await applyFilters(filters)
  const customerIds = customers.map((c: { id: string }) => c.id)

  const segment = await prisma.segment.create({
    data: {
      name,
      description,
      filters,
      customerIds,
    },
  })

  return NextResponse.json(
    { segment, matchedCount: customerIds.length },
    { status: 201 }
  )
}

// The filter engine — converts filter rules into a Prisma query
export async function applyFilters(filters: Record<string, unknown>) {
  const where: Record<string, unknown> = {}

  // Minimum total spend e.g. { minTotalSpend: 10000 }
  if (filters.minTotalSpend) {
    where.totalSpend = { gte: filters.minTotalSpend }
  }

  // Maximum total spend
  if (filters.maxTotalSpend) {
    where.totalSpend = {
      ...(where.totalSpend as object || {}),
      lte: filters.maxTotalSpend,
    }
  }

  // Minimum order count e.g. { minOrderCount: 3 }
  if (filters.minOrderCount) {
    where.orderCount = { gte: filters.minOrderCount }
  }

  // Days since last order e.g. { maxDaysSinceLastOrder: 30 }
  if (filters.maxDaysSinceLastOrder) {
    const date = new Date()
    date.setDate(date.getDate() - (filters.maxDaysSinceLastOrder as number))
    where.lastOrderAt = { gte: date }
  }

  // Dormant customers e.g. { minDaysSinceLastOrder: 60 }
  if (filters.minDaysSinceLastOrder) {
    const date = new Date()
    date.setDate(date.getDate() - (filters.minDaysSinceLastOrder as number))
    where.lastOrderAt = {
      ...(where.lastOrderAt as object || {}),
      lt: date,
    }
  }

  // Filter by city e.g. { city: "Mumbai" }
  if (filters.city) {
    where.city = filters.city
  }

  // Filter by tag e.g. { tag: "vip" }
  if (filters.tag) {
    where.tags = { has: filters.tag }
  }

  const customers = await prisma.customer.findMany({
    where,
    select: { id: true, name: true, email: true, totalSpend: true, orderCount: true, lastOrderAt: true },
  })

  return customers
}