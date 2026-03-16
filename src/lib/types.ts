
export type BonusPointThreshold = {
  threshold: number;
  points: number;
  minSize?: number; // Pour la compatibilité avec Firestore pointsSystem
};

export type FishSpecies = {
  id: string;
  name: string;
  scientificName: string;
  pointsPerCm: number;
  minSize: number;
  legalSize?: number; // Pour la compatibilité Firestore
  maxSize?: number;
  description: string;
  imageUrl: string;
  image?: string; // Pour la compatibilité Firestore
  habitat: string;
  diet: string;
  averageSize: string;
  keyFeatures: string;
  fishingTips: string;
  eligibilityCriteria: string;
  rarity?: string;
  techniques?: string[];
  spots?: string[];
  bonusPoints?: BonusPointThreshold[];
  pointsSystem?: BonusPointThreshold[]; // Pour la compatibilité Firestore
};

export type Catch = {
  id: string;
  anglerId: string;
  anglerName: string;
  competitionId: string;
  fishId: string;
  fishName: string;
  size: number;
  weight?: number;
  imageUrl: string;
  date: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
};

export type Contest = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'draft' | 'completed';
  createdAt: string;
  rules?: string;
};

export type UserProfile = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  totalPoints: number;
  catchesCount: number;
  avatarUrl?: string;
  email?: string;
};

export type InvitationCode = {
  id: string;
  code: string;
  isUsed: boolean;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
};
