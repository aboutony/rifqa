import type { ApiLang } from './http.js'

export type RecommendationKind = 'relaxation_audio' | 'exercise'

export type WellnessRecommendation = {
  kind: RecommendationKind
  priority: 'low' | 'medium' | 'high'
  source: 'doctor' | 'ai_rules'
  title: string
  body: string
  trigger: string
}

export function buildWellnessRecommendations({
  lang,
  mood,
  sleepQuality,
  symptoms,
  hasDoctorExercisePlan = false,
}: {
  lang: ApiLang
  mood: string
  sleepQuality: number
  symptoms: string[]
  hasDoctorExercisePlan?: boolean
}): WellnessRecommendation[] {
  const lowered = [mood, ...symptoms].join(' ').toLowerCase()
  const stressSignal =
    sleepQuality <= 2 ||
    /anxious|panic|sad|stress|exhausted|tired|قلق|توتر|حزينة|مرهقة|متعبة/.test(lowered)
  const fatigueSignal = sleepQuality <= 2 || /exhausted|tired|fatigue|مرهقة|متعبة/.test(lowered)
  const recommendations: WellnessRecommendation[] = []

  if (stressSignal) {
    recommendations.push({
      kind: 'relaxation_audio',
      priority: sleepQuality <= 2 ? 'high' : 'medium',
      source: 'ai_rules',
      title: lang === 'ar' ? 'استرخاء صوتي الآن' : 'Audio relaxation now',
      body:
        lang === 'ar'
          ? 'اقترح جلسة قصيرة: تلاوة هادئة، دعاء، أو موسيقى تنفس من قائمتك الخاصة لمدة 7 دقائق.'
          : 'Try a short session: calm recitation, prayer, or breathing music from your playlist for 7 minutes.',
      trigger: 'stress_or_poor_sleep_pattern',
    })
  }

  if (!fatigueSignal) {
    recommendations.push({
      kind: 'exercise',
      priority: 'low',
      source: hasDoctorExercisePlan ? 'doctor' : 'ai_rules',
      title: lang === 'ar' ? 'حركة آمنة اليوم' : 'Safe movement today',
      body:
        lang === 'ar'
          ? hasDoctorExercisePlan
            ? 'اتبعي خطة الحركة المسجلة من طبيبتك. تعليمات الطبيبة تتجاوز أي اقتراح AI.'
            : 'لا توجد تعليمات طبيبة مسجلة. يمكن تجربة مشي خفيف أو تمدد لطيف إذا لم توجد أعراض مقلقة.'
          : hasDoctorExercisePlan
            ? 'Follow your stored clinician movement plan. Clinician instructions override AI suggestions.'
            : 'No clinician plan is stored. Try an easy walk or gentle stretch if there are no concerning symptoms.',
      trigger: hasDoctorExercisePlan ? 'doctor_plan_available' : 'no_contraindication_detected',
    })
  }

  return recommendations
}

