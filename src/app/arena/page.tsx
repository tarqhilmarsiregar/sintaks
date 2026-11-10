'use client';

import React from 'react';

export default function ArenaPage() {
  return (
    <div className="w-full h-[calc(100vh-64px)] bg-[#090d16]">
      <iframe
        src="/arena.html"
        className="w-full h-full border-0"
        title="STMIK TIME — CP ARENA"
      />
    </div>
  );
}
