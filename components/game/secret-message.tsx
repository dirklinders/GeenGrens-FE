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
    { country: 'H', number: '0731.383.463' },
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
            <p className="mt-2">Mijn onderzoek spant meerdere enclaves.</p>
            <p className="mt-2">Ik moet weten dat je slimmer bent dan mijn vijanden.</p>
            <p className="mt-2">Vul daarom hier het wachtwoord in.</p>
          </div>
        </div>
      </div>

      {/* Password entry */}
      <div className="flex flex-col items-center gap-4">
        <Numpad
          value={password}
          onChange={setPassword}
          onSubmit={handleSubmit}
          maxLength={8}
          disabled={isLoading}
          shake={shake}
          backgroundLetters={['H', 'N', 'H', 'H', 'N', 'H', 'N', 'H']}
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
            Uit mijn onderzoek kwamen 7 bedrijven naar voren. <br/>
            Hun locatie is belangrijker dan hun naam.
          </p>
          
          <ul className="space-y-2 font-mono text-stone-400">
            {companies.map((company, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-amber-600">{company.country}_</span>
                <span>:</span>
                {index === 0 ? (
                  <a
                    href="https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=0731.383.463"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-stone-300 underline underline-offset-2 decoration-stone-600 hover:text-amber-300 hover:decoration-amber-600 transition-colors"
                  >
                    {company.number}
                  </a>
                ) : (
                  <span className="text-stone-300">{company.number}</span>
                )}
              </li>
            ))}
          </ul>
          
          <p className="font-[family-name:var(--font-handwritten)] text-lg text-stone-300 mt-4">
            De letters zeggen niets zonder hun nummer. <br/>
          </p>
        </div>
        
      </div>
    </div>
  );
}