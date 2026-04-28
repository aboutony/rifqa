import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getLang, readString, sendJson, sendMethodNotAllowed, type ApiLang } from './_lib/http.js'
import { getRequestContext, type RequestContext } from './_lib/supabase.js'
import { isReviewer } from './review-queue.js'

type PreferenceRow = {
  channel: string
  quiet_hours_start: string
  quiet_hours_end: string
  stage_milestones: boolean
  safety_reminders: boolean
  daily_checkin_time?: string | null
  checkin_reminders?: boolean | null
  pregnancy_week_notifications?: boolean | null
  appointment_reminders?: boolean | null
  vaccination_reminders?: boolean | null
  content_review_expiry_reminders?: boolean | null
  notification_language?: ApiLang | null
  appointment_reminder_time?: string | null
  vaccination_reminder_time?: string | null
}

const RULES = [
  'daily_checkin',
  'pregnancy_week',
  'missed_checkin_recovery',
  'symptom_followup',
  'postpartum_transition',
  'appointment',
  'vaccination',
  'content_review_expiry',
  'quiet_hours',
]

function readBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function normalizeLang(value: unknown, fallback: ApiLang): ApiLang {
  return value === 'en' || value === 'ar' ? value : fallback
}

function notificationCopy(lang: ApiLang) {
  if (lang === 'en') {
    return {
      pregnancyWeek: {
        title: 'Your week update is ready',
        body: 'A calm week-by-week note is ready in RIFQA.',
      },
      dailyCheckin: {
        title: 'Daily check-in',
        body: 'How are mood, sleep, symptoms, and movement today?',
      },
      appointment: {
        title: 'Clinic appointment reminder',
        body: 'Prepare your questions and bring any recent logs.',
      },
      vaccination: {
        title: 'Baby vaccination reminder',
        body: 'A vaccine dose is coming up in the Saudi schedule.',
      },
      contentReviewExpiry: {
        title: 'Content review expiring',
        body: 'A health card needs reviewer renewal before mothers see stale guidance.',
      },
      quietHours: {
        title: 'Quiet hours active',
        body: 'Non-urgent reminders wait until quiet hours end.',
      },
    }
  }

  return {
    pregnancyWeek: {
      title: 'تحديث أسبوع الحمل جاهز',
      body: 'تنتظرك ملاحظة هادئة ومراجعة حسب أسبوع الحمل.',
    },
    dailyCheckin: {
      title: 'الفحص اليومي',
      body: 'كيف المزاج والنوم والأعراض وحركة الطفل اليوم؟',
    },
    appointment: {
      title: 'تذكير بموعد العيادة',
      body: 'جهزي أسئلتك وخذي معك آخر السجلات المهمة.',
    },
    vaccination: {
      title: 'تذكير بتطعيم الطفل',
      body: 'هناك جرعة قادمة حسب جدول التطعيمات السعودي.',
    },
    contentReviewExpiry: {
      title: 'مراجعة محتوى تنتهي قريبا',
      body: 'بطاقة صحية تحتاج تجديد المراجعة قبل أن تظهر للأمهات.',
    },
    quietHours: {
      title: 'ساعات الهدوء مفعلة',
      body: 'التذكيرات غير العاجلة تنتظر حتى انتهاء ساعات الهدوء.',
    },
  }
}

function mapPreference(row: PreferenceRow, requestedLang: ApiLang) {
  const language = normalizeLang(row.notification_language, requestedLang)
  return {
    channel: row.channel,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
    dailyCheckinTime: row.daily_checkin_time ?? '20:00',
    checkinReminders: row.checkin_reminders ?? true,
    pregnancyWeekNotifications: row.pregnancy_week_notifications ?? row.stage_milestones ?? true,
    appointmentReminders: row.appointment_reminders ?? true,
    vaccinationReminders: row.vaccination_reminders ?? true,
    contentReviewExpiryReminders: row.content_review_expiry_reminders ?? true,
    notificationLanguage: language,
    appointmentReminderTime: row.appointment_reminder_time ?? '09:00',
    vaccinationReminderTime: row.vaccination_reminder_time ?? '09:00',
    stageMilestones: row.stage_milestones,
    safetyReminders: row.safety_reminders,
    copy: notificationCopy(language),
    rules: RULES,
    stored: true,
  }
}

function defaultPreference(lang: ApiLang) {
  return {
    channel: 'push',
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    dailyCheckinTime: '20:00',
    checkinReminders: true,
    pregnancyWeekNotifications: true,
    appointmentReminders: true,
    vaccinationReminders: true,
    contentReviewExpiryReminders: true,
    notificationLanguage: lang,
    appointmentReminderTime: '09:00',
    vaccinationReminderTime: '09:00',
    stageMilestones: true,
    safetyReminders: true,
    copy: notificationCopy(lang),
    rules: RULES,
    stored: false,
  }
}

async function getScheduled(context: RequestContext, preference: ReturnType<typeof defaultPreference>, lang: ApiLang) {
  const copy = notificationCopy(preference.notificationLanguage)
  const scheduled: Array<{ type: string; title: string; body: string; scheduledFor?: string; meta?: Record<string, unknown> }> = []
  const today = new Date()

  if (preference.checkinReminders) {
    scheduled.push({
      type: 'daily_checkin',
      title: copy.dailyCheckin.title,
      body: copy.dailyCheckin.body,
      scheduledFor: `${today.toISOString().slice(0, 10)}T${preference.dailyCheckinTime}:00`,
    })
  }

  if (context.supabase && context.userId && preference.pregnancyWeekNotifications) {
    const { data } = await context.supabase
      .from('pregnancies')
      .select('current_week, due_date')
      .eq('user_id', context.userId)
      .eq('status', 'active')
      .maybeSingle()
    if (data?.current_week) {
      scheduled.push({
        type: 'pregnancy_week',
        title: copy.pregnancyWeek.title,
        body: lang === 'en' ? `Week ${data.current_week} guidance is ready.` : `إرشادات الأسبوع ${data.current_week} جاهزة.`,
        meta: { currentWeek: data.current_week, dueDate: data.due_date },
      })
    }
  } else if (preference.pregnancyWeekNotifications) {
    scheduled.push({ type: 'pregnancy_week', title: copy.pregnancyWeek.title, body: copy.pregnancyWeek.body, meta: { currentWeek: 28 } })
  }

  if (context.supabase && context.userId && preference.vaccinationReminders) {
    const { data } = await context.supabase
      .from('vaccine_records')
      .select('id, vaccine_name, due_age_month, completed_at')
      .eq('user_id', context.userId)
      .is('completed_at', null)
      .order('due_age_month', { ascending: true })
      .limit(3)
    for (const row of data ?? []) {
      scheduled.push({
        type: 'vaccination',
        title: copy.vaccination.title,
        body: row.vaccine_name || copy.vaccination.body,
        scheduledFor: `${today.toISOString().slice(0, 10)}T${preference.vaccinationReminderTime}:00`,
        meta: { vaccineId: row.id, dueAgeMonth: row.due_age_month },
      })
    }
  } else if (preference.vaccinationReminders) {
    scheduled.push({
      type: 'vaccination',
      title: copy.vaccination.title,
      body: copy.vaccination.body,
      scheduledFor: `${today.toISOString().slice(0, 10)}T${preference.vaccinationReminderTime}:00`,
    })
  }

  if (preference.appointmentReminders) {
    scheduled.push({
      type: 'appointment',
      title: copy.appointment.title,
      body: copy.appointment.body,
      scheduledFor: `${today.toISOString().slice(0, 10)}T${preference.appointmentReminderTime}:00`,
    })
  }

  if (context.supabase && preference.contentReviewExpiryReminders && await isReviewer(context)) {
    const inThirtyDays = new Date(today.getTime() + 30 * 86_400_000).toISOString().slice(0, 10)
    const { data } = await context.supabase
      .from('reviewed_content')
      .select('id, title, expiry_date')
      .eq('status', 'approved')
      .lte('expiry_date', inThirtyDays)
      .order('expiry_date', { ascending: true })
      .limit(5)
    for (const row of data ?? []) {
      scheduled.push({
        type: 'content_review_expiry',
        title: copy.contentReviewExpiry.title,
        body: row.title || copy.contentReviewExpiry.body,
        meta: { contentId: row.id, expiryDate: row.expiry_date },
      })
    }
  } else if (preference.contentReviewExpiryReminders) {
    scheduled.push({ type: 'content_review_expiry', title: copy.contentReviewExpiry.title, body: copy.contentReviewExpiry.body })
  }

  return scheduled
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const lang = getLang(req)
  const context = await getRequestContext(req)

  if (req.method === 'GET') {
    if (context.supabase && context.userId) {
      const { data, error } = await context.supabase
        .from('notification_preferences')
        .select('channel, quiet_hours_start, quiet_hours_end, stage_milestones, safety_reminders, daily_checkin_time, checkin_reminders, pregnancy_week_notifications, appointment_reminders, vaccination_reminders, content_review_expiry_reminders, notification_language, appointment_reminder_time, vaccination_reminder_time')
        .eq('user_id', context.userId)
        .eq('channel', 'push')
        .maybeSingle()

      if (error) throw error
      if (data) {
        const preference = mapPreference(data, lang)
        return sendJson(res, 200, { data: { ...preference, scheduled: await getScheduled(context, preference, lang) }, meta: { persisted: true } })
      }
    }

    const preference = defaultPreference(lang)
    return sendJson(res, 200, {
      data: { ...preference, scheduled: await getScheduled(context, preference, lang) },
      meta: { persisted: false },
    })
  }

  if (req.method !== 'POST') return sendMethodNotAllowed(res, ['GET', 'POST'])

  const body = typeof req.body === 'object' && req.body !== null ? req.body : {}
  const quietHoursStart = readString(body.quietHoursStart, '22:00')
  const quietHoursEnd = readString(body.quietHoursEnd, '08:00')
  const dailyCheckinTime = readString(body.dailyCheckinTime, '20:00')
  const channel = readString(body.channel, 'push')
  const notificationLanguage = normalizeLang(body.notificationLanguage, lang)
  const appointmentReminderTime = readString(body.appointmentReminderTime, '09:00')
  const vaccinationReminderTime = readString(body.vaccinationReminderTime, '09:00')
  const checkinReminders = readBoolean(body.checkinReminders, true)
  const pregnancyWeekNotifications = readBoolean(body.pregnancyWeekNotifications, true)
  const appointmentReminders = readBoolean(body.appointmentReminders, true)
  const vaccinationReminders = readBoolean(body.vaccinationReminders, true)
  const contentReviewExpiryReminders = readBoolean(body.contentReviewExpiryReminders, true)
  const id = crypto.randomUUID()

  if (context.supabase && context.userId) {
    const { data, error } = await context.supabase.from('notification_preferences').upsert(
      {
        id,
        user_id: context.userId,
        channel,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        daily_checkin_time: dailyCheckinTime,
        checkin_reminders: checkinReminders,
        pregnancy_week_notifications: pregnancyWeekNotifications,
        appointment_reminders: appointmentReminders,
        vaccination_reminders: vaccinationReminders,
        content_review_expiry_reminders: contentReviewExpiryReminders,
        notification_language: notificationLanguage,
        appointment_reminder_time: appointmentReminderTime,
        vaccination_reminder_time: vaccinationReminderTime,
        stage_milestones: pregnancyWeekNotifications,
        safety_reminders: true,
      },
      { onConflict: 'user_id,channel' },
    ).select('channel, quiet_hours_start, quiet_hours_end, stage_milestones, safety_reminders, daily_checkin_time, checkin_reminders, pregnancy_week_notifications, appointment_reminders, vaccination_reminders, content_review_expiry_reminders, notification_language, appointment_reminder_time, vaccination_reminder_time').single()

    if (error) throw error
    const preference = mapPreference(data, lang)
    return sendJson(res, 200, { data: { ...preference, scheduled: await getScheduled(context, preference, lang) }, meta: { persisted: true } })
  }

  const preference = {
    ...defaultPreference(notificationLanguage),
    channel,
    quietHoursStart,
    quietHoursEnd,
    dailyCheckinTime,
    checkinReminders,
    pregnancyWeekNotifications,
    appointmentReminders,
    vaccinationReminders,
    contentReviewExpiryReminders,
    appointmentReminderTime,
    vaccinationReminderTime,
  }
  return sendJson(res, 200, { data: { ...preference, scheduled: await getScheduled(context, preference, lang) } })
}
