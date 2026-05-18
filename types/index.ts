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
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  openingHours?: OpeningHours | null;
  openFullDay?: boolean;
  social?: SocialLinks | null;
  priceType?: "range" | "fixed" | "onRequest" | "free" | "discounted" | null;
  price?: number | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  oldPrice?: number | null;
  isPriceOnRequest?: boolean;
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
  facilities?: Facility[];
  restaurant?: Restaurant | null;
  accommodation?: Accommodation | null;
  shopping?: Shopping | null;
  transport?: Transport | null;
  healthWellness?: HealthWellness | null;
  natureOutdoors?: NatureOutdoors | null;
  entertainment?: Entertainment | null;
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

export interface Facility {
  id: number;
  name: string;
  icon?: string | null;
  description?: string | null;
  sortOrder: number;
}

export interface OpeningHourDay {
  open: string;
  close: string;
  isClosed: boolean;
}

export type OpeningHours = Record<string, OpeningHourDay>;

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  linkedin?: string | null;
}

export interface RestaurantSpecialDish {
  id: number;
  title?: string | null;
  description?: string | null;
  file?: FileEntity | null;
}

export interface Restaurant {
  id: number;
  cuisineTypes?: string[];
  diningOptions?: string[];
  dietaryOptions?: string[];
  menuImages?: FileEntity[];
  dishImages?: FileEntity[];
  specialDishes?: RestaurantSpecialDish[];
}

export interface RoomType {
  name: string;
  description?: string;
  capacity: number;
  photos?: number[];
}

export interface Accommodation {
  id: number;
  roomTypes?: RoomType[];
  bookingUrl?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  petsAllowed?: boolean;
  ageRestriction?: string | null;
}

export interface Shopping {
  id: number;
  productCategories?: string[];
  brandsCarried?: string[];
  onlineStoreUrl?: string | null;
  returnPolicy?: string | null;
  bookingUrl?: string | null;
}

export interface RentalOptions {
  perHour?: number;
  perDay?: number;
  perWeek?: number;
  perMonth?: number;
}

export interface Transport {
  id: number;
  operator?: string | null;
  transportLines?: string[];
  destinations?: string[];
  vehicleTypes?: string[];
  rentalOptions?: RentalOptions | null;
  bookingUrl?: string | null;
}

export interface Practitioner {
  name: string;
  specialty?: string;
  qualifications?: string;
  yearsOfExperience?: number;
}

export interface MembershipOptions {
  monthly?: number;
  yearly?: number;
  weekly?: number;
  dayPass?: number;
  trialPeriod?: string;
  features?: string[];
}

export interface HealthWellness {
  id: number;
  servicesOffered?: string[];
  appointmentBookingUrl?: string | null;
  insuranceAccepted?: boolean | string[] | { accepted: boolean; providers?: string[] };
  practitioners?: Practitioner[];
  membershipOptions?: MembershipOptions | null;
  bookingUrl?: string | null;
}

export interface NatureOutdoors {
  id: number;
  entryFee?: string | null;
  keyActivities?: string[];
  rules?: string[];
  bestTimeToVisit?: string | null;
  keyExhibits?: string[];
}

export interface Entertainment {
  id: number;
  eventSchedule?: string | null;
  ticketPrice?: Record<string, unknown> | null;
  ticketBookingUrl?: string | null;
  currentExhibits?: string[];
  ageRestriction?: string | null;
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
