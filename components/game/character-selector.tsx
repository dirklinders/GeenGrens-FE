'use client';

import { cn } from '@/lib/utils';
import type { CharacterDTO } from '@/lib/api';

interface CharacterSelectorProps {
  characters: CharacterDTO[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export function CharacterSelector({ characters, selectedId, onSelect }: CharacterSelectorProps) {
  if (characters.length === 0) {
    return (
      <div className="p-4 text-center text-stone-500 text-sm">
        Geen verdachten beschikbaar
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-wider text-stone-500 px-2 mb-3">
        Verdachten
      </h3>
      {characters.map((character) => (
        <button
          key={character.id}
          onClick={() => onSelect(character.id)}
          className={cn(
            'w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left',
            selectedId === character.id
              ? 'bg-red-900/30 border border-red-800'
              : 'bg-stone-800/50 border border-transparent hover:bg-stone-800 hover:border-stone-700'
          )}
        >
          {/* Avatar */}
          <div 
            className={cn(
              'w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-medium',
              selectedId === character.id
                ? 'bg-red-800 text-red-100'
                : 'bg-stone-700 text-stone-300'
            )}
          >
            {character.avatarUrl ? (
              <img 
                src={character.avatarUrl} 
                alt={character.name || 'Character'} 
                className="w-full h-full rounded-full object-cover" 
              />
            ) : (
              character.name?.charAt(0) || '?'
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className={cn(
              'font-medium text-sm truncate',
              selectedId === character.id ? 'text-stone-100' : 'text-stone-300'
            )}>
              {character.name || 'Onbekend'}
            </div>
            {character.description && (
              <div className="text-xs text-stone-500 truncate">
                {character.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
