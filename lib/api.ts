const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7424';

// ────────────────────────────────────────────────────────────
// Shared fetch helper
// ────────────────────────────────────────────────────────────

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  if (!text) return {} as T;

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

// ────────────────────────────────────────────────────────────
// DTOs
// ────────────────────────────────────────────────────────────

export interface LoginDTO {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  teamName?: string;
  isAdmin?: boolean;
}

export interface CharacterDTO {
  id: number;
  name: string | null;
  description: string | null;
  systemPrompt: string | null;
  avatarUrl: string | null;
  personality: string | null;
}

export interface ChatDTO {
  role: string;
  message: string;
}

export interface AdminMessageDTO {
  role: 'User' | 'Assistant';
  content: string;
}


export interface TeamDTO {
  id: number;
  name: string;
  notebookLocation?: string | null;
  isPlaytest?: boolean;
  barName?: string | null;
}

export interface LocationCodeDTO {
  id: number;
  code: string;
  locationName: string;
  unlockMessage: string;
  characterId: number;
}

export interface TeamProgressDTO {
  teamId: number;
  teamName: string;
  notebookLocation: string;
  members: Array<{ id: string; email: string | null; fullName: string | null }>;
  progress: {
    isNotebookUnlocked: boolean;
    canAccessChat: boolean;
    canSubmitTip: boolean;
    tipSubmitted: boolean;
    tipSuspectId?: string | null;
    tipMotive?: string | null;
    tipIsCorrect?: boolean | null;
  } | null;
  unlockedCodes: Array<{
    code: string | null;
    locationName: string | null;
    unlockedAt: string;
  }>;
}

export interface TeamDetailDTO {
  teamId: number;
  teamName: string;
  notebookLocation: string;
  members: Array<{ id: string; email: string | null; fullName: string | null }>;
  progress: {
    isNotebookUnlocked: boolean;
    canAccessChat: boolean;
    canSubmitTip: boolean;
    tipSubmitted: boolean;
    tipSuspectId?: string | null;
    tipMotive?: string | null;
    tipIsCorrect?: boolean | null;
  } | null;
  unlockedCodes: Array<{
    code: string | null;
    locationName: string | null;
    unlockedAt: string;
    characterId: number | null;
    characterName: string | null;
    chats: Array<{ role: string; message: string }>;
  }>;
}

export interface UserInfoAdmin {
  id: string;
  email: string | null;
  name: string | null;
  teamId: number;
  teamName?: string | null;
}

export interface UnlockResult {
  success: boolean;
  message: string;
  characterName?: string | null;
  characterId?: number;
  locationName?: string | null;
}

export interface UnlockedCode {
  code: string;
  locationName: string;
  characterName?: string | null;
  characterId: number;
  unlockedAt: string;
}

export interface PasswordResponse {
  success: boolean;
  notebookLocation?: string;
}

export interface GameStatusResponse {
  isUnlocked: boolean;
  notebookLocation?: string;
  canAccessChat?: boolean;
  canSubmitTip?: boolean;
  isPlaytest?: boolean;
  barName?: string | null;
}

export interface TipResult {
  isCorrect: boolean;
  alreadySubmitted: boolean;
  suspectId?: string | null;
}

// ────────────────────────────────────────────────────────────
// Auth
// ────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginDTO) =>
    fetchApi<{ success: boolean }>('/api/Auth/Login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  isAuthenticated: () =>
    fetchApi<UserInfo>('/api/Auth/IsAuthenticated'),

  logout: () =>
    fetchApi<void>('/api/Auth/Logout', { method: 'POST' }),

  getGoogleLoginUrl: (returnUrl: string) =>
    `${API_BASE_URL}/api/ExternalAuth/LoginGoogle?returnUrl=${encodeURIComponent(returnUrl)}`,
};

// ────────────────────────────────────────────────────────────
// Game
// ────────────────────────────────────────────────────────────

export const gameApi = {
  verifyPassword: (password: string) =>
    fetchApi<PasswordResponse>('/api/game/VerifyPassword', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getNotebookLocation: () =>
    fetchApi<{ location: string }>('/api/game/NotebookLocation'),

  getGameStatus: () =>
    fetchApi<GameStatusResponse>('/api/game/Status'),

  /** Returns only the characters unlocked by the current team via location codes */
  getUnlockedCharacters: () =>
    fetchApi<CharacterDTO[]>('/api/game/UnlockedCharacters'),
};

// ────────────────────────────────────────────────────────────
// Unlock (location codes)
// ────────────────────────────────────────────────────────────

export const unlockApi = {
  enterCode: (code: string) =>
    fetchApi<UnlockResult>('/api/Unlock/EnterCode', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getUnlocked: () =>
    fetchApi<UnlockedCode[]>('/api/Unlock/GetUnlocked'),
};

// ────────────────────────────────────────────────────────────
// Tip
// ────────────────────────────────────────────────────────────

export const tipApi = {
  submit: (suspectId: string, motive: string) =>
    fetchApi<TipResult>('/api/Tip/Submit', {
      method: 'POST',
      body: JSON.stringify({ suspectId, motive }),
    }),
};

// ────────────────────────────────────────────────────────────
// Characters (admin CRUD)
// ────────────────────────────────────────────────────────────

export const characterApi = {
  getAll: () => fetchApi<CharacterDTO[]>('/api/Character'),
  getById: (id: number) => fetchApi<CharacterDTO>(`/api/Character/${id}`),
  create: (data: Omit<CharacterDTO, 'id'>) =>
    fetchApi<CharacterDTO>('/api/Character', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: CharacterDTO) =>
    fetchApi<CharacterDTO>('/api/Character', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/Character/${id}`, { method: 'DELETE' }),
};

// ────────────────────────────────────────────────────────────
// Chat (admin CRUD) — raw DB records
// ────────────────────────────────────────────────────────────

export interface ChatRecordDTO {
  id: number;
  role: string | null;
  message: string | null;
  characterId: number;
  teamId?: number | null;
}

export const chatApi = {
  getAll: () => fetchApi<ChatRecordDTO[]>('/api/Chat'),
  getById: (id: number) => fetchApi<ChatRecordDTO>(`/api/Chat/${id}`),
  create: (data: Omit<ChatRecordDTO, 'id'>) =>
    fetchApi<ChatRecordDTO>('/api/Chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: ChatRecordDTO) =>
    fetchApi<ChatRecordDTO>('/api/Chat', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/Chat/${id}`, { method: 'DELETE' }),
};

// ────────────────────────────────────────────────────────────
// ChatFE (gameplay AI chat + streaming)
// ────────────────────────────────────────────────────────────

/** Parse SSE chunks and call onChunk for each text token. Returns the full text. */
async function consumeSseStream(
  response: Response,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
  onEnded?: () => void
): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return full;
      try {
        const parsed = JSON.parse(data) as { text?: string; ended?: boolean; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.ended) { onEnded?.(); continue; }
        if (parsed.text) {
          full += parsed.text;
          onChunk(parsed.text);
        }
      } catch {
        // ignore malformed lines
      }
    }
  }
  return full;
}

export const chatFeApi = {
  getChats: (characterId: number) =>
    fetchApi<ChatDTO[]>(`/api/ChatFE/getchats?characterId=${characterId}`),

  /**
   * Stream a team-scoped chat response.
   * onChunk is called with each token as it arrives.
   * onEnded is called (once) if the AI triggered the stop-condition tool.
   * Returns the full assembled response text.
   */
  streamChat: async (
    characterId: number,
    question: string,
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    onEnded?: () => void
  ): Promise<string> => {
    const url = `${API_BASE_URL}/api/ChatFE/stream?characterId=${characterId}&question=${encodeURIComponent(question)}`;
    const response = await fetch(url, {
      credentials: 'include',
      signal,
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return consumeSseStream(response, onChunk, signal, onEnded);
  },

  /**
   * Stream an admin test chat response (no DB reads/writes).
   * onChunk is called with each token as it arrives.
   * onEnded is called if the AI triggered the stop-condition tool.
   * Returns the full assembled response text.
   */
  streamAdminTest: async (
    characterId: number,
    question: string,
    history: AdminMessageDTO[],
    onChunk: (text: string) => void,
    signal?: AbortSignal,
    onEnded?: () => void
  ): Promise<string> => {
    const url = `${API_BASE_URL}/api/ChatFE/admin-test-stream`;
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId, question, history }),
      signal,
    });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return consumeSseStream(response, onChunk, signal, onEnded);
  },
};

// ────────────────────────────────────────────────────────────
// Teams (admin CRUD)
// ────────────────────────────────────────────────────────────

export const teamApi = {
  getAll: () => fetchApi<TeamDTO[]>('/api/Team'),
  getById: (id: number) => fetchApi<TeamDTO>(`/api/Team/${id}`),
  create: (data: Omit<TeamDTO, 'id'>) =>
    fetchApi<TeamDTO>('/api/Team', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: TeamDTO) =>
    fetchApi<TeamDTO>('/api/Team', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/Team/${id}`, { method: 'DELETE' }),
};

// ────────────────────────────────────────────────────────────
// Location Codes (admin CRUD)
// ────────────────────────────────────────────────────────────

export const locationCodeApi = {
  getAll: () => fetchApi<LocationCodeDTO[]>('/api/LocationCode'),
  getById: (id: number) => fetchApi<LocationCodeDTO>(`/api/LocationCode/${id}`),
  create: (data: Omit<LocationCodeDTO, 'id'>) =>
    fetchApi<LocationCodeDTO>('/api/LocationCode', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: LocationCodeDTO) =>
    fetchApi<LocationCodeDTO>('/api/LocationCode', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/LocationCode/${id}`, { method: 'DELETE' }),
};

// ────────────────────────────────────────────────────────────
// Admin
// ────────────────────────────────────────────────────────────

export const adminApi = {
  getUsers: () => fetchApi<UserInfoAdmin[]>('/api/Admin/Users'),
  assignTeam: (userId: string, teamId: number) =>
    fetchApi<void>('/api/Admin/AssignTeam', {
      method: 'POST',
      body: JSON.stringify({ userId, teamId }),
    }),
  makeAdmin: (userId: string) =>
    fetchApi<void>('/api/Admin/MakeAdmin', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  getTeamProgress: () =>
    fetchApi<TeamProgressDTO[]>('/api/Admin/TeamProgress'),
  getTeamDetail: (teamId: number) =>
    fetchApi<TeamDetailDTO>(`/api/Admin/TeamDetail/${teamId}`),
  setProgress: (teamId: number, flags: { isNotebookUnlocked?: boolean; canAccessChat?: boolean; canSubmitTip?: boolean }) =>
    fetchApi<void>('/api/Admin/SetProgress', {
      method: 'POST',
      body: JSON.stringify({ teamId, ...flags }),
    }),
  setPlaytest: (teamId: number, isPlaytest: boolean) =>
    fetchApi<void>('/api/Team', {
      method: 'PUT',
      body: JSON.stringify({ id: teamId, isPlaytest }),
    }),
  createUser: (email: string, password: string, name?: string) =>
    fetchApi<{ id: string; email: string; name: string }>('/api/Admin/CreateUser', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  deleteUser: (userId: string) =>
    fetchApi<void>(`/api/Admin/DeleteUser/${userId}`, { method: 'DELETE' }),
};
