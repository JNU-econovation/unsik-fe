import type { CSSProperties, FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import './room-list-screen.css';

type RoomListScreenProps = {
  onBack: () => void;
};

type RoomTone = 'featured' | 'muted' | 'quiet';

type Room = {
  id: string;
  icon: string;
  name: string;
  code: string;
  members: {
    current: number;
    max: number;
    colors: string[];
  };
  recommendation: string;
};

type MenuAction = 'copy' | 'rename' | 'delete';

type DialogState =
  | { type: 'create' }
  | { type: 'rename'; roomId: string }
  | { type: 'delete'; roomId: string };

type RoomFormValues = {
  name: string;
  icon: string;
  maxMembers: number;
};

const INITIAL_ROOMS: Room[] = [
  {
    id: 'unsik-team',
    icon: '🍽️',
    name: '운식팀',
    code: 'UNM-2024',
    members: {
      current: 4,
      max: 6,
      colors: ['#9e6bf5', '#f55947', '#4785f5', '#33c766'],
    },
    recommendation: '오늘 · 국수 추천됨',
  },
  {
    id: 'cs-lunch',
    icon: '☕',
    name: 'CS 점심 모임',
    code: 'CSL-0312',
    members: {
      current: 3,
      max: 5,
      colors: ['#9e6bf5', '#f55947', '#4785f5'],
    },
    recommendation: '어제 · 카페 추천됨',
  },
  {
    id: 'dorm-room',
    icon: '🏠',
    name: '기숙사 룸메',
    code: 'DRM-0505',
    members: {
      current: 2,
      max: 4,
      colors: ['#9e6bf5', '#f55947'],
    },
    recommendation: '3일 전 · 분식 추천됨',
  },
];

const ICON_OPTIONS = ['🍽️', '☕', '🏠', '🍜', '🍕', '🥗'] as const;
const MAX_MEMBER_OPTIONS = [4, 5, 6, 8] as const;
const MEMBER_COLORS = ['#9e6bf5', '#f55947', '#4785f5', '#33c766', '#f5c829', '#21c2a9'] as const;

const MENU_ITEMS: Array<{ action: MenuAction; icon: string; label: string; kind: 'normal' | 'danger' }> = [
  { action: 'copy', icon: '🔗', label: '링크 복사', kind: 'normal' },
  { action: 'rename', icon: '✏️', label: '이름 변경', kind: 'normal' },
  { action: 'delete', icon: '🗑️', label: '방 삭제', kind: 'danger' },
];

const STARS = [
  { left: 18, top: 70, label: '✦', size: 15, opacity: 0.2 },
  { left: 325, top: 115, label: '✧', size: 11, opacity: 0.17 },
  { left: 355, top: 300, label: '✦', size: 12, opacity: 0.17 },
  { left: 30, top: 440, label: '✧', size: 10, opacity: 0.14 },
  { left: 348, top: 610, label: '✦', size: 11, opacity: 0.15 },
] as const;

function getRoomTone(index: number): RoomTone {
  if (index === 0) {
    return 'featured';
  }

  if (index === 1) {
    return 'muted';
  }

  return 'quiet';
}

function createRoomId() {
  return `room-${Date.now()}-${Math.round(Math.random() * 9999)}`;
}

function createRoomCode() {
  return `UNS-${Math.floor(1000 + Math.random() * 9000)}`;
}

function createRoomLink(code: string) {
  return `${window.location.origin}/grouplist?code=${encodeURIComponent(code)}`;
}

export function RoomListScreen({ onBack }: RoomListScreenProps) {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = (message: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    setToast(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 2200);
  };

  const closeDialog = () => {
    setDialog(null);
  };

  const handleCreateRoom = (values: RoomFormValues) => {
    const room: Room = {
      id: createRoomId(),
      icon: values.icon,
      name: values.name.trim(),
      code: createRoomCode(),
      members: {
        current: 1,
        max: values.maxMembers,
        colors: [MEMBER_COLORS[0]],
      },
      recommendation: '방금 생성됨 · 추천 대기',
    };

    setRooms((currentRooms) => [room, ...currentRooms]);
    setOpenMenuId(null);
    setDialog(null);
    showToast(`${room.name} 방을 만들었어요`);
  };

  const handleRenameRoom = (roomId: string, values: RoomFormValues) => {
    const nextName = values.name.trim();

    setRooms((currentRooms) =>
      currentRooms.map((room) => (room.id === roomId ? { ...room, name: nextName } : room)),
    );
    setOpenMenuId(null);
    setDialog(null);
    showToast('방 이름을 바꿨어요');
  };

  const handleDeleteRoom = (roomId: string) => {
    const targetRoom = rooms.find((room) => room.id === roomId);

    setRooms((currentRooms) => currentRooms.filter((room) => room.id !== roomId));
    setOpenMenuId(null);
    setDialog(null);
    showToast(`${targetRoom?.name ?? '방'}을 삭제했어요`);
  };

  const handleMenuAction = async (room: Room, action: MenuAction) => {
    setOpenMenuId(null);

    if (action === 'copy') {
      const link = createRoomLink(room.code);

      try {
        await navigator.clipboard.writeText(link);
        showToast('초대 링크를 복사했어요');
      } catch {
        showToast(`복사할 링크: ${link}`);
      }

      return;
    }

    if (action === 'rename') {
      setDialog({ type: 'rename', roomId: room.id });
      return;
    }

    setDialog({ type: 'delete', roomId: room.id });
  };

  const activeRoom =
    dialog?.type === 'rename' || dialog?.type === 'delete'
      ? rooms.find((room) => room.id === dialog.roomId)
      : null;

  return (
    <main className="room-list-screen">
      <section className="room-list-canvas" aria-labelledby="room-list-title">
        <StarField />

        <nav className="room-list-nav" aria-label="방 목록 탐색">
          <button className="room-list-back" type="button" onClick={onBack} aria-label="메인으로 돌아가기">
            <span aria-hidden="true">←</span>
          </button>
          <p className="room-list-nav-title">방 목록</p>
          <span aria-hidden="true" />
        </nav>

        <header className="room-list-header">
          <h1 id="room-list-title">내 그룹</h1>
          <p>
            총 {rooms.length}개의 방 <span aria-hidden="true">·</span> 목데이터
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
                  onToggleMenu={() => setOpenMenuId((current) => (current === room.id ? null : room.id))}
                  room={room}
                  style={{ '--room-delay': `${index * 80}ms` } as CSSProperties}
                  tone={getRoomTone(index)}
                />
              ))}
            </div>
          ) : (
            <div className="room-empty-state">
              <p>아직 참여 중인 방이 없어요</p>
              <span>아래 버튼으로 첫 방을 만들어 보세요</span>
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
          <button className="room-list-join" type="button" onClick={() => showToast('코드 참여는 다음 화면에서 연결할게요')}>
            <span aria-hidden="true">🔗</span>
            <span>코드로 참여하기</span>
          </button>
        </div>

        {toast ? <div className="room-toast">{toast}</div> : null}
      </section>

      {dialog?.type === 'create' ? (
        <RoomFormDialog
          mode="create"
          onClose={closeDialog}
          onSubmit={handleCreateRoom}
          submitLabel="방 만들기"
          title="새 방 만들기"
        />
      ) : null}

      {dialog?.type === 'rename' && activeRoom ? (
        <RoomFormDialog
          initialName={activeRoom.name}
          mode="rename"
          onClose={closeDialog}
          onSubmit={(values) => handleRenameRoom(activeRoom.id, values)}
          submitLabel="이름 변경"
          title="방 이름 변경"
        />
      ) : null}

      {dialog?.type === 'delete' && activeRoom ? (
        <ConfirmDialog
          dangerLabel="삭제"
          description={`${activeRoom.name} 방을 목록에서 삭제할까요? 목데이터라 새로고침하면 초기 목록으로 돌아옵니다.`}
          onClose={closeDialog}
          onConfirm={() => handleDeleteRoom(activeRoom.id)}
          title="방 삭제"
        />
      ) : null}
    </main>
  );
}

type RoomCardProps = {
  room: Room;
  tone: RoomTone;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onMenuAction: (action: MenuAction) => void;
  style: CSSProperties;
};

function RoomCard({ room, tone, isMenuOpen, onToggleMenu, onMenuAction, style }: RoomCardProps) {
  const cardClassName = `room-card room-card-${tone}`;

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

        <button className="room-enter-button" type="button">
          들어가기
        </button>

        <button
          className="room-menu-button"
          type="button"
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
          {room.members.current}/{room.members.max}명
        </p>
        <p className="room-recommendation">{room.recommendation}</p>
      </div>

      {isMenuOpen ? <RoomMenu onSelect={onMenuAction} roomName={room.name} /> : null}
    </article>
  );
}

function RoomMenu({ roomName, onSelect }: { roomName: string; onSelect: (action: MenuAction) => void }) {
  return (
    <div className="room-menu-popover" role="menu" aria-label={`${roomName} 메뉴`}>
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
  mode: 'create' | 'rename';
  title: string;
  submitLabel: string;
  initialName?: string;
  onClose: () => void;
  onSubmit: (values: RoomFormValues) => void;
};

function RoomFormDialog({
  mode,
  title,
  submitLabel,
  initialName = '',
  onClose,
  onSubmit,
}: RoomFormDialogProps) {
  const [name, setName] = useState(initialName);
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

        {mode === 'create' ? (
          <>
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
          </>
        ) : null}

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
