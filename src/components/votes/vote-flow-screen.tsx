import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

import type {
  BackendContext,
  CandidateMenuResponse,
  Cuisine,
  GroupMemberResponse,
  MenuResponse,
  RestaurantDocument,
  Restriction,
  School,
  VoteDetailResponse,
  VoteSummaryResponse,
} from '@/services/backend';
import {
  closeVote,
  createVote,
  deleteVote,
  getVote,
  listGroupMembers,
  listGroupVotes,
  listMenus,
  recommendMenus,
  searchRestaurants,
  submitBallot,
  submitPreference,
} from '@/services/backend';
import oracleFateImage from '@/assets/images/mascots/oracle-fate-ai.png';
import oracleMoonImage from '@/assets/images/mascots/oracle-moon-ai.png';
import oracleStarImage from '@/assets/images/mascots/oracle-star-ai.png';

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
  | 'score';

type VoteMember = GroupMemberResponse & {
  color: string;
};

type PlaceOption = {
  key: string;
  label: string;
  school: School;
  backendNote: string;
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
  status: string;
  meta: string;
  placeLabel: string;
  school: School;
  participantIds: number[];
};

type MenuCatalogStatus = 'idle' | 'loading' | 'loaded' | 'error';

const MEMBER_COLORS = ['#e8c7ab', '#fcd4de', '#c9ede3', '#dbd1f7', '#c9f2b4', '#b9d9ff'];

const PLACE_OPTIONS: PlaceOption[] = [
  { key: 'front', label: '정문', school: 'GONGDAE', backendNote: '정문은 백엔드 학교 코드 GONGDAE로 보냅니다.' },
  { key: 'back', label: '후문', school: 'GONGDAE', backendNote: '후문은 백엔드 학교 코드 GONGDAE로 보냅니다.' },
  { key: 'business', label: '상대', school: 'SANGDAE', backendNote: '상대는 SANGDAE로 보냅니다.' },
  { key: 'art', label: '예대', school: 'YEDAE', backendNote: '예대는 YEDAE로 보냅니다.' },
  { key: 'any', label: '상관없어', school: 'GONGDAE', backendNote: '상관없어는 기본 GONGDAE로 보냅니다.' },
];

const ORACLES = [
  {
    id: 'star',
    name: '별의 점쟁이',
    imageSrc: oracleStarImage,
    copy: '깔끔한 선택. 오늘 외모 운이 살짝 올라가요.',
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
    copy: '57%가 고른 빠른 운명 확정 카드.',
  },
];

const CUISINE_OPTIONS: Array<{
  cuisine: Cuisine;
  label: string;
  icon: string;
  description: string;
  color: string;
}> = [
  { cuisine: 'FASTFOOD', label: '패스트푸드', icon: '🍔', description: '햄버거 · 피자 · 토스트', color: '#f5834a' },
  { cuisine: 'KOREAN', label: '한식', icon: '🍲', description: '냉면 · 국밥 · 덮밥 · 찌개', color: '#9e85f5' },
  { cuisine: 'STEW_SOUP', label: '찜·탕', icon: '🥘', description: '김치찜 · 찜닭 · 감자탕', color: '#2ed6a3' },
  { cuisine: 'JAPANESE', label: '돈까스·회', icon: '🍱', description: '돈까스 · 초밥 · 라멘 · 회', color: '#f5c829' },
  { cuisine: 'MEAT', label: '고기', icon: '🥩', description: '삼겹살 · 제육 · 닭갈비', color: '#f07840' },
  { cuisine: 'ASIAN', label: '아시안', icon: '🍜', description: '쌀국수 · 팟타이', color: '#ffb347' },
  { cuisine: 'CHINESE', label: '중식', icon: '🥡', description: '짜장 · 짬뽕 · 마라탕', color: '#d783ff' },
  { cuisine: 'WESTERN', label: '양식', icon: '🍝', description: '파스타 · 스테이크 · 샐러드', color: '#4dd0e1' },
];

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
  const [voteTitle, setVoteTitle] = useState('오늘 점심');
  const [selectedPlaceKey, setSelectedPlaceKey] = useState('back');
  const [voteSummaries, setVoteSummaries] = useState<VoteSummary[]>([]);
  const [members, setMembers] = useState<VoteMember[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<number>>(() => new Set());
  const [activeVote, setActiveVote] = useState<ActiveVote | null>(null);
  const [selectedOracleId, setSelectedOracleId] = useState('moon');
  const [dislikedCuisines, setDislikedCuisines] = useState<Set<Cuisine>>(() => new Set());
  const [restrictions, setRestrictions] = useState<Set<Restriction>>(() => new Set());
  const [excludedMenuIds, setExcludedMenuIds] = useState<Set<number>>(() => new Set());
  const [menuSearch, setMenuSearch] = useState('');
  const [menuCatalog, setMenuCatalog] = useState<MenuResponse[]>([]);
  const [menuCatalogStatus, setMenuCatalogStatus] = useState<MenuCatalogStatus>('idle');
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [ballotChoices, setBallotChoices] = useState<Record<number, BallotChoice>>({});
  const [finalMenu, setFinalMenu] = useState<CandidateCard | null>(null);
  const [restaurants, setRestaurants] = useState<RestaurantDocument[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVoteSummaries, setIsLoadingVoteSummaries] = useState(Boolean(memberId && hasBackendGroup));
  const [voteListMessage, setVoteListMessage] = useState<string | null>(null);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const selectedPlace = PLACE_OPTIONS.find((place) => place.key === selectedPlaceKey) ?? PLACE_OPTIONS[1];
  const selectedMembers = members.filter((member) => selectedMemberIds.has(member.memberId));
  const currentCandidate = candidates[activeCardIndex] ?? null;
  const likedCandidate = candidates.find((candidate) => ballotChoices[candidate.menuId] === 'LIKE');
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
          setApiMessage(`그룹원 API 호출 실패: ${getErrorMessage(error)}`);
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
      setVoteListMessage('유효한 그룹 id가 없어 투표 목록을 불러올 수 없어요.');
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
        setVoteListMessage(`그룹 투표 목록 API 호출 실패: ${getErrorMessage(error)}`);
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

  useEffect(() => {
    if (step !== 'preference' || menuCatalogStatus !== 'idle') {
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
          setApiMessage('전체 메뉴 조회 API 응답이 비어 있어 메뉴 검색을 사용할 수 없어요.');
        }
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setMenuCatalog([]);
        setMenuCatalogStatus('error');
        setApiMessage(`전체 메뉴 조회 API 호출 실패: ${getErrorMessage(error)}`);
      });

    return () => {
      isCurrent = false;
    };
  }, [menuCatalogStatus, step]);

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
        setApiMessage(result.documents.length > 0 ? null : '추천 식당 API 응답이 비어 있습니다.');
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setRestaurants([]);
        setApiMessage(`추천 식당 API 호출 실패: ${getErrorMessage(error)}`);
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

  const resetForNewVote = (title: string) => {
    setVoteTitle(title);
    setActiveVote(null);
    setSelectedPlaceKey('back');
    setSelectedMemberIds(new Set(members.map((member) => member.memberId)));
    setDislikedCuisines(new Set());
    setRestrictions(new Set());
    setExcludedMenuIds(new Set());
    setMenuSearch('');
    setCandidates([]);
    setActiveCardIndex(0);
    setBallotChoices({});
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
    const baseVote: ActiveVote = {
      title: voteTitle.trim() || '오늘의 투표',
      placeLabel: selectedPlace.label,
      school: selectedPlace.school,
      participantIds,
    };

    const addVoteSummary = (voteId: number, status: string) => {
      setVoteSummaries((current) => {
        const summary = {
          id: String(voteId),
          voteId,
          title: baseVote.title,
          status,
          meta: `${baseVote.placeLabel} · 참여자 ${participantIds.length}명`,
          placeLabel: baseVote.placeLabel,
          school: baseVote.school,
          participantIds,
        };

        return [summary, ...current.filter((item) => item.voteId !== voteId)];
      });
    };

    setIsLoading(true);
    setApiMessage(null);

    if (!hasBackendGroup || !context.memberId) {
      setApiMessage('로그인 회원 id 또는 숫자형 그룹 id가 없어 투표를 생성할 수 없어요.');
      setIsLoading(false);
      return;
    }

    try {
      const createdVote = await createVote(
        numericGroupId,
        {
          title: baseVote.title,
          deadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
          school: baseVote.school,
          participantMemberIds: participantIds,
        },
        context.token,
      );

      setActiveVote({
        ...baseVote,
        id: createdVote.id,
      });
      addVoteSummary(createdVote.id, getVoteStatusLabel(createdVote.status));
      setStep('status');
    } catch (error) {
      setApiMessage(`투표 생성 API 호출 실패: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectVote = async (vote: VoteSummary) => {
    setIsLoading(true);
    setApiMessage(null);

    try {
      const detail = context.memberId ? await getVote({ memberId: context.memberId, token: context.token }, vote.voteId) : null;
      const nextSummary = detail ? toVoteSummary(detail) : vote;
      const nextCandidates = detail?.candidates.map(toCandidateCard) ?? [];

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
        setFinalMenu(toCandidateCard(detail.resultMenu));
        setStep('final');
      } else {
        setFinalMenu(null);
        setStep(nextCandidates.length > 0 ? 'cards' : 'status');
      }
    } catch (error) {
      setApiMessage(`투표 상태 조회 API 호출 실패: ${getErrorMessage(error)}`);
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
      setApiMessage('백엔드 voteId 또는 회원 id가 없어 투표를 삭제할 수 없어요.');
      return;
    }

    setIsLoading(true);
    setApiMessage(null);

    try {
      await deleteVote({ memberId: context.memberId, token: context.token }, activeVote.id);
      setVoteSummaries((current) => current.filter((vote) => vote.voteId !== activeVote.id));
      setActiveVote(null);
      setCandidates([]);
      setBallotChoices({});
      setFinalMenu(null);
      setStep('list');
      showToast('투표를 삭제했어요.');
    } catch (error) {
      setApiMessage(`투표 삭제 API 호출 실패: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
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
      setApiMessage('백엔드 voteId 또는 회원 id가 없어 추천 후보를 받을 수 없어요.');
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

      const result = await recommendMenus({ memberId: context.memberId, token: context.token }, activeVote.id);
      const apiCandidates = result.candidates.map(toCandidateCard);

      if (result.impossible || apiCandidates.length === 0) {
        setCandidates([]);
        setApiMessage('추천 가능한 후보가 없습니다. 선호 조건을 줄이거나 다시 시도해 주세요.');
        setIsLoading(false);
        return;
      }

      setCandidates(apiCandidates);
      setActiveCardIndex(0);
      setBallotChoices({});
      setStep('cards');
    } catch (error) {
      setApiMessage(`선호/추천 API 호출 실패: ${getErrorMessage(error)}`);
    } finally {
      setIsLoading(false);
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

    await submitCardBallot(nextChoices);
  };

  const submitCardBallot = async (choices: Record<number, BallotChoice>) => {
    setApiMessage(null);

    const nextFinalMenu = candidates.find((candidate) => choices[candidate.menuId] === 'LIKE') ?? candidates[0] ?? null;
    setFinalMenu(nextFinalMenu);
    setStep('reveal');
  };

  const handleFinalize = async () => {
    setIsLoading(true);
    setApiMessage(null);

    if (!activeVote?.id || !context.memberId) {
      setApiMessage('백엔드 voteId 또는 회원 id가 없어 결과를 확정할 수 없어요.');
      setIsLoading(false);
      return;
    }

    const apiChoices = Object.fromEntries(
      candidates.map((candidate) => [String(candidate.menuId), ballotChoices[candidate.menuId] ?? 'DISLIKE']),
    );

    try {
      await submitBallot({ memberId: context.memberId, token: context.token }, activeVote.id, apiChoices);
    } catch (error) {
      setApiMessage(`호불호 투표 API 호출 실패: ${getErrorMessage(error)}`);
      setIsLoading(false);
      return;
    }

    try {
      const voteAfterBallot = await getVote({ memberId: context.memberId, token: context.token }, activeVote.id);

      if (voteAfterBallot.resultMenu) {
        setFinalMenu(toCandidateCard(voteAfterBallot.resultMenu));
        setVoteSummaries((current) =>
          current.map((summary) =>
            summary.voteId === activeVote.id ? { ...summary, status: getVoteStatusLabel(voteAfterBallot.status) } : summary,
          ),
        );
        setStep('final');
        setIsLoading(false);
        return;
      }

      const closedMenu = await closeVote({ memberId: context.memberId, token: context.token }, activeVote.id);
      setFinalMenu(toCandidateCard(closedMenu));
      setStep('final');
      setIsLoading(false);
      return;
    } catch (closeError) {
      try {
        const vote = await getVote({ memberId: context.memberId, token: context.token }, activeVote.id);

        if (vote.resultMenu) {
          setFinalMenu(toCandidateCard(vote.resultMenu));
          setVoteSummaries((current) =>
            current.map((summary) =>
              summary.voteId === activeVote.id ? { ...summary, status: getVoteStatusLabel(vote.status) } : summary,
            ),
          );
          setStep('final');
          setIsLoading(false);
          return;
        }
      } catch {
        // The close error below is the actionable failure for the user.
      }

      setApiMessage(`마감 API 호출 실패: ${getErrorMessage(closeError)}`);
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

  const handleToggleRestriction = (option: (typeof RESTRICTION_OPTIONS)[number]) => {
    if (option.label === '없음') {
      setRestrictions(new Set());
      return;
    }

    const restriction = option.restriction;

    if (option.unsupported || !restriction) {
      showToast(`${option.label}은 현재 백엔드 제한 enum에 없어 전송하지 않아요.`);
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
          onSelectVote={handleSelectVote}
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
          onInvite={() => showToast('초대 링크 공유는 그룹 초대코드로 대체해요.')}
          onPlaceChange={setSelectedPlaceKey}
          onTitleChange={setVoteTitle}
          onToggleMember={toggleMember}
          selectedMemberIds={selectedMemberIds}
          selectedPlace={selectedPlace}
          selectedPlaceKey={selectedPlaceKey}
          title={voteTitle}
        />
      );
    }

    if (step === 'status') {
      return (
        <VoteStatusView
          activeVote={activeVote}
          apiMessage={apiMessage}
          isLoading={isLoading}
          members={selectedMembers}
          onBack={() => setStep('setup')}
          onCancel={() => void handleCancelVote()}
          onNext={() => setStep('oracle')}
          onNotify={() => void handleVoteReminder()}
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
            message={apiMessage ?? '추천 후보 API 응답이 비어 있어 카드 투표를 진행할 수 없어요.'}
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
            message={apiMessage ?? '백엔드에서 확정된 메뉴를 받지 못했습니다.'}
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
    <main className="vote-flow-screen">
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
  onSelectVote,
}: {
  groupId: string;
  memberName?: string;
  votes: VoteSummary[];
  isLoading: boolean;
  message: string | null;
  onBack: () => void;
  onCreate: () => void;
  onSelectVote: (vote: VoteSummary) => void;
}) {
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
            <button className="vote-list-card" type="button" key={vote.id} onClick={() => onSelectVote(vote)}>
              <span className="vote-list-icon">🗳️</span>
              <span>
                <strong>{vote.title}</strong>
                <small>{vote.meta}</small>
              </span>
              <em>{vote.status}</em>
            </button>
          ))}
        </div>
      ) : (
        <div className="vote-empty-panel">
          <strong>{emptyTitle}</strong>
          <p>{isLoading ? '백엔드에서 이 그룹의 투표를 조회하고 있어요.' : message ?? '새 투표를 만들어 메뉴를 정해보세요.'}</p>
        </div>
      )}

      <div className="vote-api-note">
        현재 그룹에 속한 투표를 백엔드에서 불러옵니다.
      </div>

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onCreate}>
          새 투표 만들기
        </button>
      </div>
    </>
  );
}

function VoteSetupView({
  title,
  selectedPlaceKey,
  selectedPlace,
  selectedMemberIds,
  members,
  apiMessage,
  isLoading,
  onBack,
  onTitleChange,
  onPlaceChange,
  onToggleMember,
  onInvite,
  onCreateVote,
}: {
  title: string;
  selectedPlaceKey: string;
  selectedPlace: PlaceOption;
  selectedMemberIds: Set<number>;
  members: VoteMember[];
  apiMessage: string | null;
  isLoading: boolean;
  onBack: () => void;
  onTitleChange: (value: string) => void;
  onPlaceChange: (value: string) => void;
  onToggleMember: (memberId: number) => void;
  onInvite: () => void;
  onCreateVote: () => void;
}) {
  return (
    <>
      <VoteNav title="그룹 컨디션" onBack={onBack} />
      <div className="vote-field-block">
        <label className="vote-text-field">
          <span>투표 이름</span>
          <input value={title} maxLength={24} onChange={(event) => onTitleChange(event.target.value)} />
        </label>
      </div>

      <section className="vote-section">
        <div className="vote-label-row">
          <strong>📍 어디서 먹을지 골라주세요</strong>
          <span>👑 그룹장 설정</span>
        </div>
        <div className="vote-chip-row">
          {PLACE_OPTIONS.map((place) => (
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
        <p className="vote-muted-note">{selectedPlace.backendNote}</p>
      </section>

      <section className="vote-section vote-member-section">
        <div className="vote-member-header">
          <span>👥</span>
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
              <p>그룹원 목록 API가 성공해야 투표를 생성할 수 있어요.</p>
            </div>
          )}
        </div>
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
  activeVote,
  apiMessage,
  isLoading,
  members,
  onBack,
  onNotify,
  onCancel,
  onNext,
}: {
  activeVote: ActiveVote | null;
  apiMessage: string | null;
  isLoading: boolean;
  members: VoteMember[];
  onBack: () => void;
  onNotify: () => void;
  onCancel: () => void;
  onNext: () => void;
}) {
  return (
    <>
      <VoteNav title="그룹 컨디션" onBack={onBack} />
      <section className="vote-status-card">
        <div className="vote-status-head">
          <strong>🗳️ 투표 현황</strong>
          <span>● 진행 중</span>
        </div>
        <div className="vote-progress-row">
          <div className="vote-progress-track">
            <div style={{ width: members.length > 0 ? '100%' : '0%' }} />
          </div>
          <small>
            참여자 {members.length}명
          </small>
        </div>
        <div className="vote-status-members">
          {members.map((member) => (
            <span key={member.memberId}>
              <Avatar member={member} />
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
          {isLoading ? '삭제 중' : '✕ 투표 취소'}
        </button>
      </div>

      <div className="vote-api-note">
        위치 투표 전용 API가 없어 "{activeVote?.placeLabel ?? '선택한 위치'}" 선택 상태는 프론트에서 관리합니다.
      </div>
      <ApiMessage message={apiMessage} />

      <div className="vote-bottom-actions">
        <button className="vote-primary-button" type="button" onClick={onNext}>
          다음으로
        </button>
      </div>
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
  onNext: () => void;
  onToggleCuisine: (cuisine: Cuisine) => void;
  onToggleExcludedMenu: (menuId: number) => void;
  onToggleRestriction: (option: (typeof RESTRICTION_OPTIONS)[number]) => void;
}) {
  const normalizedSearch = menuSearch.trim().toLowerCase();
  const selectedMenus = menuCatalog.filter((menu) => excludedMenuIds.has(menu.id));
  const searchedMenus = normalizedSearch
    ? menuCatalog
        .filter((menu) => {
          const cuisineLabel = getCuisineLabel(menu.cuisine).toLowerCase();

          return menu.name.toLowerCase().includes(normalizedSearch) || cuisineLabel.includes(normalizedSearch);
        })
        .slice(0, 8)
    : [];

  return (
    <>
      <VoteNav title="오늘의 취향" onBack={onBack} />
      <header className="vote-centered-header">
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
        <div className="vote-selected-menu-list" aria-label="검색으로 제외한 메뉴">
          {selectedMenus.map((menu) => (
            <button type="button" key={menu.id} onClick={() => onToggleExcludedMenu(menu.id)}>
              <span>{menu.name}</span>
              <small>{getCuisineLabel(menu.cuisine)} 제외</small>
              <b aria-hidden="true">×</b>
            </button>
          ))}
        </div>
      ) : null}

      {normalizedSearch ? (
        <div className="vote-menu-search-results">
          {menuCatalogStatus === 'loading' ? <p>전체 메뉴를 불러오는 중입니다</p> : null}
          {menuCatalogStatus !== 'loading' && searchedMenus.length === 0 ? <p>검색 결과가 없습니다</p> : null}
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
                <span>{getCuisineIcon(menu.cuisine)}</span>
                <strong>{menu.name}</strong>
                <small>{getCuisineLabel(menu.cuisine)}</small>
                <b aria-hidden="true">{isSelected ? '✓' : '+'}</b>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="vote-cuisine-grid">
        {CUISINE_OPTIONS.map((option) => {
          const isSelected = dislikedCuisines.has(option.cuisine);

          return (
            <button
              className={isSelected ? 'vote-cuisine vote-cuisine-selected' : 'vote-cuisine'}
              style={{ '--vote-accent': option.color } as CSSProperties}
              type="button"
              key={option.cuisine}
              onClick={() => onToggleCuisine(option.cuisine)}
              aria-pressed={isSelected}
            >
              <span>{option.icon}</span>
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
  return (
    <>
      <VoteNav title="운명의 한 수" onBack={onBack} />
      <header className="vote-centered-header">
        <strong>✦ AI가 오늘의 메뉴를 골랐어요! ✦</strong>
        <p>마음에 들면 결정 · 아니면 다시 뽑을 수 있어요</p>
      </header>

      <button className="vote-reveal-card" type="button" onClick={onFinalize}>
        <span>✦ 오늘의 메뉴 ✦</span>
        <em>{finalMenu.icon}</em>
        <strong>{finalMenu.name}</strong>
        <p>{finalMenu.description}</p>
        <small># {getCuisineLabel(finalMenu.cuisine)}</small>
      </button>

      <div className="vote-result-members">
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
  return (
    <>
      <VoteNav title="✦ 오늘의 운명 ✦" onBack={onBack} />
      <button className="vote-final-hero" type="button" onClick={onOpenScore}>
        <span>✦·✦·✦</span>
        <em>{finalMenu.icon}</em>
        <small>오늘의 메뉴</small>
        <strong>{finalMenu.name}</strong>
        <b>{getCuisineLabel(finalMenu.cuisine)}</b>
        <p>메뉴 정보를 보려면 탭하세요 →</p>
      </button>

      <p className="vote-section-title">📍 추천 식당</p>
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
              <em>🗺 카카오맵</em>
              <b>{restaurant.distance ? `${restaurant.distance}m` : ''}</b>
            </button>
          ))}
        </div>
      ) : !isLoading ? (
        <div className="vote-empty-panel">
          <strong>추천 식당이 없습니다</strong>
          <p>백엔드 식당 검색 API 응답이 비어 있습니다.</p>
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
        <span>{finalMenu.icon}</span>
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
        <span>📍</span>
        <strong>{restaurant.placeName}</strong>
        <em>🗺 카카오맵에서 전체보기 →</em>
      </a>

      <section className="vote-info-card">
        <InfoRow icon="📍" label="주소" value={restaurant.roadAddressName || restaurant.addressName || '주소 정보 없음'} />
        <InfoRow icon="📞" label="전화" value={restaurant.phone || '전화 정보 없음'} />
        <InfoRow icon="🚶" label="거리" value={restaurant.distance ? `${restaurant.distance}m` : '거리 정보 없음'} />
      </section>

      <div className="vote-sticky-row">
        <button className="vote-secondary-button" type="button" onClick={onShare}>
          📤 공유하기
        </button>
        <a className="vote-primary-link" href={restaurant.placeUrl || undefined} target="_blank" rel="noreferrer">
          🗺 길 찾기
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
          <div className="vote-score-donut">{finalMenu.icon}</div>
          <span>
            <strong>{getCuisineLabel(finalMenu.cuisine)}</strong>
            <small>메뉴 ID {finalMenu.menuId}</small>
          </span>
        </div>
        {members.map((member) => (
          <div className="vote-score-row" key={member.memberId}>
            <span>{member.name}</span>
            <div>
              <i style={{ width: '100%', background: member.color }} />
            </div>
            <b style={{ color: member.color }}>{member.role === 'OWNER' ? '그룹장' : '멤버'}</b>
          </div>
        ))}
      </section>

      <p className="vote-section-title">백엔드 연결 필요</p>
      <section className="vote-reason-card">
        <ReasonRow icon="✦" title="점수 상세 API 없음" text="개인별 점수, 추천 사유, 조건 충돌 여부는 현재 Swagger 응답에 없습니다." />
        <ReasonRow icon="📍" title="식당 상세 API 없음" text="가격, 평점, 리뷰, 영업 상태는 카카오 로컬 응답에 없어 표시하지 않습니다." />
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

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="vote-info-row">
      <span>{icon}</span>
      <small>{label}</small>
      <p>{value}</p>
    </div>
  );
}

function ReasonRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="vote-reason-row">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
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
    icon: getCuisineIcon(menu.cuisine),
    description: `${getCuisineLabel(menu.cuisine)} 계열의 오늘 후보`,
  };
}

function toVoteSummaryFromResponse(vote: VoteSummaryResponse): VoteSummary {
  const placeLabel = getSchoolLabel(vote.school);

  return {
    id: String(vote.voteId),
    voteId: vote.voteId,
    title: vote.title,
    status: getVoteStatusLabel(vote.status),
    meta: `${placeLabel} · 참여자 ${vote.participantCount}명`,
    placeLabel,
    school: vote.school,
    participantIds: [],
  };
}

function toVoteSummary(vote: VoteDetailResponse): VoteSummary {
  const placeLabel = getSchoolLabel(vote.school);
  const participantIds = vote.participants.map((participant) => participant.memberId);

  return {
    id: String(vote.voteId),
    voteId: vote.voteId,
    title: vote.title,
    status: getVoteStatusLabel(vote.status),
    meta: `${placeLabel} · 참여자 ${participantIds.length}명`,
    placeLabel,
    school: vote.school,
    participantIds,
  };
}

function getCuisineIcon(cuisine: Cuisine) {
  return CUISINE_OPTIONS.find((option) => option.cuisine === cuisine)?.icon ?? '🍽️';
}

function getCuisineLabel(cuisine: Cuisine) {
  return CUISINE_OPTIONS.find((option) => option.cuisine === cuisine)?.label ?? '메뉴';
}

function getSchoolLabel(school: School) {
  if (school === 'YEDAE') {
    return '예대';
  }

  if (school === 'SANGDAE') {
    return '상대';
  }

  return '공대';
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

  return '알 수 없는 오류가 발생했어요.';
}
