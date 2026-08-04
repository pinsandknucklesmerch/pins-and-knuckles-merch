export type GaugeZoneRatios = {
  redEnd: number;
  amberEnd: number;
  greenStart: number;
};

function clampRatio(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function gaugeZoneRatios(target: number, max: number): GaugeZoneRatios {
  const targetRatio = clampRatio(target / max);

  return {
    redEnd: clampRatio((target * 0.8) / max),
    amberEnd: targetRatio,
    greenStart: targetRatio,
  };
}
