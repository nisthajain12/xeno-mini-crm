import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/campaigns — list all campaigns
export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      segment: true,
      _count: { select: { communications: true } },
    },
  })
  return NextResponse.json({ campaigns })
}

// POST /api/campaigns — create a new campaign
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, segmentId, channel, messageBody } = body

  if (!name || !segmentId || !channel || !messageBody) {
    return NextResponse.json(
      { error: 'name, segmentId, channel, and messageBody are required' },
      { status: 400 }
    )
  }

  const campaign = await prisma.campaign.create({
    data: { name, segmentId, channel, messageBody, status: 'draft' },
    include: { segment: true },
  })

  return NextResponse.json(campaign, { status: 201 })
}