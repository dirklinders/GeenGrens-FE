const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7424';

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
}

export interface CharacterDTO {
  id: number;
  name: string | null;
  description: string | null;
  systemPrompt: string | null;
  avatarUrl: string | null;
  personality: string | null;
  storyId: number;
}

export interface ChatDTO {
  id: number;
  role: string | null;
  message: string | null;
  characterId: number;
}

export interface StoryDTO {
  id: number;
  name: string | null;
  description: string | null;
}

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

// Auth endpoints
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

// Character endpoints
export const characterApi = {
  getAll: () => fetchApi<CharacterDTO[]>('/api/Character'),
  getById: (id: number) => fetchApi<CharacterDTO>(`/api/Character/${id}`),
  create: (data: CharacterDTO) =>
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

// Chat endpoints
export const chatApi = {
  getAll: () => fetchApi<ChatDTO[]>('/api/Chat'),
  getById: (id: number) => fetchApi<ChatDTO>(`/api/Chat/${id}`),
  create: (data: ChatDTO) =>
    fetchApi<ChatDTO>('/api/Chat', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: ChatDTO) =>
    fetchApi<ChatDTO>('/api/Chat', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/Chat/${id}`, { method: 'DELETE' }),
};

// ChatFE endpoints (for gameplay)
export const chatFeApi = {
  chat: (characterId: number, question: string) =>
    fetchApi<{ response: string }>(
      `/api/ChatFE/chat?characterId=${characterId}&question=${encodeURIComponent(question)}`
    ),
  getChats: (characterId: number) =>
    fetchApi<ChatDTO[]>(`/api/ChatFE/getchats?characterId=${characterId}`),
};

// Story endpoints
export const storyApi = {
  getAll: () => fetchApi<StoryDTO[]>('/api/Story'),
  getById: (id: number) => fetchApi<StoryDTO>(`/api/Story/${id}`),
  create: (data: StoryDTO) =>
    fetchApi<StoryDTO>('/api/Story', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (data: StoryDTO) =>
    fetchApi<StoryDTO>('/api/Story', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/Story/${id}`, { method: 'DELETE' }),
};

// Game endpoints
export interface PasswordResponse {
  success: boolean;
  notebookLocation?: string;
}

export interface GameStatusResponse {
  isUnlocked: boolean;
  notebookLocation?: string;
}

export const gameApi = {
  verifyPassword: (password: string) =>
    fetchApi<PasswordResponse>('/api/Game/VerifyPassword', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),
  getNotebookLocation: () =>
    fetchApi<{ location: string }>('/api/Game/NotebookLocation'),
  getGameStatus: () =>
    fetchApi<GameStatusResponse>('/api/Game/Status'),
};
