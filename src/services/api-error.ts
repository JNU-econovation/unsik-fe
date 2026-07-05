export type ApiErrorCode = number | string;

const DEFAULT_REASON = '요청을 처리할 수 없어요.';

const HTTP_STATUS_REASONS: Record<number, string> = {
  400: '잘못된 요청입니다. 입력값을 확인해 주세요.',
  401: '로그인이 만료되었거나 인증 정보가 없습니다.',
  403: '이 작업을 수행할 권한이 없습니다.',
  404: '요청한 데이터를 찾을 수 없습니다.',
  409: '현재 진행 상태와 충돌해서 처리할 수 없습니다.',
  500: '서버에서 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  502: '서버 게이트웨이에 문제가 있습니다. 잠시 후 다시 시도해 주세요.',
  503: '서버를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
};

const GENERIC_HTTP_MESSAGES = new Set([
  'bad request',
  'unauthorized',
  'forbidden',
  'not found',
  'conflict',
  'internal server error',
  'bad gateway',
  'service unavailable',
]);

export function formatApiErrorMessage(code: ApiErrorCode, reason: string): string {
  return `오류 코드: ${String(code)} · 이유: ${normalizeReason(reason) || DEFAULT_REASON}`;
}

export function getHttpErrorReason(status: number, reason?: string, statusText?: string): string {
  const normalizedReason = normalizeReason(reason);

  if (normalizedReason && !isGenericHttpMessage(normalizedReason)) {
    return normalizedReason;
  }

  const fallbackReason = HTTP_STATUS_REASONS[status] ?? DEFAULT_REASON;
  const normalizedStatusText = normalizeReason(statusText);

  if (normalizedStatusText && !isGenericHttpMessage(normalizedStatusText)) {
    return `${fallbackReason} (${normalizedStatusText})`;
  }

  return fallbackReason;
}

export function formatUnknownErrorMessage(reason = '알 수 없는 오류가 발생했어요.'): string {
  return formatApiErrorMessage('UNKNOWN', reason);
}

function normalizeReason(reason?: string): string {
  return reason?.replace(/\s+/g, ' ').trim() ?? '';
}

function isGenericHttpMessage(message: string): boolean {
  return GENERIC_HTTP_MESSAGES.has(message.toLowerCase());
}
