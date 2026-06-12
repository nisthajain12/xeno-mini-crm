import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/receipts — channel stub calls this with delivery updates
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { communicationId, event } = body

  // event can be: delivered | opened | clicked | failed
  if (!communicationId || !event) {
    return NextResponse.json(
      { error: 'communicationId and event are required' },
      { status: 400 }
    )
  }

  const now = new Date()
  const updateData: Record<string, unknown> = { status: event }

  if (event === 'delivered') updateData.deliveredAt = now
  if (event === 'opened') updateData.openedAt = now
  if (event === 'clicked') updateData.clickedAt = now
  if (event === 'failed') updateData.failedAt = now

  const communication = await prisma.communication.update({
    where: { id: communicationId },
    data: updateData,
  })

  // Check if all communications in this campaign are done
  // and update campaign status to completed
  const campaign = await prisma.campaign.findUnique({
    where: { id: communication.campaignId },
    include: {
      _count: { select: { communications: true } },
    },
  })

  if (campaign) {
    const pendingCount = await prisma.communication.count({
      where: {
        campaignId: campaign.id,
        status: { in: ['pending', 'sent'] },
      },
    })

    if (pendingCount === 0) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'completed' },
      })
    }
  }

  return NextResponse.json({ success: true, communicationId, event })
}