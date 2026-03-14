// --- AUTH ---
export type UserRole = 'CLIENT' | 'VENDOR' | 'ADMIN'

export interface User {
  id:            string
  name:          string
  email:         string | null
  phone:         string | null
  avatar:        string | null
  role:          UserRole
  walletBalance: number
  isActive:      boolean
  googleId:      string | null
  facebookId:    string | null
  createdAt:     string
  updatedAt:     string
}

export interface AuthResponse {
  accessToken:  string
  refreshToken: string
  user:         Pick<User, 'id' | 'name' | 'role' | 'avatar' | 'phone' | 'email'>
}

// --- VENDOR CATEGORY ---
export interface VendorCategory {
  id:   string
  name: string
  icon: string | null
}

// --- VENDOR ---
export interface Vendor {
  id:            string
  name:          string
  description:   string | null
  coverImage:    string | null
  address:       string | null
  phone:         string | null
  latitude:      number
  longitude:     number
  isOpen:        boolean
  averageRating: number
  totalReviews:  number
  categoryId:    string | null
  category:      VendorCategory | null
  ownerId:       string
  openingHours:  OpeningHours[]
  distance?:     number
  createdAt:     string
  updatedAt:     string
}

// --- OPENING HOURS ---
export type DayOfWeek =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY'
  | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface OpeningHours {
  id:        string
  day:       DayOfWeek
  openTime:  string
  closeTime: string
  isClosed:  boolean
  vendorId:  string
}

// --- DISH ---
export type DishCategory = 'ENTREE' | 'PLAT' | 'DESSERT' | 'BOISSON' | 'SNACK'

export interface Dish {
  id:          string
  name:        string
  description: string | null
  price:       number
  image:       string | null
  prepTime:    number | null
  category:    DishCategory
  isAvailable: boolean
  vendorId:    string
  createdAt:   string
  updatedAt:   string
}

// --- ORDER ---
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED'

export type PaymentMethod = 'CASH' | 'WAVE' | 'ORANGE_MONEY'

export interface Order {
  id:            string
  status:        OrderStatus
  total:         number
  paymentMethod: PaymentMethod
  isPaid:        boolean
  note:          string | null
  estimatedTime: number | null
  pickupCode:    string | null
  userId:        string
  vendorId:      string
  createdAt:     string
  updatedAt:     string
  vendor:        Pick<Vendor, 'id' | 'name' | 'coverImage' | 'address'>
  items:         OrderItem[]
}

// --- ORDER ITEM ---
export interface OrderItem {
  id:        string
  quantity:  number
  unitPrice: number
  orderId:   string
  dishId:    string
  dish:      Pick<Dish, 'id' | 'name' | 'image'>
}

// --- REVIEW ---
export interface Review {
  id:          string
  rating:      number
  comment:     string | null
  vendorReply: string | null
  repliedAt:   string | null
  createdAt:   string
  userId:      string
  vendorId:    string
  user:        Pick<User, 'id' | 'name' | 'avatar'>
}

// --- FAVORITE VENDOR ---
export interface FavoriteVendor {
  id:        string
  userId:    string
  vendorId:  string
  vendor:    Vendor
  createdAt: string
}

// --- NOTIFICATION ---
export type NotificationType =
  | 'ORDER_CONFIRMED'
  | 'ORDER_READY'
  | 'ORDER_CANCELLED'
  | 'NEW_REVIEW'
  | 'PROMO'

export interface Notification {
  id:        string
  type:      NotificationType
  title:     string
  body:      string
  isRead:    boolean
  createdAt: string
  userId:    string
  orderId:   string | null
}

// --- WALLET ---
export type TransactionType = 'PURCHASE' | 'REFUND' | 'BONUS'

export interface WalletTransaction {
  id:          string
  type:        TransactionType
  amount:      number
  description: string | null
  createdAt:   string
  userId:      string
  orderId:     string | null
}

export interface WalletStats {
  totalSpent:     number
  thisMonth:      number
  totalOrders:    number
  favoriteVendor: string | null
  evolution:      number
}

export interface WalletHabits {
  dailySpending:  { date: string; amount: number }[]
  byCategory:     { category: string; amount: number }[]
  mostActiveDay:  string
  peakHour:       number
}

// --- API ---
export interface ApiError {
  error:   string
  message: string
}

export interface PaginatedResponse<T> {
  data:  T[]
  total: number
  page:  number
  limit: number
}