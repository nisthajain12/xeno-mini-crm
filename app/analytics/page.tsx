import { prisma } from '@/lib/prisma'
import { StatBar } from '@/components/StatBar'

async function getAnalytics() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      segment: true,
      communications: true,
    },
  })

  return campaigns.map((c: {
  id: string
  name: string
  channel: string
  status: string
  createdAt: Date
  segment: { name: string }
  communications: {
    status: string
    deliveredAt: Date | null
    openedAt: Date | null
    clickedAt: Date | null
    failedAt: Date | null
  }[]
}) => {
    const total = c.communications.length
    const sent = c.communications.filter(x => x.status !== 'pending').length
    const delivered = c.communications.filter(x => x.deliveredAt).length
    const opened = c.communications.filter(x => x.openedAt).length
    const clicked = c.communications.filter(x => x.clickedAt).length
    const failed = c.communications.filter(x => x.failedAt).length

    return {
      id: c.id,
      name: c.name,
      channel: c.channel,
      status: c.status,
      segment: c.segment.name,
      createdAt: c.createdAt,
      total,
      sent,
      delivered,
      opened,
      clicked,
      failed,
      deliveryRate: total ? Math.round((delivered / total) * 100) : 0,
      openRate: delivered ? Math.round((opened / delivered) * 100) : 0,
      clickRate: opened ? Math.round((clicked / opened) * 100) : 0,
      failRate: total ? Math.round((failed / total) * 100) : 0,
    }
  })
}

const statusColor: Record<string, string> = {
  draft: 'badge-yellow',
  sending: 'badge-blue',
  completed: 'badge-green',
}

export default async function AnalyticsPage() {
  const campaigns = await getAnalytics()

  const totalSent = campaigns.reduce((s, c) => s + c.sent, 0)
  const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0)
  const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0)
  const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0)

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Analytics</h1>
        <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
          Campaign performance across all channels
        </p>
      </div>

      {/* Top level stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Sent', value: totalSent, color: '#60A5FA' },
          { label: 'Delivered', value: totalDelivered, color: '#34D399' },
          { label: 'Opened', value: totalOpened, color: '#A78BFA' },
          { label: 'Clicked', value: totalClicked, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} className="card">
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0 4px', color: s.color }}>
              {s.value.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>communications</div>
          </div>
        ))}
      </div>

      {/* Per campaign breakdown */}
      {campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          No campaigns yet. Send one from the Campaigns page.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {campaigns.map(c => (
            <div key={c.id} className="card">
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontWeight: '600', fontSize: '16px' }}>{c.name}</span>
                    <span className={`badge ${statusColor[c.status] || 'badge-blue'}`}>{c.status}</span>
                    <span style={{ fontSize: '12px', background: '#0F1629', border: '1px solid #2D3748', borderRadius: '6px', padding: '2px 8px', color: '#94A3B8', textTransform: 'uppercase' }}>
                      {c.channel}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B' }}>
                    {c.segment} · {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#F1F5F9' }}>{c.total}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>recipients</div>
                </div>
              </div>

              {/* Count row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Sent', value: c.sent, color: '#60A5FA' },
                  { label: 'Delivered', value: c.delivered, color: '#34D399' },
                  { label: 'Opened', value: c.opened, color: '#A78BFA' },
                  { label: 'Clicked', value: c.clicked, color: '#F59E0B' },
                  { label: 'Failed', value: c.failed, color: '#F87171' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#0F1629', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Rate bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Delivery Rate', value: c.deliveryRate, color: '#34D399' },
                  { label: 'Open Rate', value: c.openRate, color: '#A78BFA' },
                  { label: 'Click Rate', value: c.clickRate, color: '#F59E0B' },
                  { label: 'Fail Rate', value: c.failRate, color: '#F87171' },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>{r.label}</div>
                    <StatBar value={r.value} color={r.color} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}