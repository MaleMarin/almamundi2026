'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import type {
  GlobeV2CameraPreset,
  GlobeV2LayerBuildStage,
  GlobeV2OceanSunDebug,
  GlobeV2VisualStage,
} from '@/components/globe/GlobeV2';
import type { GlobeBitMarker } from '@/components/globe/GlobeBitsLayer';
import { BITS_DATA } from '@/lib/bits-data';
import { GLOBE_V2_CAMERA_PRESETS } from '@/lib/globe/globe-v2-assets';

const GlobeV2 = dynamic(() => import('@/components/globe/GlobeV2').then((m) => m.default), {
  ssr: false,
  loading: () => (
    <div className="flex flex-1 items-center justify-center bg-black text-sm text-white/50">Cargando globo…</div>
  ),
});

const BITS_FOR_VALIDATION: GlobeBitMarker[] = BITS_DATA.map((b) => ({
  id: b.id,
  lat: b.lat,
  lon: b.lon,
}));

const STAGES: { id: GlobeV2VisualStage; label: string; hint: string }[] = [
  {
    id: 'surface',
    label: 'A · Superficie',
    hint: 'Océano + tierra (capas separadas) + nubes. Sin atmósfera, sin luces urbanas, sin bits.',
  },
  {
    id: 'nightLights',
    label: 'B · Luces',
    hint: 'A + GlobeCityLightsOverlay. Sin atmósfera ni bits.',
  },
  {
    id: 'full',
    label: 'C · Completo',
    hint: 'B + GlobeAtmosphereGlow + marcadores (GlobeBitStarBurst / Selected).',
  },
];

/**
 * Tres modos para validar oclusión océano/tierra (prioridad antes de relieve/realismo).
 */
const OCCLUSION_MODES: {
  id: GlobeV2LayerBuildStage;
  title: string;
  detail: string;
}[] = [
  {
    id: 'ocean',
    title: 'Solo océano',
    detail: 'Únicamente OceanSphere (mar). Comprobar agua sin manchas de foco.',
  },
  {
    id: 'land',
    title: 'Solo tierra',
    detail: 'Únicamente LandSphere sobre fondo negro. Máscara y descarte.',
  },
  {
    id: 'ocean_land',
    title: 'Océano + tierra',
    detail: 'Ambas capas: oclusión real, costas, archipiélagos.',
  },
];

const EXTRA_LAYERS: { id: GlobeV2LayerBuildStage; label: string }[] = [
  { id: 'ocean_land_clouds', label: '+ Nubes' },
  { id: 'ocean_land_clouds_atmosphere', label: '+ Atmósfera' },
  { id: 'full', label: 'Pipeline completo' },
];

/** Regiones con costas finas / archipiélagos (validación oclusión). */
const COAST_PRESET_ORDER: GlobeV2CameraPreset[] = ['caribbeanNorthSA', 'indonesia', 'japan'];

const OTHER_PRESET_ORDER: GlobeV2CameraPreset[] = [
  'pacificAmericas',
  'australiaSeAsia',
  'indiaCentralAsia',
  'africaEurope',
];

const OCEAN_SUN: { id: GlobeV2OceanSunDebug; label: string }[] = [
  { id: 'utc', label: 'Sol · UTC' },
  { id: 'front', label: 'Sol · frontal (+X)' },
  { id: 'side', label: 'Sol · lateral (+Y)' },
];

export default function GloboValidacionPage() {
  const [stage, setStage] = useState<GlobeV2VisualStage>('surface');
  const [layerBuildStage, setLayerBuildStage] = useState<GlobeV2LayerBuildStage>('ocean_land');
  const [oceanSunDebug, setOceanSunDebug] = useState<GlobeV2OceanSunDebug>('utc');
  const [fixedPreset, setFixedPreset] = useState<GlobeV2CameraPreset | null>(null);

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-black text-white">
      <header className="z-20 max-h-[min(58vh,520px)] shrink-0 overflow-y-auto border-b border-white/10 bg-zinc-950/95 px-3 py-2 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-sm font-semibold tracking-wide text-white/95">Validación visual del globo</h1>
              <p className="text-xs text-white/50">
                Pipeline visual · {STAGES.find((s) => s.id === stage)?.hint}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStage(s.id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    stage === s.id
                      ? 'border-orange-500 bg-white/10 text-white'
                      : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/30 px-3 py-2.5">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-200/95">
              1 · Oclusión océano / tierra (prioridad)
            </p>
            <p className="mb-2 text-[11px] leading-relaxed text-white/65">
              Objetivo: no ver mar bajo continente; sin halo azul en costa; sin z-fighting; sin bordes rotos por
              discard. Si la costa sigue dura, afinar solo{' '}
              <code className="rounded bg-black/50 px-1 text-emerald-100/90">GLOBE_V2_LAND_MASK_DILATE_UV</code> y{' '}
              <code className="rounded bg-black/50 px-1 text-emerald-100/90">GLOBE_V2_LAND_MASK_SPEC_DISCARD</code> en{' '}
              <code className="rounded bg-black/50 px-1">globe-v2-assets.ts</code> — sin tocar relieve ni night lights
              hasta que esto quede limpio.
            </p>
            <ul className="mb-3 list-inside list-disc space-y-0.5 text-[11px] text-white/55">
              <li>Modo solo mar / solo tierra / ambos para aislar fallos.</li>
              <li>Usa vistas &quot;Costas difíciles&quot; (Caribe, Indonesia, Japón).</li>
            </ul>
            <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-white/40">
              Los tres modos
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {OCCLUSION_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setLayerBuildStage(m.id)}
                  className={`flex flex-1 flex-col rounded-lg border px-3 py-2 text-left transition-colors sm:min-w-[min(100%,200px)] ${
                    layerBuildStage === m.id
                      ? 'border-emerald-400 bg-emerald-900/40 text-white'
                      : 'border-white/15 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="text-xs font-semibold">{m.title}</span>
                  <span className="mt-0.5 text-[10px] leading-snug text-white/55">{m.detail}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
              2 · Más capas (después de oclusión)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXTRA_LAYERS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayerBuildStage(l.id)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    layerBuildStage === l.id
                      ? 'border-sky-500 bg-white/10 text-white'
                      : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {layerBuildStage === 'ocean' ? (
            <div>
              <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
                Océano · dirección de luz (shader, solo QA)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {OCEAN_SUN.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setOceanSunDebug(o.id)}
                    className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      oceanSunDebug === o.id
                        ? 'border-amber-500/90 bg-white/10 text-white'
                        : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] leading-relaxed text-white/60">
            <p className="mb-1 font-medium text-white/75">Lectura del error en consola (WebGL)</p>
            <ul className="list-inside list-disc space-y-0.5">
              <li>
                Falla en oclusión →{' '}
                <code className="rounded bg-black/40 px-1 text-emerald-200/90">GlobeOceanSphere</code> /{' '}
                <code className="rounded bg-black/40 px-1 text-emerald-200/90">GlobeLandSphere</code> (
                <code className="rounded bg-black/40 px-1">globeOceanLandMaterials.ts</code>)
              </li>
              <li>
                Luces OK y falla overlay →{' '}
                <code className="rounded bg-black/40 px-1 text-emerald-200/90">GlobeCityLightsOverlay</code>
              </li>
              <li>
                Todo OK y falla marcadores →{' '}
                <code className="rounded bg-black/40 px-1 text-emerald-200/90">GlobeBitStarBurst</code> /{' '}
                <code className="rounded bg-black/40 px-1">GlobeAtmosphereGlow</code>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
              Vistas fijas · costas difíciles (archipiélagos, bordes finos)
            </p>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFixedPreset(null)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  fixedPreset === null
                    ? 'border-emerald-500/80 bg-white/10 text-white'
                    : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                }`}
              >
                Libre · órbita
              </button>
              {COAST_PRESET_ORDER.map((key) => {
                const m = GLOBE_V2_CAMERA_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFixedPreset(key)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      fixedPreset === key
                        ? 'border-emerald-500/80 bg-white/10 text-white'
                        : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {m.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-white/40">
              Otras regiones
            </p>
            <div className="flex flex-wrap gap-1.5">
              {OTHER_PRESET_ORDER.map((key) => {
                const m = GLOBE_V2_CAMERA_PRESETS[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFixedPreset(key)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                      fixedPreset === key
                        ? 'border-emerald-500/80 bg-white/10 text-white'
                        : 'border-white/15 bg-white/5 text-white/75 hover:bg-white/10'
                    }`}
                  >
                    {m.title}
                  </button>
                );
              })}
            </div>
          </div>

          {fixedPreset != null ? (
            <div className="text-[11px] leading-relaxed text-white/55">
              <p className="mb-1 font-medium text-white/70">{GLOBE_V2_CAMERA_PRESETS[fixedPreset].title}</p>
              <p className="mb-2 rounded-md border border-emerald-500/45 bg-emerald-950/50 px-2.5 py-1.5 text-[11px] font-semibold tracking-wide text-emerald-100/95">
                {GLOBE_V2_CAMERA_PRESETS[fixedPreset].validationLegend}
              </p>
              <ul className="list-inside list-disc space-y-0.5">
                {GLOBE_V2_CAMERA_PRESETS[fixedPreset].validates.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-[11px] text-white/45">
              Elegí Caribe, Indonesia o Japón para repetir el mismo encuadre y revisar costas. En &quot;Libre&quot; sigue la
              rotación automática.
            </p>
          )}
        </div>
      </header>
      <div className="relative min-h-0 flex-1">
        <GlobeV2
          className="absolute inset-0 z-0 h-full w-full min-h-0 bg-black [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:touch-none"
          visualStage={stage}
          layerBuildStage={layerBuildStage}
          oceanSunDebug={oceanSunDebug}
          bits={BITS_FOR_VALIDATION}
          fixedCameraPreset={fixedPreset}
        />
      </div>
    </div>
  );
}
