'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  text: string
}

interface CampaignSuggestion {
  segmentId: string
  segmentName: string
  channel: string
  messageBody: string
  campaignName: string
}

export default function CopilotPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hi! I'm your AI campaign co-pilot ✦\n\nTell me what you want to achieve — for example:\n• \"Re-engage customers who haven't bought in 2 months\"\n• \"Promote our summer sale to VIP customers\"\n• \"Send a loyalty reward to our top spenders\"\n\nWhat's your goal today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState<CampaignSuggestion | null>(null)
  const [creating, setCreating] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMessages)
    setLoading(true)

    const history = messages.map(m => ({ role: m.role, text: m.text }))

    const res = await fetch('/api/ai/copilot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg, history }),
    })

    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', text: data.response }])
    if (data.campaignSuggestion) setSuggestion(data.campaignSuggestion)
    setLoading(false)
  }

 async function handleCreateCampaign() {
  if (!suggestion) return
  setCreating(true)

  try {
    // First get real segments to find matching one
    const segRes = await fetch('/api/segments')
    const segData = await segRes.json()
    const segments = segData.segments

    // Find best matching segment or use first available
    const matchedSegment = segments.find((s: { name: string; id: string }) =>
      s.name.toLowerCase().includes('lapsed') ||
      s.name.toLowerCase().includes('inactive') ||
      s.name.toLowerCase().includes('dormant') ||
      s.name.toLowerCase().includes('spender')
    ) || segments[0]

    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: suggestion.campaignName,
        segmentId: matchedSegment.id,
        channel: suggestion.channel,
        messageBody: suggestion.messageBody,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Campaign creation failed:', text)
      alert('Failed to create campaign. Check console.')
      setCreating(false)
      return
    }

    setCreating(false)
    router.push('/campaigns')
  } catch (err) {
    console.error('Error creating campaign:', err)
    setCreating(false)
  }
}
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>
          <span style={{ color: '#6366F1' }}>✦</span> Campaign Co-pilot
        </h1>
        <p style={{ color: '#64748B', marginTop: '4px', fontSize: '14px' }}>
          Describe your goal — AI will plan the campaign for you
        </p>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        gap: '16px', paddingBottom: '16px', marginBottom: '16px'
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? '#6366F1' : '#1E2640',
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
              color: '#F1F5F9',
            }}>
              {m.role === 'assistant' && (
                <span style={{ color: '#6366F1', fontWeight: '700', marginRight: '6px' }}>✦</span>
              )}
              {m.text}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#1E2640', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', color: '#64748B', fontSize: '14px' }}>
              <span style={{ color: '#6366F1' }}>✦</span> Thinking...
            </div>
          </div>
        )}

        {/* Campaign suggestion card */}
        {suggestion && (
          <div style={{
            background: '#0F1629', border: '1px solid #6366F1',
            borderRadius: '12px', padding: '20px', margin: '8px 0'
          }}>
            <div style={{ fontSize: '12px', color: '#6366F1', fontWeight: '600', marginBottom: '12px', letterSpacing: '0.06em' }}>
              ✦ CAMPAIGN READY TO LAUNCH
            </div>
            <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
              {[
                { label: 'Campaign', value: suggestion.campaignName },
                { label: 'Segment', value: suggestion.segmentName },
                { label: 'Channel', value: suggestion.channel.toUpperCase() },
                { label: 'Message', value: suggestion.messageBody },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', minWidth: '70px' }}>{label}</span>
                  <span style={{ fontSize: '13px', color: '#F1F5F9' }}>{value}</span>
                </div>
              ))}
            </div>
            <button className="btn-primary" onClick={handleCreateCampaign} disabled={creating}>
              {creating ? 'Creating...' : '▶ Create this Campaign'}
            </button>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '12px', flexShrink: 0 }}>
        <input
          className="input"
          placeholder="Describe your campaign goal..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
        />
        <button className="btn-primary" onClick={sendMessage} disabled={loading}
          style={{ whiteSpace: 'nowrap', padding: '10px 24px' }}>
          Send
        </button>
      </div>
    </div>
  )
}