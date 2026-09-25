export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  coupleId?: string;
  partnerName?: string;
  createdAt: string;
}

export interface Couple {
  id: string;
  code: string; // e.g. "NOSSO-892"
  partner1Id: string;
  partner1Name: string;
  partner2Id?: string;
  partner2Name?: string;
  spaceName?: string;
  anniversaryDate?: string;
  createdAt: string;
}

export type EventCategory = 'show' | 'teatro' | 'festival' | 'viagem' | 'comemoracao' | 'outro';

export interface EventItem {
  id: string;
  coupleId: string;
  title: string;
  category: EventCategory;
  location: string;
  dateTime: string; // ISO string
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export type MediaType = 'movie' | 'series' | 'book' | 'place_wish' | 'place_visited' | 'custom' | string;
export type MediaStatus = 'to_watch' | 'watched' | 'to_read' | 'read' | 'to_visit' | 'visited' | 'pending' | 'completed' | string;
export type PriorityLevel = 'high' | 'medium' | 'low';

export interface CustomListTheme {
  id: string;
  coupleId: string;
  name: string;
  pendingLabel?: string;
  completedLabel?: string;
  createdAt: string;
}

export interface UserRating {
  userId: string;
  userName: string;
  score: number; // 1 to 5
  comment?: string;
  updatedAt: string;
}

export interface MediaItem {
  id: string;
  coupleId: string;
  type: MediaType;
  status: MediaStatus;
  title: string;
  customThemeId?: string;
  customThemeName?: string;
  priority?: PriorityLevel;
  location?: string;
  authorOrDirector?: string;
  category?: string;
  ratings?: Record<string, UserRating>; // key: userId
  averageScore?: number;
  createdBy: string;
  createdAt: string;
}

export type QuestionCategory = 'Filosofia' | 'Romance' | 'Criatividade' | string;

export interface QuestionItem {
  id: string;
  coupleId?: string; // empty if system default
  text: string;
  category: QuestionCategory;
  isCustom: boolean;
  createdBy?: string;
  createdAt: string;
}
