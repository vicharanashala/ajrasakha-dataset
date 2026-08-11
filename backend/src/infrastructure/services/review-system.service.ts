// Environment variables are accessed inside the functions to ensure they are loaded

export interface OpenFeedbackResponse {
  success: boolean;
  error?: string;
}

export interface LocationState {
  stateCode: number;
  stateNameEnglish: string;
}

export interface LocationDistrict {
  districtCode: number;
  districtNameEnglish: string;
  stateCode: number;
}

/**
 * Calls the review system's PATCH /questions/feedbacks/question/:questionId endpoint
 * to open a feedback for review. Returns the parsed response — callers handle success/failure.
 */
export async function openFeedbackInReviewSystem(
  questionId: string,
): Promise<OpenFeedbackResponse> {
  const baseUrl = process.env['REVIEWER_BACKEND_URL'];
  const authKey = process.env['REVIEW_SYSTEM_AUTH_KEY'];
  
  const res = await fetch(
    `${baseUrl}/questions/feedbacks/question/${questionId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': authKey ?? '',
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

/**
 * Fetches all states from the Reviewer Backend Location API.
 */
export async function getStatesFromReviewSystem(): Promise<LocationState[]> {
  const baseUrl = process.env['REVIEWER_BACKEND_URL'];
  const authKey = process.env['REVIEW_SYSTEM_AUTH_KEY'];

  const res = await fetch(`${baseUrl}/location/states`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': authKey ?? '',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch states: HTTP ${res.status}`);
  }

  return res.json() as Promise<LocationState[]>;
}

/**
 * Fetches districts for a specific stateCode from the Reviewer Backend Location API.
 */
export async function getDistrictsFromReviewSystem(stateCode: number): Promise<LocationDistrict[]> {
  const baseUrl = process.env['REVIEWER_BACKEND_URL'];
  const authKey = process.env['REVIEW_SYSTEM_AUTH_KEY'];

  const res = await fetch(`${baseUrl}/location/districts?stateCode=${stateCode}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-key': authKey ?? '',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch districts: HTTP ${res.status}`);
  }

  return res.json() as Promise<LocationDistrict[]>;
}