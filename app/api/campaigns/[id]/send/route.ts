import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { segment: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  if (campaign.status !== 'draft') {
    return NextResponse.json(
      { error: 'Campaign already sent' },
      { status: 400 }
    )
  }

  // Get customers in this segment
  const customerIds = campaign.segment.customerIds
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, email: true, phone: true },
  })

  // Create a Communication record for each customer
  const communications = await Promise.all(
    customers.map((customer) =>
      prisma.communication.create({
        data: {
          campaignId: campaign.id,
          customerId: customer.id,
          channel: campaign.channel,
          messageBody: campaign.messageBody.replace('{name}', customer.name),
          status: 'pending',
        },
      })
    )
  )

  // Update campaign status to sending
  await prisma.campaign.update({
    where: { id },
    data: { status: 'sending', sentAt: new Date() },
  })

  // Send each communication to the channel stub service
  const channelStubUrl = process.env.CHANNEL_STUB_URL || 'http://localhost:3001'

  for (const comm of communications) {
    const customer = customers.find((c) => c.id === comm.customerId)!

    // Fire and forget — don't await, let it be async
    fetch(`${channelStubUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        communicationId: comm.id,
        recipient: customer.email,
        channel: comm.channel,
        message: comm.messageBody,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/receipts`,
      }),
    }).catch(console.error)

    // Mark as sent immediately
    await prisma.communication.update({
      where: { id: comm.id },
      data: { status: 'sent', sentAt: new Date() },
    })
  }

  return NextResponse.json({
    success: true,
    campaignId: campaign.id,
    totalSent: communications.length,
  })
}