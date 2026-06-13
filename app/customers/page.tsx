'use client'
import { useEffect, useState } from 'react'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  city: string
  tags: string[]
  totalSpend: number
  orderCount: number
  lastOrderAt: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  async function fetchCustomers() {
    setLoading(true)
    const res = await fetch(`/api/customers?search=${search}&page=${page}&limit=15`)
    const data = await res.json()
    setCustomers(data.customers)
    setTotal(data.total)
    setLoading(false)
  }

  useEffect(() => { fetchCustomers() }, [search, page])

  function daysSince(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    return Math.floor(diff / (1000 * 60 * 60 * 24))
  }

  const tagColors: Record<string, string> = {
    vip: 'badge-purple',
    new: 'badge-green',
    'at-risk': 'badge-red',
    loyal: 'badge-blue',
    premium: 'badge-purple',
    'sale-buyer': 'badge-yellow',
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Customers</h1>
        <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
          {total} shoppers in your database
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '20px' }}>
        <input
          className="input"
          placeholder="Search by name, email or city..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: '400px' }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2D3748', background: '#161D30' }}>
              {['Customer', 'City', 'Tags', 'Total Spend', 'Orders', 'Last Order'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', color: '#64748B', fontWeight: '500' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>
                  Loading...
                </td>
              </tr>
            ) : customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #1E2640' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1A2235')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '500', fontSize: '14px' }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>{c.email}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8' }}>{c.city || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {c.tags.map(tag => (
                      <span key={tag} className={`badge ${tagColors[tag] || 'badge-blue'}`}>{tag}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '600', color: '#34D399' }}>
                  ₹{c.totalSpend.toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8' }}>{c.orderCount}</td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94A3B8' }}>
                  {c.lastOrderAt ? `${daysSince(c.lastOrderAt)}d ago` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{ padding: '16px', borderTop: '1px solid #1E2640', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#64748B' }}>
            Showing {Math.min((page - 1) * 15 + 1, total)}–{Math.min(page * 15, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '6px 14px', opacity: page === 1 ? 0.4 : 1 }}>
              ← Prev
            </button>
            <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page * 15 >= total}
              style={{ padding: '6px 14px', opacity: page * 15 >= total ? 0.4 : 1 }}>
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}