import React from 'react';
import { ShortsStudio } from './components/studio/ShortsStudio';

export const App: React.FC = () => {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#1c150d] text-white overflow-hidden select-none">
      <ShortsStudio />
    </div>
  );
};
