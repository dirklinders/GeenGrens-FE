import type { Metadata } from 'next';
import { GameLayoutClient } from '@/components/game/game-layout-client';

export const metadata: Metadata = {
  title: 'GeenGrens - Murder Mystery',
  description: 'Ontdek de waarheid achter de mysterieuze dood van Viktor Vermeer',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GameLayoutClient>{children}</GameLayoutClient>;
}
