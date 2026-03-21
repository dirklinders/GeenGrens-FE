'use client';

import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  message: string;
  characterName?: string;
  characterAvatar?: string;
}

export function ChatMessage({ role, message, characterName, characterAvatar }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div 
        className={cn(
          'w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium',
          isUser 
            ? 'bg-stone-700 text-stone-300' 
            : 'bg-red-900 text-red-100'
        )}
      >
        {isUser ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : characterAvatar ? (
          <img src={characterAvatar} alt={characterName} className="w-full h-full rounded-full object-cover" />
        ) : (
          characterName?.charAt(0) || '?'
        )}
      </div>

      {/* Message bubble */}
      <div className={cn('flex-1 max-w-[80%]', isUser && 'text-right')}>
        {!isUser && characterName && (
          <span className="text-xs text-stone-500 mb-1 block">{characterName}</span>
        )}
        <div
          className={cn(
            'inline-block px-4 py-3 rounded-lg text-sm leading-relaxed',
            isUser
              ? 'bg-stone-700 text-stone-100 rounded-br-none'
              : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
          )}
        >
          {message}
        </div>
      </div>
    </div>
  );
}
