import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 pl-16 transition-all duration-300">
        <Header title={title} />
        <main className="p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
