import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {}

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { totalSpend: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ])

  return NextResponse.json({ customers, total, page, limit })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, email, phone, city, tags } = body

  if (!name || !email) {
    return NextResponse.json(
      { error: 'name and email are required' },
      { status: 400 }
    )
  }

  const customer = await prisma.customer.create({
    data: { name, email, phone, city, tags: tags || [] },
  })

  return NextResponse.json(customer, { status: 201 })
}