import React, { ReactNode } from 'react';
import Header from './Header';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div dir="rtl" className="min-h-screen bg-sky-50">
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
}