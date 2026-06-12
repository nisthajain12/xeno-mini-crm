import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [
    totalCustomers,
    totalOrders,
    revenueResult,
    newCustomers,
    dormantCustomers,
  ] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { amount: true } }),
    prisma.customer.count({
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.customer.count({
      where: { lastOrderAt: { lt: sixtyDaysAgo } },
    }),
  ])

  return NextResponse.json({
    totalCustomers,
    totalOrders,
    totalRevenue: revenueResult._sum.amount || 0,
    newCustomers,
    dormantCustomers,
  })
}