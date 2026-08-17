export type OfficialZooCamSource = {
  id: string;
  name: string;
  provider: string;
  officialPageUrl: string;
  embeddablePlayerUrl: string | null;
  iframeAllow?: string;
};

/**
 * Only an official, independently verified embeddable player URL may be set
 * here. The YouTube video ID is the current association published by the
 * official cam page and can be updated if that page changes its stream.
 */
export const MONTEREY_OPEN_SEA_CAM: OfficialZooCamSource = {
  id: "monterey-open-sea",
  name: "Open Sea Cam",
  provider: "Monterey Bay Aquarium",
  officialPageUrl: "https://www.montereybayaquarium.org/cams-videos/live-cams/open-sea-cam",
  embeddablePlayerUrl: "https://www.youtube.com/embed/n_GpVsz4nHU?autoplay=1&mute=1",
  iframeAllow: "autoplay; encrypted-media; fullscreen; picture-in-picture",
};

export const LIVE_ZOO_CAM_SOURCES = [MONTEREY_OPEN_SEA_CAM] as const;
