'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NumpadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  maxLength?: number;
  disabled?: boolean;
  shake?: boolean;
  backgroundLetters?: string[];
}

export function Numpad({
  value,
  onChange,
  onSubmit,
  maxLength = 6,
  disabled = false,
  shake = false,
  backgroundLetters,
}: NumpadProps) {
  const handleDigit = (digit: string) => {
    if (value.length < maxLength && !disabled) {
      onChange(value + digit);
    }
  };

  const handleBackspace = () => {
    if (!disabled) {
      onChange(value.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!disabled) {
      onChange('');
    }
  };

  const buttons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '<'],
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Display */}
      <div
        className={cn(
          "w-full max-w-xs h-14 bg-stone-800 border-2 border-stone-700 rounded-lg flex items-center justify-center font-mono text-xl px-3 gap-1 transition-all",
          shake && "animate-shake border-red-500"
        )}
      >
        {Array.from({ length: maxLength }, (_, i) => {
          const isFilled = i < value.length;
          const bgLetter = backgroundLetters?.[i];
          return (
            <span
              key={i}
              className="relative flex-1 flex items-center justify-center text-center"
            >
              {isFilled ? (
                <span className="text-stone-100 text-xl">*</span>
              ) : bgLetter ? (
                <span className="text-stone-500 text-xs font-sans select-none opacity-50 tracking-normal">
                  {bgLetter}
                </span>
              ) : (
                <span className="text-stone-600">•</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Numpad grid */}
      <div className="grid grid-cols-3 gap-2">
        {buttons.map((row, rowIndex) =>
          row.map((btn) => (
            <Button
              key={`${rowIndex}-${btn}`}
              variant="outline"
              size="lg"
              disabled={disabled}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '<') handleBackspace();
                else handleDigit(btn);
              }}
              className={cn(
                "w-16 h-16 text-xl font-mono bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700 hover:text-stone-50",
                btn === 'C' && "text-amber-500 hover:text-amber-400",
                btn === '<' && "text-stone-400 hover:text-stone-300"
              )}
            >
              {btn === '<' ? '⌫' : btn}
            </Button>
          ))
        )}
      </div>

      {/* Submit button */}
      <Button
        onClick={onSubmit}
        disabled={disabled || value.length === 0}
        className="w-full max-w-[240px] bg-amber-700 hover:bg-amber-600 text-stone-100 font-medium"
      >
        Bevestig
      </Button>
    </div>
  );
}
