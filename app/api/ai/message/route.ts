import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const { segmentName, channel } = await req.json()

  if (!segmentName || !channel) {
    return NextResponse.json({ error: 'segmentName and channel are required' }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const prompt = `You are a marketing copywriter for an Indian fashion brand called "Zara Threads".
Write a personalised ${channel.toUpperCase()} message for the customer segment: "${segmentName}".

Rules:
- Use {name} as a placeholder for the customer's name
- Keep it warm, conversational, and relevant to Indian fashion
- For WhatsApp/SMS: keep under 160 characters
- For Email: 2-3 sentences max
- Include a clear call to action
- Make it feel personal, not spammy
- Use ₹ for prices if mentioning offers

Return ONLY the message text, no subject line, no explanation.`

  try {
    const result = await model.generateContent(prompt)
    const message = result.response.text().trim()
    return NextResponse.json({ message })
  } catch (err) {
    console.error('AI message error:', err)
    return NextResponse.json({ error: 'AI failed to generate message' }, { status: 500 })
  }
}