export type GaugeZoneRatios = {
  neutralEnd: number;
  redEnd: number;
  orangeEnd: number;
  amberEnd: number;
  greenStart: number;
};

function clampRatio(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

export function gaugeZoneRatios(target: number, max: number): GaugeZoneRatios {
  const targetRatio = clampRatio(target / max);

  return {
    neutralEnd: clampRatio((target * 0.25) / max),
    redEnd: clampRatio((target * 0.5) / max),
    orangeEnd: clampRatio((target * 0.75) / max),
    amberEnd: targetRatio,
    greenStart: targetRatio,
  };
}
