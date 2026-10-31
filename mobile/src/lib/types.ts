// Bentuk data dari API backend (lihat backend/lib/api.js).

export type Kind = 'Bagikan' | 'Tanya' | 'Resep';
export type Tone = 'amber' | 'green' | 'blue' | 'me';

export interface User {
  id: number;
  name: string;
  handle: string | null;
  secured: boolean;
  initials: string;
  goal: string;
  topics: string[];
  createdAt: string;
}

export interface Author {
  id: number;
  name: string;
  initials: string;
  tone?: Tone;
  bot: boolean;
}

export interface Post {
  id: number;
  kind: Kind;
  topic: string;
  text: string;
  food: { label: string; id: string | null; name?: string | null; category?: string | null } | null;
  photo: string | null;
  ai: boolean;
  createdAt: string;
  author: Author;
  likes: number;
  comments: number;
  liked: boolean;
  saved: boolean;
  mine: boolean;
}

export interface Comment {
  id: number;
  text: string;
  createdAt: string;
  mine: boolean;
  author: Author;
}

export type FoodSource = 'CalMates' | 'TKPI' | 'USDA';

export interface Food {
  id: string;
  name: string;
  nameEn: string;
  source: FoodSource;
  sourceLabel?: string;
  sugar: number | null;
  sodium: number | null;
  category: string;
  portion: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
  fiber: number | null;
  tags: string[];
  tip: string;
}

export interface ContentItem {
  id: string;
  type: 'artikel' | 'video';
  title: string;
  minutes: number;
  topic: string;
  g: [string, string];
  summary: string;
  body?: string[];
  premium?: boolean;
}

export interface Plan {
  goal: string;
  topics: string[];
  summary: string;
  focus: string[];
  challenge: { title: string; days: string[] };
  meals: { meal: string; idea: string; food_id: string | null }[];
  picks: string[];
  care: boolean;
  ai?: boolean;
  input?: string;
  createdAt?: string;
}

export interface ChallengeWeek {
  current: { id: string; title: string; body: string };
  next: { id: string; title: string };
  days: string[];
  board: { name: string; initials: string; days: number; me: boolean }[];
  participants: number;
  remind: boolean;
}

export interface AppNotification {
  id: number;
  type: 'comment' | 'reply' | 'like' | string;
  text: string;
  postId: number | null;
  read: boolean;
  createdAt: string;
  actor: { id: number; name: string; initials: string } | null;
}
