import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const { message, history } = await req.json()

  // Get current segments for context
  const segments = await prisma.segment.findMany({
    select: { id: true, name: true, customerIds: true, filters: true }
  })

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const systemContext = `You are an AI campaign co-pilot for an Indian fashion brand CRM called Xeno Mini.
You help marketers plan and create campaigns by understanding their goals.

Current available segments:
${segments.map(s => `- "${s.name}" (${s.customerIds.length} customers, filters: ${JSON.stringify(s.filters)})`).join('\n')}

Your job:
1. Understand what the marketer wants to achieve
2. Suggest which segment to target (from the list above, or suggest creating a new one)
3. Recommend a channel (WhatsApp for urgent/personal, Email for detailed offers, SMS for quick alerts)
4. Draft a message for that segment and channel
5. When the user confirms they want to create the campaign, you MUST output this exact format on its own line with no markdown around it:
CAMPAIGN_READY: {"segmentId": "SEGMENT_ID", "segmentName": "SEGMENT_NAME", "channel": "CHANNEL", "messageBody": "MESSAGE", "campaignName": "CAMPAIGN_NAME"}

IMPORTANT: Use a real segmentId from the list above. If no segment matches, use the closest one. Never skip this step when user confirms.

Be conversational, helpful, and concise. Ask clarifying questions if needed.`

  const chatHistory = (history || []).map((h: { role: string; text: string }) => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }],
  }))

  try {
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemContext }] },
        { role: 'model', parts: [{ text: 'Understood! I am your campaign co-pilot. Tell me what you want to achieve and I will help you plan the perfect campaign.' }] },
        ...chatHistory,
      ],
    })

    const result = await chat.sendMessage(message)
    const response = result.response.text()

    // Check if AI has a campaign ready
    const campaignMatch = response.match(/CAMPAIGN_READY:\s*(\{[\s\S]*?\})/)
    let campaignSuggestion = null
    if (campaignMatch) {
      try {
        campaignSuggestion = JSON.parse(campaignMatch[1])
      } catch {}
    }

    return NextResponse.json({
      response: response.replace(/CAMPAIGN_READY:[\s\S]*$/, '').trim(),
      campaignSuggestion,
    })
  } catch (err) {
    console.error('Copilot error:', err)
    return NextResponse.json({ error: 'AI failed' }, { status: 500 })
  }
}