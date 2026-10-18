export type ProductCategory = 'Saya' | 'Cutting board' | 'Custom' | 'Furniture';

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  price: number;
  stock: number; // Stock on hand
  reserved: number; // In processing/packing
  lowStockThreshold: number; // Low stock alert trigger
  status: 'Published' | 'Draft';
  image: string;
  images?: string[]; // Multiple pictures gallery
  description?: string;
  woodType?: string;
  dimensions?: string;
};

export type OrderStatus =
  | 'Paid'
  | 'Processing'
  | 'Shipped'
  | 'Delivered'
  | 'Cancelled';

export type OrderItem = {
  productId: string;
  name: string;
  quantity: number;
  price: number;
};

export type ShippingAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type ShippingEstimateOption = {
  id: string;
  carrier: 'USPS' | 'UPS' | 'Local';
  name: string;
  speed: string;
  price: number;
  zone?: number;
  recommended?: boolean;
};

export type Order = {
  id: string;
  customer: string;
  email: string;
  item: string;
  items: OrderItem[];
  amount: number;
  subtotal?: number;
  shippingMethod?: string;
  shippingCost?: number;
  shippingZone?: number;
  taxAmount?: number;
  taxRate?: number;
  taxJurisdiction?: string;
  packageWeightOz?: number;
  status: OrderStatus;
  date: string;
  shippingAddress?: ShippingAddress;
  carrier?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  emailHistory?: string[]; // IDs of emails sent
};

export type InventoryAuditReason =
  | 'Restocked from Studio'
  | 'Order Placed (Stock Reserved)'
  | 'Order Fulfilled'
  | 'Order Cancelled (Restocked)'
  | 'Damaged / Scrapped'
  | 'Physical Inventory Audit'
  | 'Initial Baseline';

export type InventoryAuditLog = {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  change: number;
  previousStock: number;
  newStock: number;
  reason: InventoryAuditReason;
  referenceId?: string; // e.g. Order #1048
  timestamp: string;
  adminName: string;
  note?: string;
};

export type EmailType =
  | 'order_confirmation'
  | 'order_shipped'
  | 'order_delivered'
  | 'low_stock_alert'
  | 'admin_shipping_label';

export type EmailDeliveryStatus = 'delivered' | 'simulated' | 'failed';

export type EmailNotification = {
  id: string;
  orderId?: string;
  recipientEmail: string;
  recipientName: string;
  type: EmailType;
  subject: string;
  htmlContent: string;
  sentAt: string;
  status: EmailDeliveryStatus;
  carrier?: string;
  trackingNumber?: string;
};

export type AdminProfile = {
  name: string;
  email: string;
  title: string;
  location: string;
  storeName: string;
  tagline: string;
  currency: string;
  taxRate: number;
  onboardingCompleted: boolean;
  onboardingStep: number;
  completedTasks: string[];
};

export type EmailSettings = {
  autoSendConfirmation: boolean;
  autoSendShipment: boolean;
  autoSendDelivered: boolean;
  autoSendLowStockAlert: boolean;
  provider: 'simulation' | 'resend' | 'sendgrid' | 'postmark';
  apiKey: string;
  senderEmail: string;
  senderName: string;
  fromEmail?: string;
  fromName?: string;
  orderConfirmationEnabled?: boolean;
  shippingNotificationEnabled?: boolean;
  lowStockAlertEnabled?: boolean;
  customStudioNote: string;
  verified?: boolean;
};

export type CommerceConnections = {
  stripeConnected: boolean;
  stripePublishableKey: string;
  stripeSecretKey: string;
  stripeWebhookSecret?: string;
  stripeMode: 'test' | 'live';
  defaultCurrency?: string;
  stripeVerified?: boolean;
  supabaseConnected: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseVerified?: boolean;
  storageMode?: 'local' | 'supabase';
  // Direct Carrier Integration (USPS / UPS Direct without 3rd party aggregators)
  carrierProvider?: 'simulation' | 'usps_direct' | 'ups_direct';
  uspsClientId?: string;
  uspsClientSecret?: string;
  uspsPaymentAccountId?: string;
  uspsMID?: string; // 9-digit Mailer ID
  uspsCrID?: string; // Customer Registration ID
  upsClientId?: string;
  upsClientSecret?: string;
  upsAccountNumber?: string;
  carrierMode?: 'test' | 'live';
  carrierConnected?: boolean;
};

export type CommissionStage =
  | 'Inquiry'
  | 'Measurements Verified'
  | 'Scribing Spine'
  | 'Kanna Hand-Planing'
  | 'Friction-Fit Testing'
  | 'Camellia Oil Finishing'
  | 'Ready for Dispatch'
  | 'Completed';

export type BespokeCommission = {
  id: string; // e.g. COMM-2026-01
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  knifeMaker: string; // e.g. 'Yoshikane Hamono', 'Takeda Classic'
  bladeType: string; // e.g. '240mm Gyuto', '165mm Nakiri'
  bladeSteel: string; // e.g. 'Aogami Super / Stainless Clad', 'Shirogami #2'
  spineHeelThickness: string; // e.g. '3.6mm taper to 1.1mm'
  heelHeight: string; // e.g. '51mm'
  requestedWood: string; // e.g. 'Japanese Magnolia (Ho-wood) & Gaboon Ebony pin'
  stage: CommissionStage;
  quotedAmount: number;
  depositPaid: boolean;
  finalPaid: boolean;
  depositAmount: number;
  submittedAt: string;
  targetCompletion: string;
  notes?: string;
};

export type WaitlistEntry = {
  id: string;
  customerEmail: string;
  customerName: string;
  productId: string;
  productName: string;
  requestedAt: string;
  notified: boolean;
  notifiedAt?: string;
};

export type TimberLot = {
  id: string; // e.g. LOT-HO-24
  species: string; // e.g. 'Japanese Magnolia (Ho-wood)'
  origin: string; // e.g. 'Gifu Prefecture, Japan'
  harvestYear: string; // e.g. '2023 Kiln-Cured'
  boardFeet: number;
  moisturePercent: number; // e.g. 7.8%
  costPerBoardFoot: number;
  supplier: string;
  status: 'In Seasoning' | 'Active Milling' | 'Depleted';
  notes?: string;
};

export type TradeAccessCode = {
  id: string;
  code: string; // e.g. 'CHEF-PARTNER-15'
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  recipientOrPartner: string;
  usesCount: number;
  maxUses?: number;
  active: boolean;
};


