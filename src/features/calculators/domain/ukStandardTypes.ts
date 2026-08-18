import type { Garment } from "./types.ts";

export type UkStandardGarmentColour = "WHITE" | "COLOURED";

export type UkStandardDecorationType =
  | "SCREEN_PRINT"
  | "EMBROIDERY"
  | "TRANSFER_DTF"
  | "DTG";

export type UkStandardPrintPosition =
  | "FRONT"
  | "BACK"
  | "LEFT_SLEEVE"
  | "RIGHT_SLEEVE"
  | "NECK";

export type UkStandardNeckOption = "STANDARD" | "TRANSFER";

export type UkStandardPrintSelection = {
  position: UkStandardPrintPosition;
  decorationType: UkStandardDecorationType;
  colourCount: string;
  neckOption?: UkStandardNeckOption;
};

export type UkStandardItemDraft = {
  id: string;
  itemLabel: string;
  garmentId: string | null;
  quantity: string;
  garmentColour: UkStandardGarmentColour;
  printPositions: UkStandardPrintSelection[];
  pkTax: string;
};

export type UkStandardReferenceData = {
  garments: Garment[];
};
