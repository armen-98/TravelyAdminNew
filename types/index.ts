export type UserRole = "super-admin" | "admin" | "moderator" | "business" | "user";

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  website?: string;
  description?: string;
  isActive: boolean;
  isPro: boolean;
  role?: { id: number; name: UserRole };
  profileImage?: FileEntity;
  createdAt: string;
  updatedAt: string;
  deactivatedAt?: string;
  deletedAt?: string | null;
  deletedBy?: "self" | "admin" | null;
  deletionReason?: string | null;
}

export interface PlaceModerationHistoryItem {
  id: number;
  eventType: string;
  reason: string | null;
  createdAt: string;
  actor: Pick<User, "id" | "fullName" | "email"> | null;
}

export interface Place {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  isActive: boolean;
  isVerified: boolean | null;
  rejectionReason?: string | null;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  viewCount: number;
  favoriteCount: number;
  category?: Category;
  subcategory?: Category | null;
  user?: User;
  images?: FileEntity[];
  country?: Location | null;
  state?: Location | null;
  city?: Location | null;
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
  /** Present on `GET /admin/places/:id` — full verification timeline */
  moderationHistory?: PlaceModerationHistoryItem[];
}

export interface Category {
  id: number;
  name: string;
  slug?: string | null;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
  isPro: boolean;
  sortOrder: number;
  parentId?: number | null;
  parent?: Category | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface Blog {
  id: number;
  title: string;
  description: string;
  image?: string;
  isActive: boolean;
  publishedAt?: string;
  user?: User;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface FileEntity {
  id: number;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  user?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  readAt?: string;
  user?: User;
  place?: Place;
  blog?: Blog;
  createdAt: string;
  updatedAt: string;
}

export interface Location {
  id: number;
  name: string;
  type: "country" | "state" | "city";
  parentId?: number;
  parent?: Location;
}

/** Nested country → states → cities from `GET /admin/locations`. */
export interface AdminLocationNode {
  id: number;
  name: string;
  type: "country" | "state" | "city";
  parentId: number | null;
  /** ISO 3166-1 alpha-2; only set for `type === "country"`. */
  countryCode?: string | null;
  image?: FileEntity | null;
  imageId?: number | null;
  children?: AdminLocationNode[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PlaceReview {
  id: number;
  placeId: number;
  rating: number;
  comment?: string | null;
  isActive: boolean | null; // null = pending, false = rejected, true = approved
  user?: User;
  place?: Place;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactRequest {
  id: number;
  user?: User;
  name?: string | null;
  email?: string | null;
  source?: "web" | "mobile";
  subject: string;
  message: string;
  cc?: string | null;
  attachmentFile?: FileEntity;
  attachmentFileId?: number;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalPlaces: number;
  pendingPlaces: number;
  verifiedPlaces: number;
  rejectedPlaces: number;
  totalReviews: number;
  pendingReviews: number;
  totalBlogs: number;
  placeStatus: { name: string; value: number }[];
  growthData: { month: string; users: number; places: number }[];
}

export interface ChartDataPoint {
  date: string;
  count: number;
}
