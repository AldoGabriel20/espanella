// Auth types
export type UserRole = "user" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  user: User;
  accessTokenExpiresAt: string;
};

// Item media types
export type ItemMediaStatus = "pending" | "ready" | "failed" | "deleted";

export type ItemMedia = {
  id: string;
  itemId: string;
  mediaType: "image" | "video";
  storageBucket: string;
  storagePath: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  status: ItemMediaStatus;
  createdAt: string;
  updatedAt: string;
};

// Item types
export type Item = {
  id: string;
  name: string;
  description: string | null;
  stock: number;
  reservedStock: number;
  availableStock: number;
  unit: string;
  price: number;
  primaryImageUrl: string | null;
  hasVideo: boolean;
  mediaCount: number;
  media: ItemMedia[];
  createdAt: string;
  updatedAt: string;
};

// Bundle types
export type BundleItem = {
  id: string;
  bundleId: string;
  itemId: string;
  quantity: number;
};

export type BundleMediaStatus = "pending" | "ready" | "failed" | "deleted";

export type BundleMedia = {
  id: string;
  bundleId: string;
  mediaType: "image" | "video";
  storageBucket: string;
  storagePath: string;
  url: string;
  mimeType: string;
  fileSizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
  status: BundleMediaStatus;
  createdAt: string;
  updatedAt: string;
};

export type Bundle = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  reservedStock: number;
  availableStock: number;
  primaryImageUrl: string | null;
  hasVideo: boolean;
  mediaCount: number;
  media: BundleMedia[];
  items: BundleItem[];
  createdAt: string;
  updatedAt: string;
};

// Order types
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "done"
  | "cancelled";

export type OrderItem = {
  id: string;
  orderId: string;
  itemId: string | null;
  bundleId: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type Order = {
  id: string;
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryAmount: number;
  status: OrderStatus;
  totalPrice: number;
  /** True when an invoice has been generated (actual signed URL is fetched on demand). */
  hasInvoice: boolean;
  address: string | null;
  cardRequest: boolean;
  notes: string | null;
  airwaybillNumber: string | null;
  courier: string | null;
  /** True when this order belongs to an in-progress fulfillment batch; cancel is blocked. */
  lockedByBatch: boolean;
  createdAt: string;
  items: OrderItem[];
};

// Stock movement types
export type StockMovement = {
  id: string;
  itemId: string;
  orderId: string | null;
  delta: number;
  reason: string;
  createdAt: string;
};

// Pagination
export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
};

// Admin summary
export type AdminSummary = {
  totalItems: number;
  totalBundles: number;
  totalOrders: number;
  pendingOrders: number;
  lowStockItems: number;
  lowStockThreshold: number;
};

// Notification types
export type NotificationStatus = "pending" | "sent" | "failed" | "skipped";

export type NotificationLog = {
  id: string;
  orderId: string | null;
  itemId: string | null;
  channel: string;
  notificationType: string;
  scheduledFor: string;
  recipient: string;
  status: NotificationStatus;
  providerMessageId: string | null;
  providerName: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

// API error
export type ApiError = {
  status: number;
  message: string;
  details?: string;
};

// ─── Fulfillment batch types ──────────────────────────────────────────────────

export type BatchStatus = "draft" | "in_progress" | "completed" | "cancelled";
export type BatchComplexity = "light" | "medium" | "heavy";

export type BatchItemSnapshot = {
  id: string;
  batchId: string;
  itemId: string;
  itemName: string;
  requiredQuantity: number;
  createdAt: string;
};

export type FulfillmentBatchOrder = {
  id: string;
  batchId: string;
  orderId: string;
  sortOrder: number;
  createdAt: string;
  order: Order | null;
};

export type FulfillmentBatch = {
  id: string;
  batchDate: string;
  name: string;
  status: BatchStatus;
  recommendationScore: number;
  rationaleSummary: string;
  totalOrders: number;
  totalUnits: number;
  createdAt: string;
  updatedAt: string;
  orders: FulfillmentBatchOrder[];
  items: BatchItemSnapshot[];
};

export type AggregatedPickItem = {
  itemId: string;
  itemName: string;
  requiredQuantity: number;
};

export type BatchRecommendation = {
  batchKey: string;
  deliveryDate: string;
  recommendationScore: number;
  rationaleSummary: string;
  orders: Order[];
  aggregatedItems: AggregatedPickItem[];
  totalOrders: number;
  totalUnits: number;
  complexityLevel: BatchComplexity;
  warnings: string[];
};

export type RecommendationsResponse = {
  data: BatchRecommendation[];
  total: number;
};

export type CreateBatchPayload = {
  name?: string;
  order_ids: string[];
  recommendation?: BatchRecommendation;
};

export type UpdateBatchStatusPayload = {
  status: BatchStatus;
};

// Form request types
export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type CreateItemRequest = {
  name: string;
  stock: number;
  unit: string;
};

export type UpdateItemRequest = Partial<CreateItemRequest>;

export type BundleItemInput = {
  itemId: string;
  quantity: number;
};

export type CreateBundleRequest = {
  name: string;
  items: BundleItemInput[];
};

export type UpdateBundleRequest = Partial<CreateBundleRequest>;

export type OrderLineInput = {
  itemId?: string;
  bundleId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type CreateOrderRequest = {
  customerName: string;
  phone: string;
  deliveryDate: string;
  deliveryAmount: number;
  items: OrderLineInput[];
};

export type UpdateOrderStatusRequest = {
  status: OrderStatus;
};

// ─── Expense / Financial reporting types ─────────────────────────────────────

export type ExpenseMarketplace =
  | "tokopedia"
  | "shopee"
  | "whatsapp"
  | "instagram"
  | "tiket"
  | "grab"
  | "agoda"
  | "lalamove"
  | "other";

export type ExpensePaymentType = "unpaid" | "dp_50" | "completed";

export type Expense = {
  id: string;
  expenseDate: string; // ISO date
  marketplace: ExpenseMarketplace;
  storeName: string | null;
  itemName: string;
  quantity: number;
  finalPrice: number;
  pricePerUnit: number;
  paymentType: ExpensePaymentType;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseListParams = {
  limit?: number;
  offset?: number;
  date_from?: string; // YYYY-MM-DD
  date_to?: string;
  marketplace?: string;
  payment_type?: string;
};

export type FinancialSummary = {
  dateFrom: string;
  dateTo: string;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  expenseCount: number;
};

// ─── Company profile types ────────────────────────────────────────────────────

export type CompanyProfile = {
  companyName: string;
  tagline: string;
  about: string;
  email: string | null;
  phone: string | null;
  whatsApp: string | null;
  instagram: string | null;
  tokopedia: string | null;
  shopee: string | null;
  address: string | null;
  heroImages: string[]; // public image URLs for hero slider
  updatedAt: string;
};

