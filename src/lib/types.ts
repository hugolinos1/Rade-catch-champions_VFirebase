
export type BonusPointThreshold = {
  threshold: number;
  points: number;
};

export type FishSpecies = {
  id: string;
  name: string;
  scientificName: string;
  pointsPerCm: number;
  minSize: number;
  maxSize?: number;
  description: string;
  imageUrl: string;
  habitat: string;
  diet: string;
  averageSize: string;
  keyFeatures: string;
  fishingTips: string;
  eligibilityCriteria: string;
  rarity?: 'Commun' | 'Rare' | 'Très rare';
  techniques?: string[];
  spots?: string[];
  bonusPoints?: BonusPointThreshold[];
};

export type Catch = {
  id: string;
  userId: string;
  userName: string;
  fishId: string;
  fishName: string;
  length: number;
  weight: number;
  photoUrl: string;
  timestamp: string;
  points: number;
  status: 'pending' | 'approved' | 'rejected';
};

export type Contest = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  rules: string;
};

export type UserProfile = {
  id: string;
  name: string;
  role: 'admin' | 'user';
  totalPoints: number;
  catchesCount: number;
  avatarUrl?: string;
};

export type InvitationCode = {
  code: string;
  isUsed: boolean;
  createdAt: string;
};
