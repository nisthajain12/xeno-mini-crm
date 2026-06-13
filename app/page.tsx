import { prisma } from '@/lib/prisma'
import Link from 'next/link'

async function getStats() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

  const [totalCustomers, totalOrders, revenue, dormant, campaigns, recentCampaigns] = await Promise.all([
    prisma.customer.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { amount: true } }),
    prisma.customer.count({ where: { lastOrderAt: { lt: sixtyDaysAgo } } }),
    prisma.campaign.count(),
    prisma.campaign.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        segment: true,
        _count: { select: { communications: true } },
      },
    }),
  ])

  return { totalCustomers, totalOrders, revenue: revenue._sum.amount || 0, dormant, campaigns, recentCampaigns }
}

const statusColor: Record<string, string> = {
  draft: 'badge-yellow',
  sending: 'badge-blue',
  completed: 'badge-green',
}

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Dashboard</h1>
        <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
          Your shoppers at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Shoppers', value: stats.totalCustomers.toLocaleString(), sub: 'in your database' },
          { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), sub: 'all time' },
          { label: 'Total Revenue', value: `₹${(stats.revenue / 100000).toFixed(1)}L`, sub: 'gross sales' },
          { label: 'At-risk Shoppers', value: stats.dormant.toLocaleString(), sub: 'no order in 60d', accent: true },
        ].map((s) => (
          <div key={s.label} className="card">
            <div style={{ fontSize: '12px', color: '#64748B', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', margin: '8px 0 4px', color: s.accent ? '#F87171' : '#F1F5F9' }}>
              {s.value}
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent campaigns */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Recent Campaigns</h2>
          <Link href="/campaigns" style={{ fontSize: '13px', color: '#6366F1', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {stats.recentCampaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
            No campaigns yet.{' '}
            <Link href="/campaigns" style={{ color: '#6366F1' }}>Create your first →</Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #2D3748' }}>
                {['Campaign', 'Segment', 'Channel', 'Recipients', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recentCampaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #1E2640' }}>
                  <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500' }}>{c.name}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#94A3B8' }}>{c.segment.name}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#94A3B8', textTransform: 'capitalize' }}>{c.channel}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#94A3B8' }}>{c._count.communications}</td>
                  <td style={{ padding: '12px' }}>
                    <span className={`badge ${statusColor[c.status] || 'badge-blue'}`}>
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}