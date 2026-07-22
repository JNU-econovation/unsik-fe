import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { formatUnknownErrorMessage } from '@/services/api-error';
import type {
  BackendContext,
  CandidateMenuResponse,
  Cuisine,
  GroupMemberResponse,
  MenuResponse,
  RestaurantDocument,
  Restriction,
  School,
  SchoolResponse,
  VoteDetailResponse,
  VoteStatus,
  VoteSummaryResponse,
} from '@/services/backend';
import {
  createVote,
  deleteVote,
  getGroup,
  getVote,
  listGroupMembers,
  listGroupVotes,
  listMenus,
  listPendingPreferenceMembers,
  listSchools,
  recommendMenus,
  searchRestaurants,
  submitBallot,
  submitPreference,
} from '@/services/backend';
import oracleFateImage from '@/assets/images/figma/oracle-2.png';
import oracleMoonImage from '@/assets/images/figma/oracle-3.png';
import oracleStarImage from '@/assets/images/figma/oracle-1.png';
import galbitangCardImage from '@/assets/images/figma/card-pick-scene.png';
import gukbapCardImage from '@/assets/images/figma/card-pick-card.png';
import galbitangRevealImage from '@/assets/images/figma/card-reveal.png';
import preferenceAsianImage from '@/assets/images/figma/preference-asian.png';
import preferenceChineseImage from '@/assets/images/figma/preference-chinese.png';
import preferenceFastfoodImage from '@/assets/images/figma/preference-fastfood.png';
import preferenceJapaneseImage from '@/assets/images/figma/preference-japanese.png';
import preferenceKoreanImage from '@/assets/images/figma/preference-korean.png';
import preferenceMeatImage from '@/assets/images/figma/preference-meat.png';
import preferenceStewSoupImage from '@/assets/images/figma/preference-stew-soup.png';
import preferenceWesternImage from '@/assets/images/figma/preference-western.png';

import './vote-flow-screen.css';

type VoteFlowScreenProps = {
  groupId: string;
  memberId?: number;
  memberName?: string;
  token?: string;
  onBackToRooms: () => void;
};

type VoteStep =
  | 'list'
  | 'setup'
  | 'status'
  | 'oracle'
  | 'preference'
  | 'cards'
  | 'reveal'
  | 'final'
  | 'restaurant'
  | 'history'
  | 'score';

type VoteMember = GroupMemberResponse & {
  color: string;
};

type PlaceOption = {
  key: string;
  label: string;
  school: School;
};

type CandidateCard = CandidateMenuResponse & {
  icon: string;
  description: string;
};

type BallotChoice = 'LIKE' | 'DISLIKE';

type ActiveVote = {
  id?: number;
  title: string;
  placeLabel: string;
  school: School;
  participantIds: number[];
};

type VoteSummary = {
  id: string;
  voteId: number;
  title: string;
  status: VoteStatus;
  deadline: string;
  meta: string;
  placeLabel: string;
  school: School;
  participantIds: number[];
  resultMenu: CandidateMenuResponse | null;
};

type MenuCatalogStatus = 'idle' | 'loading' | 'loaded' | 'error';
type MealHistoryFilter = 'all' | 'month' | 'favorite';
type RecommendAttemptStatus = 'ready' | 'pending' | 'failed';

type MealHistoryItem = {
  id: string;
  menuName: string;
  subtitle: string;
  placeLabel: string;
  date: Date | null;
  dateLabel: string;
  favorite: boolean;
};

const MEMBER_COLORS = ['#e8c7ab', '#fcd4de', '#c9ede3', '#dbd1f7', '#c9f2b4', '#b9d9ff'];
const BALLOT_COMPLETION_STORAGE_PREFIX = 'unsik:submitted_ballot_vote_ids';

const HISTORY_FILTERS: Array<{ value: MealHistoryFilter; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'month', label: '이번 달' },
  { value: 'favorite', label: '즐겨찾기' },
];

const SCHOOL_ORDER: School[] = ['JEONGMOON', 'HOOMOON', 'SANGDAE', 'YEDAE'];
const SCHOOL_PLACE_KEYS: Record<School, string> = {
  JEONGMOON: 'front',
  HOOMOON: 'back',
  SANGDAE: 'business',
  YEDAE: 'art',
};

const PLACE_OPTIONS: PlaceOption[] = [
  createPlaceOption('JEONGMOON'),
  createPlaceOption('HOOMOON'),
  createPlaceOption('SANGDAE'),
  createPlaceOption('YEDAE'),
];

const ORACLES = [
  {
    id: 'star',
    name: '별의 점쟁이',
    imageSrc: oracleStarImage,
    copy: '연애운 상승. 맛있는 한 끼가 새로운 인연을 불러올 거예요.',
  },
  {
    id: 'moon',
    name: '달의 점쟁이',
    imageSrc: oracleMoonImage,
    copy: '치킨 운 상승. 따뜻한 메뉴를 잘 맞춰요.',
  },
  {
    id: 'fate',
    name: '운명의 점쟁이',
    imageSrc: oracleFateImage,
    copy: '재물운 상승. 현명한 선택이 뜻밖의 행운을 불러올 거예요.',
  },
];

const CUISINE_OPTIONS: Array<{
  cuisine: Cuisine;
  label: string;
  icon: string;
  imageSrc: string;
  description: string;
  color: string;
}> = [
  { cuisine: 'FASTFOOD', label: '패스트푸드', icon: '🍔', imageSrc: preferenceFastfoodImage, description: '햄버거 · 피자 · 토스트', color: '#f5834a' },
  { cuisine: 'KOREAN', label: '한식', icon: '🍲', imageSrc: preferenceKoreanImage, description: '냉면 · 국밥 · 덮밥 · 찌개', color: '#9e85f5' },
  { cuisine: 'STEW_SOUP', label: '찜·탕', icon: '🫕', imageSrc: preferenceStewSoupImage, description: '김치찜 · 찜닭 · 감자탕', color: '#2ed6a3' },
  { cuisine: 'JAPANESE', label: '돈까스·회', icon: '🍱', imageSrc: preferenceJapaneseImage, description: '돈까스 · 초밥 · 라멘 · 회', color: '#f9c726' },
  { cuisine: 'MEAT', label: '고기', icon: '🥩', imageSrc: preferenceMeatImage, description: '삼겹살 · 제육 · 닭갈비', color: '#f07840' },
  { cuisine: 'ASIAN', label: '아시안', icon: '🍜', imageSrc: preferenceAsianImage, description: '쌀국수 · 팟타이', color: '#ffb347' },
  { cuisine: 'CHINESE', label: '중식', icon: '🥟', imageSrc: preferenceChineseImage, description: '짜장 · 짬뽕 · 마라탕', color: '#d783ff' },
  { cuisine: 'WESTERN', label: '양식', icon: '🍝', imageSrc: preferenceWesternImage, description: '파스타 · 스테이크 · 포케', color: '#4dd0e1' },
];

const MENU_ICON_RULES: ReadonlyArray<{ keywords: readonly string[]; icon: string }> = [
  { keywords: ['치킨', '닭강정', '닭튀김', '후라이드', 'chicken'], icon: '🍗' },
  { keywords: ['피자', 'pizza'], icon: '🍕' },
  { keywords: ['햄버거', '버거', 'burger'], icon: '🍔' },
  { keywords: ['핫도그', 'hotdog', 'hot dog'], icon: '🌭' },
  { keywords: ['샌드위치', '토스트', 'sandwich', 'toast'], icon: '🥪' },
  { keywords: ['초밥', '스시', 'sushi'], icon: '🍣' },
  { keywords: ['회', '사시미', 'sashimi'], icon: '🐟' },
  { keywords: ['만두', '딤섬', '교자', 'dumpling'], icon: '🥟' },
  { keywords: ['파스타', '스파게티', 'pasta', 'spaghetti'], icon: '🍝' },
  { keywords: ['라멘', '라면', '우동', '소바', '냉면', '국수', '쌀국수', '팟타이', '짜장', '짬뽕', '마라탕', 'noodle'], icon: '🍜' },
  { keywords: ['돈까스', '돈가스', '카레', '커리', 'curry'], icon: '🍛' },
  { keywords: ['김밥', '주먹밥'], icon: '🍙' },
  { keywords: ['떡볶이', '어묵', '오뎅'], icon: '🍢' },
  { keywords: ['삼겹살', '베이컨', 'bacon'], icon: '🥓' },
  { keywords: ['족발', '보쌈'], icon: '🍖' },
  { keywords: ['제육', '불고기', '갈비', '스테이크', '고기', 'steak'], icon: '🥩' },
  { keywords: ['찜닭', '닭갈비'], icon: '🍗' },
  { keywords: ['김치찜', '찜', '전골'], icon: '🥘' },
  { keywords: ['찌개', '국밥', '감자탕', '설렁탕', '곰탕', '해장국', '수프', '스프', 'soup', 'stew'], icon: '🍲' },
  { keywords: ['비빔밥', '볶음밥', '덮밥', '리조또', 'rice'], icon: '🍚' },
  { keywords: ['샐러드', 'salad'], icon: '🥗' },
];

const CUISINE_STYLE_TOKENS: Record<
  Cuisine,
  {
    tint: string;
    ring: string;
    glow: string;
    halo: string;
  }
> = {
  FASTFOOD: {
    tint: 'rgba(245, 131, 74, 0.32)',
    ring: 'rgba(245, 131, 74, 0.72)',
    glow: 'rgba(245, 131, 74, 0.24)',
    halo: 'rgba(245, 131, 74, 0.18)',
  },
  KOREAN: {
    tint: 'rgba(158, 133, 245, 0.34)',
    ring: 'rgba(158, 133, 245, 0.74)',
    glow: 'rgba(158, 133, 245, 0.26)',
    halo: 'rgba(158, 133, 245, 0.2)',
  },
  STEW_SOUP: {
    tint: 'rgba(46, 214, 163, 0.3)',
    ring: 'rgba(46, 214, 163, 0.7)',
    glow: 'rgba(46, 214, 163, 0.22)',
    halo: 'rgba(46, 214, 163, 0.18)',
  },
  MEAT: {
    tint: 'rgba(240, 120, 64, 0.32)',
    ring: 'rgba(240, 120, 64, 0.72)',
    glow: 'rgba(240, 120, 64, 0.24)',
    halo: 'rgba(240, 120, 64, 0.18)',
  },
  ASIAN: {
    tint: 'rgba(255, 179, 71, 0.3)',
    ring: 'rgba(255, 179, 71, 0.72)',
    glow: 'rgba(255, 179, 71, 0.24)',
    halo: 'rgba(255, 179, 71, 0.18)',
  },
  CHINESE: {
    tint: 'rgba(215, 131, 255, 0.34)',
    ring: 'rgba(215, 131, 255, 0.74)',
    glow: 'rgba(215, 131, 255, 0.26)',
    halo: 'rgba(215, 131, 255, 0.2)',
  },
  WESTERN: {
    tint: 'rgba(77, 208, 225, 0.3)',
    ring: 'rgba(77, 208, 225, 0.72)',
    glow: 'rgba(77, 208, 225, 0.22)',
    halo: 'rgba(77, 208, 225, 0.18)',
  },
  JAPANESE: {
    tint: 'rgba(249, 199, 38, 0.3)',
    ring: 'rgba(249, 199, 38, 0.72)',
    glow: 'rgba(249, 199, 38, 0.24)',
    halo: 'rgba(249, 199, 38, 0.18)',
  },
};

const RESTRICTION_OPTIONS: Array<{
  restriction?: Restriction;
  label: string;
  unsupported?: boolean;
}> = [
  { restriction: 'NUT', label: '견과류' },
  { restriction: 'CRUSTACEAN', label: '갑각류' },
  { restriction: 'MILK', label: '유제품' },
  { restriction: 'WHEAT', label: '글루텐' },
  { restriction: 'EGG', label: '계란' },
  { label: '돼지고기', unsupported: true },
  { label: '소고기', unsupported: true },
  { label: '없음' },
];

const STARS = [
  { left: 18, top: 86, size: 10, opacity: 0.16 },
  { left: 338, top: 112, size: 8, opacity: 0.16 },
  { left: 42, top: 270, size: 12, opacity: 0.12 },
  { left: 356, top: 402, size: 8, opacity: 0.14 },
  { left: 24, top: 620, size: 10, opacity: 0.12 },
  { left: 320, top: 720, size: 8, opacity: 0.12 },
] as const;

export function VoteFlowScreen({
  groupId,
  memberId,
  memberName,
  token,
  onBackToRooms,
}: VoteFlowScreenProps) {
  const numericGroupId = Number(groupId);
  const hasBackendGroup = Number.isInteger(numericGroupId) && numericGroupId > 0;
  const context = useMemo<BackendContext>(() => ({ memberId, token }), [memberId, token]);

  const [step, setStep] = useState<VoteStep>('list');
  const [historyReturnStep, setHistoryReturnStep] = useState<'setup' | 'status'>('setup');
  const [voteTitle, setVoteTitle] = useState('오늘 점심');
  const [selectedPlaceKey, setSelectedPlaceKey] = useState('back');
  const [placeOptions, setPlaceOptions] = useState<PlaceOption[]>(PLACE_OPTIONS);
  const [historyFilter, setHistoryFilter] = useState<MealHistoryFilter>('all');
  const [voteSummaries, setVoteSummaries] = useState<VoteSummary[]>([]);
  const [members, setMembers] = useState<VoteMember[]>([]);
  const [groupInviteCode, setGroupInviteCode] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(() => new Set());
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [selectedOracleId, setSelectedOracleId] = useState('moon');
  const [dislikedCuisines, setDislikedCuisines] = useState<Set<Cuisine>>(() => new Set());
  const [restrictions, setRestrictions] = useState<Set<Restriction>>(() => new Set());
  const [excludedMenuIds, setExcludedMenuIds] = useState<Set<number>>(() => new Set());
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatalog, setMenuCatalog] = useState<MenuResponse[]>([]);
  const [menuCatalogStatus, setMenuCatalogStatus] = useState<MenuCatalogStatus>('idle');
  const [menuCatalogRequestKey, setMenuCatalogRequestKey] = useState(0);
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [ballotChoices, setBallotChoices] = useState<Record<number, BallotChoice>>({});
  const [submittedPreferenceVoteIds, setSubmittedPreferenceVoteIds] = useState<Set<number>>(() => new Set());
  const [submittedBallotVoteIds, setSubmittedBallotVoteIds] = useState<Set<number>>(() => new Set());
  const [pendingPreferenceMemberIds, setPendingPreferenceMemberIds] = useState<Set<number> | null>(null);
  const [finalMenu, setFinalMenu] = useState<CandidateCard | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDocument[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoteSummaries, setIsLoadingVoteSummaries] = useState(Boolean(memberId && hasBackendGroup));
  const [voteListMessage, setVoteListMessage] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const selectedPlace = placeOptions.find((place) => place.key === selectedPlaceKey) ?? placeOptions[1] ?? PLACE_OPTIONS[1];
  const selectedMembers = members.filter((member) => selectedMemberIds.has(member.memberId));
  const mealHistoryItems = useMemo(() => toMealHistoryItems(voteSummaries), [voteSummaries]);
  const currentCandidate = candidates[activeCardIndex] ?? null;
  const likedCandidate = candidates.find((candidate) => ballotChoices[candidate.menuId] === 'LIKE');
  const hasSubmittedActivePreference = activeVote?.id ? submittedPreferenceVoteIds.has(activeVote.id) : false;
  const hasSubmittedActiveBallot = activeVote?.id ? submittedBallotVoteIds.has(activeVote.id) : false;
  const isWaitingForPreferenceCompletion =
    hasSubmittedActivePreference && !hasSubmittedActiveBallot && candidates.length === 0 && !finalMenu;
  const checkedStatusMemberIds = useMemo(() => {
    const checkedMemberIds = new Set<number>();

    if (pendingPreferenceMemberIds) {
      selectedMembers.forEach((member) => {
        if (!pendingPreferenceMemberIds.has(member.memberId)) {
          checkedMemberIds.add(member.memberId);
        }
      });
    }

    if (hasSubmittedActiveBallot && memberId) {
      checkedMemberIds.add(memberId);
    }

    if (hasSubmittedActivePreference && memberId) {
      checkedMemberIds.add(memberId);
    }

    if (finalMenu) {
      selectedMembers.forEach((member) => checkedMemberIds.add(member.memberId));
    }

    return checkedMemberIds;
  }, [
    finalMenu,
    hasSubmittedActiveBallot,
    hasSubmittedActivePreference,
    memberId,
    pendingPreferenceMemberIds,
    selectedMembers,
  ]);
  const excludedMenus = useMemo(
    () => menuCatalog.filter((menu) => excludedMenuIds.has(menu.id)),
    [excludedMenuIds, menuCatalog],
  );
  const effectiveDislikedCuisines = useMemo(() => {
    const next = new Set(dislikedCuisines);

    excludedMenus.forEach((menu) => {
      next.add(menu.cuisine);
    });

    return next;
  }, [dislikedCuisines, excludedMenus]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSubmittedBallotVoteIds(readSubmittedBallotVoteIds(memberId));
  }, [memberId]);

  useEffect(() => {
    let isCurrent = true;

    listSchools()
      .then((schools) => {
        if (!isCurrent) {
          return;
        }

        const nextPlaceOptions = toPlaceOptions(schools);

        if (nextPlaceOptions.length === 0) {
          return;
        }

        setPlaceOptions(nextPlaceOptions);
        setSelectedPlaceKey((currentKey) =>
          nextPlaceOptions.some((place) => place.key === currentKey)
            ? currentKey
            : getDefaultPlaceKey(nextPlaceOptions),
        );
      })
      .catch(() => {
        // Fallback place options stay available when the optional school list request fails.
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (!memberId || !hasBackendGroup) {
      setMembers([]);
      setSelectedMemberIds(new Set());
      return undefined;
    }

    let isCurrent = true;
    setApiMessage(null);

    listGroupMembers({ memberId, token }, numericGroupId)
      .then((nextMembers) => {
        if (!isCurrent) {
          return;
        }

        const normalizedMembers = nextMembers.map((member, index) => ({
          ...member,
          color: MEMBER_COLORS[index % MEMBER_COLORS.length],
        }));

        setMembers(normalizedMembers);
        setSelectedMemberIds(new Set(normalizedMembers.map((member) => member.memberId)));
        setApiMessage(nextMembers.length > 0 ? null : '그룹원 목록이 비어 있어 투표 참여자를 선택할 수 없어요.');
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setMembers([]);
          setSelectedMemberIds(new Set());
          setApiMessage(`그룹원을 불러오지 못했어요: ${getErrorMessage(error)}`);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [hasBackendGroup, memberId, numericGroupId, token]);

  useEffect(() => {
    if (!memberId || !hasBackendGroup) {
      setGroupInviteCode(null);
      return undefined;
    }

    let isCurrent = true;

    getGroup({ memberId, token }, numericGroupId)
      .then((group) => {
        if (isCurrent) {
          setGroupInviteCode(group.inviteCode || null);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setGroupInviteCode(null);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [hasBackendGroup, memberId, numericGroupId, token]);

  useEffect(() => {
    if (!memberId) {
      setVoteSummaries([]);
      setVoteListMessage('로그인 후 그룹 투표 목록을 볼 수 있어요.');
      setIsLoadingVoteSummaries(false);
      return undefined;
    }

    if (!hasBackendGroup) {
      setVoteSummaries([]);
      setVoteListMessage('그룹 정보를 확인할 수 없어 투표 목록을 불러올 수 없어요.');
      setIsLoadingVoteSummaries(false);
      return undefined;
    }

    let isCurrent = true;
    setIsLoadingVoteSummaries(true);
    setVoteListMessage(null);

    listGroupVotes({ memberId, token }, numericGroupId)
      .then((votes) => {
        if (!isCurrent) {
          return;
        }

        setVoteSummaries(votes.map(toVoteSummaryFromResponse));
        setVoteListMessage(votes.length > 0 ? null : '아직 이 그룹에 투표가 없어요.');
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setVoteSummaries([]);
        setVoteListMessage(`투표 목록을 불러오지 못했어요: ${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingVoteSummaries(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [hasBackendGroup, memberId, numericGroupId, token]);

  const shouldLoadMenuCatalog = step === 'preference' && Boolean(normalizeMenuSearchText(menuSearch));

  useEffect(() => {
    if (!shouldLoadMenuCatalog || menuCatalogStatus === 'loaded') {
      return undefined;
    }

    let isCurrent = true;
    setMenuCatalogStatus('loading');

    listMenus()
      .then((menus) => {
        if (!isCurrent) {
          return;
        }

        setMenuCatalog(menus);
        setMenuCatalogStatus('loaded');

        if (menus.length === 0) {
          setApiMessage('불러온 메뉴가 없어 검색을 사용할 수 없어요.');
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setMenuCatalog([]);
        setMenuCatalogStatus('error');
        setApiMessage(`메뉴 목록을 불러오지 못했어요: ${getErrorMessage(error)}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [menuCatalogRequestKey, shouldLoadMenuCatalog]);

  useEffect(() => {
    if (step !== 'status' || !activeVote?.id || !context.memberId) {
      setPendingPreferenceMemberIds(null);
      return undefined;
    }

    let isCurrent = true;
    const voteId = activeVote.id;
    const currentMemberId = context.memberId;

    listPendingPreferenceMembers({ memberId: context.memberId, token: context.token }, voteId)
      .then((pendingMembers) => {
        if (!isCurrent) {
          return;
        }

        const pendingIds = new Set(pendingMembers.map((member) => member.memberId));

        setPendingPreferenceMemberIds(pendingIds);

        if (!pendingIds.has(currentMemberId)) {
          setSubmittedPreferenceVoteIds((current) => new Set(current).add(voteId));
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setPendingPreferenceMemberIds(null);
        setApiMessage(`선호 제출 현황을 확인하지 못했어요: ${getErrorMessage(error)}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeVote?.id, context.memberId, context.token, step]);

  useEffect(() => {
    if (step !== 'final' || !finalMenu) {
      return undefined;
    }

    let isCurrent = true;
    setIsLoading(true);

    searchRestaurants({
      menu: finalMenu.name,
      voteId: activeVote?.id,
      page: 1,
    })
      .then((result) => {
        if (!isCurrent) {
          return;
        }

        setRestaurants(result.documents);
        setApiMessage(result.documents.length > 0 ? null : '추천 식당을 찾지 못했어요.');
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setRestaurants([]);
        setApiMessage(`추천 식당을 불러오지 못했어요: ${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [activeVote?.id, finalMenu, step]);

  const showToast = (message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2400);
  };

  const applyRecommendResult = useCallback((result: Awaited<ReturnType<typeof recommendMenus>>): boolean => {
    const apiCandidates = result.candidates.map(toCandidateCard);

    if (result.impossible || apiCandidates.length === 0) {
      setCandidates([]);
      setApiMessage('추천 가능한 후보가 없습니다. 선호 조건을 줄이거나 다시 시도해 주세요.');
      return false;
    }

    setCandidates(apiCandidates);
    setActiveCardIndex(0);
    setBallotChoices({});
    setVoteSummaries((current) =>
      current.map((summary) => ({ ...summary, status: summary.voteId === activeVote?.id ? 'VOTING' : summary.status })),
    );
    setApiMessage(null);
    setStep('cards');

    return true;
  }, [activeVote?.id]);

  const markPreferenceSubmitted = useCallback(
    (voteId: number) => {
      setSubmittedPreferenceVoteIds((current) => new Set(current).add(voteId));

      const currentMemberId = context.memberId;

      if (!currentMemberId) {
        return;
      }

      setPendingPreferenceMemberIds((current) => {
        if (!current) {
          return current;
        }

        const next = new Set(current);
        next.delete(currentMemberId);

        return next;
      });
    },
    [context.memberId],
  );

  const markBallotSubmitted = useCallback((voteId: number) => {
    setSubmittedBallotVoteIds((current) => {
      const next = new Set(current).add(voteId);

      writeSubmittedBallotVoteIds(memberId, next);
      return next;
    });
  }, [memberId]);

  const clearBallotSubmission = useCallback((voteId: number) => {
    setSubmittedBallotVoteIds((current) => {
      const next = withoutVoteId(current, voteId);

      writeSubmittedBallotVoteIds(memberId, next);
      return next;
    });
  }, [memberId]);

  const loadPendingPreferenceIds = useCallback(
    async (voteId: number): Promise<Set<number> | null> => {
      if (!context.memberId) {
        return null;
      }

      const pendingMembers = await listPendingPreferenceMembers(
        { memberId: context.memberId, token: context.token },
        voteId,
      );
      const pendingIds = new Set(pendingMembers.map((member) => member.memberId));

      setPendingPreferenceMemberIds(pendingIds);

      if (!pendingIds.has(context.memberId)) {
        setSubmittedPreferenceVoteIds((current) => new Set(current).add(voteId));
      }

      return pendingIds;
    },
    [context.memberId, context.token],
  );

  const tryRecommendVote = useCallback(
    async (voteId: number, quiet = false): Promise<RecommendAttemptStatus> => {
      if (!context.memberId) {
        return 'failed';
      }

      try {
        const result = await recommendMenus({ memberId: context.memberId, token: context.token }, voteId);

        return applyRecommendResult(result) ? 'ready' : 'failed';
      } catch (error) {
        if (hasApiErrorCode(error, 409)) {
          try {
            const vote = await getVote({ memberId: context.memberId, token: context.token }, voteId);

            setVoteSummaries((current) =>
              current.map((summary) => (summary.voteId === voteId ? toVoteSummary(vote, summary) : summary)),
            );

            if (vote.resultMenu) {
              setFinalMenu(toCandidateCard(vote.resultMenu));
              setApiMessage(null);
              setStep('final');
              return 'ready';
            }

            if (vote.candidates.length > 0) {
              return applyRecommendResult(vote) ? 'ready' : 'failed';
            }
          } catch (syncError) {
            if (!quiet) {
              setApiMessage(`최신 투표 상태를 확인하지 못했어요: ${getErrorMessage(syncError)}`);
            }

            return 'failed';
          }

          if (!quiet) {
            setApiMessage('내 선호는 제출됐습니다. 다른 참여자의 선호 제출을 기다리고 있어요.');
          }

          return 'pending';
        }

        if (!quiet) {
          setApiMessage(`추천 후보를 준비하지 못했어요: ${getErrorMessage(error)}`);
        }

        return 'failed';
      }
    },
    [applyRecommendResult, context.memberId, context.token],
  );

  const refreshPreferenceWait = useCallback(
    async (quiet = false): Promise<RecommendAttemptStatus> => {
      if (!activeVote?.id || !context.memberId) {
        return 'failed';
      }

      try {
        const vote = await getVote(
          { memberId: context.memberId, token: context.token },
          activeVote.id,
        );

        setVoteSummaries((current) =>
          current.map((summary) => (summary.voteId === activeVote.id ? toVoteSummary(vote, summary) : summary)),
        );

        if (vote.resultMenu) {
          setFinalMenu(toCandidateCard(vote.resultMenu));
          setApiMessage(null);
          setStep('final');
          return 'ready';
        }

        if (vote.candidates.length > 0) {
          return applyRecommendResult(vote) ? 'ready' : 'failed';
        }

        const pendingIds = await loadPendingPreferenceIds(activeVote.id);

        if (!pendingIds) {
          return 'failed';
        }

        if (pendingIds.size === 0) {
          if (!quiet) {
            setApiMessage('모든 선호가 제출되어 추천 후보를 준비하고 있어요.');
          }

          return tryRecommendVote(activeVote.id, quiet);
        }

        if (hasSubmittedActivePreference && !quiet) {
          setApiMessage('내 선호는 제출됐습니다. 다른 참여자의 선호 제출을 기다리고 있어요.');
        }

        return 'pending';
      } catch (error) {
        if (!quiet) {
          setApiMessage(`선호 제출 현황을 확인하지 못했어요: ${getErrorMessage(error)}`);
        }

        return 'failed';
      }
    },
    [
      activeVote?.id,
      applyRecommendResult,
      context.memberId,
      context.token,
      hasSubmittedActivePreference,
      loadPendingPreferenceIds,
      tryRecommendVote,
    ],
  );

  const refreshBallotResult = useCallback(
    async (quiet = false) => {
      if (!activeVote?.id || !context.memberId) {
        return;
      }

      try {
        const vote = await getVote({ memberId: context.memberId, token: context.token }, activeVote.id);

        setVoteSummaries((current) =>
          current.map((summary) => (summary.voteId === activeVote.id ? toVoteSummary(vote, summary) : summary)),
        );

        if (vote.resultMenu) {
          setFinalMenu(toCandidateCard(vote.resultMenu));
          setVoteSummaries((current) =>
            current.map((summary) =>
              summary.voteId === activeVote.id
                ? { ...summary, status: vote.status, resultMenu: vote.resultMenu }
                : summary,
            ),
          );
          setApiMessage(null);
          setStep('final');
          return;
        }

        if (!quiet) {
          setApiMessage('내 투표는 제출됐습니다. 참여자 전원이 투표하면 결과가 자동 확정됩니다.');
        }
      } catch (error) {
        if (!quiet) {
          setApiMessage(`투표 상태를 확인하지 못했어요: ${getErrorMessage(error)}`);
        }
      }
    },
    [activeVote?.id, context.memberId, context.token],
  );

  useEffect(() => {
    if (
      step !== 'status' ||
      !activeVote?.id ||
      !hasSubmittedActivePreference ||
      hasSubmittedActiveBallot ||
      candidates.length > 0 ||
      finalMenu
    ) {
      return undefined;
    }

    void refreshPreferenceWait(true);

    const intervalId = window.setInterval(() => {
      void refreshPreferenceWait(true);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    activeVote?.id,
    candidates.length,
    finalMenu,
    hasSubmittedActiveBallot,
    hasSubmittedActivePreference,
    refreshPreferenceWait,
    step,
  ]);

  useEffect(() => {
    if (step !== 'status' || !activeVote?.id || !hasSubmittedActiveBallot || finalMenu) {
      return undefined;
    }

    void refreshBallotResult(true);

    const intervalId = window.setInterval(() => {
      void refreshBallotResult(true);
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeVote?.id, finalMenu, hasSubmittedActiveBallot, refreshBallotResult, step]);

  const resetForNewVote = (title: string) => {
    setVoteTitle(title);
    setActiveVote(null);
    setSelectedPlaceKey(getDefaultPlaceKey(placeOptions));
    setSelectedMemberIds(new Set(members.map((member) => member.memberId)));
    setDislikedCuisines(new Set());
    setRestrictions(new Set());
    setExcludedMenuIds(new Set());
    setMenuSearch('');
    setCandidates([]);
    setActiveCardIndex(0);
    setBallotChoices({});
    setPendingPreferenceMemberIds(null);
    setFinalMenu(null);
    setRestaurants([]);
    setSelectedRestaurant(null);
    setApiMessage(null);
    setStep('setup');
  };

  const toggleMember = (nextMemberId: number) => {
    setSelectedMemberIds((current) => {
      const next = new Set(current);

      if (next.has(nextMemberId)) {
        next.delete(nextMemberId);
      } else {
        next.add(nextMemberId);
      }

      return next;
    });
  };

  const handleCreateVote = async () => {
    if (selectedMemberIds.size === 0) {
      showToast('참여자를 한 명 이상 선택해 주세요.');
      return;
    }

    const participantIds = Array.from(selectedMemberIds);
    const participantIdsForRequest = getParticipantIdsForVoteRequest(participantIds, members);

    const baseVote: ActiveVote = {
      title: voteTitle.trim() || '오늘의 투표',
      placeLabel: selectedPlace.label,
      school: selectedPlace.school,
      participantIds,
    };

    const addVoteSummary = (
      voteId: number,
      status: VoteStatus,
      deadline: string,
      resultMenu: CandidateMenuResponse | null,
    ) => {
      setVoteSummaries((current) => {
        const summary = {
          id: String(voteId),
          voteId,
          title: baseVote.title,
          status,
          deadline,
          meta: `${baseVote.placeLabel} · 참여자 ${participantIds.length}명`,
          placeLabel: baseVote.placeLabel,
          school: baseVote.school,
          participantIds,
          resultMenu,
        };

        return [summary, ...current.filter((item) => item.voteId !== voteId)];
      });
    };

    setIsLoading(true);
    setApiMessage(null);

    if (!hasBackendGroup || !context.memberId) {
      setApiMessage('로그인 정보 또는 그룹 정보를 확인할 수 없어 투표를 만들 수 없어요.');
      setIsLoading(false);
      return;
    }

    try {
      const deadline = formatBackendDateTime(new Date(Date.now() + 1000 * 60 * 60 * 2));
      const createdVote = await createVote(numericGroupId, {
        title: baseVote.title,
        deadline,
        school: baseVote.school,
        participantMemberIds: participantIdsForRequest,
      }, context.token);

      setActiveVote({
        ...baseVote,
        id: createdVote.id,
      });
      addVoteSummary(
        createdVote.id,
        createdVote.status,
        createdVote.deadline || deadline,
        createdVote.resultMenu,
      );
      setStep('status');
    } catch (error) {
      setApiMessage(`투표를 만들지 못했어요: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVote = async (vote: VoteSummary) => {
    setIsLoading(true);
    setApiMessage(null);

    try {
      setPendingPreferenceMemberIds(null);
      const detail = context.memberId ? await getVote({ memberId: context.memberId, token: context.token }, vote.voteId) : null;
      const nextSummary = detail ? toVoteSummary(detail, vote) : vote;
      const nextCandidates = detail?.candidates.map(toCandidateCard) ?? [];
      const hasSubmittedBallot = submittedBallotVoteIds.has(nextSummary.voteId);

      setVoteSummaries((current) =>
        current.map((summary) => (summary.voteId === nextSummary.voteId ? nextSummary : summary)),
      );
      setActiveVote({
        id: nextSummary.voteId,
        title: nextSummary.title,
        placeLabel: nextSummary.placeLabel,
        school: nextSummary.school,
        participantIds: nextSummary.participantIds,
      });
      setSelectedMemberIds(new Set(nextSummary.participantIds));
      setCandidates(nextCandidates);
      setBallotChoices({});

      if (detail?.resultMenu) {
        if (memberId && detail.participants.some((participant) => participant.memberId === memberId)) {
          markBallotSubmitted(nextSummary.voteId);
        }

        setFinalMenu(toCandidateCard(detail.resultMenu));
        setStep('final');
      } else if (hasSubmittedBallot) {
        setFinalMenu(null);
        setApiMessage('내 투표는 제출됐습니다. 참여자 전원이 투표하면 결과가 자동 확정됩니다.');
        setStep('status');
      } else {
        setFinalMenu(null);
        setStep(nextCandidates.length > 0 ? 'cards' : 'status');
      }
    } catch (error) {
      setApiMessage(`투표 상태를 확인하지 못했어요: ${getErrorMessage(error)}`);
      setActiveVote({
        id: vote.voteId,
        title: vote.title,
        placeLabel: vote.placeLabel,
        school: vote.school,
        participantIds: vote.participantIds,
      });
      setSelectedMemberIds(new Set(vote.participantIds));
      setStep('status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelVote = async () => {
    if (!activeVote?.id || !context.memberId) {
      setApiMessage('투표 정보 또는 로그인 정보를 확인할 수 없어 삭제할 수 없어요.');
      return;
    }

    const voteId = activeVote.id;

    setIsLoading(true);
    setApiMessage(null);

    try {
      await deleteVote({ memberId: context.memberId, token: context.token }, voteId);
      setVoteSummaries((current) => current.filter((vote) => vote.voteId !== voteId));
      clearBallotSubmission(voteId);
      setSubmittedPreferenceVoteIds((current) => {
        const next = new Set(current);

        next.delete(voteId);

        return next;
      });
      setActiveVote(null);
      setCandidates([]);
      setBallotChoices({});
      setPendingPreferenceMemberIds(null);
      setFinalMenu(null);
      setStep('list');
      showToast('투표를 삭제했어요.');
    } catch (error) {
      setApiMessage(`투표를 삭제하지 못했어요: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVoteFromList = async (vote: VoteSummary) => {
    if (!context.memberId) {
      setVoteListMessage('로그인 정보를 확인할 수 없어 투표를 삭제할 수 없어요.');
      return;
    }

    setIsLoadingVoteSummaries(true);
    setVoteListMessage(null);

    try {
      await deleteVote({ memberId: context.memberId, token: context.token }, vote.voteId);
      setVoteSummaries((current) => current.filter((summary) => summary.voteId !== vote.voteId));
      clearBallotSubmission(vote.voteId);
      setSubmittedPreferenceVoteIds((current) => withoutVoteId(current, vote.voteId));
      showToast('투표를 삭제했어요.');
    } catch (error) {
      setVoteListMessage(`투표를 삭제하지 못했어요: ${getErrorMessage(error)}`);
    } finally {
      setIsLoadingVoteSummaries(false);
    }
  };

  const handleVoteReminder = async () => {
    if (!('Notification' in window)) {
      showToast('이 브라우저는 로컬 알림을 지원하지 않아요.');
      return;
    }

    const permission =
      Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;

    if (permission !== 'granted') {
      showToast('알림 권한이 없어 앱 안에서만 안내할게요.');
      return;
    }

    new Notification('운식 투표 알림', {
      body: `${activeVote?.title ?? '투표'} 참여를 기다리고 있어요.`,
    });
    showToast('브라우저 로컬 알림을 보냈어요.');
  };

  const handlePreferenceSubmit = async () => {
    setIsLoading(true);
    setApiMessage(null);

    if (!activeVote?.id || !context.memberId) {
      setApiMessage('투표 정보 또는 로그인 정보를 확인할 수 없어 추천 후보를 받을 수 없어요.');
      setIsLoading(false);
      return;
    }

    try {
      await submitPreference(
        { memberId: context.memberId, token: context.token },
        activeVote.id,
        {
          dislikedCuisines: Array.from(effectiveDislikedCuisines),
          restrictions: Array.from(restrictions),
        },
      );

      markPreferenceSubmitted(activeVote.id);

      const recommendStatus = await refreshPreferenceWait(false);

      if (recommendStatus === 'pending') {
        setApiMessage('내 선호는 제출됐습니다. 다른 참여자의 선호 제출을 기다리고 있어요.');
        setStep('status');
      }
    } catch (error) {
      setApiMessage(`선호를 제출하지 못했어요: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!groupInviteCode) {
      showToast('초대 링크를 아직 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }

    const inviteUrl = new URL('/grouplist', window.location.origin);
    inviteUrl.searchParams.set('code', groupInviteCode);

    try {
      if (navigator.share) {
        await navigator.share({
          title: '운식 그룹 초대',
          text: '운식에서 같이 오늘의 메뉴를 골라요.',
          url: inviteUrl.toString(),
        });
        showToast('초대 링크를 공유했어요.');
        return;
      }

      await navigator.clipboard.writeText(inviteUrl.toString());
      showToast('초대 링크를 복사했어요. 카카오톡에 붙여넣어 주세요.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      showToast(`초대 링크: ${inviteUrl.toString()}`);
    }
  };

  const handleCandidateVote = async (choice: BallotChoice) => {
    if (!currentCandidate) {
      setApiMessage('추천 후보가 없어 호불호 투표를 진행할 수 없어요.');
      return;
    }

    const nextChoices = {
      ...ballotChoices,
      [currentCandidate.menuId]: choice,
    };

    setBallotChoices(nextChoices);

    if (activeCardIndex < candidates.length - 1) {
      setActiveCardIndex((current) => current + 1);
      return;
    }

    const revealMenu = candidates.find((candidate) => nextChoices[candidate.menuId] === 'LIKE') ?? currentCandidate;

    setFinalMenu(revealMenu);
    setStep('reveal');
  };

  const handleFinalize = async (choices: Record<number, BallotChoice> = ballotChoices) => {
    setIsLoading(true);
    setApiMessage(null);

    if (!activeVote?.id || !context.memberId) {
      setApiMessage('투표 정보 또는 로그인 정보를 확인할 수 없어 결과를 확정할 수 없어요.');
      setIsLoading(false);
      return;
    }

    const voteId = activeVote.id;

    const apiChoices = Object.fromEntries(
      candidates.map((candidate) => [String(candidate.menuId), choices[candidate.menuId] ?? 'DISLIKE']),
    );

    try {
      await submitBallot({ memberId: context.memberId, token: context.token }, voteId, apiChoices);
      markBallotSubmitted(voteId);
    } catch (error) {
      setApiMessage(`호불호 투표를 제출하지 못했어요: ${getErrorMessage(error)}`);
      setIsLoading(false);
      return;
    }

    try {
      const voteAfterBallot = await getVote({ memberId: context.memberId, token: context.token }, voteId);
      setVoteSummaries((current) =>
        current.map((summary) => (summary.voteId === voteId ? toVoteSummary(voteAfterBallot, summary) : summary)),
      );

      if (voteAfterBallot.resultMenu) {
        setFinalMenu(toCandidateCard(voteAfterBallot.resultMenu));
        setStep('final');
        setIsLoading(false);
        return;
      }

      setFinalMenu(null);
      setActiveCardIndex(0);
      setBallotChoices({});
      setApiMessage('내 투표는 제출됐습니다. 참여자 전원이 투표하면 결과가 자동 확정됩니다.');
      setStep('status');
      setIsLoading(false);
      return;
    } catch (error) {
      try {
        const vote = await getVote({ memberId: context.memberId, token: context.token }, voteId);

        if (vote.resultMenu) {
          setFinalMenu(toCandidateCard(vote.resultMenu));
          setVoteSummaries((current) =>
            current.map((summary) =>
              summary.voteId === voteId
                ? { ...summary, status: vote.status, resultMenu: vote.resultMenu }
                : summary,
            ),
          );
          setStep('final');
          setIsLoading(false);
          return;
        }
      } catch {
        // The first status lookup failure below is the actionable failure for the user.
      }

      setApiMessage(`투표 상태를 확인하지 못했어요: ${getErrorMessage(error)}`);
      setStep('status');
      setIsLoading(false);
    }
  };

  const handleToggleCuisine = (cuisine: Cuisine) => {
    const isSelected = effectiveDislikedCuisines.has(cuisine);

    setDislikedCuisines((current) => {
      const next = new Set(current);

      if (isSelected) {
        next.delete(cuisine);
      } else {
        next.add(cuisine);
      }

      return next;
    });

    if (isSelected) {
      setExcludedMenuIds((current) => {
        const next = new Set(current);

        menuCatalog.forEach((menu) => {
          if (menu.cuisine === cuisine) {
            next.delete(menu.id);
          }
        });

        return next;
      });
    }
  };

  const handleToggleExcludedMenu = (menuId: number) => {
    setExcludedMenuIds((current) => toggleSetValue(current, menuId));
  };

  const retryMenuCatalog = () => {
    setMenuCatalogStatus('idle');
    setApiMessage(null);
    setMenuCatalogRequestKey((current) => current + 1);
  };

  const handleToggleRestriction = (option: (typeof RESTRICTION_OPTIONS)[number]) => {
    if (option.label === '없음') {
      setRestrictions(new Set());
      return;
    }

    const restriction = option.restriction;

    if (option.unsupported || !restriction) {
      showToast(`${option.label}은 아직 선택할 수 없어요.`);
      return;
    }

    setRestrictions((current) => toggleSetValue(current, restriction));
  };

  const renderStep = () => {
    if (step === 'list') {
      return (
        <VoteListView
          groupId={groupId}
          memberName={memberName}
          onBack={onBackToRooms}
          onCreate={() => resetForNewVote('오늘 점심')}
          onDeleteVote={(vote) => void handleDeleteVoteFromList(vote)}
          onSelectVote={handleSelectVote}
          submittedBallotVoteIds={submittedBallotVoteIds}
          isLoading={isLoadingVoteSummaries}
          message={voteListMessage}
          votes={voteSummaries}
        />
      );
    }

    if (step === 'setup') {
      return (
        <VoteSetupView
          apiMessage={apiMessage}
          isLoading={isLoading}
          members={members}
          onBack={() => setStep('list')}
          onCreateVote={() => void handleCreateVote()}
          onInvite={() => void handleInvite()}
          onOpenHistory={() => {
            setHistoryReturnStep('setup');
            setStep('history');
          }}
          onPlaceChange={setSelectedPlaceKey}
          onToggleMember={toggleMember}
          placeOptions={placeOptions}
          selectedMemberIds={selectedMemberIds}
          selectedPlaceKey={selectedPlaceKey}
        />
      );
    }

    if (step === 'status') {
      return (
        <VoteStatusView
          apiMessage={apiMessage}
          checkedMemberIds={checkedStatusMemberIds}
          hasSubmittedBallot={hasSubmittedActiveBallot}
          hasSubmittedPreference={hasSubmittedActivePreference}
          isWaitingForPreferenceCompletion={isWaitingForPreferenceCompletion}
          isLoading={isLoading}
          members={selectedMembers}
          onBack={() => setStep(hasSubmittedActiveBallot || hasSubmittedActivePreference ? 'list' : 'setup')}
          onCancel={() => void handleCancelVote()}
          onOpenHistory={() => {
            setHistoryReturnStep('status');
            setStep('history');
          }}
          onNext={() => {
            if (hasSubmittedActiveBallot) {
              setStep('list');
              return;
            }

            if (isWaitingForPreferenceCompletion) {
              void refreshPreferenceWait(false);
              return;
            }

            setStep('oracle');
          }}
          onNotify={() => void handleVoteReminder()}
        />
      );
    }

    if (step === 'history') {
      return (
        <MealHistoryView
          filter={historyFilter}
          items={mealHistoryItems}
          onBack={() => setStep(historyReturnStep)}
          onFilterChange={setHistoryFilter}
        />
      );
    }

    if (step === 'oracle') {
      return (
        <OracleView
          onBack={() => setStep('status')}
          onNext={() => setStep('preference')}
          onSelect={setSelectedOracleId}
          selectedOracleId={selectedOracleId}
        />
      );
    }

    if (step === 'preference') {
      return (
        <PreferenceView
          apiMessage={apiMessage}
          dislikedCuisines={effectiveDislikedCuisines}
          excludedMenuIds={excludedMenuIds}
          isLoading={isLoading}
          menuCatalog={menuCatalog}
          menuCatalogStatus={menuCatalogStatus}
          menuSearch={menuSearch}
          onBack={() => setStep('oracle')}
          onMenuSearchChange={setMenuSearch}
          onRetryMenuCatalog={retryMenuCatalog}
          onNext={() => void handlePreferenceSubmit()}
          onToggleCuisine={handleToggleCuisine}
          onToggleExcludedMenu={handleToggleExcludedMenu}
          onToggleRestriction={handleToggleRestriction}
          restrictions={restrictions}
        />
      );
    }

    if (step === 'cards') {
      if (!currentCandidate) {
        return (
          <VoteBlockingView
            actionLabel="취향 다시 선택"
            message={apiMessage ?? '추천 후보가 없어 카드 투표를 진행할 수 없어요.'}
            onAction={() => setStep('preference')}
            onBack={() => setStep('preference')}
            title="추천 후보 없음"
          />
        );
      }

      return (
        <CardVoteView
          activeCardIndex={activeCardIndex}
          apiMessage={apiMessage}
          candidate={currentCandidate}
          candidates={candidates}
          isLoading={isLoading}
          onBack={() => setStep('preference')}
          onVote={(choice) => void handleCandidateVote(choice)}
        />
      );
    }

    if (step === 'reveal') {
      const visibleFinalMenu = likedCandidate ?? finalMenu;

      if (!visibleFinalMenu) {
        return (
          <VoteBlockingView
            actionLabel="카드 투표로 돌아가기"
            message={apiMessage ?? '호불호 투표 결과로 표시할 메뉴가 없습니다.'}
            onAction={() => setStep('cards')}
            onBack={() => setStep('cards')}
            title="결과 없음"
          />
        );
      }

      return (
        <RevealView
          apiMessage={apiMessage}
          finalMenu={visibleFinalMenu}
          isLoading={isLoading}
          members={selectedMembers}
          onBack={() => setStep('cards')}
          onFinalize={() => void handleFinalize()}
          onRetry={() => {
            setActiveCardIndex(0);
            setBallotChoices({});
            setFinalMenu(null);
            setStep('cards');
          }}
        />
      );
    }

    if (step === 'final') {
      if (!finalMenu) {
        return (
          <VoteBlockingView
            actionLabel="투표 목록으로"
            message={apiMessage ?? '확정된 메뉴를 아직 받지 못했어요.'}
            onAction={() => setStep('list')}
            onBack={() => setStep('reveal')}
            title="확정 메뉴 없음"
          />
        );
      }

      return (
        <FinalResultView
          apiMessage={apiMessage}
          finalMenu={finalMenu}
          isLoading={isLoading}
          onBack={onBackToRooms}
          onBackToRooms={onBackToRooms}
          onBackToVotes={() => setStep('list')}
          onOpenRestaurant={(restaurant) => {
            setSelectedRestaurant(restaurant);
            setStep('restaurant');
          }}
          onOpenScore={() => setStep('score')}
          restaurants={restaurants}
        />
      );
    }

    if (step === 'restaurant' && selectedRestaurant) {
      if (!finalMenu) {
        return (
          <VoteBlockingView
            actionLabel="결과로 돌아가기"
            message="확정 메뉴 정보가 없어 식당 상세를 열 수 없어요."
            onAction={() => setStep('final')}
            onBack={() => setStep('final')}
            title="메뉴 정보 없음"
          />
        );
      }

      return (
        <RestaurantDetailView
          finalMenu={finalMenu}
          onBack={() => setStep('final')}
          onShare={() => void shareRestaurant(selectedRestaurant, showToast)}
          restaurant={selectedRestaurant}
        />
      );
    }

    if (!finalMenu) {
      return (
        <VoteBlockingView
          actionLabel="결과로 돌아가기"
          message="확정 메뉴 정보가 없어 상세를 열 수 없어요."
          onAction={() => setStep('final')}
          onBack={() => setStep('final')}
          title="메뉴 정보 없음"
        />
      );
    }

    return <ScoreDetailView finalMenu={finalMenu} members={selectedMembers} onBack={() => setStep('final')} />;
  };

  return (
    <main className={step === 'history' ? 'vote-flow-screen vote-history-screen' : 'vote-flow-screen'}>
      <section className="vote-flow-canvas">
        <StarField />
        {renderStep()}
        {toast ? <div className="vote-toast">{toast}</div> : null}
      </section>
    </main>
  );
}

function VoteListView({
  groupId,
  memberName,
  votes,
  isLoading,
  message,
  onBack,
  onCreate,
  onDeleteVote,
  onSelectVote,
  submittedBallotVoteIds,
}: {
  groupId: string;
  memberName?: string;
  votes: VoteSummary[];
  isLoading: boolean;
  message: string | null;
  onBack: () => void;
  onCreate: () => void;
  onDeleteVote: (vote: VoteSummary) => void;
  onSelectVote: (vote: VoteSummary) => void;
  submittedBallotVoteIds: Set<number>;
}) {
  const [openMenuVoteId, setOpenMenuVoteId] = useState<number | null>(null);
  const hasLoadError = Boolean(message?.includes('실패'));
  const emptyTitle = isLoading
    ? '투표 목록을 불러오는 중입니다'
    : hasLoadError
      ? '투표 목록을 불러오지 못했어요'
      : '그룹 투표 목록이 비어 있어요';

  return (
    <>
      <VoteNav title="투표 리스트" onBack={onBack} />
      <header className="vote-page-header">
        <p className="vote-eyebrow">GROUP #{groupId}</p>
        <h1>어떤 식사를 정할까요?</h1>
        <p>{memberName ? `${memberName}님이 참여 중인 그룹입니다.` : '그룹 안에서 여러 투표를 만들 수 있어요.'}</p>
      </header>

      {votes.length > 0 ? (
        <div className="vote-list-stack">
          {votes.map((vote) => (
            <div className="vote-list-item vote-list-item-with-action" key={vote.id}>
              <button className="vote-list-card" type="button" onClick={() => onSelectVote(vote)}>
                <span className="vote-list-icon">🗳️</span>
                <span>
                  <strong>{vote.title}</strong>
                  <small>{vote.meta}</small>
                </span>
                <em>{submittedBallotVoteIds.has(vote.voteId) ? '참여 완료' : getVoteStatusLabel(vote.status)}</em>
              </button>
              <div className="vote-list-menu">
                <button
                  className="vote-list-menu-button"
                  type="button"
                  aria-label={`${vote.title} 투표 메뉴`}
                  aria-expanded={openMenuVoteId === vote.voteId}
                  disabled={isLoading}
                  onClick={() => setOpenMenuVoteId((current) => current === vote.voteId ? null : vote.voteId)}
                >
                  <span aria-hidden="true">⋮</span>
                </button>
                {openMenuVoteId === vote.voteId ? (
                  <div className="vote-list-menu-popover">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuVoteId(null);
                        onDeleteVote(vote);
                      }}
                    >
                      삭제하기
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="vote-empty-panel">
          <strong>{emptyTitle}</strong>
          <p>{isLoading ? '투표를 불러오는 중입니다.' : message ?? '새 투표를 만들어 메뉴를 정해보세요.'}</p>
        </div>
      )}

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onCreate}>
          새 투표 만들기
        </button>
      </div>
    </>
  );
}

function VoteSetupView({
  selectedPlaceKey,
  placeOptions,
  selectedMemberIds,
  members,
  apiMessage,
  isLoading,
  onBack,
  onPlaceChange,
  onToggleMember,
  onInvite,
  onOpenHistory,
  onCreateVote,
}: {
  selectedPlaceKey: string;
  placeOptions: PlaceOption[];
  selectedMemberIds: Set<number>;
  members: VoteMember[];
  apiMessage: string | null;
  isLoading: boolean;
  onBack: () => void;
  onPlaceChange: (value: string) => void;
  onToggleMember: (memberId: number) => void;
  onInvite: () => void;
  onOpenHistory: () => void;
  onCreateVote: () => void;
}) {
  return (
    <>
      <VoteNav title="그룹 컨디션" onBack={onBack} />
      <section className="vote-section">
        <div className="vote-label-row">
          <strong>어디서 먹을지 골라주세요</strong>
          <span>그룹장 설정</span>
        </div>
        <div className="vote-chip-row">
          {placeOptions.map((place) => (
            <button
              className={place.key === selectedPlaceKey ? 'vote-chip vote-chip-selected' : 'vote-chip'}
              type="button"
              key={place.key}
              onClick={() => onPlaceChange(place.key)}
            >
              {place.label}
            </button>
          ))}
        </div>
      </section>

      <button className="vote-history-button vote-history-button-setup" type="button" onClick={onOpenHistory}>
        <span>
          <strong>과거 내역 보기</strong>
          <small>이전에 선정된 메뉴를 확인해요</small>
        </span>
        <em aria-hidden="true">→</em>
      </button>

      <section className="vote-section vote-member-section">
        <div className="vote-member-header">
          <span>
            <strong>이번 식사 참여자</strong>
            <small>함께하는 멤버를 선택해주세요</small>
          </span>
          <button type="button" onClick={onInvite}>
            + 초대
          </button>
        </div>

        <div className="vote-member-list">
          {members.length > 0 ? (
            members.map((member) => (
              <button
                className={selectedMemberIds.has(member.memberId) ? 'vote-member vote-member-selected' : 'vote-member'}
                type="button"
                key={member.memberId}
                onClick={() => onToggleMember(member.memberId)}
              >
                <Avatar member={member} />
                <span>
                  <strong>{member.name}</strong>
                  <small>{member.role === 'OWNER' ? '그룹장' : '멤버'}</small>
                </span>
                <em>{selectedMemberIds.has(member.memberId) ? '✓' : ''}</em>
              </button>
            ))
          ) : (
            <div className="vote-empty-panel">
              <strong>참여자를 불러오지 못했어요</strong>
              <p>잠시 후 다시 시도해 주세요.</p>
            </div>
          )}
        </div>

        <button className="vote-kakao-invite" type="button" onClick={onInvite}>
          <span>
            <strong>카카오톡으로 초대하기</strong>
            <small>링크를 공유해 그룹에 초대하세요</small>
          </span>
          <em aria-hidden="true">→</em>
        </button>
      </section>

      <ApiMessage message={apiMessage} />

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" disabled={isLoading} onClick={onCreateVote}>
          {isLoading ? '투표 만드는 중' : '다음으로'}
        </button>
      </div>
    </>
  );
}

function VoteStatusView({
  apiMessage,
  checkedMemberIds,
  hasSubmittedBallot,
  hasSubmittedPreference,
  isWaitingForPreferenceCompletion,
  isLoading,
  members,
  onBack,
  onNotify,
  onCancel,
  onOpenHistory,
  onNext,
}: {
  apiMessage: string | null;
  checkedMemberIds: Set<number>;
  hasSubmittedBallot: boolean;
  hasSubmittedPreference: boolean;
  isWaitingForPreferenceCompletion: boolean;
  isLoading: boolean;
  members: VoteMember[];
  onBack: () => void;
  onNotify: () => void;
  onCancel: () => void;
  onOpenHistory: () => void;
  onNext: () => void;
}) {
  const completedCount = members.filter((member) => checkedMemberIds.has(member.memberId)).length;
  const progressWidth = members.length > 0 ? `${Math.min(100, (completedCount / members.length) * 100)}%` : '0%';
  const statusLabel = getStatusViewLabel(hasSubmittedBallot, hasSubmittedPreference);
  const primaryLabel = getStatusPrimaryLabel(hasSubmittedBallot, isWaitingForPreferenceCompletion, isLoading);
  const progressLabel = hasSubmittedBallot
    ? `호불호 투표 ${completedCount}/${members.length}명 · 결과는 전원 투표 후 자동 표시`
    : `선호 제출 ${completedCount}/${members.length}명 · 후보는 전원 제출 후 자동 준비`;

  return (
    <>
      <VoteNav title="그룹 컨디션" onBack={onBack} />
      <section className="vote-status-card">
        <div className="vote-status-head">
          <strong>🗳️ 투표 현황</strong>
          <span>{statusLabel}</span>
        </div>
        <div className="vote-progress-row">
          <div className="vote-progress-track">
            <div style={{ width: progressWidth }} />
          </div>
          <small>{progressLabel}</small>
        </div>
        <div className="vote-status-members">
          {members.map((member) => (
            <span key={member.memberId}>
              <Avatar member={member} checked={checkedMemberIds.has(member.memberId)} />
              <small>{member.name}</small>
            </span>
          ))}
        </div>
      </section>

      <div className="vote-action-row">
        <button className="vote-outline-yellow" type="button" onClick={onNotify}>
          📣 투표 알림 보내기
        </button>
        <button className="vote-outline-red" type="button" disabled={isLoading} onClick={onCancel}>
          {isLoading ? '취소 중' : '투표 취소'}
        </button>
      </div>

      <button className="vote-history-button" type="button" onClick={onOpenHistory}>
        <span aria-hidden="true">↺</span>
        <span>
          <strong>과거 내역 보기</strong>
          <small>우리 그룹이 함께 먹었던 메뉴 기록</small>
        </span>
        <em aria-hidden="true">›</em>
      </button>

      <ApiMessage message={apiMessage} />

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onNext}>
          {primaryLabel}
        </button>
      </div>
    </>
  );
}

function MealHistoryView({
  items,
  filter,
  onBack,
  onFilterChange,
}: {
  items: MealHistoryItem[];
  filter: MealHistoryFilter;
  onBack: () => void;
  onFilterChange: (filter: MealHistoryFilter) => void;
}) {
  const filteredItems = getFilteredHistoryItems(items, filter);
  const monthCount = items.filter((item) => isSameMonth(item.date, new Date())).length;
  const weekCount = items.filter((item) => isSameWeek(item.date, new Date())).length;

  return (
    <>
      <VoteNav title="과거 내역" onBack={onBack} />

      <section className="vote-history-summary">
        <strong>우리 그룹, 총 {items.length}번 함께 먹었어요</strong>
        <span>
          이번 달 {monthCount}회 <b aria-hidden="true">·</b> 이번 주 {weekCount}회
        </span>
      </section>

      <div className="vote-history-filters" role="tablist" aria-label="과거 내역 필터">
        {HISTORY_FILTERS.map((option) => (
          <button
            className={option.value === filter ? 'vote-history-filter vote-history-filter-selected' : 'vote-history-filter'}
            type="button"
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            aria-selected={option.value === filter}
            role="tab"
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="vote-history-divider" />
      <p className="vote-history-title">최근 식사 내역</p>

      {filteredItems.length > 0 ? (
        <div className="vote-meal-history-list">
          {filteredItems.map((item) => (
            <article className="vote-meal-history-card" key={item.id}>
              <time>{item.dateLabel}</time>
              <span>
                <strong>{item.menuName}</strong>
                <small>{item.subtitle}</small>
              </span>
              <em>{item.placeLabel}</em>
            </article>
          ))}
        </div>
      ) : (
        <div className="vote-empty-panel vote-history-empty">
          <strong>{getHistoryEmptyTitle(filter)}</strong>
          <p>
            {items.length === 0
              ? '확정된 투표 결과가 생기면 이곳에 자동으로 쌓여요.'
              : '다른 필터를 선택해 과거 식사 내역을 확인해 보세요.'}
          </p>
        </div>
      )}
    </>
  );
}

function OracleView({
  selectedOracleId,
  onSelect,
  onBack,
  onNext,
}: {
  selectedOracleId: string;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [sparkedOracleId, setSparkedOracleId] = useState<string | null>(null);
  const sparkTimerRef = useRef<number | null>(null);
  const selectedIndex = Math.max(
    0,
    ORACLES.findIndex((oracle) => oracle.id === selectedOracleId),
  );
  const leftIndex = (selectedIndex + ORACLES.length - 1) % ORACLES.length;

  const getOraclePosition = (index: number) => {
    if (index === selectedIndex) {
      return 'active';
    }

    if (index === leftIndex) {
      return 'left';
    }

    return 'right';
  };

  useEffect(() => {
    return () => {
      if (sparkTimerRef.current !== null) {
        window.clearTimeout(sparkTimerRef.current);
      }
    };
  }, []);

  const handleSelectOracle = (oracleId: string) => {
    if (sparkTimerRef.current !== null) {
      window.clearTimeout(sparkTimerRef.current);
    }

    setSparkedOracleId(oracleId);
    sparkTimerRef.current = window.setTimeout(() => {
      setSparkedOracleId(null);
    }, 560);
    onSelect(oracleId);
  };

  return (
    <>
      <VoteNav title="" onBack={onBack} />
      <header className="vote-oracle-header">
        <h1>
          각자의 성향을
          <br />
          <span>점쳐봅시다</span>
        </h1>
        <p>점쟁이가 당신의 오늘 점심을 점지해 드립니다</p>
      </header>

      <p className="vote-small-title">✦ 점술사를 선택하세요</p>
      <div className="vote-oracle-stage">
        {ORACLES.map((oracle, index) => {
          const position = getOraclePosition(index);

          return (
          <button
            className={`vote-oracle-card vote-oracle-card-${position}${
              oracle.id === selectedOracleId ? ' vote-oracle-card-selected' : ''
            }${oracle.id === sparkedOracleId ? ' vote-oracle-card-sparked' : ''
            }`}
            type="button"
            key={oracle.id}
            onClick={() => handleSelectOracle(oracle.id)}
            aria-pressed={oracle.id === selectedOracleId}
          >
            <span className="vote-oracle-image">
              <img src={oracle.imageSrc} alt="" aria-hidden="true" />
            </span>
            <strong>{oracle.name}</strong>
            <small>{oracle.copy}</small>
            <em />
          </button>
          );
        })}
      </div>

      <div className="vote-warning-banner">⚠ 알레르기 · 음식 제한은 다음 단계에서</div>
      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onNext}>
          운명을 열어보기!
        </button>
      </div>
    </>
  );
}

function PreferenceView({
  dislikedCuisines,
  excludedMenuIds,
  restrictions,
  apiMessage,
  isLoading,
  menuCatalog,
  menuCatalogStatus,
  menuSearch,
  onBack,
  onMenuSearchChange,
  onRetryMenuCatalog,
  onNext,
  onToggleCuisine,
  onToggleExcludedMenu,
  onToggleRestriction,
}: {
  dislikedCuisines: Set<Cuisine>;
  excludedMenuIds: Set<number>;
  restrictions: Set<Restriction>;
  apiMessage: string | null;
  isLoading: boolean;
  menuCatalog: MenuResponse[];
  menuCatalogStatus: MenuCatalogStatus;
  menuSearch: string;
  onBack: () => void;
  onMenuSearchChange: (value: string) => void;
  onRetryMenuCatalog: () => void;
  onNext: () => void;
  onToggleCuisine: (cuisine: Cuisine) => void;
  onToggleExcludedMenu: (menuId: number) => void;
  onToggleRestriction: (option: (typeof RESTRICTION_OPTIONS)[number]) => void;
}) {
  const normalizedSearch = normalizeMenuSearchText(menuSearch);
  const selectedMenus = menuCatalog.filter((menu) => excludedMenuIds.has(menu.id));
  const searchedMenus = normalizedSearch
    ? menuCatalog
        .filter((menu) => {
          const cuisineLabel = normalizeMenuSearchText(getCuisineLabel(menu.cuisine));
          const menuName = normalizeMenuSearchText(menu.name);

          return menuName.includes(normalizedSearch) || cuisineLabel.includes(normalizedSearch);
        })
        .sort((first, second) => {
          const firstStartsWith = normalizeMenuSearchText(first.name).startsWith(normalizedSearch);
          const secondStartsWith = normalizeMenuSearchText(second.name).startsWith(normalizedSearch);

          return Number(secondStartsWith) - Number(firstStartsWith) || first.name.localeCompare(second.name, 'ko-KR');
        })
        .slice(0, 12)
    : [];

  return (
    <>
      <VoteNav title="오늘의 취향" onBack={onBack} />
      <header className="vote-centered-header vote-preference-header">
        <strong>🚫 오늘 당기지 않는 게 있나요?</strong>
        <p>없으면 그냥 스킵해도 괜찮아요</p>
      </header>

      <div className="vote-menu-search">
        <span>⌕</span>
        <input
          aria-label="빼고 싶은 메뉴 검색"
          onChange={(event) => onMenuSearchChange(event.target.value)}
          placeholder="예: 국밥, 피자, 회"
          value={menuSearch}
        />
        {menuSearch ? (
          <button type="button" onClick={() => onMenuSearchChange('')} aria-label="검색어 지우기">
            ×
          </button>
        ) : (
          <em>{menuCatalogStatus === 'loading' ? '로딩' : '검색'}</em>
        )}
      </div>

      {selectedMenus.length > 0 ? (
        <>
          <div className="vote-selected-menu-list" aria-label="검색으로 제외한 메뉴">
            {selectedMenus.map((menu) => (
              <button type="button" key={menu.id} onClick={() => onToggleExcludedMenu(menu.id)}>
                <span>{menu.name}</span>
                <small>{getCuisineLabel(menu.cuisine)} 제외</small>
                <b aria-hidden="true">×</b>
              </button>
            ))}
          </div>
          <p className="vote-menu-search-help">선택한 메뉴와 같은 음식 종류가 추천에서 제외됩니다.</p>
        </>
      ) : null}

      {normalizedSearch ? (
        <div className="vote-menu-search-results">
          {menuCatalogStatus === 'loading' ? <p>전체 메뉴를 불러오는 중입니다</p> : null}
          {menuCatalogStatus === 'error' ? (
            <div className="vote-menu-search-error">
              <p>메뉴를 불러오지 못했어요.</p>
              <button type="button" onClick={onRetryMenuCatalog}>다시 불러오기</button>
            </div>
          ) : null}
          {menuCatalogStatus === 'loaded' && searchedMenus.length === 0 ? <p>검색 결과가 없습니다</p> : null}
          {searchedMenus.map((menu) => {
            const isSelected = excludedMenuIds.has(menu.id);

            return (
              <button
                className={isSelected ? 'vote-menu-search-item vote-menu-search-item-selected' : 'vote-menu-search-item'}
                type="button"
                key={menu.id}
                onClick={() => onToggleExcludedMenu(menu.id)}
                aria-pressed={isSelected}
              >
                <span>{getMenuIcon(menu.name, menu.cuisine)}</span>
                <strong>{menu.name}</strong>
                <small>{getCuisineLabel(menu.cuisine)}</small>
                <b aria-hidden="true">{isSelected ? '✓' : '+'}</b>
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="vote-preference-label">카테고리로 빠르게 제외하기</p>

        <div className="vote-cuisine-grid">
          {CUISINE_OPTIONS.map((option) => {
            const isSelected = dislikedCuisines.has(option.cuisine);
            const styleTokens = CUISINE_STYLE_TOKENS[option.cuisine];

            return (
              <button
                className={isSelected ? 'vote-cuisine vote-cuisine-selected' : 'vote-cuisine'}
                style={
                  {
                    '--vote-accent': option.color,
                    '--vote-accent-tint': styleTokens.tint,
                    '--vote-accent-ring': styleTokens.ring,
                    '--vote-accent-glow': styleTokens.glow,
                    '--vote-accent-halo': styleTokens.halo,
                  } as CSSProperties
                }
                type="button"
                key={option.cuisine}
              onClick={() => onToggleCuisine(option.cuisine)}
              aria-pressed={isSelected}
            >
              <span aria-hidden="true">
                <img alt="" src={option.imageSrc} />
              </span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
              <b aria-hidden="true">{isSelected ? '✓' : ''}</b>
            </button>
          );
        })}
      </div>

      <div className="vote-divider" />
      <p className="vote-small-title">⚠ 알레르기 / 음식 제한</p>
      <div className="vote-chip-row vote-restriction-row">
        {RESTRICTION_OPTIONS.map((option) => {
          const isSelected = option.restriction ? restrictions.has(option.restriction) : false;

          return (
            <button
              className={isSelected ? 'vote-chip vote-chip-danger' : 'vote-chip'}
              type="button"
              key={option.label}
              onClick={() => onToggleRestriction(option)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="vote-warning-banner">✦ 선택하지 않으면 모든 음식이 포함됩니다</div>
      <ApiMessage message={apiMessage} />

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" disabled={isLoading} onClick={onNext}>
          {isLoading ? '추천 후보 받는 중' : '운명에게 맡기기'}
        </button>
      </div>
    </>
  );
}

function CardVoteView({
  candidate,
  candidates,
  activeCardIndex,
  apiMessage,
  isLoading,
  onBack,
  onVote,
}: {
  candidate: CandidateCard;
  candidates: CandidateCard[];
  activeCardIndex: number;
  apiMessage: string | null;
  isLoading: boolean;
  onBack: () => void;
  onVote: (choice: BallotChoice) => void;
}) {
  return (
    <>
      <VoteNav title="카드 뽑기" onBack={onBack} right={`${activeCardIndex + 1} / ${candidates.length}`} />
      <div className="vote-card-progress" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
        {candidates.map((item, index) => (
          <span className={index <= activeCardIndex ? 'vote-card-progress-active' : ''} key={item.menuId} />
        ))}
      </div>

      <section className="vote-pick-layout">
        <article className="vote-menu-card">
          <span className="vote-roman">{toRoman(activeCardIndex + 1)}</span>
          <div className="vote-menu-icon">{candidate.icon}</div>
          <strong>{candidate.name}</strong>
          <p>{candidate.description}</p>
          <em># {getCuisineLabel(candidate.cuisine)}</em>
        </article>
        <div className="vote-card-stack-preview">
          <span>✦</span>
          <small>남은 카드 {Math.max(candidates.length - activeCardIndex - 1, 0)}장</small>
        </div>
      </section>

      <header className="vote-centered-header vote-card-question">
        <strong>오늘 이 음식은 어때요?</strong>
        <p>오늘 {candidate.name} 땡기면 좋아를 눌러주세요</p>
      </header>

      <div className="vote-like-row">
        <button className="vote-dislike-button" type="button" disabled={isLoading} onClick={() => onVote('DISLIKE')}>
          별로
        </button>
        <button className="vote-like-button" type="button" disabled={isLoading} onClick={() => onVote('LIKE')}>
          좋아
        </button>
      </div>

      <div className="vote-api-note">← 왼쪽은 별로 · 오른쪽은 좋아</div>
      <ApiMessage message={apiMessage} />
    </>
  );
}

function RevealView({
  finalMenu,
  members,
  apiMessage,
  isLoading,
  onBack,
  onFinalize,
  onRetry,
}: {
  finalMenu: CandidateCard;
  members: VoteMember[];
  apiMessage: string | null;
  isLoading: boolean;
  onBack: () => void;
  onFinalize: () => void;
  onRetry: () => void;
}) {
  const finalMenuArtwork = getMenuArtwork(finalMenu.name);
  const hasFigmaRevealArtwork = normalizeMenuSearchText(finalMenu.name).includes('갈비탕');

  return (
    <>
      <VoteNav title="운명의 한 수" onBack={onBack} />
      <header className="vote-centered-header vote-reveal-header">
        <strong>✦ AI가 오늘의 메뉴를 골랐어요! ✦</strong>
        <p>마음에 들면 결정 · 아니면 다시 뽑을 수 있어요</p>
      </header>

      <button
        className={hasFigmaRevealArtwork ? 'vote-reveal-card vote-reveal-card-exact' : 'vote-reveal-card'}
        type="button"
        onClick={onFinalize}
        aria-label={`${finalMenu.name}(으)로 결정하기`}
      >
        {hasFigmaRevealArtwork ? (
          <span className="vote-reveal-tarot-crop">
            <img src={galbitangRevealImage} alt="갈비탕 타로 카드" />
          </span>
        ) : (
          <>
            <span>✦ 오늘의 메뉴 ✦</span>
            {finalMenuArtwork ? (
              <span className="vote-reveal-artwork">
                <img src={finalMenuArtwork.src} alt="" style={{ objectPosition: finalMenuArtwork.position }} />
              </span>
            ) : (
              <em>{finalMenu.icon}</em>
            )}
            <strong>{finalMenu.name}</strong>
            <p>{finalMenu.description}</p>
            <small># {getCuisineLabel(finalMenu.cuisine)}</small>
          </>
        )}
      </button>

      <div className="vote-result-members vote-reveal-members">
        <div>
          <strong>참여자</strong>
          <span>{members.length}명</span>
        </div>
        <div className="vote-status-members">
          {members.map((member) => (
            <span key={member.memberId}>
              <Avatar member={member} />
              <small>{member.name}</small>
            </span>
          ))}
        </div>
      </div>
      <ApiMessage message={apiMessage} />

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" disabled={isLoading} onClick={onFinalize}>
          {isLoading ? '결정 처리 중' : '이걸로 결정하기'}
        </button>
        <button className="vote-secondary-button" type="button" onClick={onRetry}>
          다시 뽑기
        </button>
      </div>
    </>
  );
}

function FinalResultView({
  finalMenu,
  restaurants,
  apiMessage,
  isLoading,
  onBack,
  onBackToRooms,
  onBackToVotes,
  onOpenScore,
  onOpenRestaurant,
}: {
  finalMenu: CandidateCard;
  restaurants: RestaurantDocument[];
  apiMessage: string | null;
  isLoading: boolean;
  onBack: () => void;
  onBackToRooms: () => void;
  onBackToVotes: () => void;
  onOpenScore: () => void;
  onOpenRestaurant: (restaurant: RestaurantDocument) => void;
}) {
  const fateCharacterImage = getCuisineCharacterImage(finalMenu.cuisine);

  return (
    <>
      <VoteNav title="✦ 오늘의 운명 ✦" onBack={onBack} />
      <button
        className="vote-final-hero vote-final-hero-dynamic"
        type="button"
        onClick={onOpenScore}
      >
        <span className="vote-final-kicker">✦ 오늘의 운명 ✦</span>
        <div className="vote-final-scene">
          <span className="vote-final-spark vote-final-spark-one" aria-hidden="true">✦</span>
          <span className="vote-final-spark vote-final-spark-two" aria-hidden="true">✧</span>
          <span className="vote-final-spark vote-final-spark-three" aria-hidden="true">✦</span>
          <div className="vote-final-magic-trail" aria-hidden="true" />
          <div className="vote-final-tarot-card">
            <small>UNSIK · TODAY'S FATE</small>
            <div className="vote-final-menu-icon" aria-hidden="true">{finalMenu.icon}</div>
            <strong>{finalMenu.name}</strong>
            <span>{getCuisineLabel(finalMenu.cuisine)}</span>
          </div>
          <img
            className="vote-final-character"
            src={fateCharacterImage}
            alt={`${finalMenu.name} 운명 카드를 보여주는 ${getCuisineLabel(finalMenu.cuisine)} 캐릭터`}
          />
        </div>
        <b>✦ 운명을 맞았다! ✦</b>
        <p>메뉴 정보를 보려면 탭하세요</p>
      </button>

      <p className="vote-section-title">추천 식당</p>
      {isLoading ? <div className="vote-loading-panel">추천 식당을 찾는 중입니다</div> : null}
      {restaurants.length > 0 ? (
        <div className="vote-restaurant-list">
          {restaurants.map((restaurant) => (
            <button
              className="vote-restaurant-card"
              type="button"
              key={restaurant.id}
              onClick={() => onOpenRestaurant(restaurant)}
            >
              <span>
                <strong>{restaurant.placeName}</strong>
                <small>{restaurant.categoryName || '음식점'}</small>
              </span>
              <em>카카오맵</em>
              <b>{restaurant.distance ? `${restaurant.distance}m` : ''}</b>
            </button>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="vote-empty-panel">
          <strong>추천 식당이 없습니다</strong>
          <p>다른 메뉴로 다시 확인해 보세요.</p>
        </div>
      ) : null}
      <ApiMessage message={apiMessage} />
      <div className="vote-bottom-actions vote-final-actions">
        <button className="vote-secondary-button" type="button" onClick={onBackToVotes}>
          투표 목록
        </button>
        <button className="vote-primary-button" type="button" onClick={onBackToRooms}>
          방 목록으로
        </button>
      </div>
    </>
  );
}

function RestaurantDetailView({
  restaurant,
  finalMenu,
  onBack,
  onShare,
}: {
  restaurant: RestaurantDocument;
  finalMenu: CandidateCard;
  onBack: () => void;
  onShare: () => void;
}) {
  return (
    <>
      <VoteNav title="식당 정보" onBack={onBack} />
      <section className="vote-restaurant-header">
        <div>
          <strong>{restaurant.placeName}</strong>
          <p>{restaurant.categoryName || getCuisineLabel(finalMenu.cuisine)}</p>
        </div>
      </section>

      <a
        className="vote-map-panel"
        href={restaurant.placeUrl || undefined}
        target="_blank"
        rel="noreferrer"
        aria-label="카카오맵에서 보기"
      >
        <strong>{restaurant.placeName}</strong>
        <em>카카오맵에서 전체보기 →</em>
      </a>

      <section className="vote-info-card">
        <InfoRow label="주소" value={restaurant.roadAddressName || restaurant.addressName || '주소 정보 없음'} />
        <InfoRow label="전화" value={restaurant.phone || '전화 정보 없음'} />
        <InfoRow label="거리" value={restaurant.distance ? `${restaurant.distance}m` : '거리 정보 없음'} />
      </section>

      <div className="vote-sticky-row">
        <button className="vote-secondary-button" type="button" onClick={onShare}>
          공유하기
        </button>
        <a className="vote-primary-link" href={restaurant.placeUrl || undefined} target="_blank" rel="noreferrer">
          길 찾기
        </a>
      </div>
    </>
  );
}

function ScoreDetailView({
  finalMenu,
  members,
  onBack,
}: {
  finalMenu: CandidateCard;
  members: VoteMember[];
  onBack: () => void;
}) {
  return (
    <>
      <VoteNav title="메뉴 정보" onBack={onBack} compact />
      <header className="vote-score-title">
        <h1>{finalMenu.name}</h1>
      </header>

      <section className="vote-score-card">
        <div className="vote-score-top">
          <div className="vote-score-donut" aria-label="추천 완료">
            ✓
          </div>
          <span>
            <strong>그룹 추천 완료</strong>
            <small>
              {members.length}명 참여 · {getCuisineLabel(finalMenu.cuisine)} 메뉴
            </small>
          </span>
        </div>
        {members.map((member) => (
          <div className="vote-score-row" key={member.memberId}>
            <span>{member.name}</span>
            <div>
              <i style={{ width: '100%', background: member.color }} />
            </div>
            <b style={{ color: member.color }}>참여</b>
          </div>
        ))}
      </section>

      <p className="vote-score-section-label">왜 이 메뉴를</p>
      <section className="vote-score-why-card">
        <div className="vote-score-reason">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>그룹 선택 결과 반영</strong>
            <p>{members.length}명의 선택을 종합해 최종 메뉴로 결정했어요.</p>
          </div>
        </div>
        <div className="vote-score-reason">
          <span aria-hidden="true">🍽</span>
          <div>
            <strong>{getCuisineLabel(finalMenu.cuisine)} 메뉴</strong>
            <p>{finalMenu.name}은(는) 추천 후보 중 그룹이 최종 선택한 메뉴예요.</p>
          </div>
        </div>
        <div className="vote-score-reason">
          <span aria-hidden="true">📍</span>
          <div>
            <strong>주변 식당으로 바로 연결</strong>
            <p>결과 화면에서 선택한 학교 주변의 실제 식당을 확인할 수 있어요.</p>
          </div>
        </div>
      </section>

    </>
  );
}

function VoteNav({
  title,
  right,
  compact = false,
  onBack,
}: {
  title: string;
  right?: string;
  compact?: boolean;
  onBack: () => void;
}) {
  return (
    <nav className={compact ? 'vote-nav vote-nav-compact' : 'vote-nav'}>
      <button type="button" onClick={onBack} aria-label="뒤로 가기">
        ←
      </button>
      <p>{title}</p>
      <span>{right}</span>
    </nav>
  );
}

function Avatar({ member, checked = false }: { member: VoteMember; checked?: boolean }) {
  return (
    <span className="vote-avatar" style={{ backgroundColor: member.color }}>
      <i />
      {checked ? <b>✓</b> : null}
    </span>
  );
}

function ApiMessage({ message }: { message: string | null }) {
  return message ? <div className="vote-api-message">{message}</div> : null;
}

function VoteBlockingView({
  title,
  message,
  actionLabel,
  onAction,
  onBack,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <VoteNav title={title} onBack={onBack} />
      <div className="vote-empty-panel">
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="vote-info-row">
      <small>{label}</small>
      <p>{value}</p>
    </div>
  );
}

function StarField() {
  return (
    <div className="vote-stars" aria-hidden="true">
      {STARS.map((star) => (
        <span
          key={`${star.left}-${star.top}`}
          style={{
            left: `${star.left}px`,
            top: `${star.top}px`,
            fontSize: `${star.size}px`,
            opacity: star.opacity,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function toggleSetValue<T>(current: Set<T>, value: T) {
  const next = new Set(current);

  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }

  return next;
}

function toCandidateCard(menu: CandidateMenuResponse): CandidateCard {
  return {
    ...menu,
    icon: getMenuIcon(menu.name, menu.cuisine),
    description: `${getCuisineLabel(menu.cuisine)} 계열의 오늘 후보`,
  };
}

function getParticipantIdsForVoteRequest(participantIds: number[], members: VoteMember[]): number[] {
  const ownerIds = new Set(members.filter((member) => member.role === 'OWNER').map((member) => member.memberId));
  const nonOwnerParticipantIds = participantIds.filter((participantId) => !ownerIds.has(participantId));

  if (nonOwnerParticipantIds.length > 0) {
    return nonOwnerParticipantIds;
  }

  const selectedOwnerId = participantIds.find((participantId) => ownerIds.has(participantId));

  return selectedOwnerId === undefined ? [] : [selectedOwnerId];
}

function toMealHistoryItems(votes: VoteSummary[]): MealHistoryItem[] {
  return votes
    .flatMap((vote) => {
      if (!vote.resultMenu) {
        return [];
      }

      const date = parseDate(vote.deadline);

      return [
        {
          id: String(vote.voteId),
          menuName: vote.resultMenu.name,
          subtitle: getCuisineLabel(vote.resultMenu.cuisine),
          placeLabel: vote.placeLabel,
          date,
          dateLabel: formatMealDate(date),
          favorite: false,
        },
      ];
    })
    .sort((a, b) => getHistoryTimeValue(b.date) - getHistoryTimeValue(a.date));
}

function getFilteredHistoryItems(items: MealHistoryItem[], filter: MealHistoryFilter): MealHistoryItem[] {
  if (filter === 'month') {
    return items.filter((item) => isSameMonth(item.date, new Date()));
  }

  if (filter === 'favorite') {
    return items.filter((item) => item.favorite);
  }

  return items;
}

function getHistoryEmptyTitle(filter: MealHistoryFilter): string {
  if (filter === 'month') {
    return '이번 달 식사 내역이 없어요';
  }

  if (filter === 'favorite') {
    return '즐겨찾기한 내역이 없어요';
  }

  return '아직 과거 내역이 없어요';
}

function createPlaceOption(school: School, displayName = getSchoolLabel(school)): PlaceOption {
  return {
    key: SCHOOL_PLACE_KEYS[school],
    label: displayName,
    school,
  };
}

function toPlaceOptions(schools: SchoolResponse[]): PlaceOption[] {
  const schoolByCode = new Map(schools.map((school) => [school.code, school]));

  return SCHOOL_ORDER.flatMap((school) => {
    const schoolResponse = schoolByCode.get(school);

    return schoolResponse ? [createPlaceOption(school)] : [];
  });
}

function getDefaultPlaceKey(placeOptions: PlaceOption[]) {
  return placeOptions.find((place) => place.school === 'HOOMOON')?.key ?? placeOptions[0]?.key ?? 'back';
}

function toVoteSummaryFromResponse(vote: VoteSummaryResponse): VoteSummary {
  const placeLabel = getSchoolLabel(vote.school);

  return {
    id: String(vote.voteId),
    voteId: vote.voteId,
    title: vote.title,
    status: vote.status,
    deadline: vote.deadline,
    meta: `${placeLabel} · 참여자 ${vote.participantCount}명`,
    placeLabel,
    school: vote.school,
    participantIds: [],
    resultMenu: vote.resultMenu,
  };
}

function toVoteSummary(vote: VoteDetailResponse, previous?: VoteSummary): VoteSummary {
  const placeLabel = getSchoolLabel(vote.school);
  const participantIds = vote.participants.map((participant) => participant.memberId);

  return {
    id: String(vote.voteId),
    voteId: vote.voteId,
    title: vote.title,
    status: vote.status,
    deadline: previous?.deadline ?? '',
    meta: `${placeLabel} · 참여자 ${participantIds.length}명`,
    placeLabel,
    school: vote.school,
    participantIds,
    resultMenu: vote.resultMenu,
  };
}

function getCuisineIcon(cuisine: Cuisine) {
  return CUISINE_OPTIONS.find((option) => option.cuisine === cuisine)?.icon ?? '🍽️';
}

function getCuisineCharacterImage(cuisine: Cuisine) {
  return CUISINE_OPTIONS.find((option) => option.cuisine === cuisine)?.imageSrc ?? preferenceFastfoodImage;
}

function normalizeMenuSearchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replaceAll(/\s+/g, '');
}

function getMenuIcon(name: string, cuisine: Cuisine) {
  const normalizedName = name.toLocaleLowerCase('ko-KR').replaceAll(/\s+/g, ' ');
  const matchedRule = MENU_ICON_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalizedName.includes(keyword)),
  );

  return matchedRule?.icon ?? getCuisineIcon(cuisine);
}

function getMenuArtwork(name: string): { src: string; position: string } | null {
  const normalizedName = normalizeMenuSearchText(name);

  if (normalizedName.includes('갈비탕')) {
    return { src: galbitangCardImage, position: '50% 57%' };
  }

  if (normalizedName.includes('국밥')) {
    return { src: gukbapCardImage, position: '50% 58%' };
  }

  return null;
}

function getCuisineLabel(cuisine: Cuisine) {
  return CUISINE_OPTIONS.find((option) => option.cuisine === cuisine)?.label ?? '메뉴';
}

function getSchoolLabel(school: School) {
  if (school === 'JEONGMOON') {
    return '정문';
  }

  if (school === 'HOOMOON') {
    return '후문';
  }

  if (school === 'YEDAE') {
    return '예대';
  }

  if (school === 'SANGDAE') {
    return '상대';
  }

  return '후문';
}

function parseDate(value: string): Date | null {
  if (!value.trim()) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function formatBackendDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  const seconds = padDatePart(date.getSeconds());

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function formatMealDate(date: Date | null): string {
  if (!date) {
    return '최근';
  }

  const now = new Date();

  if (isSameDay(date, now)) {
    return '오늘';
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDay(date, yesterday)) {
    return '어제';
  }

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function isSameDay(first: Date | null, second: Date): boolean {
  if (!first) {
    return false;
  }

  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

function isSameMonth(date: Date | null, now: Date): boolean {
  if (!date) {
    return false;
  }

  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function isSameWeek(date: Date | null, now: Date): boolean {
  if (!date) {
    return false;
  }

  const weekStart = getWeekStart(now);
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(weekStart.getDate() + 7);

  return date >= weekStart && date < nextWeekStart;
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() + mondayOffset);

  return weekStart;
}

function getHistoryTimeValue(date: Date | null): number {
  return date?.getTime() ?? 0;
}

function getStatusViewLabel(hasSubmittedBallot: boolean, hasSubmittedPreference: boolean): string {
  if (hasSubmittedBallot) {
    return '● 내 투표 제출 완료';
  }

  if (hasSubmittedPreference) {
    return '● 내 선호 제출 완료';
  }

  return '● 진행 중';
}

function getStatusPrimaryLabel(
  hasSubmittedBallot: boolean,
  isWaitingForPreferenceCompletion: boolean,
  isLoading: boolean,
): string {
  if (hasSubmittedBallot) {
    return '투표 목록으로';
  }

  if (isWaitingForPreferenceCompletion) {
    return isLoading ? '확인 중' : '상태 새로고침';
  }

  return '다음으로';
}

function getVoteStatusLabel(status: string) {
  if (status === 'CLOSED') {
    return '마감';
  }

  if (status === 'VOTING') {
    return '투표 중';
  }

  return '추천 중';
}

function toRoman(value: number) {
  return ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ'][value - 1] ?? String(value);
}

async function shareRestaurant(restaurant: RestaurantDocument, showToast: (message: string) => void) {
  const text = restaurant.placeUrl || `${restaurant.placeName} ${restaurant.roadAddressName || restaurant.addressName}`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('식당 정보를 복사했어요.');
  } catch {
    showToast(text);
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return formatUnknownErrorMessage();
}

function hasApiErrorCode(error: unknown, code: number): boolean {
  return error instanceof Error && error.message.startsWith(`오류 코드: ${code}`);
}

function withoutVoteId(voteIds: Set<number>, voteId: number): Set<number> {
  const next = new Set(voteIds);

  next.delete(voteId);

  return next;
}

function readSubmittedBallotVoteIds(memberId?: number): Set<number> {
  if (!memberId) {
    return new Set();
  }

  try {
    const value: unknown = JSON.parse(localStorage.getItem(`${BALLOT_COMPLETION_STORAGE_PREFIX}:${memberId}`) ?? '[]');

    if (!Array.isArray(value)) {
      return new Set();
    }

    return new Set(value.filter((item): item is number => typeof item === 'number' && Number.isInteger(item) && item > 0));
  } catch {
    return new Set();
  }
}

function writeSubmittedBallotVoteIds(memberId: number | undefined, voteIds: Set<number>) {
  if (!memberId) {
    return;
  }

  try {
    localStorage.setItem(`${BALLOT_COMPLETION_STORAGE_PREFIX}:${memberId}`, JSON.stringify(Array.from(voteIds)));
  } catch {
    // The in-memory completion state still works when browser storage is unavailable.
  }
}
