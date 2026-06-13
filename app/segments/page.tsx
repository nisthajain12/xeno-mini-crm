'use client'
import { useEffect, useState } from 'react'

interface Segment {
  id: string
  name: string
  description: string
  filters: Record<string, unknown>
  customerIds: string[]
  createdAt: string
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [filters, setFilters] = useState({
    minTotalSpend: '',
    maxTotalSpend: '',
    minOrderCount: '',
    minDaysSinceLastOrder: '',
    maxDaysSinceLastOrder: '',
    city: '',
    tag: '',
  })
  const [preview, setPreview] = useState<{ matchedCount: number } | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [saving, setSaving] = useState(false)

  // AI state
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  async function fetchSegments() {
    setLoading(true)
    const res = await fetch('/api/segments')
    const data = await res.json()
    setSegments(data.segments)
    setLoading(false)
  }

  useEffect(() => { fetchSegments() }, [])

  function buildFilters() {
    const f: Record<string, unknown> = {}
    if (filters.minTotalSpend) f.minTotalSpend = Number(filters.minTotalSpend)
    if (filters.maxTotalSpend) f.maxTotalSpend = Number(filters.maxTotalSpend)
    if (filters.minOrderCount) f.minOrderCount = Number(filters.minOrderCount)
    if (filters.minDaysSinceLastOrder) f.minDaysSinceLastOrder = Number(filters.minDaysSinceLastOrder)
    if (filters.maxDaysSinceLastOrder) f.maxDaysSinceLastOrder = Number(filters.maxDaysSinceLastOrder)
    if (filters.city) f.city = filters.city
    if (filters.tag) f.tag = filters.tag
    return f
  }

  async function handlePreview() {
    setPreviewing(true)
    const res = await fetch('/api/segments/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters: buildFilters() }),
    })
    const data = await res.json()
    setPreview(data)
    setPreviewing(false)
  }

  async function handleSave() {
    if (!name) return alert('Please enter a segment name')
    setSaving(true)
    await fetch('/api/segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, filters: buildFilters() }),
    })
    setSaving(false)
    setShowCreate(false)
    setName('')
    setDescription('')
    setFilters({ minTotalSpend: '', maxTotalSpend: '', minOrderCount: '', minDaysSinceLastOrder: '', maxDaysSinceLastOrder: '', city: '', tag: '' })
    setPreview(null)
    fetchSegments()
  }

  async function handleAI() {
    if (!aiPrompt) return
    setAiLoading(true)
    const res = await fetch('/api/ai/segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: aiPrompt }),
    })
    const data = await res.json()
    if (data.filters) {
      setFilters({
        minTotalSpend: data.filters.minTotalSpend || '',
        maxTotalSpend: data.filters.maxTotalSpend || '',
        minOrderCount: data.filters.minOrderCount || '',
        minDaysSinceLastOrder: data.filters.minDaysSinceLastOrder || '',
        maxDaysSinceLastOrder: data.filters.maxDaysSinceLastOrder || '',
        city: data.filters.city || '',
        tag: data.filters.tag || '',
      })
      if (data.name) setName(data.name)
      if (data.description) setDescription(data.description)
    }
    setAiLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Segments</h1>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
            Carve out audiences from your shoppers
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ New Segment'}
        </button>
      </div>

      {/* Create segment form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Create Segment</h2>

          {/* AI prompt */}
          <div style={{ background: '#0F1629', border: '1px solid #6366F1', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.06em' }}>
              ✦ AI SEGMENT BUILDER
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input"
                placeholder="e.g. high value customers who haven't bought in 60 days"
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAI()}
              />
              <button className="btn-primary" onClick={handleAI} disabled={aiLoading}
                style={{ whiteSpace: 'nowrap', opacity: aiLoading ? 0.6 : 1 }}>
                {aiLoading ? 'Thinking...' : '✦ Generate'}
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px' }}>
              Describe your audience in plain English — AI will set the filters for you
            </div>
          </div>

          {/* Manual filters */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Min Total Spend (₹)', key: 'minTotalSpend', placeholder: 'e.g. 10000' },
              { label: 'Max Total Spend (₹)', key: 'maxTotalSpend', placeholder: 'e.g. 50000' },
              { label: 'Min Order Count', key: 'minOrderCount', placeholder: 'e.g. 3' },
              { label: 'Max Days Since Last Order', key: 'maxDaysSinceLastOrder', placeholder: 'e.g. 30 (active)' },
              { label: 'Min Days Since Last Order', key: 'minDaysSinceLastOrder', placeholder: 'e.g. 60 (dormant)' },
              { label: 'City', key: 'city', placeholder: 'e.g. Mumbai' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>{label}</label>
                <input
                  className="input"
                  placeholder={placeholder}
                  value={filters[key as keyof typeof filters]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Tag</label>
              <select className="input" value={filters.tag} onChange={e => setFilters(f => ({ ...f, tag: e.target.value }))}>
                <option value="">Any tag</option>
                {['vip', 'new', 'at-risk', 'loyal', 'sale-buyer', 'premium'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Name + description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Segment Name *</label>
              <input className="input" placeholder="e.g. High-value loyalists" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Description</label>
              <input className="input" placeholder="Optional description" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>

          {/* Preview + save */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-secondary" onClick={handlePreview} disabled={previewing}>
              {previewing ? 'Previewing...' : '👁 Preview Audience'}
            </button>
            {preview && (
              <span style={{ fontSize: '14px', color: '#34D399', fontWeight: '600' }}>
                ✓ {preview.matchedCount} customers match
              </span>
            )}
            <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginLeft: 'auto' }}>
              {saving ? 'Saving...' : 'Save Segment'}
            </button>
          </div>
        </div>
      )}

      {/* Segments list */}
      {loading ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : segments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          No segments yet. Create your first one above.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {segments.map(seg => (
            <div key={seg.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '4px' }}>{seg.name}</div>
                {seg.description && (
                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>{seg.description}</div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(seg.filters as Record<string, unknown>).map(([k, v]) => (
                    <span key={k} style={{ fontSize: '11px', background: '#0F1629', border: '1px solid #2D3748', borderRadius: '6px', padding: '2px 8px', color: '#94A3B8' }}>
                      {k}: {String(v)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '24px' }}>
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366F1' }}>{seg.customerIds.length}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>customers</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                  {new Date(seg.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}