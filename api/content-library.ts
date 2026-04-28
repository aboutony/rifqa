import type { VercelRequest, VercelResponse } from '@vercel/node'
import { capabilities, getPublicReviewedContentFromItems } from './_lib/maternal-os.js'
import { getLang, sendJson, sendMethodNotAllowed } from './_lib/http.js'
import { getPersistedReviewedContent } from './_lib/reviewed-content-store.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return sendMethodNotAllowed(res, ['GET'])
  const lang = getLang(req)
  const content = await getPersistedReviewedContent(lang)

  return sendJson(res, 200, {
    data: {
      reviewedContent: getPublicReviewedContentFromItems(content.items),
      capabilities,
      stored: content.stored,
      reviewPolicy: {
        healthContentMustBeApproved: true,
        defaultExpiryMonths: 6,
        userFacingBadgeFields: ['reviewerName', 'reviewerSpecialty', 'approvalDate', 'expiryDate', 'status'],
      },
    },
  })
}
