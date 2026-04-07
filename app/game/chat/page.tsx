'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { AuthGuard } from '@/components/game/auth-guard';
import { ChatMessage } from '@/components/game/chat-message';
import { CharacterSelector } from '@/components/game/character-selector';
import { GameHeader } from '@/components/game/game-header';
import { characterApi, chatFeApi, type CharacterDTO, type ChatDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

// Moved outside to prevent recreation on each render
function SidebarContent({
  characters,
  charactersLoading,
  selectedCharacterId,
  onSelectCharacter,
}: {
  characters: CharacterDTO[];
  charactersLoading: boolean;
  selectedCharacterId: number | null;
  onSelectCharacter: (id: number) => void;
}) {
  return (
    <div className="h-full flex flex-col bg-stone-900">
      <div className="p-4 border-b border-stone-800">
        <h2 className="font-serif text-xl text-stone-100">Verdachten</h2>
        <p className="text-xs text-stone-500 mt-1">Selecteer iemand om te ondervragen</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
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
            onSelect={onSelectCharacter}
          />
        )}
      </ScrollArea>
    </div>
  );
}

function ChatContent() {
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatDTO[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Fetch characters
  const { data: characters, isLoading: charactersLoading } = useSWR<CharacterDTO[]>(
    'characters',
    () => characterApi.getAll(),
    { revalidateOnFocus: false }
  );

  // Fetch chat history for selected character
  const { data: chatHistory, mutate: mutateChatHistory } = useSWR<ChatDTO[]>(
    selectedCharacterId ? `chats-${selectedCharacterId}` : null,
    () => selectedCharacterId ? chatFeApi.getChats(selectedCharacterId) : Promise.resolve([]),
    { revalidateOnFocus: false }
  );

  // Safe references - avoid creating new arrays on every render
  const charactersList = characters || [];
  const selectedCharacter = charactersList.find(c => c.id === selectedCharacterId);

  // Sync chat history to local state only when chatHistory reference changes and has data
  const chatHistoryRef = useRef<ChatDTO[] | undefined>();
  useEffect(() => {
    if (chatHistory && chatHistory !== chatHistoryRef.current && chatHistory.length > 0) {
      chatHistoryRef.current = chatHistory;
      setLocalMessages(chatHistory);
    }
  }, [chatHistory]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  // Handle character selection
  const handleSelectCharacter = (id: number) => {
    setSelectedCharacterId(id);
    setLocalMessages([]);
    setSidebarOpen(false);
  };

  // Handle sending a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedCharacterId || isSubmitting) return;

    const userMessage = message.trim();
    setMessage('');
    setIsSubmitting(true);

    // Add user message to local state immediately
    const tempUserMessage: ChatDTO = {
      id: Date.now(),
      role: 'user',
      message: userMessage,
      characterId: selectedCharacterId,
    };
    setLocalMessages(prev => [...prev, tempUserMessage]);

    try {
      // Send message and get response
      const response = await chatFeApi.chat(selectedCharacterId, userMessage);
      
      // Add assistant response
      const assistantMessage: ChatDTO = {
        id: Date.now() + 1,
        role: 'assistant',
        message: response.response || 'Geen antwoord ontvangen.',
        characterId: selectedCharacterId,
      };
      setLocalMessages(prev => [...prev, assistantMessage]);
      
      // Refresh chat history from server
      mutateChatHistory();
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message
      const errorMessage: ChatDTO = {
        id: Date.now() + 1,
        role: 'assistant',
        message: 'Er is een fout opgetreden. Probeer het later opnieuw.',
        characterId: selectedCharacterId,
      };
      setLocalMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mobileMenuContent = (
    <SidebarContent
      characters={charactersList}
      charactersLoading={charactersLoading}
      selectedCharacterId={selectedCharacterId}
      onSelectCharacter={handleSelectCharacter}
    />
  );

  return (
    <div className="h-screen bg-stone-950 flex flex-col">
      {/* Consistent Header with hamburger menu */}
      <GameHeader 
        showMobileMenu 
        mobileMenuContent={mobileMenuContent}
        mobileMenuOpen={sidebarOpen}
        onMobileMenuChange={setSidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-72 border-r border-stone-800 flex-shrink-0">
          <SidebarContent
            characters={charactersList}
            charactersLoading={charactersLoading}
            selectedCharacterId={selectedCharacterId}
            onSelectCharacter={handleSelectCharacter}
          />
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Selected character info bar */}
          <div className="bg-stone-900/50 border-b border-stone-800 p-4 flex items-center gap-4">
            {selectedCharacter ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-900 flex items-center justify-center text-red-100 font-medium">
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
                <div>
                  <h1 className="text-stone-100 font-medium">
                    {selectedCharacter.name}
                  </h1>
                  <p className="text-xs text-stone-500">
                    {selectedCharacter.description || 'Verdachte'}
                  </p>
                </div>
              </div>
            ) : (
              <h1 className="text-stone-400">Selecteer een verdachte</h1>
            )}
          </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
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
                  Selecteer een verdachte uit de lijst om het verhoor te beginnen. 
                  Stel vragen, zoek naar tegenstrijdigheden, en ontdek de waarheid.
                </p>
              </div>
            </div>
          ) : localMessages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md mx-auto p-8">
                <p className="text-stone-500 text-sm">
                  Begin het gesprek met {selectedCharacter?.name}. 
                  Wat wil je vragen?
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {localMessages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  role={msg.role === 'user' ? 'user' : 'assistant'}
                  message={msg.message || ''}
                  characterName={msg.role !== 'user' ? selectedCharacter?.name || undefined : undefined}
                  characterAvatar={msg.role !== 'user' ? selectedCharacter?.avatarUrl || undefined : undefined}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="border-t border-stone-800 p-4 bg-stone-900">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                selectedCharacterId 
                  ? `Stel een vraag aan ${selectedCharacter?.name || 'de verdachte'}...` 
                  : 'Selecteer eerst een verdachte...'
              }
              disabled={!selectedCharacterId || isSubmitting}
              className="flex-1 bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-red-800 focus:ring-red-800"
            />
            <Button 
              type="submit" 
              disabled={!selectedCharacterId || !message.trim() || isSubmitting}
              className="bg-red-800 hover:bg-red-700 text-stone-100 px-6"
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
        </main>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  );
}
