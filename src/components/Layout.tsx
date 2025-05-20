import type { ReactNode } from 'react';
// import Header from './Header';
// import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <main className="w-full flex flex-col items-center">
        {children}
      </main>
    </div>
  );
};

export default Layout; 