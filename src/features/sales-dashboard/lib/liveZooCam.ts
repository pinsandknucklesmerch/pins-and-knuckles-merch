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
 * here. The Smithsonian page itself returns X-Frame-Options: SAMEORIGIN.
 */
export const SMITHSONIAN_PANDA_CAM: OfficialZooCamSource = {
  id: "smithsonian-panda",
  name: "Giant Panda Cam",
  provider: "Smithsonian’s National Zoo",
  officialPageUrl: "https://nationalzoo.si.edu/webcams/panda-cam",
  embeddablePlayerUrl: null,
};

export const LIVE_ZOO_CAM_SOURCES = [SMITHSONIAN_PANDA_CAM] as const;
