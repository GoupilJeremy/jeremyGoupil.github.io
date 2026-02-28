export interface GeoLocation {
  name: string;
  lat: number;
  lng: number;
}

export type EventCategory =
  | "physics"
  | "chemistry"
  | "biology"
  | "engineering"
  | "mathematics"
  | "astronomy"
  | "medicine"
  | "computing"
  | "geology"
  | "general";

export type EraId =
  | "formation"
  | "origin-of-life"
  | "cambrian"
  | "dinosaurs"
  | "mammals"
  | "prehistory"
  | "antiquity"
  | "medieval"
  | "renaissance"
  | "enlightenment"
  | "industrial"
  | "modern"
  | "contemporary";

export interface HistoricalEvent {
  id: string;
  title: string;
  /** Year number. Negative for BCE. Use -4_500_000_000 for 4.5 Ga, etc. */
  year: number;
  endYear?: number;
  era: EraId;
  category: EventCategory;
  subcategory?: string;
  location: GeoLocation;
  protagonist?: string;
  summary: string;
  impact?: string;
  connections?: string[];
  importance: 1 | 2 | 3 | 4 | 5;
}

export interface Era {
  id: EraId;
  label: string;
  startYear: number;
  endYear: number;
  color: string;
}

export interface CategoryInfo {
  id: EventCategory;
  label: string;
  icon: string;
  color: string;
}
