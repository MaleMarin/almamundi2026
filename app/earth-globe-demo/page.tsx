'use client';

import { EarthGlobeDemoScene } from '@/components/globe/EarthGlobeDemoScene';

export default function EarthGlobeDemoPage() {
  return (
    <main className="fixed inset-0 z-0 h-[100dvh] w-full min-h-0 bg-black [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full">
      <EarthGlobeDemoScene />
    </main>
  );
}
