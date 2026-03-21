import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'GeenGrens - Murder Mystery',
  description: 'Ontdek de waarheid achter de mysterieuze dood van Viktor Vermeer',
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
