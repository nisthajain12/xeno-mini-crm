import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const firstNames = ['Priya', 'Arjun', 'Meera', 'Rahul', 'Ananya', 'Vikram', 'Zara', 'Kabir', 'Nisha', 'Rohan', 'Aisha', 'Dev', 'Sia', 'Aditya', 'Kavya']
const lastNames = ['Sharma', 'Patel', 'Mehta', 'Nair', 'Reddy', 'Joshi', 'Khan', 'Iyer', 'Gupta', 'Singh']
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Jaipur', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata']
const allTags = ['vip', 'new', 'at-risk', 'loyal', 'sale-buyer', 'premium']

const products = [
  { name: 'Floral Wrap Dress', price: 2999 },
  { name: 'Linen Co-ord Set', price: 4499 },
  { name: 'Embroidered Kurta', price: 1899 },
  { name: 'Silk Saree', price: 8999 },
  { name: 'Denim Jacket', price: 3499 },
  { name: 'Palazzo Set', price: 2499 },
  { name: 'Anarkali Suit', price: 5999 },
  { name: 'Casual T-shirt Pack', price: 999 },
  { name: 'Trench Coat', price: 6999 },
  { name: 'Boho Skirt', price: 1599 },
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.communication.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.segment.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()

  const customers = []

  for (let i = 0; i < 60; i++) {
    const firstName = randomFrom(firstNames)
    const lastName = randomFrom(lastNames)
    const name = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`
    const city = randomFrom(cities)
    const customerTags = [randomFrom(allTags)]

    const profile = i % 5
    let orderCount: number
    let lastOrderDaysAgo: number

    if (profile === 0) {
      orderCount = randomInt(6, 15)
      lastOrderDaysAgo = randomInt(1, 20)
      customerTags.push('vip')
    } else if (profile === 1) {
      orderCount = randomInt(2, 5)
      lastOrderDaysAgo = randomInt(61, 120)
      customerTags.push('at-risk')
    } else if (profile === 2) {
      orderCount = randomInt(1, 2)
      lastOrderDaysAgo = randomInt(1, 30)
      customerTags.push('new')
    } else if (profile === 3) {
      orderCount = randomInt(3, 6)
      lastOrderDaysAgo = randomInt(45, 90)
    } else {
      orderCount = randomInt(2, 7)
      lastOrderDaysAgo = randomInt(10, 50)
    }

    let totalSpend = 0
    const orderData = []

    for (let j = 0; j < orderCount; j++) {
      const numItems = randomInt(1, 3)
      const items = []
      let orderAmount = 0

      for (let k = 0; k < numItems; k++) {
        const product = randomFrom(products)
        items.push({ name: product.name, qty: 1, price: product.price })
        orderAmount += product.price
      }

      totalSpend += orderAmount
      const orderDaysAgo = j === 0
        ? lastOrderDaysAgo
        : randomInt(lastOrderDaysAgo, lastOrderDaysAgo + 90)

      orderData.push({
        amount: orderAmount,
        items,
        channel: randomFrom(['online', 'store']),
        createdAt: daysAgo(orderDaysAgo),
      })
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        email,
        phone: `+91 ${randomInt(70000, 99999)} ${randomInt(10000, 99999)}`,
        city,
        tags: customerTags,
        totalSpend,
        orderCount,
        lastOrderAt: daysAgo(lastOrderDaysAgo),
        orders: { create: orderData },
      },
    })

    customers.push(customer)
    console.log(`  ✓ ${customer.name} — ₹${totalSpend.toLocaleString()} — ${orderCount} orders`)
  }

  console.log(`\n✅ Created ${customers.length} customers`)

  // Sample segment
  const highValue = customers.filter(
    c => c.totalSpend > 10000 && c.lastOrderAt && c.lastOrderAt > daysAgo(30)
  )

  await prisma.segment.create({
    data: {
      name: 'High-value loyalists',
      description: 'Spent over ₹10,000 and ordered in the last 30 days',
      filters: { minTotalSpend: 10000, maxDaysSinceLastOrder: 30 },
      customerIds: highValue.map(c => c.id),
    },
  })

  console.log(`✅ Created sample segment with ${highValue.length} customers`)
  console.log('🎉 Seed complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())