"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LiveCamera } from "./types";
import { CameraPanel } from "./CameraPanel";

const GlobeComp = dynamic(() => import("react-globe.gl"), { ssr: false });

type Props = {
  cameras: LiveCamera[];
  width?: number;
  height?: number;
};

export function GlobeLive({ cameras, width = 800, height = 600 }: Props) {
  const globeEl = useRef<any>(null);
  const [selectedCamera, setSelectedCamera] = useState<LiveCamera | null>(null);

  const pointsData = useMemo(() => {
    return cameras.map((cam) => ({
      lat: cam.lat,
      lng: cam.lng,
      size: 0.15,
      color: cam.category === "space" ? "#ff6b6b" : cam.category === "nature" ? "#51cf66" : "#4dabf7",
    }));
  }, [cameras]);

  const handlePointClick = useCallback((point: any) => {
    const camera = cameras.find(
      (c) => Math.abs(c.lat - point.lat) < 0.1 && Math.abs(c.lng - point.lng) < 0.1
    );
    if (camera) {
      setSelectedCamera(camera);
    }
  }, [cameras]);

  const handleGlobeReady = useCallback(() => {
    if (!globeEl.current) return;
    const controls = globeEl.current.controls();
    if (controls) {
      controls.enableZoom = true;
      controls.autoRotate = false;
    }
  }, []);

  return (
    <>
      <div className="relative w-full h-full" style={{ width, height }}>
        <GlobeComp
          ref={globeEl}
          onGlobeReady={handleGlobeReady}
          globeImageUrl="/textures/earth-night.jpg"
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius="size"
          pointAltitude={0.01}
          onPointClick={handlePointClick}
          width={width}
          height={height}
        />
      </div>
      <CameraPanel camera={selectedCamera} onClose={() => setSelectedCamera(null)} />
    </>
  );
}
