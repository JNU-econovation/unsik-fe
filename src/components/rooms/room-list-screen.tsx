import type { CSSProperties, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { BackendContext, GroupResponse } from '@/services/backend';
import { createGroup, deleteGroup, joinGroup, listGroupMembers, listGroups } from '@/services/backend';

import './room-list-screen.css';

type RoomListScreenProps = {
  memberId?: number;
  memberName?: string;
  onOpenRoom: (roomId: string) => void;
  token?: string;
};

type Room = {
  id: string;
  groupId?: number;
  icon: string;
  name: string;
  code: string;
  members: {
    current: number | null;
    colors: string[];
  };
  recommendation: string;
};

type MenuAction = 'copy' | 'delete';

type DialogState =
  | { type: 'create' }
  | { type: 'delete'; roomId: string };

type RoomFormValues = {
  name: string;
  icon: string;
  maxMembers: number;
};

const ICON_OPTIONS = ['🍽️', '☕', '🏠', '🍜', '🍕', '🥗'] as const;
const DEFAULT_ROOM_ICON = ICON_OPTIONS[0];
const MAX_MEMBER_OPTIONS = [4, 5, 6, 8] as const;
const MEMBER_COLORS = ['#9e6bf5', '#f55947', '#4785f5', '#33c766', '#f5c829', '#21c2a9'] as const;

const MENU_ITEMS: Array<{ action: MenuAction; icon: string; label: string; kind: 'normal' | 'danger' }> = [
  { action: 'copy', icon: '🔗', label: '코드 복사', kind: 'normal' },
  { action: 'delete', icon: '🗑️', label: '방 삭제', kind: 'danger' },
];

const STARS = [
  { left: 18, top: 70, label: '✦', size: 15, opacity: 0.2 },
  { left: 325, top: 115, label: '✧', size: 11, opacity: 0.17 },
  { left: 355, top: 300, label: '✦', size: 12, opacity: 0.17 },
  { left: 30, top: 440, label: '✧', size: 10, opacity: 0.14 },
  { left: 348, top: 610, label: '✦', size: 11, opacity: 0.15 },
] as const;

const INVITE_CODE_SEARCH_PARAM = 'code';
const PENDING_INVITE_CODE_STORAGE_KEY = 'unsik:pending_invite_code';

function readInviteCodeFromLocation(): string | null {
  const inviteCode = new URLSearchParams(window.location.search).get(INVITE_CODE_SEARCH_PARAM)?.trim();

  return inviteCode || null;
}

function readStoredInviteCode(): string | null {
  try {
    return window.localStorage.getItem(PENDING_INVITE_CODE_STORAGE_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

function storePendingInviteCode(inviteCode: string) {
  try {
    window.localStorage.setItem(PENDING_INVITE_CODE_STORAGE_KEY, inviteCode);
  } catch {
    // The URL still carries the invite code, so storage failure is non-fatal.
  }
}

function clearPendingInviteCode() {
  try {
    window.localStorage.removeItem(PENDING_INVITE_CODE_STORAGE_KEY);
  } catch {
    // Nothing to recover here.
  }
}

function clearInviteCodeFromLocation() {
  const url = new URL(window.location.href);

  if (!url.searchParams.has(INVITE_CODE_SEARCH_PARAM)) {
    return;
  }

  url.searchParams.delete(INVITE_CODE_SEARCH_PARAM);
  window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
}

function readInitialInviteCode(): string | null {
  return readInviteCodeFromLocation() ?? readStoredInviteCode();
}

async function copyRoomCode(room: Room) {
  await navigator.clipboard.writeText(room.code);

  return room.code;
}

async function groupToRoom(
  group: GroupResponse,
  context: Required<Pick<BackendContext, 'memberId'>> & Pick<BackendContext, 'token'>,
  iconOverride?: string,
): Promise<Room> {
  const members = await listGroupMembers(context, group.id).catch(() => null);
  const memberCount = members?.length ?? null;

  return {
    id: String(group.id),
    groupId: group.id,
    icon: iconOverride ?? readGroupIcon(group.description) ?? DEFAULT_ROOM_ICON,
    name: group.name,
    code: group.inviteCode || `GRP-${group.id}`,
    members: {
      current: memberCount,
      colors: memberCount === null ? [] : MEMBER_COLORS.slice(0, Math.min(Math.max(memberCount, 1), MEMBER_COLORS.length)),
    },
    recommendation: group.description || '투표를 만들어 메뉴를 정해보세요',
  };
}

function readGroupIcon(description: string): string | null {
  const [firstCharacter] = Array.from(description.trim());

  if (firstCharacter && ICON_OPTIONS.some((option) => option === firstCharacter)) {
    return firstCharacter;
  }

  return null;
}

function getRoomEmptyTitle(hasMemberId: boolean, errorMessage: string | null): string {
  if (!hasMemberId) {
    return '로그인이 필요해요';
  }

  if (errorMessage) {
    return '방 목록을 불러오지 못했어요';
  }

  return '아직 참여 중인 방이 없어요';
}

function getRoomEmptyDescription(hasMemberId: boolean, errorMessage: string | null): string {
  if (!hasMemberId) {
    return '카카오 로그인 후 백엔드에 저장된 그룹을 조회할 수 있어요';
  }

  if (errorMessage) {
    return errorMessage;
  }

  return '아래 버튼으로 첫 방을 만들어 보세요';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return '알 수 없는 오류가 발생했어요.';
}

export function RoomListScreen({ memberId, memberName, onOpenRoom, token }: RoomListScreenProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isLoadingRooms, setIsLoadingRooms] = useState(Boolean(memberId));
  const [hasLoadedRooms, setHasLoadedRooms] = useState(false);
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(() => readInitialInviteCode());
  const [isJoiningInvite, setIsJoiningInvite] = useState(false);
  const [roomSourceLabel, setRoomSourceLabel] = useState('백엔드 API');
  const [roomListError, setRoomListError] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const pendingInviteNoticeRef = useRef<string | null>(null);
  const handledInviteCodeRef = useRef<string | null>(null);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!memberId) {
      setRooms([]);
      setRoomSourceLabel('로그인 필요');
      setRoomListError(null);
      setHasLoadedRooms(false);
      return undefined;
    }

    let isCurrent = true;
    setIsLoadingRooms(true);
    setHasLoadedRooms(false);
    setRoomListError(null);

    listGroups({ memberId, token })
      .then(async (groups) => {
        if (!isCurrent) {
          return;
        }

        const nextRooms = await Promise.all(
          groups.map((group) => groupToRoom(group, { memberId, token })),
        );

        if (!isCurrent) {
          return;
        }

        setRooms(nextRooms);
        setRoomSourceLabel('백엔드 API');
        setRoomListError(null);
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setRooms([]);
        setRoomSourceLabel('오류');
        setRoomListError(getErrorMessage(error));
        showToast('그룹 목록 API 호출에 실패했어요');
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoadingRooms(false);
          setHasLoadedRooms(true);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [memberId, showToast, token]);

  useEffect(() => {
    const inviteCode = readInviteCodeFromLocation();

    if (!inviteCode) {
      return;
    }

    storePendingInviteCode(inviteCode);
    setPendingInviteCode(inviteCode);
  }, []);

  useEffect(() => {
    if (!pendingInviteCode) {
      return undefined;
    }

    if (!memberId) {
      storePendingInviteCode(pendingInviteCode);

      if (pendingInviteNoticeRef.current !== pendingInviteCode) {
        pendingInviteNoticeRef.current = pendingInviteCode;
        showToast('카카오 로그인 후 초대 링크로 참여할 수 있어요');
      }

      return undefined;
    }

    if (!hasLoadedRooms || isJoiningInvite) {
      return undefined;
    }

    const existingRoom = rooms.find((room) => room.code === pendingInviteCode);

    if (existingRoom) {
      handledInviteCodeRef.current = pendingInviteCode;
      clearPendingInviteCode();
      clearInviteCodeFromLocation();
      setPendingInviteCode(null);
      showToast(`${existingRoom.name} 방으로 이동해요`);
      onOpenRoom(existingRoom.id);
      return undefined;
    }

    if (handledInviteCodeRef.current === pendingInviteCode) {
      return undefined;
    }

    let isCurrent = true;
    handledInviteCodeRef.current = pendingInviteCode;
    setIsJoiningInvite(true);

    joinGroup({ memberId, token }, pendingInviteCode)
      .then(async (group) => {
        const room = await groupToRoom(group, { memberId, token });

        if (!isCurrent) {
          return;
        }

        setRooms((currentRooms) => {
          if (currentRooms.some((currentRoom) => currentRoom.id === room.id)) {
            return currentRooms;
          }

          return [room, ...currentRooms];
        });
        setRoomSourceLabel('백엔드 API');
        setRoomListError(null);
        clearPendingInviteCode();
        clearInviteCodeFromLocation();
        setPendingInviteCode(null);
        showToast(`${room.name} 방에 참여했어요`);
        onOpenRoom(room.id);
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        handledInviteCodeRef.current = null;
        clearPendingInviteCode();
        clearInviteCodeFromLocation();
        setPendingInviteCode(null);
        showToast(`초대 링크 참여에 실패했어요: ${getErrorMessage(error)}`);
      })
      .finally(() => {
        if (isCurrent) {
          setIsJoiningInvite(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [hasLoadedRooms, isJoiningInvite, memberId, onOpenRoom, pendingInviteCode, rooms, showToast, token]);

  useEffect(() => {
    if (!openMenuId) {
      return undefined;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      const isCurrentMenuClick = event.target.closest(`[data-room-menu-popover="${openMenuId}"]`);
      const isCurrentButtonClick = event.target.closest(`[data-room-menu-button="${openMenuId}"]`);

      if (isCurrentMenuClick || isCurrentButtonClick) {
        return;
      }

      setOpenMenuId(null);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [openMenuId]);

  const closeDialog = () => {
    setDialog(null);
  };

  const handleCreateRoom = async (values: RoomFormValues) => {
    if (!memberId) {
      showToast('로그인 후 방을 만들 수 있어요');
      return;
    }

    try {
      const group = await createGroup(
        { memberId, token },
        {
          name: values.name.trim(),
          description: `${values.icon} 최대 ${values.maxMembers}명`,
        },
      );
      const room = await groupToRoom(group, { memberId, token }, values.icon);

      setRooms((currentRooms) => [room, ...currentRooms]);
      setRoomSourceLabel('백엔드 API');
      setRoomListError(null);
      setOpenMenuId(null);
      setDialog(null);
      showToast(`${room.name} 방을 만들었어요`);
    } catch (error) {
      showToast(`그룹 생성 API 호출에 실패했어요: ${getErrorMessage(error)}`);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    const targetRoom = rooms.find((room) => room.id === roomId);

    if (!memberId || !targetRoom?.groupId) {
      showToast('백엔드 그룹 정보가 없어 삭제할 수 없어요');
      return;
    }

    try {
      await deleteGroup({ memberId, token }, targetRoom.groupId);
    } catch (error) {
      showToast(`그룹 삭제 API 호출에 실패했어요: ${getErrorMessage(error)}`);
      return;
    }

    setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomId));
    setOpenMenuId(null);
    setDialog(null);
    showToast(`${targetRoom?.name ?? '방'}을 삭제했어요`);
  };

  const handleJoinRoom = async () => {
    if (!memberId) {
      showToast('로그인 후 초대코드로 참여할 수 있어요');
      return;
    }

    const inviteCode = window.prompt('초대코드를 입력해 주세요');

    if (!inviteCode?.trim()) {
      return;
    }

    try {
      const group = await joinGroup({ memberId, token }, inviteCode.trim());
      const room = await groupToRoom(group, { memberId, token });

      setRooms((currentRooms) => {
        if (currentRooms.some((currentRoom) => currentRoom.id === room.id)) {
          return currentRooms;
        }

        return [room, ...currentRooms];
      });
      setRoomSourceLabel('백엔드 API');
      showToast(`${room.name} 방에 참여했어요`);
    } catch {
      showToast('초대코드 참여 API 호출에 실패했어요');
    }
  };

  const handleMenuAction = async (room: Room, action: MenuAction) => {
    setOpenMenuId(null);

    if (action === 'copy') {
      try {
        await copyRoomCode(room);
        showToast('방 코드를 복사했어요');
      } catch {
        showToast(`복사할 코드: ${room.code}`);
      }

      return;
    }

    setDialog({ type: 'delete', roomId: room.id });
  };

  const activeRoom = dialog?.type === 'delete' ? rooms.find((room) => room.id === dialog.roomId) : null;

  return (
    <main className="room-list-screen">
      <section className="room-list-canvas" aria-labelledby="room-list-title">
        <StarField />

        <nav className="room-list-nav" aria-label="방 목록 탐색">
          <span aria-hidden="true" />
          <p className="room-list-nav-title">방 목록</p>
          <span aria-hidden="true" />
        </nav>

        <header className="room-list-header">
          <h1 id="room-list-title">내 그룹</h1>
          <p>
            {memberName ? `${memberName}님 · ` : ''}총 {rooms.length}개의 방{' '}
            <span aria-hidden="true">·</span> {isLoadingRooms ? '불러오는 중' : roomSourceLabel}
          </p>
        </header>

        <section className="room-list-section" aria-labelledby="joined-room-title">
          <p className="room-list-section-label" id="joined-room-title">
            참여 중인 방
          </p>

          {rooms.length > 0 ? (
            <div className="room-card-stack">
              {rooms.map((room, index) => (
                <RoomCard
                  key={room.id}
                  isMenuOpen={openMenuId === room.id}
                  onMenuAction={(action) => void handleMenuAction(room, action)}
                  onOpen={() => onOpenRoom(room.id)}
                  onToggleMenu={() => setOpenMenuId((current) => (current === room.id ? null : room.id))}
                  room={room}
                  style={{ '--room-delay': `${index * 80}ms` } as CSSProperties}
                />
              ))}
            </div>
          ) : (
            <div className="room-empty-state">
              <p>{getRoomEmptyTitle(Boolean(memberId), roomListError)}</p>
              <span>{getRoomEmptyDescription(Boolean(memberId), roomListError)}</span>
            </div>
          )}
        </section>

        <p className="room-list-hint">새 그룹을 추가하려면 아래 버튼을 눌러요</p>

        <div className="room-list-spacer" />

        <div className="room-list-actions">
          <button className="room-list-create" type="button" onClick={() => setDialog({ type: 'create' })}>
            <span aria-hidden="true">✦</span>
            <span>방 만들기</span>
          </button>
          <button className="room-list-join" type="button" onClick={() => void handleJoinRoom()}>
            <span aria-hidden="true">🔗</span>
            <span>코드로 참여하기</span>
          </button>
        </div>

        {toast ? <div className="room-toast">{toast}</div> : null}
      </section>

      {dialog?.type === 'create' ? (
        <RoomFormDialog
          onClose={closeDialog}
          onSubmit={(values) => void handleCreateRoom(values)}
          submitLabel="방 만들기"
          title="새 방 만들기"
        />
      ) : null}

      {dialog?.type === 'delete' && activeRoom ? (
        <ConfirmDialog
          dangerLabel="삭제"
          description={`${activeRoom.name} 방을 삭제할까요? 백엔드에서 그룹과 관련 데이터가 함께 삭제됩니다.`}
          onClose={closeDialog}
          onConfirm={() => void handleDeleteRoom(activeRoom.id)}
          title="방 삭제"
        />
      ) : null}
    </main>
  );
}

type RoomCardProps = {
  room: Room;
  isMenuOpen: boolean;
  onOpen: () => void;
  onToggleMenu: () => void;
  onMenuAction: (action: MenuAction) => void;
  style: CSSProperties;
};

function RoomCard({ room, isMenuOpen, onOpen, onToggleMenu, onMenuAction, style }: RoomCardProps) {
  const cardClassName = `room-card room-card-featured${isMenuOpen ? ' room-card-open' : ''}`;

  return (
    <article className={cardClassName} style={style}>
      <div className="room-card-top">
        <div className="room-icon" aria-hidden="true">
          {room.icon}
        </div>

        <div className="room-card-copy">
          <h2>{room.name}</h2>
          <p>코드&nbsp; {room.code}</p>
        </div>

        <button className="room-enter-button" type="button" onClick={onOpen}>
          들어가기
        </button>

        <button
          className="room-menu-button"
          type="button"
          data-room-menu-button={room.id}
          onClick={onToggleMenu}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          aria-label={`${room.name} 메뉴 열기`}
        >
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </button>
      </div>

      <div className="room-card-divider" />

      <div className="room-card-meta">
        <div className="room-member-dots" aria-hidden="true">
          {room.members.colors.map((color) => (
            <span key={color} style={{ backgroundColor: color }} />
          ))}
        </div>
        <p className="room-member-count">
          {room.members.current === null ? '인원 정보 없음' : `${room.members.current}명`}
        </p>
        <p className="room-recommendation">{room.recommendation}</p>
      </div>

      {isMenuOpen ? <RoomMenu onSelect={onMenuAction} roomId={room.id} roomName={room.name} /> : null}
    </article>
  );
}

function RoomMenu({
  roomId,
  roomName,
  onSelect,
}: {
  roomId: string;
  roomName: string;
  onSelect: (action: MenuAction) => void;
}) {
  return (
    <div className="room-menu-popover" role="menu" aria-label={`${roomName} 메뉴`} data-room-menu-popover={roomId}>
      {MENU_ITEMS.map((item) => (
        <button
          className={`room-menu-item ${item.kind === 'danger' ? 'room-menu-item-danger' : ''}`}
          key={item.action}
          type="button"
          role="menuitem"
          onClick={() => onSelect(item.action)}
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

type RoomFormDialogProps = {
  title: string;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => void;
};

function RoomFormDialog({
  title,
  submitLabel,
  onClose,
  onSubmit,
}: RoomFormDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<(typeof ICON_OPTIONS)[number]>(ICON_OPTIONS[0]);
  const [maxMembers, setMaxMembers] = useState<(typeof MAX_MEMBER_OPTIONS)[number]>(MAX_MEMBER_OPTIONS[2]);
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      setError('방 이름을 입력해 주세요');
      return;
    }

    onSubmit({ name, icon, maxMembers });
  };

  return (
    <div className="room-dialog-backdrop">
      <form
        className="room-dialog"
        onSubmit={handleSubmit}
        aria-labelledby="room-dialog-title"
        aria-modal="true"
        role="dialog"
      >
        <div className="room-dialog-header">
          <h2 id="room-dialog-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>

        <label className="room-field">
          <span>방 이름</span>
          <input
            autoFocus
            maxLength={18}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            placeholder="예: 저녁 메뉴 회의"
            value={name}
          />
        </label>

        <div className="room-field">
          <span>아이콘</span>
          <div className="room-icon-options">
            {ICON_OPTIONS.map((option) => (
              <button
                className={option === icon ? 'room-icon-option room-icon-option-selected' : 'room-icon-option'}
                key={option}
                type="button"
                onClick={() => setIcon(option)}
                aria-pressed={option === icon}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="room-field">
          <span>최대 인원</span>
          <div className="room-member-options">
            {MAX_MEMBER_OPTIONS.map((option) => (
              <button
                className={option === maxMembers ? 'room-member-option room-member-option-selected' : 'room-member-option'}
                key={option}
                type="button"
                onClick={() => setMaxMembers(option)}
                aria-pressed={option === maxMembers}
              >
                {option}명
              </button>
            ))}
          </div>
        </div>

        {error ? <p className="room-dialog-error">{error}</p> : null}

        <div className="room-dialog-actions">
          <button className="room-dialog-secondary" type="button" onClick={onClose}>
            취소
          </button>
          <button className="room-dialog-primary" type="submit">
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

type ConfirmDialogProps = {
  title: string;
  description: string;
  dangerLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

function ConfirmDialog({ title, description, dangerLabel, onClose, onConfirm }: ConfirmDialogProps) {
  return (
    <div className="room-dialog-backdrop">
      <div className="room-dialog" role="dialog" aria-labelledby="room-confirm-title" aria-modal="true">
        <div className="room-dialog-header">
          <h2 id="room-confirm-title">{title}</h2>
          <button type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </div>
        <p className="room-dialog-description">{description}</p>
        <div className="room-dialog-actions">
          <button className="room-dialog-secondary" type="button" onClick={onClose}>
            취소
          </button>
          <button className="room-dialog-danger" type="button" onClick={onConfirm}>
            {dangerLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarField() {
  return (
    <div className="room-list-stars" aria-hidden="true">
      {STARS.map((star) => (
        <span
          className="room-list-star"
          key={`${star.left}-${star.top}`}
          style={{
            left: `${star.left}px`,
            top: `${star.top}px`,
            fontSize: `${star.size}px`,
            opacity: star.opacity,
          }}
        >
          {star.label}
        </span>
      ))}
    </div>
  );
}
