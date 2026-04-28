import assert from 'node:assert/strict'
import { classifyCompanionSafety, redactSensitiveIdentifiers } from '../api/_lib/ai-policy.js'
import { selectRelevantReviewedContent } from '../api/_lib/maternal-os.js'
import type { ApiLang } from '../api/_lib/http.js'

type RetrievalCase = {
  name: string
  lang: ApiLang
  query: string
  expectedId: string
}

const cases: RetrievalCase[] = [
  {
    name: 'Arabic reduced movement selects fetal movement guidance',
    lang: 'ar',
    query: 'أشعر أن قلة الحركة اليوم غير معتادة',
    expectedId: 'reduced-movement',
  },
  {
    name: 'English reduced movement selects fetal movement guidance',
    lang: 'en',
    query: 'Baby movement is less than usual today',
    expectedId: 'reduced-movement',
  },
  {
    name: 'Arabic bleeding and severe pain selects urgent pregnancy signs',
    lang: 'ar',
    query: 'عندي نزيف وألم شديد',
    expectedId: 'urgent-pregnancy-signs',
  },
  {
    name: 'English bleeding and severe pain selects urgent pregnancy signs',
    lang: 'en',
    query: 'I have bleeding and severe pain',
    expectedId: 'urgent-pregnancy-signs',
  },
  {
    name: 'Arabic postpartum heavy bleeding selects postpartum warning signs',
    lang: 'ar',
    query: 'نزيف غزير بعد الولادة مع حرارة',
    expectedId: 'postpartum-warning-signs',
  },
  {
    name: 'English postpartum chest pain selects postpartum warning signs',
    lang: 'en',
    query: 'After delivery I have chest pain and shortness of breath',
    expectedId: 'postpartum-warning-signs',
  },
  {
    name: 'Arabic walking question selects exercise safety',
    lang: 'ar',
    query: 'هل المشي والتمدد آمن في الحمل؟',
    expectedId: 'exercise-safety',
  },
  {
    name: 'English workout question selects exercise safety',
    lang: 'en',
    query: 'Can I workout or stretch during pregnancy?',
    expectedId: 'exercise-safety',
  },
  {
    name: 'Arabic anxiety selects mental health support',
    lang: 'ar',
    query: 'أشعر بقلق وهلع ولا أعرف ماذا أفعل',
    expectedId: 'mental-health-support',
  },
  {
    name: 'English self-harm concern selects mental health support',
    lang: 'en',
    query: 'I feel unsafe and worried I might self-harm',
    expectedId: 'mental-health-support',
  },
  {
    name: 'Arabic Ramadan fasting selects Ramadan guidance',
    lang: 'ar',
    query: 'هل الصيام في رمضان آمن وأنا حامل؟',
    expectedId: 'ramadan-pregnancy-guidance',
  },
  {
    name: 'English Ramadan fasting selects Ramadan guidance',
    lang: 'en',
    query: 'Can I fast during Ramadan while pregnant?',
    expectedId: 'ramadan-pregnancy-guidance',
  },
]

for (const item of cases) {
  const matches = selectRelevantReviewedContent({ lang: item.lang, query: item.query })
  assert.equal(
    matches[0]?.id,
    item.expectedId,
    `${item.name}: expected top match ${item.expectedId}, got ${matches.map((match) => match.id).join(', ') || 'none'}`,
  )
}

assert.deepEqual(
  selectRelevantReviewedContent({ lang: 'en', query: 'What color is the app logo?' }),
  [],
  'Unrelated English query should not retrieve reviewed medical content',
)

assert.deepEqual(
  selectRelevantReviewedContent({ lang: 'ar', query: 'ما لون شعار التطبيق؟' }),
  [],
  'Unrelated Arabic query should not retrieve reviewed medical content',
)

assert.deepEqual(
  selectRelevantReviewedContent({
    lang: 'en',
    query: 'Baby movement is less than usual today',
    now: new Date('2026-10-28T09:00:00Z'),
  }),
  [],
  'Expired reviewed content should not be selected for AI retrieval',
)

assert.equal(
  selectRelevantReviewedContent({
    lang: 'en',
    query: 'Baby movement is less than usual today',
    now: new Date('2026-10-27T09:00:00Z'),
  })[0]?.id,
  'reduced-movement',
  'Reviewed content should remain selectable through its expiry date',
)

const diagnosisDecision = classifyCompanionSafety('Do I have preeclampsia? Please diagnose me', 'en')
assert.equal(diagnosisDecision.kind, 'medical_diagnosis')
assert.equal(diagnosisDecision.shouldUseModel, false)
assert.match(diagnosisDecision.message, /cannot diagnose/i)

const medicationDecision = classifyCompanionSafety('Can I take ibuprofen and what dose?', 'en')
assert.equal(medicationDecision.kind, 'medication')
assert.equal(medicationDecision.shouldUseModel, false)
assert.match(medicationDecision.message, /cannot choose a medication or dose/i)

const selfHarmDecision = classifyCompanionSafety('I might self-harm tonight', 'en')
assert.equal(selfHarmDecision.kind, 'self_harm')
assert.equal(selfHarmDecision.crisisSafeMode, true)
assert.equal(selfHarmDecision.shouldUseModel, false)
assert.match(selfHarmDecision.message, /never puts crisis support behind a paywall/i)

assert.equal(
  redactSensitiveIdentifiers('اسمي سارة الأحمد ورقم الهوية 1234567890 والجوال 0501234567'),
  'اسمي [name] ورقم الهوية [id] والجوال [phone]',
  'Arabic redaction should remove sensitive name/id/phone details',
)

console.log(`retrieval and AI safety tests passed: ${cases.length + 8}`)
