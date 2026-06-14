# Xeno Mini CRM — Architecture & Decision Log

## What I Built
An AI-native Mini CRM for Indian fashion brands to reach their shoppers with personalised campaigns.

**Live URL**: https://xeno-mini-crm-eight.vercel.app
**Channel Stub**: https://xeno-channel-stub-theta.vercel.app
**GitHub (CRM)**: https://github.com/nisthajain12/xeno-mini-crm
**GitHub (Stub)**: https://github.com/nisthajain12/xeno-channel-stub

---

## Key Decisions & Why

### 1. Stack: Next.js + Prisma + Neon + Gemini
Next.js App Router lets me colocate API routes and UI in one codebase. Prisma gives type-safe database queries. Neon is serverless PostgreSQL that works with Vercel. Gemini has a free tier with 1000 requests/day.

### 2. Two-Service Architecture
Real messaging providers work exactly this way — you POST a message, they fire webhooks back as delivery events happen. The callback loop: CRM sends to stub → stub waits 1-4s → stub POSTs back delivered/opened/clicked/failed → CRM updates Communication record.

**Tradeoff**: At scale I'd use Redis/SQS queue with retries. For this scope, direct HTTP works fine.

### 3. AI Features
- **NL → Segment**: Converts plain English to Prisma filter queries
- **AI Message Writer**: Context-aware copy for each channel
- **Co-pilot**: Multi-turn chat that plans AND executes campaigns

### 4. Data Model
Communication status flow: pending → sent → delivered → opened → clicked (or failed). Each transition is timestamped for analytics.

### 5. Deployment
Vercel for both services. Channel stub deployed separately to mirror real microservice architecture.

---

## Scale Assumptions & Tradeoffs

| What I did | What I'd do at scale |
|------------|---------------------|
| Direct HTTP callbacks | Message queue (Redis/SQS) with retries |
| Segment computed at creation | Dynamic recomputation at send time |
| In-memory chat state | Persist to DB with session IDs |
| Single Neon DB | Read replicas for analytics queries |
| Gemini free tier | Dedicated AI API with rate limiting |
| No auth | Auth.js with role-based access |
| No rate limiting on APIs | API gateway with per-user limits |

---

## Interview Q&A

**Q: Why did you choose this tech stack?**
Next.js for full-stack simplicity, Prisma for type-safe DB access, Neon for serverless-compatible PostgreSQL, Gemini for free AI API. Each choice optimises for speed of development without sacrificing correctness.

**Q: How does the callback loop work?**
The CRM sends a message to the channel stub with a callbackUrl. The stub simulates delivery asynchronously and POSTs back to that URL with events. The CRM's /api/receipts endpoint processes these and updates the Communication record. This mirrors how real providers like Twilio work.

**Q: What would break at 1 million users?**
The direct HTTP callback approach would fail — we need a queue. The single DB instance would need read replicas. The segment computation would need to be async with background jobs. The channel stub would need horizontal scaling.

**Q: How is this AI-native vs AI-bolted-on?**
AI is embedded in three core workflows: segment creation, message drafting, and campaign planning. The co-pilot doesn't just answer questions — it executes actions. The AI understands the CRM's data model and makes decisions based on real segment data.

**Q: What's the difference between Segment and Campaign models?**
A Segment is a reusable audience definition with filter rules and matched customer IDs. A Campaign is a one-time execution targeting a Segment with a specific message and channel. One segment can be used by many campaigns.

**Q: How did you handle async delivery events?**
The channel stub fires callbacks asynchronously with setTimeout, mimicking real network delays. The CRM's receipt API is idempotent — calling it twice with the same event won't corrupt data. At scale I'd add webhook signature verification and idempotency keys.

**Q: Why store both timestamp AND status string?**
The status string gives current state for quick filtering. The timestamps give full history for analytics (e.g. average time from sent to opened). Both are needed for a complete analytics story.

**Q: How did you use AI in your development workflow?**
I used Claude as my primary coding assistant for architecture decisions, debugging, writing boilerplate, and fixing deployment issues. I reviewed and understood every piece of code before committing it. AI accelerated development by approximately 3x.

**Q: Why Vercel over Railway?**
Vercel is purpose-built for Next.js (same company). Zero-config deployment, automatic preview URLs per commit, and seamless environment variable management. Railway had pnpm compatibility issues in their build environment.

**Q: Why is the channel stub a separate service?**
Mirrors production architecture. In real life the channel service would be a completely separate microservice owned by the messaging provider. Keeping them separate means they can be scaled independently and the CRM doesn't need to know implementation details of delivery.

---

## Architecture Diagram
┌─────────────────────────────────┐

│         Next.js CRM App         │

│      (Vercel)                   │

│                                 │

│  Pages:                         │

│  / Dashboard                    │

│  /customers                     │

│  /segments                      │

│  /campaigns                     │

│  /analytics                     │

│  /copilot                       │

│                                 │

│  APIs:                          │

│  /api/customers                 │

│  /api/segments                  │

│  /api/segments/preview          │

│  /api/campaigns                 │

│  /api/campaigns/[id]/send       │

│  /api/receipts ◄────────────────┼──┐

│  /api/ai/segment                │  │

│  /api/ai/message                │  │ async

│  /api/ai/copilot                │  │ callbacks

└──────────────┬──────────────────┘  │

│ POST /send          │

▼                     │

┌─────────────────────────────────┐  │

│      Channel Stub Service       │──┘

│      (Vercel)                   │

│                                 │

│  POST /send → accepts message   │

│  Waits 1-4 seconds              │

│  POSTs back: delivered/opened/  │

│  clicked/failed                 │

│                                 │

│  Failure rate: 5%               │

│  Open rate: ~85%                │

│  Click rate: ~45%               │

└─────────────────────────────────┘

│

▼

┌─────────────────────────────────┐

│     PostgreSQL on Neon          │

│                                 │

│  Customer                       │

│    id, name, email, phone       │

│    city, tags[], totalSpend     │

│    orderCount, lastOrderAt      │

│                                 │

│  Order                          │

│    id, customerId, amount       │

│    items (JSON), channel        │

│                                 │

│  Segment                        │

│    id, name, filters (JSON)     │

│    customerIds[]                │

│                                 │

│  Campaign                       │

│    id, name, segmentId          │

│    channel, messageBody         │

│    status, sentAt               │

│                                 │

│  Communication                  │

│    id, campaignId, customerId   │

│    status, sentAt, deliveredAt  │

│    openedAt, clickedAt, failedAt│

└─────────────────────────────────┘
---

## What I'm Most Proud Of

1. **The async callback loop** — it works exactly like real messaging infrastructure
2. **AI Co-pilot** — genuinely useful, not a gimmick. It reads real segment data and makes intelligent recommendations
3. **Clean UI** — looks like a real product, not a take-home assignment
4. **End-to-end in 2 days** — scoped aggressively, built the right things

## What I'd Build Next

1. **Auth** — multi-tenant with brand workspaces
2. **Scheduled campaigns** — send at optimal time per user timezone
3. **A/B testing** — test two messages on a segment
4. **Revenue attribution** — track orders that came from a campaign
5. **Real channel integration** — Twilio for SMS, Gupshup for WhatsApp