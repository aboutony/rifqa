import type { ApiLang } from './http.js'
import {
  getReviewedContent,
  mergeReviewedContentRows,
  type ReviewedContent,
  type ReviewedContentPersistedRow,
} from './maternal-os.js'
import { getServiceClient } from './supabase.js'

export async function getPersistedReviewedContent(lang: ApiLang): Promise<{ items: ReviewedContent[]; stored: boolean }> {
  const supabase = getServiceClient()
  if (!supabase) return { items: getReviewedContent(lang), stored: false }

  const { data, error } = await supabase
    .from('reviewed_content')
    .select('id, stage, title, summary, reviewer_name, reviewer_specialty, approval_date, expiry_date, status, citations')

  if (error) throw error
  return {
    items: mergeReviewedContentRows(lang, (data ?? []) as ReviewedContentPersistedRow[]),
    stored: true,
  }
}
