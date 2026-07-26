export type CategoryType = 
  | 'All'
  | 'Coral Reef' 
  | 'Deep Sea' 
  | 'Macro' 
  | 'Pelagic & Predators' 
  | 'Nudibranchs & Mollusks' 
  | 'Crustaceans';

export type DepthZone = 'All' | 'Sunlight' | 'Twilight' | 'Midnight';

export type ConservationStatus = 
  | 'Least Concern' 
  | 'Near Threatened' 
  | 'Vulnerable' 
  | 'Endangered' 
  | 'Critically Endangered' 
  | 'Data Deficient';

export interface CameraSettings {
  camera?: string;
  lens?: string;
  lighting?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
}

export interface UnderwaterCreature {
  id: string;
  title: string;
  scientificName: string;
  category: Exclude<CategoryType, 'All'>;
  imageUrl: string;
  depthRange: string;
  depthZone: Exclude<DepthZone, 'All'>;
  location: string;
  conservationStatus: ConservationStatus;
  description: string;
  habitat: string;
  diet: string;
  behaviorNotes?: string;
  cameraEquipment: CameraSettings;
  photographer: string;
  dateTaken: string;
  tags: string[];
  likes: number;
  featured?: boolean;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: CategoryType;
  depthZone: DepthZone;
  conservationStatus: string;
  sortBy: 'newest' | 'oldest' | 'likes' | 'name' | 'depth';
}

export type ActiveViewMode = 'visitor' | 'admin';
export type AdminTab = 'upload' | 'manage' | 'analytics';
