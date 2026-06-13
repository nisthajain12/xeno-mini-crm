import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      segment: true,
      communications: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const data = campaigns.map((campaign: any) => {
    const comms = campaign.communications
    const total = comms.length

    const count = (status: string) =>
      comms.filter((c: any) => c.status === status).length

    const rate = (n: number) =>
      total > 0 ? Math.round((n / total) * 100) : 0

    const sent      = count('sent')
    const delivered = count('delivered')
    const opened    = count('opened')
    const clicked   = count('clicked')
    const failed    = count('failed')

    return {
      id:           campaign.id,
      name:         campaign.name,
      channel:      campaign.channel,
      segment:      campaign.segment?.name ?? '—',
      status:       campaign.status,
      createdAt:    campaign.createdAt,
      total,
      sent,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate: rate(delivered),
      openRate:     rate(opened),
      clickRate:    rate(clicked),
      failRate:     rate(failed),
    }
  })

  return NextResponse.json(data)
}