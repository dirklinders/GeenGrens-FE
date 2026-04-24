'use client';

import { useState, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { characterApi, chatFeApi, type CharacterDTO, type AdminMessageDTO } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

// ────────────────────────────────────────────────────────────
// Character form
// ────────────────────────────────────────────────────────────

type CharacterFormData = Omit<CharacterDTO, 'id'> & { id?: number };

function CharacterForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: CharacterDTO;
  onSave: (data: CharacterFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [systemPrompt, setSystemPrompt] = useState(initial?.systemPrompt ?? '');
  const [avatarUrl, setAvatarUrl] = useState(initial?.avatarUrl ?? '');
  const [personality, setPersonality] = useState(initial?.personality ?? '');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'prompt'>('basic');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        id: initial?.id,
        name,
        description: description || null,
        systemPrompt,
        avatarUrl,
        personality: personality || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-stone-800 p-1 rounded w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('basic')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === 'basic' ? 'bg-stone-700 text-stone-100' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Basisinfo
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('prompt')}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === 'prompt' ? 'bg-stone-700 text-stone-100' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          Systeemprompt
        </button>
      </div>

      {activeTab === 'basic' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Naam *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="bijv. Burgemeester Van Dijk"
              required
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Beschrijving</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="bijv. Betrokken bij de grondtransactie 20 jaar geleden"
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Persoonlijkheid</Label>
            <Input
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="bijv. Nerveus, defensief, vermijdt oogcontact"
              className="bg-stone-800 border-stone-700 text-stone-100"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-stone-300 text-sm">Avatar URL</Label>
            <div className="flex gap-3 items-start">
              <Input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="bg-stone-800 border-stone-700 text-stone-100 flex-1"
              />
              {avatarUrl && (
                <img
                  src={avatarUrl}
                  alt="preview"
                  className="w-10 h-10 rounded-full object-cover border border-stone-700 shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prompt' && (
        <div className="space-y-2">
          <Label className="text-stone-300 text-sm">
            Systeemprompt *
            <span className="text-stone-500 font-normal ml-2">
              — definieert hoe dit personage antwoorden geeft aan spelers
            </span>
          </Label>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={`Je bent [naam], een personage in een murder mystery spel in Baarle-Nassau.\n\nJe bent [beschrijving]. Je praat [stijl].\n\nJe weet het volgende over de zaak:\n- ...\n\nJe verbergt het volgende:\n- ...\n\nAntwoord altijd in het Nederlands. Blijf in karakter.`}
            required
            className="bg-stone-800 border-stone-700 text-stone-100 font-mono text-sm min-h-72 resize-y"
          />
          <p className="text-stone-600 text-xs">
            {systemPrompt.length} tekens · De prompt wordt meegestuurd bij elk bericht naar de AI.
          </p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={saving || !name || !systemPrompt}
          className="bg-red-800 hover:bg-red-700 text-stone-100"
        >
          {saving ? 'Opslaan...' : initial ? 'Bijwerken' : 'Aanmaken'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          Annuleren
        </Button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────────────────
// Admin test chat panel
// ────────────────────────────────────────────────────────────

interface TestMessage {
  role: 'User' | 'Assistant' | 'System';
  content: string;
  streaming?: boolean;
}

function AdminTestChat({ character }: { character: CharacterDTO }) {
  const [history, setHistory] = useState<TestMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const [isEnded, setIsEnded] = useState(false);

  const resetChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setHistory([]);
    setInput('');
    setIsStreaming(false);
    setIsEnded(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || isStreaming) return;

    setInput('');
    setIsStreaming(true);

    // Snapshot history for request (before adding user msg to state)
    const historyForRequest: AdminMessageDTO[] = history.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Optimistically add user message
    setHistory(prev => [...prev, { role: 'User', content: question }]);

    // Add placeholder streaming message
    setHistory(prev => [...prev, { role: 'Assistant', content: '', streaming: true }]);
    scrollToBottom();

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await chatFeApi.streamAdminTest(
        character.id,
        question,
        historyForRequest,
        (chunk) => {
          setHistory(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.streaming) {
              updated[updated.length - 1] = { ...last, content: last.content + chunk };
            }
            return updated;
          });
          scrollToBottom();
        },
        controller.signal,
        () => {
          // Tool call fired — mark conversation as ended and add a system notice
          setIsEnded(true);
          setHistory(prev => [
            ...prev,
            { role: 'System', content: '🚪 beeindig_gesprek aangeroepen — personage heeft het gesprek beëindigd.' },
          ]);
          scrollToBottom();
        }
      );

      // Mark streaming done
      setHistory(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.streaming) {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        // cancelled — leave partial message
        setHistory(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { ...last, streaming: false };
          }
          return updated;
        });
      } else {
        setHistory(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last?.streaming) {
            updated[updated.length - 1] = { role: 'Assistant', content: 'Fout opgetreden.', streaming: false };
          }
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="mt-4 border-t border-stone-700 pt-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-stone-400 text-xs font-medium uppercase tracking-wide">
          Test gesprek (tijdelijk, niet opgeslagen)
        </p>
        <button
          onClick={resetChat}
          className="text-stone-500 hover:text-stone-300 text-xs transition-colors"
        >
          Nieuw gesprek
        </button>
      </div>

      {/* Message list */}
      <div className="bg-stone-950 rounded border border-stone-800 p-3 h-64 overflow-y-auto space-y-3 text-sm">
        {history.length === 0 && (
          <p className="text-stone-600 text-center pt-4 text-xs">
            Stel een testvraag om het personage te testen met de huidige systeemprompt.
          </p>
        )}
        {history.map((msg, i) => (
          msg.role === 'System' ? (
            <div key={i} className="text-center">
              <span className="text-amber-600 text-xs bg-amber-950 border border-amber-800 px-2 py-1 rounded">
                {msg.content}
              </span>
            </div>
          ) : (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'User' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-relaxed ${
                  msg.role === 'User'
                    ? 'bg-stone-700 text-stone-100 rounded-br-none'
                    : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
                }`}
              >
                {msg.content || <span className="text-stone-500 animate-pulse">…</span>}
                {msg.streaming && (
                  <span className="inline-block w-1 h-3 bg-stone-400 ml-0.5 align-middle animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          )
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isEnded ? 'Gesprek beëindigd — klik "Nieuw gesprek" om opnieuw te beginnen' : `Stel een vraag aan ${character.name}...`}
          disabled={isStreaming || isEnded}
          className="flex-1 bg-stone-800 border-stone-700 text-stone-100 text-sm h-8"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isStreaming}
          className="bg-stone-700 hover:bg-stone-600 text-stone-100 text-xs h-8 px-3"
        >
          {isStreaming ? (
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : 'Sturen'}
        </Button>
      </form>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Character card (collapsed view)
// ────────────────────────────────────────────────────────────

function CharacterCard({
  character,
  onEdit,
  onDelete,
}: {
  character: CharacterDTO;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTestChat, setShowTestChat] = useState(false);

  return (
    <Card className="bg-stone-900 border-stone-800">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-red-900 flex items-center justify-center text-red-100 font-medium text-lg shrink-0 overflow-hidden border border-stone-700">
            {character.avatarUrl ? (
              <img
                src={character.avatarUrl}
                alt={character.name ?? ''}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              character.name?.charAt(0) ?? '?'
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-stone-100 font-medium">{character.name}</h3>
                {character.description && (
                  <p className="text-stone-500 text-sm mt-0.5">{character.description}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {character.personality && (
                    <span className="bg-stone-800 text-stone-400 text-xs px-2 py-0.5 rounded italic">
                      {character.personality}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 shrink-0">
                <button
                  onClick={() => setShowPrompt(!showPrompt)}
                  className="text-stone-500 hover:text-stone-300 text-xs transition-colors"
                >
                  {showPrompt ? 'Prompt verbergen' : 'Prompt bekijken'}
                </button>
                <button
                  onClick={() => setShowTestChat(!showTestChat)}
                  className="text-stone-400 hover:text-stone-200 text-xs transition-colors"
                >
                  {showTestChat ? 'Test sluiten' : 'Testen'}
                </button>
                <button
                  onClick={onEdit}
                  className="text-stone-400 hover:text-stone-100 text-sm transition-colors"
                >
                  Bewerken
                </button>
                <button
                  onClick={onDelete}
                  className="text-red-700 hover:text-red-400 text-sm transition-colors"
                >
                  Verwijderen
                </button>
              </div>
            </div>

            {/* System prompt preview */}
            {showPrompt && (
              <div className="mt-3 bg-stone-800 rounded p-3 border border-stone-700">
                <p className="text-stone-400 text-xs font-medium uppercase tracking-wide mb-2">Systeemprompt</p>
                <pre className="text-stone-300 text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {character.systemPrompt || <span className="text-stone-600 italic">Geen prompt ingesteld</span>}
                </pre>
                <p className="text-stone-600 text-xs mt-2">
                  {(character.systemPrompt ?? '').length} tekens
                </p>
              </div>
            )}

            {/* Admin test chat */}
            {showTestChat && <AdminTestChat character={character} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────
// Main page
// ────────────────────────────────────────────────────────────

export default function CharactersPage() {
  const { data: characters, mutate } = useSWR('admin-characters', characterApi.getAll, { revalidateOnFocus: false });

  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleCreate = async (data: CharacterFormData) => {
    try {
      await characterApi.create(data as Omit<CharacterDTO, 'id'>);
      mutate();
      setCreating(false);
    } catch {
      setError('Aanmaken mislukt.');
    }
  };

  const handleUpdate = async (data: CharacterFormData) => {
    try {
      await characterApi.update(data as CharacterDTO);
      mutate();
      setEditingId(null);
    } catch {
      setError('Bijwerken mislukt.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Verdachte verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
    try {
      await characterApi.delete(id);
      mutate();
    } catch {
      setError('Verwijderen mislukt.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-stone-100">Verdachten</h1>
          <p className="text-stone-500 text-sm mt-1">
            Beheer de personages die spelers kunnen ondervragen
          </p>
        </div>
        <Button
          onClick={() => { setCreating(true); setEditingId(null); }}
          className="bg-red-800 hover:bg-red-700 text-stone-100"
        >
          + Nieuw personage
        </Button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 text-red-400 px-4 py-2 rounded text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-600 hover:text-red-400">✕</button>
        </div>
      )}

      {/* Create form */}
      {creating && (
        <Card className="bg-stone-900 border-stone-800">
          <CardHeader>
            <CardTitle className="text-stone-100 text-lg">Nieuw personage aanmaken</CardTitle>
          </CardHeader>
          <CardContent>
            <CharacterForm
              onSave={handleCreate}
              onCancel={() => setCreating(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Character list */}
      <div className="space-y-3">
        {(characters ?? []).map((character) =>
          editingId === character.id ? (
            <Card key={character.id} className="bg-stone-900 border-stone-800">
              <CardHeader>
                <CardTitle className="text-stone-100 text-lg">
                  {character.name} bewerken
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CharacterForm
                  initial={character}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              </CardContent>
            </Card>
          ) : (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={() => { setEditingId(character.id); setCreating(false); }}
              onDelete={() => handleDelete(character.id)}
            />
          )
        )}

        {characters?.length === 0 && !creating && (
          <p className="text-stone-500 text-center py-12">
            Nog geen personages aangemaakt. Klik op &quot;Nieuw personage&quot; om te beginnen.
          </p>
        )}
      </div>
    </div>
  );
}
