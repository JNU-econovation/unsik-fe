import { formatApiErrorMessage, getHttpErrorReason } from '@/services/api-error';

export type BackendContext = {
  memberId?: number;
  token?: string;
};

export type Cuisine =
  | 'FASTFOOD'
  | 'KOREAN'
  | 'STEW_SOUP'
  | 'MEAT'
  | 'ASIAN'
  | 'CHINESE'
  | 'WESTERN'
  | 'JAPANESE';

export type Restriction = 'EGG' | 'MILK' | 'WHEAT' | 'SOY' | 'NUT' | 'CRUSTACEAN' | 'SEAFOOD';

export type School = 'JEONGMOON' | 'HOOMOON' | 'YEDAE' | 'SANGDAE';

export type SchoolResponse = {
  code: School;
  displayName: string;
};

export type GroupResponse = {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  ownerId: number;
};

export type GroupMemberRole = 'OWNER' | 'MEMBER';

export type GroupMemberResponse = {
  memberId: number;
  name: string;
  role: GroupMemberRole;
};

export type VoteStatus = 'RECOMMENDING' | 'VOTING' | 'CLOSED';

export type CandidateMenuResponse = {
  menuId: number;
  name: string;
  cuisine: Cuisine;
};

export type MenuResponse = {
  id: number;
  name: string;
  cuisine: Cuisine;
  restrictions: Restriction[];
};

export type RecommendResultResponse = {
  candidates: CandidateMenuResponse[];
  relaxed: boolean;
  relaxedCuisines: Cuisine[];
  impossible: boolean;
};

export type VoteResponse = {
  id: number;
  title: string;
  deadline: string;
  school: School;
  participantMemberIds: number[];
  status: VoteStatus;
  resultMenu: CandidateMenuResponse | null;
  relaxed: boolean;
  impossible: boolean;
  relaxedCuisines: Cuisine[];
};

export type VoteSummaryResponse = {
  voteId: number;
  title: string;
  status: VoteStatus;
  school: School;
  deadline: string;
  participantCount: number;
  resultMenu: CandidateMenuResponse | null;
};

export type VoteDetailResponse = {
  voteId: number;
  title: string;
  status: VoteStatus;
  school: School;
  participants: GroupMemberResponse[];
  candidates: CandidateMenuResponse[];
  resultMenu: CandidateMenuResponse | null;
  relaxed: boolean;
  relaxedCuisines: Cuisine[];
  impossible: boolean;
};

export type RestaurantDocument = {
  id: string;
  placeName: string;
  categoryName: string;
  categoryGroupName: string;
  categoryGroupCode: string;
  phone: string;
  addressName: string;
  roadAddressName: string;
  x: string;
  y: string;
  placeUrl: string;
  distance: string;
};

export type RestaurantSearchResponse = {
  documents: RestaurantDocument[];
  isEnd: boolean;
  totalCount: number;
};

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  timeoutMs?: number;
};

export const AUTH_EXPIRED_EVENT = 'unsik:auth-expired';

export function createApiUrl(path: `/${string}`, params?: Record<string, string | number | undefined>): string {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
  const url = new URL(`${baseUrl}${path}`, window.location.origin);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

export async function requestBackend(path: `/${string}`, options: RequestOptions = {}): Promise<unknown> {
  const headers = new Headers({
    Accept: 'application/json',
  });

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`);
  }

  let response: Response;
  const abortController = new AbortController();
  const timeoutId = options.timeoutMs
    ? window.setTimeout(() => abortController.abort(), options.timeoutMs)
    : null;

  try {
    response = await fetch(createApiUrl(path), {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: abortController.signal,
    });
  } catch {
    if (abortController.signal.aborted) {
      throw new Error(formatApiErrorMessage('TIMEOUT', '서버 응답이 늦어 요청을 중단했어요. 다시 시도해 주세요.'));
    }

    throw new Error(
      formatApiErrorMessage('NETWORK', '서버에 연결할 수 없어요. 인터넷 연결을 확인해 주세요.'),
    );
  } finally {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    throw new Error(await readBackendError(response));
  }

  if (response.status === 204) {
    return null;
  }

  let text: string;

  try {
    text = await response.text();
  } catch {
    throw new Error(formatApiErrorMessage('PARSE', '서버에서 받은 정보를 읽을 수 없어요.'));
  }

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(formatApiErrorMessage('PARSE', '서버에서 받은 정보 형식이 올바르지 않아 처리할 수 없어요.'));
  }
}

export async function logout(context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>) {
  await requestBackend(`/api/auth/logout?memberId=${context.memberId}`, {
    method: 'POST',
    token: context.token,
  });
}

export async function listGroups(context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>) {
  const value = await requestBackend(`/api/groups?memberId=${context.memberId}`, {
    token: context.token,
  });

  return asArray(value).map(parseGroupResponse);
}

export async function createGroup(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  payload: { name: string; description: string },
) {
  const value = await requestBackend(`/api/groups?memberId=${context.memberId}`, {
    method: 'POST',
    body: payload,
    token: context.token,
  });

  return parseGroupResponse(value);
}

export async function joinGroup(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  inviteCode: string,
) {
  const value = await requestBackend(`/api/groups/join?memberId=${context.memberId}`, {
    method: 'POST',
    body: { inviteCode },
    token: context.token,
  });

  return parseGroupResponse(value);
}

export async function deleteGroup(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  groupId: number,
) {
  await requestBackend(`/api/groups/${groupId}?memberId=${context.memberId}`, {
    method: 'DELETE',
    token: context.token,
  });
}

export async function getGroup(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  groupId: number,
) {
  const value = await requestBackend(`/api/groups/${groupId}?memberId=${context.memberId}`, {
    token: context.token,
  });

  return parseGroupResponse(value);
}

export async function renameGroup(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  groupId: number,
  name: string,
) {
  const value = await requestBackend(`/api/groups/${groupId}?memberId=${context.memberId}`, {
    method: 'PATCH',
    body: { name },
    token: context.token,
  });

  return parseGroupResponse(value);
}

export async function listGroupMembers(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  groupId: number,
) {
  const value = await requestBackend(`/api/groups/${groupId}/members?memberId=${context.memberId}`, {
    token: context.token,
  });

  return asArray(value).map(parseGroupMemberResponse);
}

export async function listPendingPreferenceMembers(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
) {
  const value = await requestBackend(`/api/votes/${voteId}/pending-members?memberId=${context.memberId}`, {
    token: context.token,
  });

  return asArray(value).map(parseGroupMemberResponse);
}

export async function listMenus() {
  const value = await requestBackend('/api/menus', { timeoutMs: 10_000 });

  return asArray(value).map(parseMenuResponse);
}

export async function listSchools() {
  const value = await requestBackend('/api/schools');

  return asArray(value)
    .map(parseSchoolResponse)
    .filter((school): school is SchoolResponse => school !== null);
}

export async function listGroupVotes(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  groupId: number,
) {
  const value = await requestBackend(`/api/groups/${groupId}/votes?memberId=${context.memberId}`, {
    token: context.token,
  });

  return asArray(value).map(parseVoteSummaryResponse);
}

export async function createVote(
  groupId: number,
  payload: {
    title: string;
    deadline: string;
    school: School;
    participantMemberIds: number[];
  },
  token?: string,
) {
  const value = await requestBackend(`/api/groups/${groupId}/votes`, {
    method: 'POST',
    body: payload,
    token,
  });

  return parseVoteResponse(value);
}

export async function submitPreference(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
  payload: {
    dislikedCuisines: Cuisine[];
    restrictions: Restriction[];
  },
) {
  await requestBackend(`/api/votes/${voteId}/preferences?memberId=${context.memberId}`, {
    method: 'POST',
    body: {
      memberId: context.memberId,
      dislikedCuisines: payload.dislikedCuisines,
      restrictions: payload.restrictions,
    },
    token: context.token,
  });
}

export async function recommendMenus(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
) {
  const value = await requestBackend(`/api/votes/${voteId}/recommend?memberId=${context.memberId}`, {
    method: 'POST',
    token: context.token,
  });

  return parseRecommendResultResponse(value);
}

export async function submitBallot(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
  choices: Record<string, 'LIKE' | 'DISLIKE'>,
) {
  await requestBackend(`/api/votes/${voteId}/ballots?memberId=${context.memberId}`, {
    method: 'POST',
    body: {
      memberId: context.memberId,
      choices,
    },
    token: context.token,
  });
}

export async function getVote(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
) {
  const value = await requestBackend(`/api/votes/${voteId}?memberId=${context.memberId}`, {
    token: context.token,
  });

  return parseVoteDetailResponse(value);
}

export async function deleteVote(
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  voteId: number,
) {
  await requestBackend(`/api/votes/${voteId}?memberId=${context.memberId}`, {
    method: 'DELETE',
    token: context.token,
  });
}

export async function searchRestaurants(params: { menu?: string; voteId?: number; page?: number }) {
  const query = new URLSearchParams();

  if (params.menu) {
    query.set('menu', params.menu);
  }

  if (params.voteId !== undefined) {
    query.set('voteId', String(params.voteId));
  }

  query.set('page', String(params.page ?? 1));

  const value = await requestBackend(`/api/restaurants?${query.toString()}`);

  return parseRestaurantSearchResponse(value);
}

async function readBackendError(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';
  const text = await response.text().catch(() => '');
  let reason = '';

  if (contentType.includes('application/json') && text.trim()) {
    const body: unknown = parseJsonOrNull(text);

    reason = readErrorReasonFromBody(body);
  }

  if (!reason) {
    reason = text.trim();
  }

  return formatApiErrorMessage(response.status, getHttpErrorReason(response.status, reason, response.statusText));
}

function readErrorReasonFromBody(body: unknown): string {
  if (!isRecord(body)) {
    return '';
  }

  const message = body.message ?? body.detail ?? body.title;

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  const errors = body.errors ?? body.fieldErrors;

  if (Array.isArray(errors)) {
    const errorMessages = errors
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (!isRecord(item)) {
          return '';
        }

        const field = typeof item.field === 'string' ? `${item.field}: ` : '';
        const defaultMessage = item.defaultMessage ?? item.message;

        return typeof defaultMessage === 'string' ? `${field}${defaultMessage}` : '';
      })
      .filter((item) => item.trim());

    if (errorMessages.length > 0) {
      return errorMessages.join(', ');
    }
  }

  const error = body.error;
  const path = body.path;

  if (typeof error === 'string' && error.trim()) {
    const pathText = typeof path === 'string' && path.trim() ? ` (${path})` : '';

    return `${error}${pathText}`;
  }

  return '';
}

function parseJsonOrNull(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function parseGroupResponse(value: unknown): GroupResponse {
  const record = asRecord(value);

  return {
    id: readNumber(record.id),
    name: readString(record.name, '이름 없는 그룹'),
    description: readString(record.description, ''),
    inviteCode: readString(record.inviteCode, ''),
    ownerId: readNumber(record.ownerId, 0),
  };
}

function parseGroupMemberResponse(value: unknown): GroupMemberResponse {
  const record = asRecord(value);
  const role = readString(record.role, 'MEMBER');

  return {
    memberId: readNumber(record.memberId),
    name: readString(record.name, '이름 없음'),
    role: role === 'OWNER' ? 'OWNER' : 'MEMBER',
  };
}

function parseVoteResponse(value: unknown): VoteResponse {
  const record = asRecord(value);

  return {
    id: readNumber(record.id),
    title: readString(record.title, '오늘의 투표'),
    deadline: readString(record.deadline, ''),
    school: parseSchool(record.school),
    participantMemberIds: asArray(record.participantMemberIds).map((item) => readNumber(item)),
    status: parseVoteStatus(record.status),
    resultMenu: record.resultMenu ? parseCandidateMenuResponse(record.resultMenu) : null,
    relaxed: Boolean(record.relaxed),
    impossible: Boolean(record.impossible),
    relaxedCuisines: asArray(record.relaxedCuisines).map(parseCuisine),
  };
}

function parseVoteSummaryResponse(value: unknown): VoteSummaryResponse {
  const record = asRecord(value);

  return {
    voteId: readNumber(record.voteId),
    title: readString(record.title, '오늘의 투표'),
    status: parseVoteStatus(record.status),
    school: parseSchool(record.school),
    deadline: readString(record.deadline, ''),
    participantCount: readNumber(record.participantCount, 0),
    resultMenu: record.resultMenu ? parseCandidateMenuResponse(record.resultMenu) : null,
  };
}

function parseVoteDetailResponse(value: unknown): VoteDetailResponse {
  const record = asRecord(value);

  return {
    voteId: readNumber(record.voteId),
    title: readString(record.title, '오늘의 투표'),
    status: parseVoteStatus(record.status),
    school: parseSchool(record.school),
    participants: asArray(record.participants).map(parseGroupMemberResponse),
    candidates: asArray(record.candidates).map(parseCandidateMenuResponse),
    resultMenu: record.resultMenu ? parseCandidateMenuResponse(record.resultMenu) : null,
    relaxed: Boolean(record.relaxed),
    relaxedCuisines: asArray(record.relaxedCuisines).map(parseCuisine),
    impossible: Boolean(record.impossible),
  };
}

function parseRecommendResultResponse(value: unknown): RecommendResultResponse {
  const record = asRecord(value);

  return {
    candidates: asArray(record.candidates).map(parseCandidateMenuResponse),
    relaxed: Boolean(record.relaxed),
    relaxedCuisines: asArray(record.relaxedCuisines).map(parseCuisine),
    impossible: Boolean(record.impossible),
  };
}

function parseCandidateMenuResponse(value: unknown): CandidateMenuResponse {
  const record = asRecord(value);

  return {
    menuId: readNumber(record.menuId),
    name: readString(record.name, '추천 메뉴'),
    cuisine: parseCuisine(record.cuisine),
  };
}

function parseMenuResponse(value: unknown): MenuResponse {
  const record = asRecord(value);

  return {
    id: readNumber(record.id),
    name: readString(record.name, '메뉴'),
    cuisine: parseCuisine(record.cuisine),
    restrictions: asArray(record.restrictions).filter(isRestriction),
  };
}

function parseSchoolResponse(value: unknown): SchoolResponse | null {
  const record = asRecord(value);
  const code = parseOptionalSchool(record.code);

  if (!code) {
    return null;
  }

  return {
    code,
    displayName: readString(record.displayName, code),
  };
}

function parseRestaurantSearchResponse(value: unknown): RestaurantSearchResponse {
  const record = asRecord(value);
  const meta = isRecord(record.meta) ? record.meta : {};

  return {
    documents: asArray(record.documents).map(parseRestaurantDocument),
    isEnd: Boolean(meta.is_end),
    totalCount: readNumber(meta.total_count, 0),
  };
}

function parseRestaurantDocument(value: unknown): RestaurantDocument {
  const record = asRecord(value);

  return {
    id: readString(record.id, createFallbackRestaurantId(record.place_name)),
    placeName: readString(record.place_name, '식당 이름 없음'),
    categoryName: readString(record.category_name, ''),
    categoryGroupName: readString(record.category_group_name, ''),
    categoryGroupCode: readString(record.category_group_code, ''),
    phone: readString(record.phone, ''),
    addressName: readString(record.address_name, ''),
    roadAddressName: readString(record.road_address_name, ''),
    x: readString(record.x, ''),
    y: readString(record.y, ''),
    placeUrl: readString(record.place_url, ''),
    distance: readString(record.distance, ''),
  };
}

function parseCuisine(value: unknown): Cuisine {
  if (
    value === 'FASTFOOD' ||
    value === 'KOREAN' ||
    value === 'STEW_SOUP' ||
    value === 'MEAT' ||
    value === 'ASIAN' ||
    value === 'CHINESE' ||
    value === 'WESTERN' ||
    value === 'JAPANESE'
  ) {
    return value;
  }

  return 'KOREAN';
}

function isRestriction(value: unknown): value is Restriction {
  return (
    value === 'EGG' ||
    value === 'MILK' ||
    value === 'WHEAT' ||
    value === 'SOY' ||
    value === 'NUT' ||
    value === 'CRUSTACEAN' ||
    value === 'SEAFOOD'
  );
}

function parseOptionalSchool(value: unknown): School | null {
  if (value === 'JEONGMOON' || value === 'HOOMOON' || value === 'YEDAE' || value === 'SANGDAE') {
    return value;
  }

  return null;
}

function parseSchool(value: unknown): School {
  return parseOptionalSchool(value) ?? 'HOOMOON';
}

function parseVoteStatus(value: unknown): VoteStatus {
  if (value === 'VOTING' || value === 'CLOSED') {
    return value;
  }

  return 'RECOMMENDING';
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function createFallbackRestaurantId(value: unknown): string {
  return `restaurant-${readString(value, 'unknown')}`;
}
