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

// Item types
export type Item = {
  id: string;
  name: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  unit: string;
  price: number;
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

export type Bundle = {
  id: string;
  name: string;
  items: BundleItem[];
  createdAt: string;
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
  invoiceSignedUrl: string | null;
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
