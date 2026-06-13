import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: NextRequest) {
  const { prompt } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

  const systemPrompt = `You are a CRM segmentation engine for an Indian fashion brand.
Convert the user's natural language description into a JSON filter object.

Available filter fields:
- minTotalSpend: number (minimum ₹ spend)
- maxTotalSpend: number (maximum ₹ spend)
- minOrderCount: number (minimum number of orders)
- maxDaysSinceLastOrder: number (ordered within this many days — for ACTIVE customers)
- minDaysSinceLastOrder: number (no order for this many days — for DORMANT customers)
- city: string (one of: Mumbai, Delhi, Bangalore, Jaipur, Pune, Hyderabad, Chennai, Kolkata)
- tag: string (one of: vip, new, at-risk, loyal, sale-buyer, premium)

Also return:
- name: a short segment name (max 4 words)
- description: one sentence describing the segment

Return ONLY valid JSON, no markdown, no explanation.

Example input: "high value customers who haven't bought in 60 days"
Example output: {"filters":{"minTotalSpend":20000,"minDaysSinceLastOrder":60},"name":"Dormant High-Value","description":"Customers who spent over ₹20,000 but haven't ordered in 60+ days"}

User input: "${prompt}"
`

  try {
    const result = await model.generateContent(systemPrompt)
    const text = result.response.text().trim()
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    return NextResponse.json(parsed)
  } catch (err) {
    console.error('AI segment error:', err)
    return NextResponse.json({ error: 'AI failed to parse response' }, { status: 500 })
  }
}