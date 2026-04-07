'use client';

import { useState } from 'react';
import { Numpad } from './numpad';
import { Button } from '@/components/ui/button';
import { gameApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface SecretMessageProps {
  onSuccess: (notebookLocation: string) => void;
}

export function SecretMessage({ onSuccess }: SecretMessageProps) {
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      const response = await gameApi.verifyPassword(password);
      
      if (response.success && response.notebookLocation) {
        onSuccess(response.notebookLocation);
      } else {
        setShake(true);
        setError('Fout wachtwoord');
        setTimeout(() => setShake(false), 500);
        setPassword('');
      }
    } catch {
      setShake(true);
      setError('Fout wachtwoord');
      setTimeout(() => setShake(false), 500);
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const companies = [
    { country: 'H', number: '2.067.339.224' },
    { country: 'N', number: '16043861' },
    { country: 'H', number: '63352842' },
    { country: 'N', number: '0476.604.253' },
    { country: 'H', number: '0429.713.166' },
    { country: 'N', number: '97941158' },
    { country: 'H', number: '0427.465.439' },
  ];

  return (
    <div className="space-y-12">
      {/* Secret mirrored message */}
      <div className="bg-stone-900/50 border border-stone-800 rounded-lg p-6 md:p-8">
        <div className="space-y-6">
          {/* The message - written backwards and mirrored for added difficulty */}
          <div 
            className="font-[family-name:var(--font-handwritten)] text-xl md:text-2xl text-amber-200/90 leading-relaxed text-center"
            style={{ 
              transform: 'scaleX(-1)',
              filter: 'blur(0.3px)',
            }}
          >
            <p>Ik heb iets ontdekt maar ik voel me niet veilig.</p>
            <p className="mt-2">De sukkels die achter me aan zitten zijn niet zo slim,</p>
            <p className="mt-2">vul daarom hieronder het wachtwoord in.</p>
          </div>
          
          {/* Small hint about mirror */}
          <p className="text-stone-600 text-xs text-center italic">
            (Tip: houd dit tegen een spiegel)
          </p>
        </div>
      </div>

      {/* Password entry */}
      <div className="flex flex-col items-center gap-4">
        <Numpad
          value={password}
          onChange={setPassword}
          onSubmit={handleSubmit}
          maxLength={6}
          disabled={isLoading}
          shake={shake}
        />
        
        {error && (
          <p className={cn(
            "text-red-500 font-medium animate-pulse",
            shake && "animate-shake"
          )}>
            {error}
          </p>
        )}
      </div>

      {/* Company numbers section */}
      <div className="bg-stone-900/30 border border-stone-800 rounded-lg p-6 md:p-8">
        <div className="space-y-4">
          <p className="font-[family-name:var(--font-handwritten)] text-lg text-stone-300">
            Er zijn bij elkaar opgeteld 7 mogelijke interessante bedrijven:
          </p>
          
          <ul className="space-y-2 font-mono text-stone-400">
            {companies.map((company, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-amber-600">{company.country}*</span>
                <span>:</span>
                <span className="text-stone-300">{company.number}</span>
              </li>
            ))}
          </ul>
          
          <p className="font-[family-name:var(--font-handwritten)] text-lg text-stone-300 mt-4">
            Ik tel op je!
          </p>
        </div>

        {/* Hint button */}
        <div className="mt-6 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHint(!showHint)}
            className="text-stone-500 hover:text-stone-300 text-xs"
          >
            {showHint ? 'Verberg hint' : 'Toon hint'}
          </Button>
        </div>
        
        {showHint && (
          <div className="mt-4 p-4 bg-stone-800/50 rounded border border-stone-700 text-center">
            <p className="text-stone-400 text-sm">
              Dit zijn KVK nummers (Kamer van Koophandel) uit Nederland en België.
            </p>
            <p className="text-stone-500 text-xs mt-2">
              H = Handelsregister (België) | N = Nederland
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
