export type GaugeZoneRatios = {
  redEnd: number;
  orangeEnd: number;
  greenStart: number;
  targetRatio: number;
};

function clampRatio(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function gaugeZoneRatios(target: number, max: number): GaugeZoneRatios {
  const targetRatio = clampRatio(target / max);

  return {
    redEnd: 1 / 3,
    orangeEnd: 2 / 3,
    greenStart: 2 / 3,
    targetRatio,
  };
}
