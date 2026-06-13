'use client'
import { useEffect, useState } from 'react'

interface Segment {
  id: string
  name: string
  customerIds: string[]
}

interface Campaign {
  id: string
  name: string
  channel: string
  messageBody: string
  status: string
  sentAt: string
  createdAt: string
  segment: Segment
  _count: { communications: number }
}

const statusColor: Record<string, string> = {
  draft: 'badge-yellow',
  sending: 'badge-blue',
  completed: 'badge-green',
}

const channels = ['email', 'sms', 'whatsapp', 'rcs']

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [segmentId, setSegmentId] = useState('')
  const [channel, setChannel] = useState('email')
  const [messageBody, setMessageBody] = useState('')
  const [saving, setSaving] = useState(false)

  // AI message state
  const [aiLoading, setAiLoading] = useState(false)

  async function fetchAll() {
    setLoading(true)
    const [campRes, segRes] = await Promise.all([
      fetch('/api/campaigns'),
      fetch('/api/segments'),
    ])
    const campData = await campRes.json()
    const segData = await segRes.json()
    setCampaigns(campData.campaigns)
    setSegments(segData.segments)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

  async function handleCreate() {
    if (!name || !segmentId || !messageBody) return alert('Please fill all fields')
    setSaving(true)
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, segmentId, channel, messageBody }),
    })
    setSaving(false)
    setShowCreate(false)
    setName(''); setSegmentId(''); setMessageBody(''); setChannel('email')
    fetchAll()
  }

  async function handleSend(campaignId: string) {
    setSending(campaignId)
    await fetch(`/api/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    setSending(null)
    fetchAll()
  }

  async function handleAIMessage() {
    if (!segmentId) return alert('Please select a segment first')
    const seg = segments.find(s => s.id === segmentId)
    if (!seg) return
    setAiLoading(true)
    const res = await fetch('/api/ai/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ segmentName: seg.name, channel }),
    })
    const data = await res.json()
    if (data.message) setMessageBody(data.message)
    setAiLoading(false)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Campaigns</h1>
          <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
            Send personalised messages to your segments
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? '✕ Cancel' : '+ New Campaign'}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Create Campaign</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Campaign Name *</label>
              <input className="input" placeholder="e.g. Summer Sale Blast" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Segment *</label>
              <select className="input" value={segmentId} onChange={e => setSegmentId(e.target.value)}>
                <option value="">Select a segment</option>
                {segments.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.customerIds.length} customers)</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#64748B', display: 'block', marginBottom: '4px' }}>Channel *</label>
              <select className="input" value={channel} onChange={e => setChannel(e.target.value)}>
                {channels.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
          </div>

          {/* Message body */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', color: '#64748B' }}>Message *</label>
              <button
                onClick={handleAIMessage}
                disabled={aiLoading}
                style={{
                  fontSize: '12px', color: '#6366F1', background: 'none', border: 'none',
                  cursor: 'pointer', fontWeight: '600', opacity: aiLoading ? 0.6 : 1
                }}>
                {aiLoading ? '✦ Writing...' : '✦ Write with AI'}
              </button>
            </div>
            <textarea
              className="input"
              placeholder="Hi {name}, we have something special for you..."
              value={messageBody}
              onChange={e => setMessageBody(e.target.value)}
              rows={4}
              style={{ resize: 'vertical' }}
            />
            <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
              Use {'{name}'} to personalise with customer name
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div style={{ color: '#475569', textAlign: 'center', padding: '40px' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: '#475569' }}>
          No campaigns yet. Create your first one above.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {campaigns.map(c => (
            <div key={c.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '15px' }}>{c.name}</span>
                    <span className={`badge ${statusColor[c.status] || 'badge-blue'}`}>{c.status}</span>
                    <span style={{ fontSize: '12px', background: '#0F1629', border: '1px solid #2D3748', borderRadius: '6px', padding: '2px 8px', color: '#94A3B8', textTransform: 'uppercase' }}>
                      {c.channel}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                    → {c.segment.name} · {c._count.communications} recipients
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', background: '#0F1629', borderRadius: '6px', padding: '8px 12px', fontStyle: 'italic' }}>
                    "{c.messageBody.slice(0, 100)}{c.messageBody.length > 100 ? '...' : ''}"
                  </div>
                </div>
                <div style={{ marginLeft: '24px', flexShrink: 0, textAlign: 'right' }}>
                  {c.status === 'draft' && (
                    <button
                      className="btn-primary"
                      onClick={() => handleSend(c.id)}
                      disabled={sending === c.id}
                      style={{ marginBottom: '8px' }}
                    >
                      {sending === c.id ? '⏳ Sending...' : '▶ Send Now'}
                    </button>
                  )}
                  <div style={{ fontSize: '11px', color: '#475569' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}