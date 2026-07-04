export type AuthMember = {
  id: number;
  name: string;
};

export type AuthSession = {
  token: string;
  member: AuthMember;
};

type KakaoAuthRequest = {
  code: string;
  redirectUri: string;
};

const AUTH_SESSION_STORAGE_KEY = 'unsik:auth_session';
const KAKAO_OAUTH_STATE_STORAGE_KEY = 'unsik:kakao_oauth_state';
const KAKAO_AUTHORIZATION_URL = 'https://kauth.kakao.com/oauth/authorize';

export const KAKAO_CALLBACK_PATH = '/auth/kakao/callback';

const verifiedKakaoOAuthStates = new Set<string>();

export async function authenticateWithKakaoCode(code: string): Promise<AuthSession> {
  const body: KakaoAuthRequest = {
    code,
    redirectUri: getKakaoRedirectUri(),
  };
  const response = await fetch(createApiUrl('/api/auth/kakao'), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readAuthErrorMessage(response));
  }

  return parseAuthSession(await response.json());
}

export function createKakaoLoginUrl(): string {
  const clientId = import.meta.env.VITE_KAKAO_REST_API_KEY?.trim();

  if (!clientId) {
    throw new Error('카카오 REST API 키가 설정되지 않았어요.');
  }

  const state = createOAuthState();
  saveKakaoOAuthState(state);

  const url = new URL(KAKAO_AUTHORIZATION_URL);
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', getKakaoRedirectUri());
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', state);

  return url.toString();
}

export function verifyKakaoOAuthState(returnedState: string | null): void {
  if (returnedState && verifiedKakaoOAuthStates.has(returnedState)) {
    return;
  }

  const expectedState = window.sessionStorage.getItem(KAKAO_OAUTH_STATE_STORAGE_KEY);

  if (!expectedState || !returnedState || expectedState !== returnedState) {
    throw new Error('카카오 로그인 요청 정보를 확인할 수 없어요. 다시 시도해 주세요.');
  }

  verifiedKakaoOAuthStates.add(returnedState);
  window.sessionStorage.removeItem(KAKAO_OAUTH_STATE_STORAGE_KEY);
}

export function saveAuthSession(session: AuthSession): void {
  try {
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // In-memory app state still keeps the user signed in for this page session.
  }
}

export function loadAuthSession(): AuthSession | null {
  try {
    const rawSession = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);

    if (!rawSession) {
      return null;
    }

    return parseAuthSession(JSON.parse(rawSession));
  } catch {
    try {
      window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // Ignore unavailable storage during app bootstrap.
    }

    return null;
  }
}

function createApiUrl(path: `/${string}`): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');

  return `${baseUrl}${path}`;
}

function getKakaoRedirectUri(): string {
  const configuredRedirectUri = import.meta.env.VITE_KAKAO_REDIRECT_URI?.trim();

  if (configuredRedirectUri) {
    return configuredRedirectUri;
  }

  return new URL(KAKAO_CALLBACK_PATH, window.location.origin).toString();
}

function saveKakaoOAuthState(state: string): void {
  try {
    window.sessionStorage.setItem(KAKAO_OAUTH_STATE_STORAGE_KEY, state);
  } catch {
    throw new Error('브라우저 저장소를 사용할 수 없어 카카오 로그인을 시작할 수 없어요.');
  }
}

function createOAuthState(): string {
  const bytes = new Uint8Array(16);

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function readAuthErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body: unknown = await response.json().catch(() => null);

    if (isRecord(body)) {
      const message = body.message ?? body.error;

      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return `카카오 로그인 요청이 실패했어요. (${response.status})`;
  }

  const text = await response.text().catch(() => '');

  return text.trim() || `카카오 로그인 요청이 실패했어요. (${response.status})`;
}

function parseAuthSession(value: unknown): AuthSession {
  if (!isRecord(value) || typeof value.token !== 'string' || !isRecord(value.member)) {
    throw new Error('카카오 로그인 응답 형식이 올바르지 않아요.');
  }

  const { member } = value;

  if (typeof member.id !== 'number' || typeof member.name !== 'string') {
    throw new Error('카카오 로그인 회원 정보 형식이 올바르지 않아요.');
  }

  return {
    token: value.token,
    member: {
      id: member.id,
      name: member.name,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
