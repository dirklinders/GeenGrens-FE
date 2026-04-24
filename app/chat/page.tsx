'use client';

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { ChatMessage } from '@/components/game/chat-message';
import { CharacterSelector } from '@/components/game/character-selector';
import { GameHeader } from '@/components/game/game-header';
import { gameApi, chatFeApi, unlockApi, type CharacterDTO, type ChatDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LocalMessage {
  id: number;
  role: string;
  message: string;
}

// Moved outside to prevent recreation on each render
function SidebarContent({
  characters,
  charactersLoading,
  selectedCharacterId,
  lockedCharacterIds,
  onSelectCharacter,
}: {
  characters: CharacterDTO[];
  charactersLoading: boolean;
  selectedCharacterId: number | null;
  lockedCharacterIds: Set<number>;
  onSelectCharacter: (id: number) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-stone-900">
      <div className="p-4 border-b border-stone-800">
        <h2 className="font-serif text-xl text-stone-100">Verdachten</h2>
        <p className="text-xs text-stone-500 mt-1">Selecteer iemand om te ondervragen</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          {charactersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-stone-800 h-16 rounded-lg" />
              ))}
            </div>
          ) : (
            <CharacterSelector
              characters={characters}
              selectedId={selectedCharacterId}
              lockedIds={lockedCharacterIds}
              onSelect={onSelectCharacter}
            />
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [isConversationEnded, setIsConversationEnded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Check access permission
  const { data: gameStatus, isLoading: statusLoading } = useSWR(
    'game-status-chat',
    () => gameApi.getGameStatus(),
    { revalidateOnFocus: false }
  );

  // Redirect if not allowed to access chat
  useEffect(() => {
    if (!statusLoading && gameStatus && !gameStatus.canAccessChat) {
      router.push('/');
    }
  }, [gameStatus, statusLoading, router]);

  // Fetch characters unlocked by this team (via entered location codes)
  const { data: characters, isLoading: charactersLoading } = useSWR<CharacterDTO[]>(
    'unlocked-characters',
    () => gameApi.getUnlockedCharacters(),
    { revalidateOnFocus: false }
  );

  // Fetch unlock order to determine which chats are locked
  const { data: unlockedCodes } = useSWR(
    'unlocked-codes-chat',
    () => unlockApi.getUnlocked(),
    { revalidateOnFocus: false }
  );

  // The most recently scanned character is the only one still active
  const latestUnlockedCharacterId = useMemo(() => {
    if (!unlockedCodes || unlockedCodes.length === 0) return null;
    const sorted = [...unlockedCodes].sort(
      (a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
    );
    return sorted[0].characterId;
  }, [unlockedCodes]);

  // All characters except the latest are locked (read-only)
  const lockedCharacterIds = useMemo(() => {
    if (!unlockedCodes || unlockedCodes.length <= 1) return new Set<number>();
    return new Set(
      unlockedCodes
        .filter(uc => uc.characterId !== latestUnlockedCharacterId)
        .map(uc => uc.characterId)
    );
  }, [unlockedCodes, latestUnlockedCharacterId]);

  const isChatLocked =
    selectedCharacterId !== null &&
    lockedCharacterIds.has(selectedCharacterId);

  // Fetch chat history for selected character
  const { data: chatHistory, mutate: mutateChatHistory } = useSWR<ChatDTO[]>(
    selectedCharacterId ? `chats-${selectedCharacterId}` : null,
    () => selectedCharacterId ? chatFeApi.getChats(selectedCharacterId) : Promise.resolve([]),
    { revalidateOnFocus: false }
  );

  const charactersList = characters || [];

  // Auto-select character from NFC scan query param (?character=ID)
  useEffect(() => {
    const paramId = searchParams.get('character');
    if (!paramId || charactersList.length === 0) return;
    const id = parseInt(paramId, 10);
    if (!isNaN(id) && charactersList.some(c => c.id === id)) {
      setSelectedCharacterId(id);
    }
  }, [searchParams, charactersList]);

  const selectedCharacter = charactersList.find(c => c.id === selectedCharacterId);

  // Sync chat history to local state; detect persisted ended-state marker
  const chatHistoryRef = useRef<ChatDTO[] | undefined>();
  useEffect(() => {
    if (chatHistory && chatHistory !== chatHistoryRef.current) {
      chatHistoryRef.current = chatHistory;
      const hasEndedMarker = chatHistory.some(
        m => m.role === 'System' && m.message === '[BEËINDIGD]'
      );
      setIsConversationEnded(hasEndedMarker);
      setLocalMessages(
        chatHistory
          .filter(m => m.role !== 'System')                          // hide system markers from UI
          .map((m, i) => ({ id: i, role: m.role, message: m.message }))
      );
    }
  }, [chatHistory]);

  // Scroll to bottom when messages change or streaming progresses
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [localMessages, streamingText]);

  // Handle character selection
  const handleSelectCharacter = useCallback((id: number) => {
    // Cancel any in-flight stream
    abortRef.current?.abort();
    abortRef.current = null;
    setStreamingText(null);
    setSelectedCharacterId(id);
    setLocalMessages([]);
    setIsConversationEnded(false);
    setSidebarOpen(false);
  }, []);

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCharacterId || isSubmitting || isChatLocked) return;

    const userInput = message.trim();
    setMessage('');
    setIsSubmitting(true);
    setStreamingText('');

    // Add user message to local state immediately
    setLocalMessages(prev => [
      ...prev,
      { id: Date.now(), role: 'User', message: userInput },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let accumulated = '';
      await chatFeApi.streamChat(
        selectedCharacterId,
        userInput,
        (chunk) => {
          accumulated += chunk;
          setStreamingText(accumulated);
        },
        controller.signal,
        () => setIsConversationEnded(true)
      );

      // Stream complete — promote streaming text to a real message
      if (accumulated) {
        setLocalMessages(prev => [
          ...prev,
          { id: Date.now() + 1, role: 'Assistant', message: accumulated },
        ]);
      }

      // Optionally refresh from server (history already saved on backend)
      mutateChatHistory();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      setLocalMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'Assistant', message: 'Er is een fout opgetreden. Probeer het later opnieuw.' },
      ]);
    } finally {
      setStreamingText(null);
      setIsSubmitting(false);
      abortRef.current = null;
    }
  };

  const mobileMenuContent = (
    <SidebarContent
      characters={charactersList}
      charactersLoading={charactersLoading}
      selectedCharacterId={selectedCharacterId}
      lockedCharacterIds={lockedCharacterIds}
      onSelectCharacter={handleSelectCharacter}
    />
  );

  return (
    <div className="flex flex-col bg-stone-950" style={{ height: '100dvh' }}>
      <GameHeader
        showMobileMenu
        mobileMenuContent={mobileMenuContent}
        mobileMenuOpen={sidebarOpen}
        onMobileMenuChange={setSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-80 border-r border-stone-800 flex-shrink-0">
          <SidebarContent
            characters={charactersList}
            charactersLoading={charactersLoading}
            selectedCharacterId={selectedCharacterId}
            lockedCharacterIds={lockedCharacterIds}
            onSelectCharacter={handleSelectCharacter}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Selected character info bar */}
          <div className="bg-stone-900/50 border-b border-stone-800 px-3 sm:px-4 py-3 flex items-center gap-3 min-w-0 flex-shrink-0">
            {selectedCharacter ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-red-900 flex items-center justify-center text-red-100 font-medium flex-shrink-0">
                  {selectedCharacter.avatarUrl ? (
                    <img
                      src={selectedCharacter.avatarUrl}
                      alt={selectedCharacter.name || ''}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    selectedCharacter.name?.charAt(0) || '?'
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-stone-100 font-medium truncate">
                    {selectedCharacter.name}
                  </h1>
                  <p className="text-xs text-stone-500 truncate">
                    {isChatLocked
                      ? '🔒 Verhoor afgesloten'
                      : selectedCharacter.description || 'Verdachte'}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-stone-400 text-sm sm:text-base">Selecteer een verdachte</h1>
            )}
          </div>

          {/* Messages Area — plain div so scroll-to-bottom works reliably */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overscroll-contain p-4 min-h-0"
          >
            {!selectedCharacterId ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto p-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-stone-800 flex items-center justify-center">
                    <svg className="w-8 h-8 text-stone-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-serif text-stone-100">
                    Begin het onderzoek
                  </h2>
                  <p className="text-stone-500 text-sm">
                    {charactersLoading
                      ? 'Laden...'
                      : (characters ?? []).length === 0
                        ? 'Nog geen verdachten ontgrendeld. Voer een locatiecode in om een getuige vrij te spelen.'
                        : 'Selecteer een verdachte uit de lijst om het verhoor te beginnen. Stel vragen, zoek naar tegenstrijdigheden, en ontdek de waarheid.'}
                  </p>
                </div>
              </div>
            ) : localMessages.length === 0 && streamingText === null ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center space-y-4 max-w-md mx-auto p-8">
                  <p className="text-stone-500 text-sm">
                    Begin het gesprek met {selectedCharacter?.name}. Wat wil je vragen?
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 max-w-3xl mx-auto pb-2">
                {localMessages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    role={msg.role === 'User' ? 'user' : 'assistant'}
                    message={msg.message}
                    characterName={msg.role !== 'User' ? selectedCharacter?.name || undefined : undefined}
                    characterAvatar={msg.role !== 'User' ? selectedCharacter?.avatarUrl || undefined : undefined}
                  />
                ))}

                {/* Streaming assistant bubble */}
                {streamingText !== null && (
                  <ChatMessage
                    key="streaming"
                    role="assistant"
                    message={streamingText || '…'}
                    characterName={selectedCharacter?.name || undefined}
                    characterAvatar={selectedCharacter?.avatarUrl || undefined}
                    isStreaming
                  />
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area — always pinned at bottom */}
          <div className="border-t border-stone-800 bg-stone-900 flex-shrink-0">
            {isChatLocked ? (
              <div className="px-3 sm:px-4 py-3 max-w-3xl mx-auto">
                <p className="text-stone-500 text-sm text-center">
                  🔒 Dit verhoor is afgesloten — je hebt een nieuwe locatie ontdekt. Je kunt het gesprek nog wel teruglezen.
                </p>
              </div>
            ) : isConversationEnded ? (
              <div className="px-3 sm:px-4 py-3 max-w-3xl mx-auto">
                <p className="text-stone-500 text-sm text-center">
                  🚪 {selectedCharacter?.name ?? 'De verdachte'} heeft het gesprek beëindigd.
                </p>
              </div>
            ) : (
              <div className="p-3 sm:p-4">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      selectedCharacterId
                        ? `Vraag aan ${selectedCharacter?.name || 'verdachte'}...`
                        : 'Selecteer eerst een verdachte...'
                    }
                    disabled={!selectedCharacterId || isSubmitting}
                    className="flex-1 bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-red-800 focus:ring-red-800 text-base"
                  />
                  <Button
                    type="submit"
                    disabled={!selectedCharacterId || !message.trim() || isSubmitting}
                    className="bg-red-800 hover:bg-red-700 text-stone-100 px-3 sm:px-6 flex-shrink-0"
                  >
                    {isSubmitting ? (
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="min-h-screen bg-stone-950 flex items-center justify-center">
          <div className="animate-pulse text-stone-400 font-serif text-lg">Laden...</div>
        </div>
      }>
        <ChatContent />
      </Suspense>
    </AuthGuard>
  );
}
