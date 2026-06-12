import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const customerId = searchParams.get('customerId')

  const orders = await prisma.order.findMany({
    where: customerId ? { customerId } : {},
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      customer: { select: { name: true, email: true } },
    },
  })

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { customerId, items, channel } = body

  if (!customerId || !items || !Array.isArray(items)) {
    return NextResponse.json(
      { error: 'customerId and items[] are required' },
      { status: 400 }
    )
  }

  const amount = items.reduce(
    (sum: number, item: { price: number; qty: number }) =>
      sum + item.price * item.qty,
    0
  )

  const [order] = await prisma.$transaction([
    prisma.order.create({
      data: { customerId, amount, items, channel: channel || 'online' },
    }),
    prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpend: { increment: amount },
        orderCount: { increment: 1 },
        lastOrderAt: new Date(),
      },
    }),
  ])

  return NextResponse.json(order, { status: 201 })
}