const REVIEWER_BACKEND_URL = process.env['REVIEWER_BACKEND_URL'];
const REVIEW_SYSTEM_AUTH_KEY = process.env['REVIEW_SYSTEM_AUTH_KEY'];

export interface OpenFeedbackResponse {
  success: boolean;
  error?: string;
}

/**
 * Calls the review system's PATCH /questions/feedbacks/question/:questionId endpoint
 * to open a feedback for review. Returns the parsed response — callers handle success/failure.
 */
export async function openFeedbackInReviewSystem(
  questionId: string,
): Promise<OpenFeedbackResponse> {
  const res = await fetch(
    `${REVIEWER_BACKEND_URL}/questions/feedbacks/question/${questionId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': REVIEW_SYSTEM_AUTH_KEY ?? '',
      },
      body: JSON.stringify({ source: 'DATASET' }),
    },
  );

  if (!res.ok) {
    let error = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      error = body?.error ?? body?.message ?? error;
    } catch {
      // use status text as fallback
    }
    return { success: false, error };
  }

  return res.json() as Promise<OpenFeedbackResponse>;
}