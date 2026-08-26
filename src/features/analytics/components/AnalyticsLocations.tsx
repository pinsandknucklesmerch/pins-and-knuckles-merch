"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveGeoMap } from "@nivo/geo";
import { feature } from "topojson-client";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import worldTopologyJson from "world-atlas/countries-110m.json";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./AnalyticsLocations.module.css";

type LocationMetric = "sessions" | "activeUsers";
type GeographicCountry = Ga4WebsiteAnalyticsReport["geography"][number];
type WorldFeature = Feature<Geometry, { name?: string }>;
type LocationSelection = { countryKey: string | null; mapName: string };

const worldTopology = worldTopologyJson as unknown as Topology;
const worldFeatures = (feature(worldTopology, worldTopology.objects.countries) as FeatureCollection<Geometry, { name?: string }>).features as WorldFeature[];

function formatNumber(value: number) { return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value); }
function countryMapKey(value: string) { return value.normalize("NFKD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("en").replace(/[^a-z0-9]+/g, ""); }
function countryIdentity(country: GeographicCountry) { return country.countryId ?? country.country; }
function featureName(featureValue: unknown) {
  if (!featureValue || typeof featureValue !== "object") return "Unknown country";
  const properties = (featureValue as { properties?: unknown }).properties;
  const name = properties && typeof properties === "object" ? (properties as { name?: unknown }).name : null;
  return typeof name === "string" && name.trim() ? name.trim() : "Unknown country";
}

export function AnalyticsLocations({ countries }: { countries: Ga4WebsiteAnalyticsReport["geography"] }) {
  const [metric, setMetric] = useState<LocationMetric>("sessions");
  const [hoveredCountryKey, setHoveredCountryKey] = useState<string | null>(null);
  const [selection, setSelection] = useState<LocationSelection | null>(null);
  const sortedCountries = useMemo(() => [...countries].sort((left, right) => right.sessions - left.sessions), [countries]);
  const countriesByMapName = useMemo(() => new Map(countries.map((country) => [countryMapKey(country.country), country])), [countries]);
  const countriesByIdentity = useMemo(() => new Map(countries.map((country) => [countryIdentity(country), country])), [countries]);
  const maximum = Math.max(1, ...countries.map((country) => country[metric]));
  const totalSessions = countries.reduce((total, country) => total + country.sessions, 0);
  const selectedCountry = selection?.countryKey ? countriesByIdentity.get(selection.countryKey) ?? null : selection ? countriesByMapName.get(countryMapKey(selection.mapName)) ?? null : null;

  useEffect(() => { if (selection?.countryKey && !countriesByIdentity.has(selection.countryKey)) setSelection(null); }, [countriesByIdentity, selection]);

  const countryForFeature = (mapFeature: unknown) => countriesByMapName.get(countryMapKey(featureName(mapFeature))) ?? null;
  const selectFeature = (mapFeature: unknown) => { const mapName = featureName(mapFeature); const country = countryForFeature(mapFeature); setSelection({ mapName, countryKey: country ? countryIdentity(country) : null }); };
  const selectCountry = (country: GeographicCountry) => {
    const matchingFeature = worldFeatures.find((worldFeature) => countryForFeature(worldFeature) === country);
    setSelection({ countryKey: countryIdentity(country), mapName: matchingFeature ? featureName(matchingFeature) : country.country });
  };
  const GeoTooltip = ({ feature: mapFeature }: { feature: unknown }) => {
    const mapName = featureName(mapFeature);
    const country = countryForFeature(mapFeature);
    return <div className={styles.tooltip}><strong>{country?.country ?? mapName}</strong>{country ? <><span>Sessions <b>{formatNumber(country.sessions)}</b></span><span>Active users <b>{formatNumber(country.activeUsers)}</b></span><span>Share <b>{totalSessions ? `${((country.sessions / totalSessions) * 100).toFixed(0)}%` : "0%"}</b></span></> : <span>No reported traffic</span>}</div>;
  };

  return <Panel className={styles.panel}>
    <header className={styles.header}><h2>Locations</h2><div className={styles.metricTabs} role="tablist" aria-label="Map metric"><button type="button" role="tab" aria-selected={metric === "sessions"} className={metric === "sessions" ? styles.activeTab : undefined} onClick={() => setMetric("sessions")}>Sessions</button><button type="button" role="tab" aria-selected={metric === "activeUsers"} className={metric === "activeUsers" ? styles.activeTab : undefined} onClick={() => setMetric("activeUsers")}>Active users</button></div></header>
    {countries.length ? <div className={styles.content}>
      <div className={styles.mapFrame}><ResponsiveGeoMap features={worldFeatures} projectionType="equalEarth" projectionScale={112} projectionTranslation={[0.5, 0.52]} enableGraticule={false} borderWidth={(mapFeature) => { const country = countryForFeature(mapFeature); const highlighted = country ? (selectedCountry ? countryIdentity(country) === countryIdentity(selectedCountry) : false) || countryIdentity(country) === hoveredCountryKey : false; return highlighted ? 1.15 : 0.55; }} borderColor="hsl(var(--border))" fillColor={(mapFeature) => { const country = countryForFeature(mapFeature); if (!country) return "hsl(var(--muted))"; return `hsl(var(--primary) / ${0.28 + (country[metric] / maximum) * 0.72})`; }} isInteractive tooltip={GeoTooltip} onMouseEnter={(mapFeature) => { const country = countryForFeature(mapFeature); setHoveredCountryKey(country ? countryIdentity(country) : null); }} onMouseLeave={() => setHoveredCountryKey(null)} onClick={selectFeature} /></div>
      <div className={styles.sidePanel}>
        <ol className={styles.ranking} aria-label="Leading countries by sessions">{sortedCountries.slice(0, 5).map((country) => { const key = countryIdentity(country); const selected = selectedCountry ? countryIdentity(selectedCountry) === key : false; return <li key={key}><button type="button" aria-pressed={selected} className={selected ? styles.selectedCountry : undefined} onPointerEnter={() => setHoveredCountryKey(key)} onPointerLeave={() => setHoveredCountryKey(null)} onClick={() => selectCountry(country)}><span>{country.country}</span><small>{totalSessions ? `${((country.sessions / totalSessions) * 100).toFixed(0)}%` : "0%"}</small><strong>{formatNumber(country.sessions)}</strong></button></li>; })}</ol>
        {selection ? <section className={styles.selection} aria-live="polite"><div><span>{selectedCountry?.country ?? selection.mapName}</span><button type="button" onClick={() => setSelection(null)}>Clear</button></div>{selectedCountry ? <dl><div><dt>Sessions</dt><dd>{formatNumber(selectedCountry.sessions)}</dd></div><div><dt>Active users</dt><dd>{formatNumber(selectedCountry.activeUsers)}</dd></div><div><dt>Share</dt><dd>{totalSessions ? `${((selectedCountry.sessions / totalSessions) * 100).toFixed(0)}%` : "0%"}</dd></div></dl> : <p>No reported traffic for this period.</p>}</section> : null}
      </div>
    </div> : <EmptyState title="No location data" />}
  </Panel>;
}
