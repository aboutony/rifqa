import assert from 'node:assert/strict'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import checkins from '../api/checkins.js'
import babyLogs from '../api/baby-logs.js'
import postpartumLogs from '../api/postpartum-logs.js'
import privacy from '../api/privacy.js'
import reviewQueue from '../api/review-queue.js'
import b2bReports from '../api/b2b-reports.js'
import careRouting from '../api/care-routing.js'
import contentLibrary from '../api/content-library.js'

type Handler = (req: VercelRequest, res: VercelResponse) => unknown | Promise<unknown>
type ResponseCapture = {
  statusCode: number
  headers: Record<string, string>
  body: unknown
}

function makeReq(method: string, body: Record<string, unknown> = {}, query: Record<string, string> = {}): VercelRequest {
  return {
    method,
    body,
    query,
    headers: {},
  } as VercelRequest
}

function makeRes(): VercelResponse & ResponseCapture {
  const capture = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: undefined as unknown,
    setHeader(name: string, value: number | string | readonly string[]) {
      capture.headers[name] = Array.isArray(value) ? value.join(', ') : String(value)
      return capture
    },
    status(code: number) {
      capture.statusCode = code
      return capture
    },
    json(payload: unknown) {
      capture.body = payload
      return capture
    },
  }
  return capture as unknown as VercelResponse & ResponseCapture
}

async function invoke(handler: Handler, method: string, body: Record<string, unknown> = {}, query: Record<string, string> = {}) {
  const res = makeRes()
  await handler(makeReq(method, body, query), res)
  return res
}

function dataOf<T>(res: ResponseCapture): T {
  assert.equal(res.headers['Content-Type'], 'application/json; charset=utf-8')
  return (res.body as { data: T }).data
}

const urgentCheckin = await invoke(checkins, 'POST', {
  mood: 'Scared',
  sleepQuality: 1,
  symptoms: ['bleeding', 'severe pain', 'reduced movement'],
  note: 'Needs help now',
}, { lang: 'en' })
assert.equal(urgentCheckin.statusCode, 201)
const urgentCheckinData = dataOf<{ assessment: { level: string; nextActions: string[] }; stored: boolean }>(urgentCheckin)
assert.equal(urgentCheckinData.assessment.level, 'urgent')
assert.equal(urgentCheckinData.stored, false)
assert.ok(urgentCheckinData.assessment.nextActions.length > 0)

const checkinHistory = await invoke(checkins, 'GET', {}, { lang: 'en' })
assert.equal(checkinHistory.statusCode, 200)
const checkinHistoryData = dataOf<{ items: unknown[]; trends: { count: number } }>(checkinHistory)
assert.ok(checkinHistoryData.items.length >= 1)
assert.ok(checkinHistoryData.trends.count >= 1)

const babyLog = await invoke(babyLogs, 'POST', {
  logType: 'medication',
  amount: 2,
  unit: 'ml',
  note: 'Given as prescribed',
}, { lang: 'en' })
assert.equal(babyLog.statusCode, 201)
assert.equal(dataOf<{ logType: string; amount: number; stored: boolean }>(babyLog).logType, 'medication')

const postpartumLog = await invoke(postpartumLogs, 'POST', {
  logType: 'bleeding',
  severity: 4,
  painLevel: 3,
  sleepHours: 2,
  feedingStress: 4,
  note: 'Heavy bleeding watch',
}, { lang: 'en' })
assert.equal(postpartumLog.statusCode, 201)
const postpartumData = dataOf<{ bleeding: string; guidance: string }>(postpartumLog)
assert.equal(postpartumData.bleeding, 'light')
assert.match(postpartumData.guidance, /saved|urgent|watch/i)

const privacyGet = await invoke(privacy, 'GET', {}, { lang: 'en' })
assert.equal(privacyGet.statusCode, 200)
assert.equal(dataOf<{ settings: { lowPiiMode: boolean }; stored: boolean }>(privacyGet).settings.lowPiiMode, true)

const privacyUpdate = await invoke(privacy, 'PUT', {
  aiContextEnabled: false,
  lowPiiMode: true,
  rawChatAnalytics: false,
}, { lang: 'en' })
assert.equal(privacyUpdate.statusCode, 200)
assert.equal(dataOf<{ settings: { aiContextEnabled: boolean } }>(privacyUpdate).settings.aiContextEnabled, false)

const privacyExport = await invoke(privacy, 'POST', { requestType: 'export' }, { lang: 'en' })
assert.equal(privacyExport.statusCode, 201)
const exportData = dataOf<{ requestType: string; status: string; exportBundle?: { exportMetadata: { format: string } } }>(privacyExport)
assert.equal(exportData.requestType, 'export')
assert.equal(exportData.status, 'completed')
assert.equal(exportData.exportBundle?.exportMetadata.format, 'rifqa-demo-privacy-export-v1')

const privacyDelete = await invoke(privacy, 'POST', { requestType: 'delete', confirmDeletion: true }, { lang: 'en' })
assert.equal(privacyDelete.statusCode, 201)
assert.equal(dataOf<{ requestType: string; status: string }>(privacyDelete).requestType, 'delete')

const adminAccess = await invoke(reviewQueue, 'GET', {}, { access: '1', lang: 'en' })
assert.equal(adminAccess.statusCode, 200)
assert.equal(dataOf<{ canReview: boolean }>(adminAccess).canReview, true)

const reviewList = await invoke(reviewQueue, 'GET', {}, { lang: 'en' })
assert.equal(reviewList.statusCode, 200)
const reviewListData = dataOf<{ queue: Array<{ id: string }>; reminders: unknown[]; actions: string[] }>(reviewList)
assert.ok(reviewListData.queue.length > 0)
assert.ok(reviewListData.actions.includes('renew'))

const reviewAction = await invoke(reviewQueue, 'POST', {
  contentId: reviewListData.queue[0]?.id,
  action: 'renew',
  reviewerName: 'QA Reviewer',
  reviewerSpecialty: 'Clinical QA',
}, { lang: 'en' })
assert.equal(reviewAction.statusCode, 200)
assert.equal(dataOf<{ action: string }>(reviewAction).action, 'renew')

const contentSearch = await invoke(contentLibrary, 'GET', {}, { lang: 'en', q: 'reduced movement' })
assert.equal(contentSearch.statusCode, 200)
assert.ok(dataOf<{ reviewedContent: Array<{ id: string }> }>(contentSearch).reviewedContent.some((item) => item.id === 'reduced-movement'))

const b2bReport = await invoke(b2bReports, 'GET', {}, { lang: 'en' })
assert.equal(b2bReport.statusCode, 200)
const b2bData = dataOf<{ reports: Array<{ userCount: number }>; threshold: number; aggregateOnly: boolean }>(b2bReport)
assert.equal(b2bData.aggregateOnly, true)
assert.ok(b2bData.reports.every((item) => item.userCount >= b2bData.threshold))

const emergencyCareRoute = await invoke(careRouting, 'POST', {
  concern: 'I have bleeding and severe pain',
  stage: 'pregnancy',
  country: 'SA',
}, { lang: 'en' })
assert.equal(emergencyCareRoute.statusCode, 200)
assert.equal(dataOf<{ level: string; country: string }>(emergencyCareRoute).level, 'urgent')

const postpartumCareRoute = await invoke(careRouting, 'POST', {
  concern: 'After birth I have fever and heavy bleeding',
  stage: 'postpartum',
  country: 'SA',
}, { lang: 'en' })
assert.equal(postpartumCareRoute.statusCode, 200)
assert.equal(dataOf<{ level: string }>(postpartumCareRoute).level, 'urgent')

console.log('api, privacy, admin, review, log, and safety scenario tests passed')
