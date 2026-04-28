#!/usr/bin/env node

const baseUrl = process.env.RIFQA_BASE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || 'http://127.0.0.1:5174'
const token = process.env.RIFQA_REVIEWER_ACCESS_TOKEN

if (!token) {
  console.error('RIFQA_REVIEWER_ACCESS_TOKEN is required to sync reviewed content seeds.')
  process.exit(1)
}

const url = new URL('/api/sync-reviewed-content', baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`)
const response = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
})

const payload = await response.json().catch(() => null)
if (!response.ok) {
  console.error(`Seed sync failed: ${response.status}`)
  console.error(JSON.stringify(payload, null, 2))
  process.exit(1)
}

console.log(`Seed sync complete: ${payload?.data?.synced ?? 0} reviewed content items`)
console.log(JSON.stringify(payload?.data ?? payload, null, 2))
