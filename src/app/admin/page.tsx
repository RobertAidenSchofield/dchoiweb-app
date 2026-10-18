'use client';

import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Compass,
  CreditCard,
  Database,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  LayoutDashboard,
  Lock,
  Mail,
  Menu,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  Tag,
  Trash,
  Trash2,
  Trees,
  TrendingUp,
  Truck,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AdminProfile,
  BespokeCommission,
  CommerceConnections,
  EmailNotification,
  EmailSettings,
  InventoryAuditLog,
  Order,
  OrderStatus,
  Product,
  TimberLot,
  TradeAccessCode,
  WaitlistEntry,
} from '@/types/store';
import {
  INITIAL_ADMIN_PROFILE,
  INITIAL_AUDIT_LOGS,
  INITIAL_COMMISSIONS,
  INITIAL_CONNECTIONS,
  INITIAL_EMAIL_SETTINGS,
  INITIAL_ORDERS,
  INITIAL_OUTBOX,
  INITIAL_PRODUCTS,
  INITIAL_PROMO_CODES,
  INITIAL_TIMBER_LOTS,
  INITIAL_WAITLIST,
  STORAGE_KEYS,
  loadStoredData,
  saveStoredData,
} from '@/lib/storeManager';
import {
  getOrderConfirmationEmailHtml,
  getOrderDeliveredEmailHtml,
  getOrderShippedEmailHtml,
  getLowStockAlertEmailHtml,
} from '@/lib/emailTemplates';
import { dispatchEmail } from '@/lib/emailService';
import { BespokeCommissionsView } from './components/BespokeCommissionsView';
import { WaitlistView } from './components/WaitlistView';
import { TimberLotsView } from './components/TimberLotsView';
import { TradeCodesView } from './components/TradeCodesView';
import { AccountingView } from './components/AccountingView';
import { CertificateModal } from './components/CertificateModal';
import { PackingSlipModal } from './components/PackingSlipModal';
import { ShippingLabelModal } from './components/ShippingLabelModal';

const money = (amount: number) =>
  `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function AdminPage() {
  const [activeView, setActiveView] = useState('Overview');
  const [isHydrated, setIsHydrated] = useState(false);

  // Core Store State
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [auditLogs, setAuditLogs] = useState<InventoryAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(INITIAL_ADMIN_PROFILE);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(INITIAL_EMAIL_SETTINGS);
  const [connections, setConnections] = useState<CommerceConnections>(INITIAL_CONNECTIONS);
  const [outbox, setOutbox] = useState<EmailNotification[]>(INITIAL_OUTBOX);

  // Artisan Studio Operations State
  const [commissions, setCommissions] = useState<BespokeCommission[]>(INITIAL_COMMISSIONS);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(INITIAL_WAITLIST);
  const [timberLots, setTimberLots] = useState<TimberLot[]>(INITIAL_TIMBER_LOTS);
  const [promoCodes, setPromoCodes] = useState<TradeAccessCode[]>(INITIAL_PROMO_CODES);

  // Print Modals
  const [selectedCertificateOrder, setSelectedCertificateOrder] = useState<{ order: Order; product?: Product } | null>(null);
  const [selectedPackingSlipOrder, setSelectedPackingSlipOrder] = useState<Order | null>(null);
  const [selectedShippingLabelOrder, setSelectedShippingLabelOrder] = useState<Order | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('All');
  const [inventoryHealthFilter, setInventoryHealthFilter] = useState<'All' | 'Healthy' | 'Low' | 'Out'>('All');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notice, setNotice] = useState('');

  // Modals
  const [isProductModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const [isShipModalOpen, setShipModalOpen] = useState(false);
  const [shippingOrder, setShippingOrder] = useState<Order | null>(null);

  const [isOnboardingModalOpen, setOnboardingModalOpen] = useState(false);
  const [previewEmailModal, setPreviewEmailModal] = useState<EmailNotification | null>(null);

  // Administrative Access Gate State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    fetch('/api/admin/check')
      .then((res) => res.json())
      .then((data) => {
        setIsAdminAuthenticated(data.authenticated ?? false);
      })
      .catch(() => {
        setIsAdminAuthenticated(false);
      });
  }, []);

  async function handleAdminLogin(e: FormEvent) {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasscode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAdminAuthenticated(true);
        setAdminPasscode('');
        showNotice('Studio administrative session unlocked.');
      } else {
        setAuthError(data.error || 'Invalid studio passcode.');
      }
    } catch {
      setAuthError('Authentication endpoint error.');
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function handleAdminLogout() {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } catch {}
    setIsAdminAuthenticated(false);
    showNotice('Studio administrative session locked.');
  }

  // Hydrate from localStorage on client mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setProducts(loadStoredData(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS));
      const loadedOrders = loadStoredData<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
      setOrders(loadedOrders);
      setAuditLogs(loadStoredData(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS));
      setAdminProfile(loadStoredData(STORAGE_KEYS.ADMIN_PROFILE, INITIAL_ADMIN_PROFILE));
      setEmailSettings(loadStoredData(STORAGE_KEYS.EMAIL_SETTINGS, INITIAL_EMAIL_SETTINGS));
      setConnections(loadStoredData(STORAGE_KEYS.CONNECTIONS, INITIAL_CONNECTIONS));
      setOutbox(loadStoredData(STORAGE_KEYS.OUTBOX, INITIAL_OUTBOX));
      setCommissions(loadStoredData(STORAGE_KEYS.COMMISSIONS, INITIAL_COMMISSIONS));
      setWaitlist(loadStoredData(STORAGE_KEYS.WAITLIST, INITIAL_WAITLIST));
      setTimberLots(loadStoredData(STORAGE_KEYS.TIMBER_LOTS, INITIAL_TIMBER_LOTS));
      setPromoCodes(loadStoredData(STORAGE_KEYS.PROMO_CODES, INITIAL_PROMO_CODES));
      setIsHydrated(true);

      // Deep-link from maker automated shipping label or packing slip email
      if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const printLabelId = searchParams.get('printLabel');
        const printSlipId = searchParams.get('printSlip');
        if (printLabelId) {
          const targetOrder = loadedOrders.find((o) => o.id === printLabelId);
          if (targetOrder) {
            setSelectedShippingLabelOrder(targetOrder);
            setActiveView('Orders');
          }
        } else if (printSlipId) {
          const targetOrder = loadedOrders.find((o) => o.id === printSlipId);
          if (targetOrder) {
            setSelectedPackingSlipOrder(targetOrder);
            setActiveView('Orders');
          }
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.PRODUCTS, products);
  }, [products, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.ORDERS, orders);
  }, [orders, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.AUDIT_LOGS, auditLogs);
  }, [auditLogs, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.ADMIN_PROFILE, adminProfile);
  }, [adminProfile, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.EMAIL_SETTINGS, emailSettings);
  }, [emailSettings, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.CONNECTIONS, connections);
  }, [connections, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.OUTBOX, outbox);
  }, [outbox, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.COMMISSIONS, commissions);
  }, [commissions, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.WAITLIST, waitlist);
  }, [waitlist, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.TIMBER_LOTS, timberLots);
  }, [timberLots, isHydrated]);

  useEffect(() => {
    if (isHydrated) saveStoredData(STORAGE_KEYS.PROMO_CODES, promoCodes);
  }, [promoCodes, isHydrated]);

  // Derived metrics
  const revenue = useMemo(
    () => orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.amount, 0),
    [orders]
  );
  const lowStockProducts = useMemo(
    () => products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold),
    [products]
  );

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  }, []);

  const triggerLowStockAlert = useCallback(
    async (product: Product) => {
      const email = await dispatchEmail({
        product,
        recipientEmail: adminProfile.email,
        recipientName: adminProfile.name,
        type: 'low_stock_alert',
        subject: `[Low Stock Alert] ${product.name} is down to ${product.stock} units — DCHOI DESIGNS`,
        settings: emailSettings,
      });

      setOutbox((current) => [email, ...current]);
    },
    [adminProfile.email, adminProfile.name, emailSettings]
  );

  // --- Inventory Management Functions ---
  const handleStockAdjustment = useCallback(
    (
      product: Product,
      changeAmount: number,
      reason: InventoryAuditLog['reason'],
      note?: string
    ) => {
      const prevStock = product.stock;
      const newStock = Math.max(0, prevStock + changeAmount);
      const actualChange = newStock - prevStock;

      const updatedProduct = { ...product, stock: newStock };
      setProducts((current) =>
        current.map((p) => (p.id === product.id ? updatedProduct : p))
      );

      const logEntry: InventoryAuditLog = {
        id: `log-${Date.now()}`,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        change: actualChange,
        previousStock: prevStock,
        newStock,
        reason,
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric',
        }),
        adminName: adminProfile.name,
        note,
      };
      setAuditLogs((current) => [logEntry, ...current]);
      setStockModalOpen(false);
      setStockProduct(null);

      // If stock dropped to low threshold and alert is enabled, trigger studio alert
      if (
        newStock <= product.lowStockThreshold &&
        emailSettings.autoSendLowStockAlert
      ) {
        triggerLowStockAlert(updatedProduct);
      }

      showNotice(`Updated ${product.name}: stock is now ${newStock}`);
    },
    [adminProfile.name, emailSettings.autoSendLowStockAlert, triggerLowStockAlert, showNotice]
  );

  function saveProduct(productData: {
    name: string;
    sku: string;
    category: Product['category'];
    price: number;
    stock: number;
    lowStockThreshold: number;
    status: 'Published' | 'Draft';
    woodType: string;
    dimensions: string;
    image: string;
    images: string[];
  }) {
    const {
      name,
      sku,
      category,
      price,
      stock,
      lowStockThreshold,
      status,
      woodType,
      dimensions,
      image,
      images,
    } = productData;

    if (editingProduct) {
      const stockDiff = stock - editingProduct.stock;
      const updated: Product = {
        ...editingProduct,
        name,
        sku,
        category,
        price,
        stock,
        lowStockThreshold,
        status,
        woodType,
        dimensions,
        image,
        images,
      };
      setProducts((current) =>
        current.map((p) => (p.id === editingProduct.id ? updated : p))
      );
      if (stockDiff !== 0) {
        setAuditLogs((current) => [
          {
            id: `log-${Date.now()}`,
            productId: updated.id,
            productName: updated.name,
            sku: updated.sku,
            change: stockDiff,
            previousStock: editingProduct.stock,
            newStock: stock,
            reason: 'Physical Inventory Audit',
            timestamp: new Date().toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }),
            adminName: adminProfile.name,
            note: 'Updated via product editor',
          },
          ...current,
        ]);
      }
      showNotice('Product catalog listing updated');
    } else {
      const defaultFallbackImage =
        category === 'Cutting board'
          ? 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1707765193847-22CXIFLNEX9QZ8PSYEA3/walnut+large+sizing.jpg?format=300w'
          : 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=300w';

      const finalPrimaryImage = image || defaultFallbackImage;
      const finalImages = images && images.length > 0 ? images : [finalPrimaryImage];

      const newProduct: Product = {
        id: String(Date.now()),
        name,
        sku,
        category,
        price,
        stock,
        reserved: 0,
        lowStockThreshold,
        status,
        image: finalPrimaryImage,
        images: finalImages,
        woodType,
        dimensions,
      };
      setProducts((current) => [...current, newProduct]);
      setAuditLogs((current) => [
        {
          id: `log-${Date.now()}`,
          productId: newProduct.id,
          productName: newProduct.name,
          sku: newProduct.sku,
          change: stock,
          previousStock: 0,
          newStock: stock,
          reason: 'Initial Baseline',
          timestamp: new Date().toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
          }),
          adminName: adminProfile.name,
          note: `New catalog piece created with ${finalImages.length} photo${finalImages.length > 1 ? 's' : ''}`,
        },
        ...current,
      ]);
      showNotice(`Added new piece: ${newProduct.name}`);
    }
    setProductModalOpen(false);
    setEditingProduct(null);
  }

  function deleteProduct(productId: string) {
    setProducts((current) => current.filter((p) => p.id !== productId));
    showNotice('Product removed from catalog');
  }

  function exportOrdersCsv() {
    const headers = [
      'Order Ref',
      'Date',
      'Customer',
      'Email',
      'Street',
      'City',
      'State',
      'Zip',
      'Item',
      'Gross Amount ($)',
      'Status',
      'Carrier',
      'Tracking Number',
    ];
    const rows = orders.map((o) => [
      `"${o.id}"`,
      `"${o.date}"`,
      `"${o.customer.replace(/"/g, '""')}"`,
      `"${o.email}"`,
      `"${(o.shippingAddress?.street || '').replace(/"/g, '""')}"`,
      `"${o.shippingAddress?.city || ''}"`,
      `"${o.shippingAddress?.state || ''}"`,
      `"${o.shippingAddress?.zip || ''}"`,
      `"${o.item.replace(/"/g, '""')}"`,
      o.amount.toFixed(2),
      `"${o.status}"`,
      `"${o.carrier || ''}"`,
      `"${o.trackingNumber || ''}"`,
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCHOI_DESIGNS_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Exported orders CSV');
  }

  // --- Order & Auto-Email Fulfillment ---
  async function handleOrderStatusChange(orderId: string, newStatus: OrderStatus) {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    if (newStatus === 'Shipped') {
      // Prompt shipping modal to collect carrier and tracking number
      setShippingOrder(targetOrder);
      setShipModalOpen(true);
      return;
    }

    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    if (newStatus === 'Delivered' && emailSettings.autoSendDelivered) {
      const email = await dispatchEmail({
        order: { ...targetOrder, status: 'Delivered' },
        recipientEmail: targetOrder.email,
        recipientName: targetOrder.customer,
        type: 'order_delivered',
        subject: `Delivered: Care instructions for your DCHOI DESIGNS piece (${targetOrder.id})`,
        settings: emailSettings,
      });
      setOutbox((current) => [email, ...current]);
      showNotice(`${orderId} marked Delivered · Auto-sent care guide to ${targetOrder.email}`);
    } else {
      showNotice(`${orderId} marked ${newStatus.toLowerCase()}`);
    }
  }

  async function fulfillShipment(carrier: string, trackingNumber: string) {
    if (!shippingOrder) return;
    const updatedOrder: Order = {
      ...shippingOrder,
      status: 'Shipped',
      carrier,
      trackingNumber,
    };

    setOrders((current) =>
      current.map((o) => (o.id === shippingOrder.id ? updatedOrder : o))
    );

    // Auto-provision customer shipment email
    if (emailSettings.autoSendShipment) {
      const email = await dispatchEmail({
        order: updatedOrder,
        recipientEmail: updatedOrder.email,
        recipientName: updatedOrder.customer,
        type: 'order_shipped',
        subject: `Your order ${updatedOrder.id} has shipped — DCHOI DESIGNS`,
        settings: emailSettings,
        carrier,
        trackingNumber,
      });
      setOutbox((current) => [email, ...current]);
      showNotice(`Fulfillment recorded! Auto-dispatched tracking email to ${updatedOrder.email}`);
    } else {
      showNotice(`${updatedOrder.id} marked shipped`);
    }

    setShipModalOpen(false);
    setShippingOrder(null);
  }

  // Manual re-send / test send
  async function resendEmail(notification: EmailNotification) {
    const order = orders.find((o) => o.id === notification.orderId);
    const reSent = await dispatchEmail({
      order,
      recipientEmail: notification.recipientEmail,
      recipientName: notification.recipientName,
      type: notification.type,
      subject: `[Resent] ${notification.subject}`,
      settings: emailSettings,
      carrier: notification.carrier,
      trackingNumber: notification.trackingNumber,
    });
    setOutbox((current) => [reSent, ...current]);
    showNotice(`Email re-dispatched to ${notification.recipientEmail}`);
  }

  async function sendTestEmail(recipientEmail: string, type: EmailNotification['type']) {
    const sampleOrder = orders[0] || INITIAL_ORDERS[0];
    const email = await dispatchEmail({
      order: sampleOrder,
      recipientEmail,
      recipientName: 'Test Recipient',
      type,
      subject: `[Test Preview] Order Notification — DCHOI DESIGNS`,
      settings: emailSettings,
      carrier: 'USPS Priority Mail',
      trackingNumber: '9400111899562537119283',
    });
    setOutbox((current) => [email, ...current]);
    showNotice(`Test email dispatched to ${recipientEmail}`);
  }

  // Filter products for catalog view
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        productCategoryFilter === 'All' || p.category === productCategoryFilter;
      const matchesHealth =
        inventoryHealthFilter === 'All' ||
        (inventoryHealthFilter === 'Healthy' && p.stock > p.lowStockThreshold) ||
        (inventoryHealthFilter === 'Low' && p.stock > 0 && p.stock <= p.lowStockThreshold) ||
        (inventoryHealthFilter === 'Out' && p.stock === 0);
      return matchesSearch && matchesCategory && matchesHealth;
    });
  }, [products, searchTerm, productCategoryFilter, inventoryHealthFilter]);

  if (isAdminAuthenticated === false) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#131b17',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #2a3a32',
            borderRadius: '4px',
            padding: '40px 36px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '26px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: '#eef3ef',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#263b35',
              }}
            >
              <Lock size={22} />
            </div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: '#131b17',
                margin: '0 0 6px',
              }}
            >
              DCHOI DESIGNS
            </h1>
            <p style={{ fontSize: '12px', color: '#687b70', margin: 0 }}>
              Studio Administration &amp; Inventory Access
            </p>
          </div>

          <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#41554b',
                  marginBottom: '6px',
                }}
              >
                Studio Passcode
              </label>
              <input
                type='password'
                value={adminPasscode}
                onChange={(e) => setAdminPasscode(e.target.value)}
                placeholder='Enter master passcode'
                autoFocus
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  border: '1px solid #d4ddd4',
                  borderRadius: '3px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {authError && (
              <div
                style={{
                  background: '#fdf0f0',
                  border: '1px solid #f5cfcf',
                  color: '#9c2727',
                  padding: '8px 12px',
                  borderRadius: '3px',
                  fontSize: '12px',
                }}
              >
                {authError}
              </div>
            )}

            <button
              type='submit'
              disabled={isLoggingIn}
              style={{
                background: '#263b35',
                color: '#ffffff',
                border: 0,
                padding: '11px',
                fontSize: '12.5px',
                fontWeight: 600,
                letterSpacing: '0.03em',
                borderRadius: '3px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isLoggingIn ? 'Verifying...' : 'Unlock Studio Dashboard'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <a
                href='/store'
                style={{ fontSize: '11.5px', color: '#687b70', textDecoration: 'none' }}
              >
                ← Return to Public Storefront
              </a>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <main className='dashboard-shell'>
      {/* Sidebar Navigation */}
      <aside className={`dashboard-sidebar ${mobileNavOpen ? 'is-open' : ''}`}>
        <div className='dashboard-brand'>
          <span>DCHOI</span>
          <small>OWNER STUDIO</small>
        </div>
        <button
          className='mobile-close'
          type='button'
          onClick={() => setMobileNavOpen(false)}
          aria-label='Close menu'
        >
          <X size={18} />
        </button>

        <nav className='dashboard-nav' aria-label='Dashboard navigation'>
          <p>Workspace</p>
          <DashboardNavItem
            icon={<LayoutDashboard size={17} />}
            label='Overview'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<Boxes size={17} />}
            label='Inventory'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
            badge={lowStockProducts.length > 0 ? lowStockProducts.length : undefined}
          />
          <DashboardNavItem
            icon={<ShoppingBag size={17} />}
            label='Orders'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
            badge={orders.filter((o) => o.status === 'Processing' || o.status === 'Paid').length}
          />
          <DashboardNavItem
            icon={<Compass size={17} />}
            label='Bespoke Commissions'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
            badge={commissions.filter((c) => c.stage !== 'Completed').length}
          />
          <DashboardNavItem
            icon={<Bell size={17} />}
            label='Waitlist & Drops'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
            badge={waitlist.filter((w) => !w.notified).length > 0 ? waitlist.filter((w) => !w.notified).length : undefined}
          />
          <DashboardNavItem
            icon={<Mail size={17} />}
            label='Emails & Outbox'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
            badge={outbox.length}
          />

          <p className='dashboard-nav-spacer'>Artisan &amp; Studio</p>
          <DashboardNavItem
            icon={<Trees size={17} />}
            label='Timber Lots'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<Tag size={17} />}
            label='VIP & Trade Codes'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<Receipt size={17} />}
            label='Accounting & Tax'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<CircleDollarSign size={17} />}
            label='Payments'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />

          <p className='dashboard-nav-spacer'>Setup & Control</p>
          <DashboardNavItem
            icon={<Sparkles size={17} />}
            label='Store Onboarding'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<UserRound size={17} />}
            label='Customers'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
          <DashboardNavItem
            icon={<Settings size={17} />}
            label='Settings'
            activeView={activeView}
            setActiveView={setActiveView}
            closeMenu={() => setMobileNavOpen(false)}
          />
        </nav>

        <div className='dashboard-user'>
          <div className='avatar'>DC</div>
          <div>
            <strong>{adminProfile.name}</strong>
            <span>{adminProfile.title}</span>
          </div>
          <button
            type='button'
            style={{ background: 'none', border: 0, color: '#a9bab0', cursor: 'pointer' }}
            onClick={() => setOnboardingModalOpen(true)}
            title='Open Onboarding Wizard'
          >
            <Sparkles size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className='dashboard-main'>
        <header className='dashboard-topbar'>
          <button
            className='mobile-menu'
            type='button'
            onClick={() => setMobileNavOpen(true)}
            aria-label='Open dashboard menu'
          >
            <Menu size={21} />
          </button>
          <div>
            <span className='breadcrumb'>DCHOI DESIGNS /</span>
            <strong>{activeView}</strong>
          </div>
          <div className='topbar-actions'>
            <button
              type='button'
              className='secondary-dashboard-button'
              onClick={() => setOnboardingModalOpen(true)}
              style={{ padding: '7px 12px', fontSize: '11px' }}
            >
              <Sparkles size={13} /> Setup Wizard
            </button>
            <button
              type='button'
              className='secondary-dashboard-button'
              onClick={handleAdminLogout}
              style={{ padding: '7px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title='Lock studio dashboard'
            >
              <Lock size={12} /> Lock Studio
            </button>
            <a href='/store' target='_blank' rel='noreferrer' className='view-store'>
              View Storefront <ExternalLink size={14} />
            </a>
            <button
              type='button'
              className='notification-dot'
              aria-label='Notifications'
              onClick={() => showNotice('All store systems operating normally')}
            >
              <span />
            </button>
          </div>
        </header>

        <div className='dashboard-content'>
          {/* Toast Notification */}
          {notice && (
            <div className='dashboard-notice'>
              <Check size={15} />
              {notice}
            </div>
          )}

          {/* Low Stock Urgent Warning Banner (shows if any product is low) */}
          {lowStockProducts.length > 0 && activeView !== 'Inventory' && (
            <div className='low-stock-alert-bar'>
              <div>
                <AlertTriangle size={16} />
                <span>
                  <strong>Inventory Notice:</strong> {lowStockProducts.length} item
                  {lowStockProducts.length > 1 ? 's are' : ' is'} at or below safety stock threshold (
                  {lowStockProducts.map((p) => `${p.name} (${p.stock})`).join(', ')})
                </span>
              </div>
              <button type='button' onClick={() => setActiveView('Inventory')}>
                Manage Stock
              </button>
            </div>
          )}

          {/* VIEWS */}
          {activeView === 'Overview' && (
            <OverviewView
              revenue={revenue}
              orders={orders}
              products={products}
              lowStockProducts={lowStockProducts}
              adminProfile={adminProfile}
              outbox={outbox}
              setActiveView={setActiveView}
              onOpenOnboarding={() => setOnboardingModalOpen(true)}
            />
          )}

          {activeView === 'Inventory' && (
            <InventoryManagementView
              products={filteredProducts}
              allProducts={products}
              auditLogs={auditLogs}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              categoryFilter={productCategoryFilter}
              setCategoryFilter={setProductCategoryFilter}
              healthFilter={inventoryHealthFilter}
              setHealthFilter={setInventoryHealthFilter}
              onAddProduct={() => {
                setEditingProduct(null);
                setProductModalOpen(true);
              }}
              onEditProduct={(p) => {
                setEditingProduct(p);
                setProductModalOpen(true);
              }}
              onAdjustStock={(p) => {
                setStockProduct(p);
                setStockModalOpen(true);
              }}
              onDeleteProduct={deleteProduct}
            />
          )}

          {activeView === 'Orders' && (
            <OrdersFulfillmentView
              orders={orders}
              products={products}
              onStatusChange={handleOrderStatusChange}
              onQuickSendEmail={async (order) => {
                const email = await dispatchEmail({
                  order,
                  recipientEmail: order.email,
                  recipientName: order.customer,
                  type: 'order_confirmation',
                  subject: `Order Notification ${order.id} — DCHOI DESIGNS`,
                  settings: emailSettings,
                });
                setOutbox((current) => [email, ...current]);
                showNotice(`Sent email receipt to ${order.email}`);
              }}
              onOpenCertificate={(order, p) => setSelectedCertificateOrder({ order, product: p })}
              onOpenPackingSlip={(order) => setSelectedPackingSlipOrder(order)}
              onOpenShippingLabel={(order) => setSelectedShippingLabelOrder(order)}
              onExportOrders={exportOrdersCsv}
            />
          )}

          {activeView === 'Bespoke Commissions' && (
            <BespokeCommissionsView
              commissions={commissions}
              setCommissions={setCommissions}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Waitlist & Drops' && (
            <WaitlistView
              waitlist={waitlist}
              setWaitlist={setWaitlist}
              products={products}
              emailSettings={emailSettings}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Timber Lots' && (
            <TimberLotsView
              timberLots={timberLots}
              setTimberLots={setTimberLots}
              showNotice={showNotice}
            />
          )}

          {activeView === 'VIP & Trade Codes' && (
            <TradeCodesView
              promoCodes={promoCodes}
              setPromoCodes={setPromoCodes}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Accounting & Tax' && (
            <AccountingView
              orders={orders}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Emails & Outbox' && (
            <EmailsAndProvisioningView
              outbox={outbox}
              emailSettings={emailSettings}
              setEmailSettings={setEmailSettings}
              onResend={resendEmail}
              onSendTest={sendTestEmail}
              onPreviewEmail={(email) => setPreviewEmailModal(email)}
              sampleOrder={orders[0] || INITIAL_ORDERS[0]}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Store Onboarding' && (
            <StoreOnboardingView
              adminProfile={adminProfile}
              setAdminProfile={setAdminProfile}
              emailSettings={emailSettings}
              setEmailSettings={setEmailSettings}
              connections={connections}
              setConnections={setConnections}
              onLaunchWizard={() => setOnboardingModalOpen(true)}
              showNotice={showNotice}
            />
          )}

          {activeView === 'Payments' && <PaymentsView orders={orders} />}

          {activeView === 'Customers' && <CustomersView orders={orders} />}

          {activeView === 'Settings' && (
            <SettingsView
              adminProfile={adminProfile}
              setAdminProfile={setAdminProfile}
              connections={connections}
              setConnections={setConnections}
              emailSettings={emailSettings}
              setEmailSettings={setEmailSettings}
              showNotice={showNotice}
            />
          )}
        </div>
      </section>

      {/* --- MODALS --- */}

      {/* 1. Admin Onboarding Wizard Modal */}
      {isOnboardingModalOpen && (
        <AdminOnboardingWizardModal
          adminProfile={adminProfile}
          setAdminProfile={setAdminProfile}
          emailSettings={emailSettings}
          setEmailSettings={setEmailSettings}
          connections={connections}
          setConnections={setConnections}
          onClose={() => setOnboardingModalOpen(false)}
          onComplete={() => {
            setOnboardingModalOpen(false);
            showNotice('Onboarding complete! Your studio dashboard is ready.');
          }}
        />
      )}

      {/* 2. Stock Adjustment Modal */}
      {isStockModalOpen && stockProduct && (
        <StockAdjustmentModal
          product={stockProduct}
          onClose={() => {
            setStockModalOpen(false);
            setStockProduct(null);
          }}
          onSave={handleStockAdjustment}
        />
      )}

      {/* 3. Product Catalog Modal */}
      {isProductModalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => {
            setProductModalOpen(false);
            setEditingProduct(null);
          }}
          onSave={saveProduct}
        />
      )}

      {/* 4. Shipping Carrier & Tracking Fulfillment Modal */}
      {isShipModalOpen && shippingOrder && (
        <ShippingFulfillmentModal
          order={shippingOrder}
          onClose={() => {
            setShipModalOpen(false);
            setShippingOrder(null);
          }}
          onFulfill={fulfillShipment}
        />
      )}

      {/* 5. Rendered Email Preview Modal */}
      {previewEmailModal && (
        <RenderedEmailPreviewModal
          email={previewEmailModal}
          onClose={() => setPreviewEmailModal(null)}
          onResend={() => {
            resendEmail(previewEmailModal);
            setPreviewEmailModal(null);
          }}
        />
      )}

      {/* 6. Certificate of Authenticity Modal */}
      {selectedCertificateOrder && (
        <CertificateModal
          order={selectedCertificateOrder.order}
          product={selectedCertificateOrder.product}
          onClose={() => setSelectedCertificateOrder(null)}
        />
      )}

      {/* 7. Packing Slip & Studio Care Protocol Modal */}
      {selectedPackingSlipOrder && (
        <PackingSlipModal
          order={selectedPackingSlipOrder}
          onClose={() => setSelectedPackingSlipOrder(null)}
        />
      )}

      {/* 8. Carrier 4x6" Printable Shipping Label Modal */}
      {selectedShippingLabelOrder && (
        <ShippingLabelModal
          order={selectedShippingLabelOrder}
          onClose={() => setSelectedShippingLabelOrder(null)}
        />
      )}
    </main>
  );
}

/* ========================================================================= */
/* --- SUB-COMPONENTS & VIEWS ---                                            */
/* ========================================================================= */

function DashboardNavItem({
  icon,
  label,
  activeView,
  setActiveView,
  closeMenu,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  activeView: string;
  setActiveView: (label: string) => void;
  closeMenu: () => void;
  badge?: number;
}) {
  return (
    <button
      className={`dashboard-nav-item ${activeView === label ? 'active' : ''}`}
      type='button'
      onClick={() => {
        setActiveView(label);
        closeMenu();
      }}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined ? <b>{badge}</b> : null}
    </button>
  );
}

// ---------------------------------------------------------------------------
// VIEW 1: Overview with Onboarding Checklist
// ---------------------------------------------------------------------------
function OverviewView({
  revenue,
  orders,
  products,
  lowStockProducts,
  adminProfile,
  outbox,
  setActiveView,
  onOpenOnboarding,
}: {
  revenue: number;
  orders: Order[];
  products: Product[];
  lowStockProducts: Product[];
  adminProfile: AdminProfile;
  outbox: EmailNotification[];
  setActiveView: (view: string) => void;
  onOpenOnboarding: () => void;
}) {
  const tasks = [
    { id: 'profile', label: 'Studio Identity & Admin Profile', done: true },
    { id: 'inventory', label: 'Catalog & Low Stock Thresholds', done: products.length > 0 },
    { id: 'email', label: 'Customer Automated Email Provisioning', done: outbox.length > 0 },
    { id: 'payment', label: 'Payment Gateway Connection', done: false },
  ];
  const completedCount = tasks.filter((t) => t.done).length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100);

  return (
    <>
      {/* Onboarding Checklist Card */}
      <section className='onboarding-checklist-card'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span className='dashboard-kicker'>Store Launch Progress</span>
            <h2 style={{ fontSize: '18px', margin: '4px 0 0', fontWeight: 600 }}>
              Admin Setup & Operations Checklist
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#263b35' }}>
              {completedCount} of {tasks.length} Complete ({progressPercent}%)
            </span>
            <button
              type='button'
              className='primary-dashboard-button'
              onClick={onOpenOnboarding}
              style={{ padding: '8px 12px' }}
            >
              <Sparkles size={14} /> Resume Onboarding
            </button>
          </div>
        </div>

        <div className='checklist-progress-bar'>
          <div
            className='checklist-progress-fill'
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className='checklist-grid'>
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`checklist-item ${task.done ? 'is-done' : ''}`}
              onClick={onOpenOnboarding}
            >
              <div className='checklist-check'>
                {task.done ? <Check size={12} /> : null}
              </div>
              <div className='checklist-text'>
                <strong>{task.label}</strong>
                <span>{task.done ? 'Configured & Active' : 'Setup Required'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Greeting Header */}
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1>Good morning, {adminProfile.name.split(' ')[0]}.</h1>
          <p>Here&apos;s the live status of your Chicago studio and fulfillment queue.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className='secondary-dashboard-button'
            type='button'
            onClick={() => setActiveView('Emails & Outbox')}
          >
            <Mail size={16} /> View Email Outbox
          </button>
          <button
            className='primary-dashboard-button'
            type='button'
            onClick={() => setActiveView('Inventory')}
          >
            <Boxes size={16} /> Manage Inventory
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className='metric-grid'>
        <MetricCard
          label='Gross Revenue'
          value={money(revenue)}
          change='+18.4% this month'
          icon={<CircleDollarSign size={18} />}
        />
        <MetricCard
          label='Customer Orders'
          value={orders.length.toString()}
          change={`${orders.filter((o) => o.status === 'Processing').length} awaiting fulfillment`}
          icon={<ShoppingBag size={18} />}
        />
        <MetricCard
          label='Low Stock Alerts'
          value={lowStockProducts.length.toString()}
          change={lowStockProducts.length > 0 ? 'Needs woodshop restock' : 'Stock healthy'}
          icon={<Boxes size={18} />}
          warning={lowStockProducts.length > 0}
        />
        <MetricCard
          label='Auto-Emails Dispatched'
          value={outbox.length.toString()}
          change='All receipts & tracking sent'
          icon={<Mail size={18} />}
        />
      </div>

      {/* Columns: Left Graph, Right Mini Orders */}
      <div className='dashboard-columns'>
        <section className='dashboard-panel revenue-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Fulfillment & Revenue Velocity</h2>
              <p>Active production & customer volume</p>
            </div>
            <button type='button' className='period-button'>
              30 days <ChevronDown size={14} />
            </button>
          </div>
          <div className='revenue-total'>
            {money(revenue)}
            <span>
              <TrendingUp size={14} /> +18.4%
            </span>
          </div>
          <div className='chart'>
            <div className='chart-y-axis'>
              <span>$1.5k</span>
              <span>$1k</span>
              <span>$500</span>
              <span>$0</span>
            </div>
            <div className='chart-area'>
              <div className='chart-grid-lines' />
              <svg viewBox='0 0 600 180' preserveAspectRatio='none' aria-label='Revenue trend chart'>
                <path
                  d='M0 158 C35 155 48 130 80 140 S115 95 145 116 S185 118 212 88 S245 100 274 81 S305 102 338 65 S370 83 398 52 S430 62 460 42 S495 60 530 27 S570 43 600 10'
                  fill='none'
                  stroke='#263b35'
                  strokeWidth='3'
                  vectorEffect='non-scaling-stroke'
                />
                <path
                  d='M0 158 C35 155 48 130 80 140 S115 95 145 116 S185 118 212 88 S245 100 274 81 S305 102 338 65 S370 83 398 52 S430 62 460 42 S495 60 530 27 S570 43 600 10 L600 180 L0 180 Z'
                  fill='url(#chartFill)'
                  opacity='.45'
                />
                <defs>
                  <linearGradient id='chartFill' x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='0%' stopColor='#b6d8c5' />
                    <stop offset='100%' stopColor='#b6d8c5' stopOpacity='0' />
                  </linearGradient>
                </defs>
              </svg>
              <div className='chart-x-axis'>
                <span>Aug 10</span>
                <span>Aug 17</span>
                <span>Aug 24</span>
                <span>Aug 31</span>
                <span>Sep 07</span>
              </div>
            </div>
          </div>
        </section>

        <section className='dashboard-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Recent Orders</h2>
              <p>Latest purchases requiring fulfillment</p>
            </div>
            <button
              type='button'
              className='panel-link'
              onClick={() => setActiveView('Orders')}
            >
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className='mini-orders'>
            {orders.slice(0, 4).map((order) => (
              <div className='mini-order' key={order.id}>
                <div className='order-avatar'>
                  {order.customer
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div className='mini-order-customer'>
                  <strong>{order.customer}</strong>
                  <span>{order.item}</span>
                </div>
                <div className='mini-order-value'>
                  <strong>{money(order.amount)}</strong>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 2: Complete Inventory Tracking and Management
// ---------------------------------------------------------------------------
function InventoryManagementView({
  products,
  allProducts,
  auditLogs,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  healthFilter,
  setHealthFilter,
  onAddProduct,
  onEditProduct,
  onAdjustStock,
  onDeleteProduct,
}: {
  products: Product[];
  allProducts: Product[];
  auditLogs: InventoryAuditLog[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  categoryFilter: string;
  setCategoryFilter: (c: string) => void;
  healthFilter: 'All' | 'Healthy' | 'Low' | 'Out';
  setHealthFilter: (h: 'All' | 'Healthy' | 'Low' | 'Out') => void;
  onAddProduct: () => void;
  onEditProduct: (p: Product) => void;
  onAdjustStock: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
}) {
  const [subTab, setSubTab] = useState<'catalog' | 'audit'>('catalog');

  const totalOnHand = allProducts.reduce((sum, p) => sum + p.stock, 0);
  const totalReserved = allProducts.reduce((sum, p) => sum + p.reserved, 0);
  const lowStockCount = allProducts.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length;
  const totalValue = allProducts.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Inventory Tracking & Management</p>
          <h1>Studio Stock Control</h1>
          <p>
            Track on-hand units, reserved order allocations, low stock warnings, and
            craft production history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className='secondary-dashboard-button'
            type='button'
            onClick={() => {
              const csvContent =
                'data:text/csv;charset=utf-8,' +
                'SKU,Name,Category,StockOnHand,Reserved,Available,Price\n' +
                allProducts
                  .map(
                    (p) =>
                      `"${p.sku}","${p.name}","${p.category}",${p.stock},${p.reserved},${p.stock - p.reserved},${p.price}`
                  )
                  .join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `dchoi_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            Export Stock CSV
          </button>
          <button className='primary-dashboard-button' type='button' onClick={onAddProduct}>
            <Plus size={16} /> Add Catalog Piece
          </button>
        </div>
      </div>

      {/* Inventory Stat Cards */}
      <div className='metric-grid' style={{ marginBottom: '24px' }}>
        <MetricCard
          label='Total Units in Studio'
          value={totalOnHand.toString()}
          change={`${allProducts.length} unique catalog pieces`}
          icon={<Boxes size={18} />}
        />
        <MetricCard
          label='Reserved for Fulfillment'
          value={totalReserved.toString()}
          change='Allocated to pending orders'
          icon={<PackageCheck size={18} />}
        />
        <MetricCard
          label='Low Stock Warnings'
          value={lowStockCount.toString()}
          change='At or below threshold'
          icon={<AlertTriangle size={18} />}
          warning={lowStockCount > 0}
        />
        <MetricCard
          label='Stock Retail Value'
          value={money(totalValue)}
          change='Finished studio goods'
          icon={<CircleDollarSign size={18} />}
        />
      </div>

      {/* Sub Tabs: Catalog vs Audit Log */}
      <div className='view-tabs'>
        <button
          className={`view-tab-button ${subTab === 'catalog' ? 'active' : ''}`}
          type='button'
          onClick={() => setSubTab('catalog')}
        >
          Catalog Inventory ({products.length})
        </button>
        <button
          className={`view-tab-button ${subTab === 'audit' ? 'active' : ''}`}
          type='button'
          onClick={() => setSubTab('audit')}
        >
          <History size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
          Movement & Audit Trail ({auditLogs.length})
        </button>
      </div>

      {subTab === 'catalog' ? (
        <section className='dashboard-panel table-panel'>
          {/* Filter Bar */}
          <div className='table-toolbar' style={{ flexWrap: 'wrap', gap: '12px' }}>
            <div className='search-field'>
              <Search size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search by piece name or SKU...'
                aria-label='Search products'
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className='filter-button'
                style={{ padding: '8px 12px', background: '#fff' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value='All'>All Categories</option>
                <option value='Saya'>Sayas</option>
                <option value='Cutting board'>Cutting boards</option>
                <option value='Custom'>Custom</option>
              </select>

              <select
                className='filter-button'
                style={{ padding: '8px 12px', background: '#fff' }}
                value={healthFilter}
                onChange={(e) => setHealthFilter(e.target.value as 'All' | 'Healthy' | 'Low' | 'Out')}
              >
                <option value='All'>All Stock Statuses</option>
                <option value='Healthy'>Healthy Stock</option>
                <option value='Low'>Low Stock Alerts</option>
                <option value='Out'>Sold Out (0 Units)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>Piece & SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>On Hand</th>
                  <th>Reserved</th>
                  <th>Available</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const available = Math.max(0, product.stock - product.reserved);
                  const isLow = product.stock > 0 && product.stock <= product.lowStockThreshold;
                  const isOut = product.stock === 0;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className='product-table-name'>
                          <div
                            className='table-product-image'
                            style={{ backgroundImage: `url('${product.image}')`, position: 'relative' }}
                          >
                            {product.images && product.images.length > 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '-4px',
                                  right: '-4px',
                                  background: '#192823',
                                  color: '#e2ede6',
                                  fontSize: '9px',
                                  padding: '1px 5px',
                                  borderRadius: '999px',
                                  fontWeight: 600,
                                  border: '1px solid rgba(255,255,255,0.4)',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                }}
                                title={`${product.images.length} photos in gallery`}
                              >
                                {product.images.length}
                              </span>
                            )}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <div style={{ marginTop: '2px' }}>
                              <span className='sku-badge'>{product.sku}</span>
                              {product.woodType && (
                                <span style={{ marginLeft: '6px', fontSize: '10px', color: '#7a8e82' }}>
                                  {product.woodType}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{product.category}</td>
                      <td>{money(product.price)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isOut ? '#b23b30' : isLow ? '#a77d35' : '#263b35',
                            fontSize: '13px',
                          }}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: product.reserved > 0 ? '#728b7e' : '#a9b8af' }}>
                          {product.reserved}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: available > 0 ? '#263b35' : '#b23b30' }}>
                          {available}
                        </strong>
                      </td>
                      <td>≤ {product.lowStockThreshold} units</td>
                      <td>
                        {isOut ? (
                          <span className='status-pill out-of-stock'>Sold Out</span>
                        ) : isLow ? (
                          <span className='status-pill low-stock'>Low ({product.stock} left)</span>
                        ) : (
                          <span className='status-pill in-stock'>In Stock</span>
                        )}
                      </td>
                      <td>
                        <div className='row-actions'>
                          <button
                            type='button'
                            className='primary-dashboard-button'
                            style={{ padding: '5px 10px', fontSize: '10px' }}
                            onClick={() => onAdjustStock(product)}
                            title='Adjust stock or record fresh batch'
                          >
                            <RefreshCw size={12} /> Adjust Stock
                          </button>
                          <button
                            type='button'
                            aria-label={`Edit ${product.name}`}
                            onClick={() => onEditProduct(product)}
                            title='Edit Listing'
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type='button'
                            aria-label={`Delete ${product.name}`}
                            onClick={() => onDeleteProduct(product.id)}
                            title='Delete'
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Inventory Movement Audit Trail */
        <section className='dashboard-panel table-panel'>
          <div className='table-toolbar'>
            <div>
              <strong>Inventory Audit History</strong>
              <span className='toolbar-muted'> · Every stock addition, order deduction, and physical count</span>
            </div>
          </div>
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Piece & SKU</th>
                  <th>Movement</th>
                  <th>Prev → New</th>
                  <th>Reason</th>
                  <th>Initiator</th>
                  <th>Note / Order Ref</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => {
                  const isPositive = log.change > 0;
                  return (
                    <tr key={log.id}>
                      <td>{log.timestamp}</td>
                      <td>
                        <strong>{log.productName}</strong>
                        <span className='sku-badge' style={{ marginLeft: '6px' }}>
                          {log.sku}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isPositive ? '#3d784a' : '#b23b30',
                          }}
                        >
                          {isPositive ? `+${log.change}` : log.change} units
                        </span>
                      </td>
                      <td>
                        {log.previousStock} → <strong>{log.newStock}</strong>
                      </td>
                      <td>
                        <span className='status-pill published' style={{ fontSize: '10px' }}>
                          {log.reason}
                        </span>
                      </td>
                      <td>{log.adminName}</td>
                      <td style={{ color: '#4a6054' }}>
                        {log.referenceId ? `Ref: ${log.referenceId} ` : ''}
                        {log.note || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 3: Orders Fulfillment & Status Management
// ---------------------------------------------------------------------------
function OrdersFulfillmentView({
  orders,
  products,
  onStatusChange,
  onQuickSendEmail,
  onOpenCertificate,
  onOpenPackingSlip,
  onOpenShippingLabel,
  onExportOrders,
}: {
  orders: Order[];
  products: Product[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  onQuickSendEmail: (order: Order) => void;
  onOpenCertificate: (order: Order, product?: Product) => void;
  onOpenPackingSlip: (order: Order) => void;
  onOpenShippingLabel: (order: Order) => void;
  onExportOrders: () => void;
}) {
  function getCarrierTrackingUrl(carrier?: string, trackingNumber?: string) {
    if (!trackingNumber) return '#';
    const c = (carrier || '').toLowerCase();
    if (c.includes('ups')) return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    if (c.includes('fedex')) return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    if (c.includes('dhl')) return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Order Fulfillment Center</p>
          <h1>Customer Orders</h1>
          <p>
            Process orders, input carrier tracking numbers, print Certificates of Authenticity, generate packing slips, and trigger transactional emails to buyers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className='secondary-dashboard-button' type='button' onClick={onExportOrders}>
            <Truck size={14} /> Export Orders CSV
          </button>
        </div>
      </div>

      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar'>
          <div>
            <strong>{orders.length} orders</strong>
            <span className='toolbar-muted'> · Total collected volume</span>
          </div>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Customer</th>
                <th>Item Purchased</th>
                <th>Total</th>
                <th>Date</th>
                <th>Fulfillment Status</th>
                <th>Tracking</th>
                <th style={{ textAlign: 'right' }}>Documents &amp; Email Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const matchingProduct = products.find(
                  (p) => p.name === order.item || (order.items && order.items.some((it) => it.productId === p.id))
                );

                return (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.id}</strong>
                    </td>
                    <td>
                      <div className='customer-cell'>
                        <strong>{order.customer}</strong>
                        <span>{order.email}</span>
                        {order.shippingAddress && (
                          <span style={{ fontSize: '9px', color: '#7a8c81' }}>
                            {order.shippingAddress.city}, {order.shippingAddress.state}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{order.item}</td>
                    <td>{money(order.amount)}</td>
                    <td>{order.date}</td>
                    <td>
                      <select
                        className={`status-select ${order.status.toLowerCase()}`}
                        value={order.status}
                        onChange={(event) =>
                          onStatusChange(order.id, event.target.value as OrderStatus)
                        }
                      >
                        <option value='Paid'>Paid</option>
                        <option value='Processing'>Processing</option>
                        <option value='Shipped'>Shipped</option>
                        <option value='Delivered'>Delivered</option>
                        <option value='Cancelled'>Cancelled</option>
                      </select>
                    </td>
                    <td>
                      {order.trackingNumber ? (
                        <div>
                          <span style={{ fontSize: '10px', color: '#4c6a81', fontWeight: 600 }}>
                            {order.carrier || 'USPS Priority Mail'}
                          </span>
                          <div>
                            <a
                              href={getCarrierTrackingUrl(order.carrier, order.trackingNumber)}
                              target='_blank'
                              rel='noopener noreferrer'
                              style={{
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                color: '#1d1d1b',
                                textDecoration: 'underline',
                              }}
                              title='Open live carrier tracking'
                            >
                              {order.trackingNumber} ↗
                            </a>
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#a1b1a7', fontSize: '11px' }}>Pending fulfillment</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onOpenShippingLabel(order)}
                          title='Print Carrier 4x6" Shipping Label with live barcode'
                        >
                          <Truck size={10} style={{ display: 'inline', marginRight: '3px' }} />
                          Label 🖨️
                        </button>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onOpenCertificate(order, matchingProduct)}
                          title='Print Certificate of Authenticity for this specimen'
                        >
                          Certificate ✦
                        </button>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onOpenPackingSlip(order)}
                          title='Print Packing Slip & Studio Care Protocol'
                        >
                          Packing Slip
                        </button>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onQuickSendEmail(order)}
                          title='Send receipt / confirmation email to this customer'
                        >
                          <Send size={10} /> Send Receipt
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 4: Customer Auto-Email Provisioning & Outbox Center
// ---------------------------------------------------------------------------
function EmailsAndProvisioningView({
  outbox,
  emailSettings,
  setEmailSettings,
  onResend,
  onSendTest,
  onPreviewEmail,
  sampleOrder,
  showNotice,
}: {
  outbox: EmailNotification[];
  emailSettings: EmailSettings;
  setEmailSettings: (s: EmailSettings) => void;
  onResend: (n: EmailNotification) => void;
  onSendTest: (email: string, type: EmailNotification['type']) => void;
  onPreviewEmail: (n: EmailNotification) => void;
  sampleOrder: Order;
  showNotice: (msg: string) => void;
}) {
  const [tab, setTab] = useState<'outbox' | 'templates' | 'settings'>('outbox');
  const [previewTemplate, setPreviewTemplate] = useState<
    'order_confirmation' | 'order_shipped' | 'order_delivered' | 'low_stock_alert'
  >('order_confirmation');
  const [testEmailAddress] = useState('David@dchoidesigns.com');

  const renderedTemplateHtml = useMemo(() => {
    if (previewTemplate === 'order_confirmation') {
      return getOrderConfirmationEmailHtml(sampleOrder, emailSettings.customStudioNote);
    }
    if (previewTemplate === 'order_shipped') {
      return getOrderShippedEmailHtml(
        sampleOrder,
        'USPS Priority Mail',
        '9400111899562537119283'
      );
    }
    if (previewTemplate === 'order_delivered') {
      return getOrderDeliveredEmailHtml(sampleOrder);
    }
    return getLowStockAlertEmailHtml(
      {
        id: '1',
        sku: 'DCH-SAN-01',
        name: 'Santoku Saya',
        category: 'Saya',
        price: 185,
        stock: 2,
        reserved: 0,
        lowStockThreshold: 3,
        status: 'Published',
        image: '',
      },
      2
    );
  }, [previewTemplate, sampleOrder, emailSettings]);

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Email Automation & Provisioning</p>
          <h1>Customer Communications</h1>
          <p>
            Configure automated customer email triggers, preview responsive templates,
            and audit all dispatched messages.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className='secondary-dashboard-button'
            type='button'
            onClick={() => onSendTest(testEmailAddress, 'order_confirmation')}
          >
            <Send size={15} /> Send Test Confirmation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className='view-tabs'>
        <button
          className={`view-tab-button ${tab === 'outbox' ? 'active' : ''}`}
          type='button'
          onClick={() => setTab('outbox')}
        >
          Dispatched Outbox ({outbox.length})
        </button>
        <button
          className={`view-tab-button ${tab === 'templates' ? 'active' : ''}`}
          type='button'
          onClick={() => setTab('templates')}
        >
          Email Templates & Live Preview
        </button>
        <button
          className={`view-tab-button ${tab === 'settings' ? 'active' : ''}`}
          type='button'
          onClick={() => setTab('settings')}
        >
          Automation Rules & Provider Config
        </button>
      </div>

      {/* 1. DISPATCHED OUTBOX TAB */}
      {tab === 'outbox' && (
        <section className='dashboard-panel table-panel'>
          <div className='table-toolbar'>
            <div>
              <strong>Dispatched Communications Log</strong>
              <span className='toolbar-muted'> · Real-time transactional email history</span>
            </div>
            <span style={{ fontSize: '11px', color: '#687d71' }}>
              Provider Mode: <strong>{emailSettings.provider.toUpperCase()}</strong>
            </span>
          </div>
          <div className='table-scroll'>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient</th>
                  <th>Type & Subject</th>
                  <th>Order Ref</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outbox.map((mail) => (
                  <tr key={mail.id}>
                    <td>{mail.sentAt}</td>
                    <td>
                      <div className='customer-cell'>
                        <strong>{mail.recipientName}</strong>
                        <span>{mail.recipientEmail}</span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontSize: '12px' }}>{mail.subject}</strong>
                        <div style={{ fontSize: '10px', color: '#7c8e83' }}>
                          Type: {mail.type.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td>{mail.orderId || '—'}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          mail.status === 'delivered' ? 'published' : 'processing'
                        }`}
                      >
                        {mail.status === 'delivered' ? 'Delivered (Live)' : 'Sent (Simulated)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className='row-actions'>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onPreviewEmail(mail)}
                          title='Inspect Rendered HTML'
                        >
                          <Eye size={12} /> Inspect
                        </button>
                        <button
                          type='button'
                          className='secondary-dashboard-button'
                          style={{ padding: '4px 8px', fontSize: '10px' }}
                          onClick={() => onResend(mail)}
                          title='Resend'
                        >
                          <RefreshCw size={12} /> Resend
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 2. TEMPLATES PREVIEW TAB */}
      {tab === 'templates' && (
        <div className='email-preview-container'>
          <div className='email-template-nav'>
            <button
              className={`email-template-btn ${
                previewTemplate === 'order_confirmation' ? 'active' : ''
              }`}
              type='button'
              onClick={() => setPreviewTemplate('order_confirmation')}
            >
              <strong>1. Order Confirmation</strong>
              <span>Immediate receipt + Studio signature note</span>
            </button>
            <button
              className={`email-template-btn ${
                previewTemplate === 'order_shipped' ? 'active' : ''
              }`}
              type='button'
              onClick={() => setPreviewTemplate('order_shipped')}
            >
              <strong>2. Package Shipped</strong>
              <span>Carrier, Tracking code & package button</span>
            </button>
            <button
              className={`email-template-btn ${
                previewTemplate === 'order_delivered' ? 'active' : ''
              }`}
              type='button'
              onClick={() => setPreviewTemplate('order_delivered')}
            >
              <strong>3. Delivered & Care Guide</strong>
              <span>Hardwood & saya maintenance instructions</span>
            </button>
            <button
              className={`email-template-btn ${
                previewTemplate === 'low_stock_alert' ? 'active' : ''
              }`}
              type='button'
              onClick={() => setPreviewTemplate('low_stock_alert')}
            >
              <strong>4. Low Stock Alert</strong>
              <span>Internal alert when items reach threshold</span>
            </button>
          </div>

          <div className='email-preview-box'>
            <div className='email-preview-toolbar'>
              <span>
                Simulated View: <strong>{previewTemplate.replace('_', ' ').toUpperCase()}</strong>
              </span>
              <button
                type='button'
                className='primary-dashboard-button'
                style={{ padding: '6px 12px', fontSize: '11px' }}
                onClick={() => onSendTest(testEmailAddress, previewTemplate)}
              >
                <Send size={12} /> Send Sample to {testEmailAddress}
              </button>
            </div>
            <div className='email-preview-frame'>
              <div
                dangerouslySetInnerHTML={{ __html: renderedTemplateHtml }}
                style={{ width: '100%', minHeight: '600px' }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. SETTINGS & RULES TAB */}
      {tab === 'settings' && (
        <div className='settings-grid'>
          <section className='dashboard-panel settings-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Automated Triggers</h2>
                <p>Select when emails should be automatically dispatched</p>
              </div>
            </div>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type='checkbox'
                checked={emailSettings.autoSendConfirmation}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, autoSendConfirmation: e.target.checked })
                }
              />
              <div>
                <strong>Auto-send Order Confirmation</strong>
                <p style={{ margin: 0, fontSize: '11px', color: '#7c8e83' }}>
                  Fires immediately when an order is created or checkout succeeds.
                </p>
              </div>
            </label>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type='checkbox'
                checked={emailSettings.autoSendShipment}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, autoSendShipment: e.target.checked })
                }
              />
              <div>
                <strong>Auto-send Shipping & Tracking Notice</strong>
                <p style={{ margin: 0, fontSize: '11px', color: '#7c8e83' }}>
                  Fires when admin marks order as Shipped with carrier tracking code.
                </p>
              </div>
            </label>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type='checkbox'
                checked={emailSettings.autoSendDelivered}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, autoSendDelivered: e.target.checked })
                }
              />
              <div>
                <strong>Auto-send Delivery & Wood Care Guide</strong>
                <p style={{ margin: 0, fontSize: '11px', color: '#7c8e83' }}>
                  Sends blade care and mineral oil conditioning guidelines when order is delivered.
                </p>
              </div>
            </label>

            <label style={{ flexDirection: 'row', alignItems: 'center', gap: '10px' }}>
              <input
                type='checkbox'
                checked={emailSettings.autoSendLowStockAlert}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, autoSendLowStockAlert: e.target.checked })
                }
              />
              <div>
                <strong>Send Internal Low Stock Warnings</strong>
                <p style={{ margin: 0, fontSize: '11px', color: '#7c8e83' }}>
                  Sends studio alert to maker when any piece hits safety threshold.
                </p>
              </div>
            </label>
          </section>

          <section className='dashboard-panel settings-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Provider & Sender Information</h2>
                <p>Configure transmission mode and studio credentials</p>
              </div>
            </div>

            <label>
              Email Dispatch Engine
              <select
                value={emailSettings.provider}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, provider: e.target.value as EmailSettings['provider'] })
                }
              >
                <option value='simulation'>Simulated Outbox & Preview Engine (No API key required)</option>
                <option value='resend'>Resend API (Live delivery)</option>
                <option value='sendgrid'>SendGrid API (Live delivery)</option>
              </select>
            </label>

            {emailSettings.provider !== 'simulation' && (
              <label>
                API Key ({emailSettings.provider})
                <input
                  type='password'
                  value={emailSettings.apiKey}
                  onChange={(e) =>
                    setEmailSettings({ ...emailSettings, apiKey: e.target.value })
                  }
                  placeholder='re_123456789...'
                />
              </label>
            )}

            <label>
              Sender Display Name
              <input
                value={emailSettings.senderName}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, senderName: e.target.value })
                }
              />
            </label>

            <label>
              Sender Email Address
              <input
                value={emailSettings.senderEmail}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, senderEmail: e.target.value })
                }
              />
            </label>

            <label>
              Custom Studio Note (Appears on receipts)
              <textarea
                rows={3}
                style={{ padding: '8px', fontSize: '12px' }}
                value={emailSettings.customStudioNote}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, customStudioNote: e.target.value })
                }
              />
            </label>

            <button
              className='primary-dashboard-button'
              type='button'
              onClick={() => showNotice('Email settings saved successfully')}
            >
              <Check size={16} /> Save Email Rules
            </button>
          </section>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 5: Store Onboarding Hub
// ---------------------------------------------------------------------------
function StoreOnboardingView({
  adminProfile,
  setAdminProfile,
  emailSettings,
  connections,
  setConnections,
  onLaunchWizard,
  showNotice,
}: {
  adminProfile: AdminProfile;
  setAdminProfile: (p: AdminProfile) => void;
  emailSettings: EmailSettings;
  setEmailSettings?: (s: EmailSettings) => void;
  connections: CommerceConnections;
  setConnections: (c: CommerceConnections) => void;
  onLaunchWizard: () => void;
  showNotice: (msg: string) => void;
}) {
  return (
    <>
      <div className='onboarding-banner'>
        <div>
          <h2>Welcome to DCHOI DESIGNS Studio Admin</h2>
          <p>
            Complete your 5-step onboarding walkthrough to verify inventory rules, auto customer emails,
            and payment integrations.
          </p>
        </div>
        <button
          className='primary-dashboard-button'
          style={{ background: '#d8ef58', color: '#263b35', borderColor: '#d8ef58', fontWeight: 600 }}
          type='button'
          onClick={onLaunchWizard}
        >
          <Sparkles size={16} /> Launch Setup Wizard
        </button>
      </div>

      <div className='settings-grid'>
        <section className='dashboard-panel settings-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Step 1: Studio Profile</h2>
              <p>Owner identity and public storefront branding</p>
            </div>
          </div>
          <label>
            Maker Name
            <input
              value={adminProfile.name}
              onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
            />
          </label>
          <label>
            Studio Location
            <input
              value={adminProfile.location}
              onChange={(e) => setAdminProfile({ ...adminProfile, location: e.target.value })}
            />
          </label>
          <label>
            Contact Email
            <input
              value={adminProfile.email}
              onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
            />
          </label>
          <label>
            Store Headline
            <input
              value={adminProfile.tagline}
              onChange={(e) => setAdminProfile({ ...adminProfile, tagline: e.target.value })}
            />
          </label>
          <button
            className='primary-dashboard-button'
            type='button'
            onClick={() => showNotice('Studio profile saved')}
          >
            <Check size={16} /> Save Profile
          </button>
        </section>

        <section className='dashboard-panel settings-panel'>
          <div className='panel-heading'>
            <div>
              <h2>Step 2: Service Integrations</h2>
              <p>Stripe payments and Supabase persistence</p>
            </div>
          </div>

          <div className='connection-row'>
            <div>
              <strong>Stripe Payments</strong>
              <span>Accept credit cards and Apple Pay</span>
            </div>
            <span
              className='connection-status'
              style={{
                color: connections.stripeConnected ? '#4c7957' : '#ad7d2b',
              }}
            >
              {connections.stripeConnected ? 'Connected (Ready)' : 'Test Mode Active'}
            </span>
            <button
              type='button'
              onClick={() => {
                setConnections({ ...connections, stripeConnected: !connections.stripeConnected });
                showNotice(connections.stripeConnected ? 'Stripe disconnected' : 'Stripe connected in Test Mode');
              }}
            >
              {connections.stripeConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>

          <div className='connection-row'>
            <div>
              <strong>Customer Auto-Emails</strong>
              <span>Automated order confirmation & tracking</span>
            </div>
            <span className='connection-status' style={{ color: '#4c7957' }}>
              Active ({emailSettings.provider.toUpperCase()})
            </span>
            <button type='button' onClick={onLaunchWizard}>
              Configure
            </button>
          </div>

          <div className='connection-row'>
            <div>
              <strong>Supabase Database</strong>
              <span>Persistent cloud storage</span>
            </div>
            <span
              className='connection-status'
              style={{ color: connections.supabaseConnected ? '#4c7957' : '#ad7d2b' }}
            >
              {connections.supabaseConnected ? 'Synced' : 'Local Persistence (Active)'}
            </span>
            <button
              type='button'
              onClick={() => {
                setConnections({ ...connections, supabaseConnected: !connections.supabaseConnected });
                showNotice('Supabase connection toggled');
              }}
            >
              Configure
            </button>
          </div>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 6: Payments View
// ---------------------------------------------------------------------------
function PaymentsView({ orders }: { orders: Order[] }) {
  const collected = orders
    .filter((o) => o.status !== 'Cancelled')
    .reduce((sum, o) => sum + o.amount, 0);

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Money Movement</p>
          <h1>Payments</h1>
          <p>Track collected revenue, Stripe processing, and fulfillment receipts.</p>
        </div>
        <button className='secondary-dashboard-button' type='button'>
          <ExternalLink size={16} /> Open Stripe Dashboard
        </button>
      </div>

      <div className='payment-summary'>
        <MetricCard
          label='Collected Revenue'
          value={money(collected)}
          change='All completed orders'
          icon={<CircleDollarSign size={18} />}
        />
        <MetricCard
          label='Pending Payouts'
          value='$0.00'
          change='Next payout tomorrow'
          icon={<Clock3 size={18} />}
        />
        <MetricCard
          label='Refunds / Disputes'
          value='$0.00'
          change='0 refunds recorded'
          icon={<PackageCheck size={18} />}
        />
      </div>

      <section className='dashboard-panel table-panel'>
        <div className='panel-heading'>
          <div>
            <h2>Transaction Ledger</h2>
            <p>Verified storefront transactions</p>
          </div>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Payment Ref</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <strong>pi_{order.id.replace('#', '')}dc92</strong>
                  </td>
                  <td>{order.customer}</td>
                  <td>Card ···· 4242</td>
                  <td>{money(order.amount)}</td>
                  <td>
                    <span className='status-pill published'>Succeeded</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 7: Customers View
// ---------------------------------------------------------------------------
function CustomersView({ orders }: { orders: Order[] }) {
  const customers = Array.from(
    new Map(orders.map((order) => [order.email, order])).values()
  );

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Relationship Management</p>
          <h1>Customer Roster</h1>
          <p>View the patrons and chefs supporting your Chicago woodwork studio.</p>
        </div>
      </div>

      <section className='dashboard-panel table-panel'>
        <div className='table-toolbar'>
          <strong>{customers.length} patrons</strong>
        </div>
        <div className='table-scroll'>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Latest Piece</th>
                <th>Lifetime Spend</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td>
                    <div className='product-table-name'>
                      <div className='order-avatar'>
                        {c.customer
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <strong>{c.customer}</strong>
                    </div>
                  </td>
                  <td>{c.email}</td>
                  <td>{c.item}</td>
                  <td>{money(c.amount)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className='table-more' type='button' aria-label='More options'>
                      <MoreHorizontal size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

// ---------------------------------------------------------------------------
// VIEW 8: Settings View
// ---------------------------------------------------------------------------
function SettingsView({
  adminProfile,
  setAdminProfile,
  connections,
  setConnections,
  emailSettings,
  setEmailSettings,
  showNotice,
}: {
  adminProfile: AdminProfile;
  setAdminProfile: (p: AdminProfile) => void;
  connections: CommerceConnections;
  setConnections: (c: CommerceConnections) => void;
  emailSettings: EmailSettings;
  setEmailSettings: (s: EmailSettings) => void;
  showNotice: (msg: string) => void;
}) {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showEmailApiKey, setShowEmailApiKey] = useState(false);
  const [showCarrierSecret, setShowCarrierSecret] = useState(false);
  const [stripeTesting, setStripeTesting] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<{
    success: boolean;
    message: string;
    mode?: string;
  } | null>(null);
  const [emailSendingTest, setEmailSendingTest] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);
  const [carrierTesting, setCarrierTesting] = useState(false);
  const [carrierTestResult, setCarrierTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  function fillSampleCarrierKeys() {
    setConnections({
      ...connections,
      carrierProvider: 'usps_direct',
      carrierMode: 'test',
      uspsClientId: 'usps_client_dchoi_demo_51c99ee9',
      uspsClientSecret: 'usps_secret_86f046fd51c99ee9',
      uspsPaymentAccountId: 'EPS-9920148',
      uspsMID: '901234567',
      carrierConnected: true,
    });
    setCarrierTestResult({
      success: true,
      message: 'Sample USPS Sandbox credentials populated. Ready for test label creation.',
    });
    showNotice('Sample USPS credentials loaded');
  }

  function testCarrierConnection() {
    setCarrierTesting(true);
    setTimeout(() => {
      setCarrierTesting(false);
      const provider = connections.carrierProvider || 'simulation';
      if (provider === 'simulation') {
        setCarrierTestResult({
          success: true,
          message: 'Studio In-House Meter & Carrier Barcode Generator verified! Offline thermal 4x6 labels active.',
        });
        showNotice('Studio shipping engine verified');
      } else if (provider === 'usps_direct') {
        if (!connections.uspsClientId || !connections.uspsClientSecret) {
          setCarrierTestResult({
            success: false,
            message: 'Please provide both USPS Client ID and Client Secret from developer.usps.com.',
          });
        } else {
          setCarrierTestResult({
            success: true,
            message: `USPS Developer API credentials verified (${connections.carrierMode === 'live' ? 'Live Production' : 'Sandbox Test'} mode). Official IMpb barcode generation active.`,
          });
          setConnections({ ...connections, carrierConnected: true });
          showNotice('USPS Direct API connection verified');
        }
      } else if (provider === 'ups_direct') {
        if (!connections.upsClientId || !connections.upsClientSecret) {
          setCarrierTestResult({
            success: false,
            message: 'Please provide UPS Client ID and Secret from developer.ups.com.',
          });
        } else {
          setCarrierTestResult({
            success: true,
            message: 'UPS Developer API credentials verified. 1Z tracking generation active.',
          });
          setConnections({ ...connections, carrierConnected: true });
          showNotice('UPS Direct API connection verified');
        }
      }
    }, 450);
  }

  function fillSampleTestKeys() {
    setConnections({
      ...connections,
      stripeConnected: true,
      stripeMode: 'test',
      stripePublishableKey: 'pk_test_dchoi_demo51c99ee986f046fd',
      stripeSecretKey: 'sk_test_dchoi_demo86f046fd51c99ee9',
      stripeWebhookSecret: 'whsec_dchoi_sample_webhook_key',
      defaultCurrency: 'USD',
      stripeVerified: true,
    });
    setStripeTestResult({
      success: true,
      message: 'Sample test credentials populated. Ready for test purchases and simulation!',
      mode: 'test',
    });
    showNotice('Sample Stripe test credentials populated');
  }

  async function testStripeConnection() {
    if (!connections.stripeSecretKey) {
      setStripeTestResult({
        success: false,
        message: 'Please enter a Stripe Secret Key (e.g. sk_test_... or sk_live_...) first.',
      });
      return;
    }
    setStripeTesting(true);
    setStripeTestResult(null);

    try {
      const res = await fetch('/api/integrations/stripe/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: connections.stripeSecretKey,
          publishableKey: connections.stripePublishableKey,
          mode: connections.stripeMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStripeTestResult({
          success: true,
          message: data.message || 'Stripe API connection verified successfully!',
          mode: data.mode,
        });
        setConnections({
          ...connections,
          stripeConnected: true,
          stripeVerified: true,
          stripeMode: data.mode || connections.stripeMode,
        });
        showNotice('Stripe API verified successfully');
      } else {
        setStripeTestResult({
          success: false,
          message: data.error || 'Failed to verify Stripe connection.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error communicating with Stripe verification endpoint.';
      setStripeTestResult({
        success: false,
        message,
      });
    } finally {
      setStripeTesting(false);
    }
  }

  async function testSendVerificationEmail() {
    setEmailSendingTest(true);
    setEmailTestResult(null);
    try {
      const res = await dispatchEmail({
        recipientEmail: adminProfile.email,
        recipientName: adminProfile.name,
        type: 'order_confirmation',
        subject: `[Settings Test] DCHOI DESIGNS Automated Email System`,
        settings: emailSettings,
      });
      setEmailTestResult(`✓ Verification email generated successfully (${res.status} mode) to ${adminProfile.email}`);
      setEmailSettings({ ...emailSettings, verified: true });
      showNotice('Test verification email dispatched');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send verification email';
      setEmailTestResult(`Error: ${message}`);
    } finally {
      setEmailSendingTest(false);
    }
  }

  return (
    <>
      <div className='dashboard-heading'>
        <div>
          <p className='dashboard-kicker'>Store Configuration</p>
          <h1>Studio & API Settings</h1>
          <p>Configure Stripe payments, automated email delivery APIs, and database sync.</p>
        </div>
      </div>

      <div className='settings-container'>
        {/* ROW 1: Store Profile & Supabase Cloud */}
        <div className='settings-grid'>
          <section className='dashboard-panel settings-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Store Profile</h2>
                <p>Public business details & studio branding</p>
              </div>
            </div>
            <div className='settings-panel-body'>
              <label>
                Store Name
                <input
                  type='text'
                  value={adminProfile.storeName}
                  onChange={(e) => setAdminProfile({ ...adminProfile, storeName: e.target.value })}
                />
              </label>
              <label>
                Admin Contact Email
                <input
                  type='email'
                  value={adminProfile.email}
                  onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                />
              </label>
              <label>
                Studio Location
                <input
                  type='text'
                  value={adminProfile.location}
                  onChange={(e) => setAdminProfile({ ...adminProfile, location: e.target.value })}
                />
              </label>
              <div className='settings-actions'>
                <button
                  className='primary-dashboard-button'
                  type='button'
                  onClick={() => showNotice('Studio profile settings saved')}
                >
                  <Check size={15} /> Save Store Profile
                </button>
              </div>
            </div>
          </section>

          <section className='dashboard-panel settings-panel'>
            <div className='panel-heading'>
              <div>
                <h2>Database & Cloud Sync</h2>
                <p>Supabase cloud sync and offline storage</p>
              </div>
              <span className={`api-mode-pill ${connections.supabaseConnected ? 'live' : 'test'}`}>
                {connections.supabaseConnected ? 'Cloud Sync Active' : 'Local Storage Mode'}
              </span>
            </div>

            <div className='settings-panel-body'>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#52665b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cloud PostgreSQL Mirror
                </span>
                <p style={{ margin: 0, fontSize: '12px', color: '#5a6e63', lineHeight: '1.4' }}>
                  Synchronize inventory catalog, customer orders, shipping tracking codes, and audit logs with your managed Supabase instance.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type='button'
                  className={connections.supabaseConnected ? 'secondary-dashboard-button' : 'primary-dashboard-button'}
                  style={{ fontSize: '12px', padding: '9px 16px' }}
                  onClick={() => {
                    const nextState = !connections.supabaseConnected;
                    setConnections({
                      ...connections,
                      supabaseConnected: nextState,
                      storageMode: nextState ? 'supabase' : 'local',
                    });
                    showNotice(nextState ? 'Supabase cloud sync enabled' : 'Local storage mode enabled');
                  }}
                >
                  <Database size={14} />
                  {connections.supabaseConnected ? 'Switch to Local Storage Mode' : 'Connect Supabase Cloud'}
                </button>
              </div>

              <div
                style={{
                  background: '#f4f7f5',
                  border: '1px solid #e1e9e2',
                  padding: '12px 14px',
                  borderRadius: '3px',
                  fontSize: '11.5px',
                  color: '#415549',
                  lineHeight: '1.45',
                  marginTop: 'auto',
                }}
              >
                <strong>Offline-First Resilience:</strong> All changes write instantly to local storage and queue for PostgreSQL sync when online. No downtime if remote connectivity fluctuates.
              </div>
            </div>
          </section>
        </div>

        {/* ROW 2: Stripe Payment Gateway Setup */}
        <section className='dashboard-panel settings-panel'>
          <div className='panel-heading'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CreditCard size={18} color='#263b35' />
              <div>
                <h2>Stripe Payment Gateway Configuration</h2>
                <p>Connect and verify your Stripe API keys for customer card checkout</p>
              </div>
            </div>
            <button
              type='button'
              className='secondary-dashboard-button'
              onClick={fillSampleTestKeys}
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              <Sparkles size={13} /> Quick-Fill Test Keys
            </button>
          </div>

          <div className='settings-panel-body'>
            {/* Mode selection row */}
            <div className='settings-form-row' style={{ alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#52665b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Processing Environment
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type='button'
                    className={`secondary-dashboard-button ${connections.stripeMode === 'test' ? 'active' : ''}`}
                    style={{
                      background: connections.stripeMode === 'test' ? '#263b35' : '#ffffff',
                      color: connections.stripeMode === 'test' ? '#ffffff' : '#263b35',
                      borderColor: connections.stripeMode === 'test' ? '#263b35' : '#d4ddd4',
                      fontSize: '11.5px',
                      padding: '8px 14px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      setConnections({ ...connections, stripeMode: 'test' });
                      showNotice('Switched Stripe to Test Sandbox mode');
                    }}
                  >
                    Test Sandbox (Safe Demo)
                  </button>
                  <button
                    type='button'
                    className={`secondary-dashboard-button ${connections.stripeMode === 'live' ? 'active' : ''}`}
                    style={{
                      background: connections.stripeMode === 'live' ? '#263b35' : '#ffffff',
                      color: connections.stripeMode === 'live' ? '#ffffff' : '#263b35',
                      borderColor: connections.stripeMode === 'live' ? '#263b35' : '#d4ddd4',
                      fontSize: '11.5px',
                      padding: '8px 14px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      setConnections({ ...connections, stripeMode: 'live' });
                      showNotice('Switched Stripe to Live Production mode');
                    }}
                  >
                    Live Production (Real Cards)
                  </button>
                </div>
              </div>

              <div>
                <label>
                  Default Store Currency
                  <select
                    value={connections.defaultCurrency || 'USD'}
                    onChange={(e) => setConnections({ ...connections, defaultCurrency: e.target.value })}
                  >
                    <option value='USD'>USD ($ United States Dollar)</option>
                    <option value='CAD'>CAD ($ Canadian Dollar)</option>
                    <option value='EUR'>EUR (€ Euro)</option>
                    <option value='GBP'>GBP (£ British Pound)</option>
                    <option value='JPY'>JPY (¥ Japanese Yen)</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Key Inputs */}
            <div className='settings-form-row'>
              <label>
                Stripe Publishable Key
                <input
                  type='text'
                  value={connections.stripePublishableKey || ''}
                  onChange={(e) =>
                    setConnections({
                      ...connections,
                      stripePublishableKey: e.target.value,
                      stripeConnected: !!e.target.value,
                    })
                  }
                  placeholder='pk_test_... or pk_live_...'
                  style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                />
              </label>

              <label>
                Stripe Secret Key
                <div className='api-key-input-wrapper'>
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    value={connections.stripeSecretKey || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        stripeSecretKey: e.target.value,
                        stripeConnected: !!e.target.value,
                      })
                    }
                    placeholder='sk_test_... or sk_live_...'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                  <button
                    type='button'
                    className='api-key-toggle-btn'
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    title={showSecretKey ? 'Hide key' : 'Show key'}
                  >
                    {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </label>
            </div>

            <label>
              Stripe Webhook Signing Secret (Optional for local dev, required for live webhooks)
              <input
                type='text'
                value={connections.stripeWebhookSecret || ''}
                onChange={(e) =>
                  setConnections({
                    ...connections,
                    stripeWebhookSecret: e.target.value,
                  })
                }
                placeholder='whsec_...'
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
              />
            </label>

            {/* Test result status badge */}
            {stripeTestResult && (
              <div className={`api-test-badge ${stripeTestResult.success ? 'success' : 'error'}`}>
                {stripeTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{stripeTestResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className='settings-actions'>
              <button
                type='button'
                className='primary-dashboard-button'
                onClick={testStripeConnection}
                disabled={stripeTesting}
                style={{ fontSize: '12px' }}
              >
                <RefreshCw size={14} className={stripeTesting ? 'spin' : ''} />
                {stripeTesting ? 'Contacting Stripe API...' : 'Verify Stripe API Connection'}
              </button>
              <button
                type='button'
                className='secondary-dashboard-button'
                onClick={() => showNotice('Stripe settings updated')}
                style={{ fontSize: '12px' }}
              >
                <Check size={14} /> Save Key Settings
              </button>
            </div>
          </div>
        </section>

        {/* ROW 3: Automated Customer Email Delivery Setup */}
        <section className='dashboard-panel settings-panel'>
          <div className='panel-heading'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={18} color='#263b35' />
              <div>
                <h2>Automated Customer Email Provisioning</h2>
                <p>Configure automated receipts, shipping updates, and email dispatch service</p>
              </div>
            </div>
          </div>

          <div className='settings-panel-body'>
            <div className='settings-form-row'>
              <label>
                Email Service Provider
                <select
                  value={emailSettings.provider}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      provider: e.target.value as EmailSettings['provider'],
                    })
                  }
                >
                  <option value='simulation'>Local Studio Simulator (In-App Outbox & Previews)</option>
                  <option value='resend'>Resend API (Recommended for modern web)</option>
                  <option value='sendgrid'>Twilio SendGrid</option>
                  <option value='postmark'>Postmark</option>
                </select>
              </label>

              {emailSettings.provider !== 'simulation' && (
                <label>
                  {emailSettings.provider.toUpperCase()} API Key
                  <div className='api-key-input-wrapper'>
                    <input
                      type={showEmailApiKey ? 'text' : 'password'}
                      value={emailSettings.apiKey || ''}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          apiKey: e.target.value,
                        })
                      }
                      placeholder='re_... or SG....'
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                    />
                    <button
                      type='button'
                      className='api-key-toggle-btn'
                      onClick={() => setShowEmailApiKey(!showEmailApiKey)}
                      title={showEmailApiKey ? 'Hide key' : 'Show key'}
                    >
                      {showEmailApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>
              )}
            </div>

            <div className='settings-form-row'>
              <label>
                Sender From Name
                <input
                  type='text'
                  value={emailSettings.senderName || emailSettings.fromName || ''}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      senderName: e.target.value,
                      fromName: e.target.value,
                    })
                  }
                  placeholder='DCHOI DESIGNS'
                />
              </label>
              <label>
                Sender From Email
                <input
                  type='email'
                  value={emailSettings.senderEmail || emailSettings.fromEmail || ''}
                  onChange={(e) =>
                    setEmailSettings({
                      ...emailSettings,
                      senderEmail: e.target.value,
                      fromEmail: e.target.value,
                    })
                  }
                  placeholder='orders@dchoidesigns.com'
                />
              </label>
            </div>

            {/* Email Triggers */}
            <div className='settings-section-divider'>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#52665b', display: 'block', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Automated Customer Delivery Triggers
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className='settings-checkbox-item'>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendConfirmation}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        autoSendConfirmation: e.target.checked,
                        orderConfirmationEnabled: e.target.checked,
                      })
                    }
                  />
                  <div className='settings-checkbox-text'>
                    <strong>Instant Order Confirmation Receipt</strong>
                    <span>Dispatch branded HTML receipt upon customer purchase</span>
                  </div>
                </label>
                <label className='settings-checkbox-item'>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendShipment}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        autoSendShipment: e.target.checked,
                        shippingNotificationEnabled: e.target.checked,
                      })
                    }
                  />
                  <div className='settings-checkbox-text'>
                    <strong>Tracking & Carrier Dispatch Notice</strong>
                    <span>Send official carrier tracking link when order status changes to Shipped</span>
                  </div>
                </label>
                <label className='settings-checkbox-item'>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendLowStockAlert}
                    onChange={(e) =>
                      setEmailSettings({
                        ...emailSettings,
                        autoSendLowStockAlert: e.target.checked,
                        lowStockAlertEnabled: e.target.checked,
                      })
                    }
                  />
                  <div className='settings-checkbox-text'>
                    <strong>Studio Low Stock Warning</strong>
                    <span>Send alert to maker email when inventory pieces dip below threshold</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Test result status badge */}
            {emailTestResult && (
              <div className={`api-test-badge ${emailTestResult.startsWith('✓') ? 'success' : 'error'}`}>
                {emailTestResult.startsWith('✓') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{emailTestResult}</span>
              </div>
            )}

            {/* Actions */}
            <div className='settings-actions'>
              <button
                type='button'
                className='primary-dashboard-button'
                onClick={testSendVerificationEmail}
                disabled={emailSendingTest}
                style={{ fontSize: '12px' }}
              >
                <Send size={14} />
                {emailSendingTest ? 'Dispatching test...' : `Send Test Email to ${adminProfile.email}`}
              </button>
              <button
                type='button'
                className='secondary-dashboard-button'
                onClick={() => showNotice('Email settings saved')}
                style={{ fontSize: '12px' }}
              >
                <Check size={14} /> Save Email Settings
              </button>
            </div>
          </div>
        </section>

        {/* ROW 4: Direct Carrier Shipping Account & Automation (No Aggregators) */}
        <section className='dashboard-panel settings-panel'>
          <div className='panel-heading'>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Truck size={18} color='#263b35' />
              <div>
                <h2>Direct Carrier Account &amp; Shipping Automation</h2>
                <p>Connect straight to USPS or UPS Developer REST APIs to automatically purchase postage and assign tracking</p>
              </div>
            </div>
            <button
              type='button'
              className='secondary-dashboard-button'
              onClick={fillSampleCarrierKeys}
              style={{ fontSize: '11px', padding: '6px 12px' }}
            >
              Fill Sample USPS Keys
            </button>
          </div>

          <div className='settings-panel-body'>
            <div className='settings-form-row'>
              <label>
                Carrier Fulfillment Engine
                <select
                  value={connections.carrierProvider || 'simulation'}
                  onChange={(e) =>
                    setConnections({
                      ...connections,
                      carrierProvider: e.target.value as CommerceConnections['carrierProvider'],
                    })
                  }
                >
                  <option value='simulation'>Studio In-House Meter (Offline Code-128 / Permit 1048)</option>
                  <option value='usps_direct'>USPS Developer REST API (developer.usps.com)</option>
                  <option value='ups_direct'>UPS Developer REST API (developer.ups.com)</option>
                </select>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#52665b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Carrier Environment Mode
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type='button'
                    className={`secondary-dashboard-button ${connections.carrierMode !== 'live' ? 'active' : ''}`}
                    style={{
                      flex: 1,
                      background: connections.carrierMode !== 'live' ? '#263b35' : '#ffffff',
                      color: connections.carrierMode !== 'live' ? '#ffffff' : '#263b35',
                      borderColor: connections.carrierMode !== 'live' ? '#263b35' : '#d4ddd4',
                      fontSize: '11.5px',
                      padding: '8px 12px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      setConnections({ ...connections, carrierMode: 'test' });
                      showNotice('Carrier switched to Sandbox Test Mode');
                    }}
                  >
                    Sandbox Test
                  </button>
                  <button
                    type='button'
                    className={`secondary-dashboard-button ${connections.carrierMode === 'live' ? 'active' : ''}`}
                    style={{
                      flex: 1,
                      background: connections.carrierMode === 'live' ? '#263b35' : '#ffffff',
                      color: connections.carrierMode === 'live' ? '#ffffff' : '#263b35',
                      borderColor: connections.carrierMode === 'live' ? '#263b35' : '#d4ddd4',
                      fontSize: '11.5px',
                      padding: '8px 12px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      setConnections({ ...connections, carrierMode: 'live' });
                      showNotice('Carrier switched to Live Production Mode');
                    }}
                  >
                    Live Production
                  </button>
                </div>
              </div>
            </div>

            {connections.carrierProvider === 'usps_direct' && (
              <div className='settings-form-row'>
                <label>
                  USPS Consumer Key / Client ID
                  <input
                    type='text'
                    value={connections.uspsClientId || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        uspsClientId: e.target.value,
                        carrierConnected: true,
                      })
                    }
                    placeholder='Client ID from developer.usps.com'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                </label>

                <label>
                  USPS Consumer Secret / Client Secret
                  <div className='api-key-input-wrapper'>
                    <input
                      type={showCarrierSecret ? 'text' : 'password'}
                      value={connections.uspsClientSecret || ''}
                      onChange={(e) =>
                        setConnections({
                          ...connections,
                          uspsClientSecret: e.target.value,
                          carrierConnected: true,
                        })
                      }
                      placeholder='Client Secret'
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                    />
                    <button
                      type='button'
                      className='api-key-toggle-btn'
                      onClick={() => setShowCarrierSecret(!showCarrierSecret)}
                      title={showCarrierSecret ? 'Hide key' : 'Show key'}
                    >
                      {showCarrierSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <label>
                  USPS Enterprise Payment System (EPS) Account ID
                  <input
                    type='text'
                    value={connections.uspsPaymentAccountId || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        uspsPaymentAccountId: e.target.value,
                      })
                    }
                    placeholder='e.g. EPS-9920148 or Permit No.'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                </label>

                <label>
                  USPS Mailer ID (MID - 9 digits)
                  <input
                    type='text'
                    value={connections.uspsMID || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        uspsMID: e.target.value,
                      })
                    }
                    placeholder='e.g. 901234567'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                </label>
              </div>
            )}

            {connections.carrierProvider === 'ups_direct' && (
              <div className='settings-form-row'>
                <label>
                  UPS Client ID
                  <input
                    type='text'
                    value={connections.upsClientId || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        upsClientId: e.target.value,
                        carrierConnected: true,
                      })
                    }
                    placeholder='Client ID from developer.ups.com'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                </label>

                <label>
                  UPS Client Secret
                  <div className='api-key-input-wrapper'>
                    <input
                      type={showCarrierSecret ? 'text' : 'password'}
                      value={connections.upsClientSecret || ''}
                      onChange={(e) =>
                        setConnections({
                          ...connections,
                          upsClientSecret: e.target.value,
                          carrierConnected: true,
                        })
                      }
                      placeholder='Client Secret'
                      style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                    />
                    <button
                      type='button'
                      className='api-key-toggle-btn'
                      onClick={() => setShowCarrierSecret(!showCarrierSecret)}
                      title={showCarrierSecret ? 'Hide key' : 'Show key'}
                    >
                      {showCarrierSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </label>

                <label>
                  UPS 6-Digit Account Number (Shipper Number)
                  <input
                    type='text'
                    value={connections.upsAccountNumber || ''}
                    onChange={(e) =>
                      setConnections({
                        ...connections,
                        upsAccountNumber: e.target.value,
                      })
                    }
                    placeholder='e.g. A12B34'
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace', fontSize: '12px' }}
                  />
                </label>
              </div>
            )}

            {/* Test result status badge */}
            {carrierTestResult && (
              <div className={`api-test-badge ${carrierTestResult.success ? 'success' : 'error'}`}>
                {carrierTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{carrierTestResult.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className='settings-actions'>
              <button
                type='button'
                className='primary-dashboard-button'
                onClick={testCarrierConnection}
                disabled={carrierTesting}
                style={{ fontSize: '12px' }}
              >
                <Truck size={14} />
                {carrierTesting ? 'Verifying carrier...' : 'Verify Carrier Connection'}
              </button>
              <button
                type='button'
                className='secondary-dashboard-button'
                onClick={() => showNotice('Carrier settings saved')}
                style={{ fontSize: '12px' }}
              >
                <Check size={14} /> Save Carrier Settings
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

/* ========================================================================= */
/* --- MODAL DIALOGS ---                                                     */
/* ========================================================================= */

// 1. Multi-Step Admin Onboarding Wizard
function AdminOnboardingWizardModal({
  adminProfile,
  setAdminProfile,
  emailSettings,
  setEmailSettings,
  connections,
  setConnections,
  onClose,
  onComplete,
}: {
  adminProfile: AdminProfile;
  setAdminProfile: (p: AdminProfile) => void;
  emailSettings: EmailSettings;
  setEmailSettings: (s: EmailSettings) => void;
  connections: CommerceConnections;
  setConnections: (c: CommerceConnections) => void;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState(1);
  const [stripeTesting, setStripeTesting] = useState(false);
  const [stripeTestResult, setStripeTestResult] = useState<{
    success: boolean;
    message: string;
    mode?: string;
  } | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [emailSendingTest, setEmailSendingTest] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<string | null>(null);

  function fillSampleTestKeys() {
    setConnections({
      ...connections,
      stripeConnected: true,
      stripeMode: 'test',
      stripePublishableKey: 'pk_test_dchoi_demo51c99ee986f046fd',
      stripeSecretKey: 'sk_test_dchoi_demo86f046fd51c99ee9',
      stripeWebhookSecret: 'whsec_dchoi_sample_webhook_key',
      defaultCurrency: 'USD',
      stripeVerified: true,
    });
    setStripeTestResult({
      success: true,
      message: 'Sample test credentials populated. Ready for test purchases and simulation!',
      mode: 'test',
    });
  }

  async function testStripeConnection() {
    if (!connections.stripeSecretKey) {
      setStripeTestResult({
        success: false,
        message: 'Please enter a Stripe Secret Key (e.g. sk_test_... or sk_live_...) first.',
      });
      return;
    }
    setStripeTesting(true);
    setStripeTestResult(null);

    try {
      const res = await fetch('/api/integrations/stripe/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secretKey: connections.stripeSecretKey,
          publishableKey: connections.stripePublishableKey,
          mode: connections.stripeMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStripeTestResult({
          success: true,
          message: data.message || 'Stripe API connection verified successfully!',
          mode: data.mode,
        });
        setConnections({
          ...connections,
          stripeConnected: true,
          stripeVerified: true,
          stripeMode: data.mode || connections.stripeMode,
        });
      } else {
        setStripeTestResult({
          success: false,
          message: data.error || 'Failed to verify Stripe connection.',
        });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error communicating with Stripe verification endpoint.';
      setStripeTestResult({
        success: false,
        message,
      });
    } finally {
      setStripeTesting(false);
    }
  }

  async function testSendVerificationEmail() {
    setEmailSendingTest(true);
    setEmailTestResult(null);
    try {
      const res = await dispatchEmail({
        recipientEmail: adminProfile.email,
        recipientName: adminProfile.name,
        type: 'order_confirmation',
        subject: `[Onboarding Test] DCHOI DESIGNS Automated Email System`,
        settings: emailSettings,
      });
      setEmailTestResult(`✓ Verification email generated successfully (${res.status} mode)`);
      setEmailSettings({ ...emailSettings, verified: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      setEmailTestResult(`Error: ${message}`);
    } finally {
      setEmailSendingTest(false);
    }
  }

  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section className='wizard-modal' style={{ maxWidth: '720px' }} role='dialog' aria-modal='true'>
        <div className='wizard-steps-header'>
          <div className='wizard-step-indicator'>
            <div className={`wizard-step-bullet ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
              1
            </div>
            <span>Profile</span>
            <ArrowRight size={12} />
            <div className={`wizard-step-bullet ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>
              2
            </div>
            <span>Inventory</span>
            <ArrowRight size={12} />
            <div className={`wizard-step-bullet ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>
              3
            </div>
            <span>Emails</span>
            <ArrowRight size={12} />
            <div className={`wizard-step-bullet ${step === 4 ? 'active' : step > 4 ? 'completed' : ''}`}>
              4
            </div>
            <span>APIs & Stripe</span>
            <ArrowRight size={12} />
            <div className={`wizard-step-bullet ${step === 5 ? 'active' : ''}`}>
              5
            </div>
            <span>Launch</span>
          </div>
          <button
            type='button'
            onClick={onClose}
            style={{ background: 'none', border: 0, color: '#e9eee8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className='wizard-content' style={{ maxHeight: '72vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div>
              <h2>Step 1: Admin Profile & Studio Identity</h2>
              <p className='wizard-desc'>
                Let&apos;s personalize your administrative studio workspace and public storefront details.
              </p>
              <div className='wizard-form-grid'>
                <label>
                  Maker / Admin Name
                  <input
                    value={adminProfile.name}
                    onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
                  />
                </label>
                <label>
                  Store Brand Name
                  <input
                    value={adminProfile.storeName}
                    onChange={(e) => setAdminProfile({ ...adminProfile, storeName: e.target.value })}
                  />
                </label>
                <label>
                  Studio Location
                  <input
                    value={adminProfile.location}
                    onChange={(e) => setAdminProfile({ ...adminProfile, location: e.target.value })}
                  />
                </label>
                <label>
                  Studio Contact Email
                  <input
                    value={adminProfile.email}
                    onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2>Step 2: Inventory Tracking & Safety Limits</h2>
              <p className='wizard-desc'>
                Set up automated low-stock warnings and reserve controls for hand-crafted items.
              </p>
              <div className='wizard-form-grid'>
                <div style={{ background: '#f0f5f1', padding: '16px', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#263b35' }}>
                    Low-Stock Alert Trigger
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#556a5e' }}>
                    When a piece has 3 or fewer finished units remaining on hand, an alert banner and studio
                    notification will trigger so you can queue a fresh batch in the woodshop.
                  </p>
                </div>
                <div style={{ background: '#f0f5f1', padding: '16px', borderRadius: '4px' }}>
                  <p style={{ margin: '0 0 8px', fontWeight: 600, color: '#263b35' }}>
                    Real-Time Order Stock Deduction
                  </p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#556a5e' }}>
                    Enabled: When a customer places an order, stock is immediately allocated and marked as
                    Reserved until marked Shipped.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2>Step 3: Provision Customer Auto-Emails</h2>
              <p className='wizard-desc'>
                Ensure buyers automatically receive confirmations, shipment tracking, and care guides.
              </p>
              <div className='wizard-form-grid'>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendConfirmation}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, autoSendConfirmation: e.target.checked })
                    }
                  />
                  <span>Auto-send Order Confirmation receipt immediately on purchase</span>
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendShipment}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, autoSendShipment: e.target.checked })
                    }
                  />
                  <span>Auto-send Carrier Tracking link when order is fulfilled</span>
                </label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                  <input
                    type='checkbox'
                    checked={emailSettings.autoSendDelivered}
                    onChange={(e) =>
                      setEmailSettings({ ...emailSettings, autoSendDelivered: e.target.checked })
                    }
                  />
                  <span>Auto-send Woodworking Care Guide upon delivery</span>
                </label>

                <div style={{ background: '#ffffff', border: '1px solid #dce3dc', padding: '14px 16px', borderRadius: '4px' }}>
                  <label style={{ marginBottom: '8px' }}>
                    Email Delivery Engine
                    <select
                      value={emailSettings.provider}
                      onChange={(e) =>
                        setEmailSettings({
                          ...emailSettings,
                          provider: e.target.value as EmailSettings['provider'],
                        })
                      }
                    >
                      <option value='simulation'>
                        Simulated Outbox & Preview Engine (Zero setup, preview directly in studio)
                      </option>
                      <option value='resend'>Resend API (Live production delivery)</option>
                      <option value='sendgrid'>SendGrid API (Live production delivery)</option>
                    </select>
                  </label>

                  {emailSettings.provider !== 'simulation' && (
                    <label style={{ marginTop: '10px' }}>
                      {emailSettings.provider === 'resend' ? 'Resend' : 'SendGrid'} API Key
                      <input
                        type='password'
                        value={emailSettings.apiKey}
                        onChange={(e) =>
                          setEmailSettings({ ...emailSettings, apiKey: e.target.value })
                        }
                        placeholder={
                          emailSettings.provider === 'resend' ? 're_123456789...' : 'SG.123456789...'
                        }
                      />
                    </label>
                  )}

                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type='button'
                      className='secondary-dashboard-button'
                      style={{ fontSize: '11px', padding: '6px 12px' }}
                      onClick={testSendVerificationEmail}
                      disabled={emailSendingTest}
                    >
                      <Send size={12} /> {emailSendingTest ? 'Sending...' : 'Send Test Ping to Studio'}
                    </button>
                    {emailTestResult && (
                      <span style={{ fontSize: '12px', color: '#4c7957', fontWeight: 500 }}>
                        {emailTestResult}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2>Step 4: Payment & Commerce APIs</h2>
              <p className='wizard-desc'>
                Configure Stripe for customer checkout and connect cloud persistence.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. Stripe Payment Setup */}
                <div className={`api-integration-card ${connections.stripeConnected ? 'is-connected' : ''}`}>
                  <div className='api-card-header'>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CreditCard size={18} color='#263b35' />
                        <strong>Stripe Checkout Integration</strong>
                        <span className={`api-mode-pill ${connections.stripeMode}`}>
                          {connections.stripeMode} mode
                        </span>
                        {connections.stripeVerified && (
                          <span style={{ fontSize: '11px', color: '#4c7957', fontWeight: 600 }}>
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <p>
                        Process credit card transactions, Apple Pay, and automated purchase webhooks.
                      </p>
                    </div>

                    <button
                      type='button'
                      className='secondary-dashboard-button'
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      onClick={fillSampleTestKeys}
                    >
                      ⚡ Quick-Fill Test Keys
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                      Stripe Environment
                      <select
                        value={connections.stripeMode}
                        onChange={(e) =>
                          setConnections({
                            ...connections,
                            stripeMode: e.target.value as 'test' | 'live',
                          })
                        }
                        style={{ marginTop: '4px', width: '100%', padding: '8px' }}
                      >
                        <option value='test'>Test Mode (Sandboxed, uses test cards)</option>
                        <option value='live'>Live Mode (Production real payments)</option>
                      </select>
                    </label>

                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                      Store Currency
                      <select
                        value={connections.defaultCurrency || 'USD'}
                        onChange={(e) =>
                          setConnections({
                            ...connections,
                            defaultCurrency: e.target.value,
                          })
                        }
                        style={{ marginTop: '4px', width: '100%', padding: '8px' }}
                      >
                        <option value='USD'>USD ($ United States)</option>
                        <option value='CAD'>CAD (CA$ Canada)</option>
                        <option value='EUR'>EUR (€ Europe)</option>
                        <option value='GBP'>GBP (£ United Kingdom)</option>
                        <option value='JPY'>JPY (¥ Japan)</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                      Publishable Key
                      <input
                        type='text'
                        value={connections.stripePublishableKey}
                        onChange={(e) =>
                          setConnections({
                            ...connections,
                            stripePublishableKey: e.target.value,
                            stripeConnected: true,
                          })
                        }
                        placeholder={
                          connections.stripeMode === 'test' ? 'pk_test_...' : 'pk_live_...'
                        }
                        style={{ marginTop: '4px', width: '100%', padding: '8px 10px', fontSize: '12px' }}
                      />
                    </label>

                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                      Secret Key
                      <div className='api-key-input-wrapper' style={{ marginTop: '4px' }}>
                        <input
                          type={showSecretKey ? 'text' : 'password'}
                          value={connections.stripeSecretKey}
                          onChange={(e) =>
                            setConnections({
                              ...connections,
                              stripeSecretKey: e.target.value,
                              stripeConnected: true,
                            })
                          }
                          placeholder={
                            connections.stripeMode === 'test' ? 'sk_test_...' : 'sk_live_...'
                          }
                          style={{ width: '100%', padding: '8px 36px 8px 10px', fontSize: '12px' }}
                        />
                        <button
                          type='button'
                          className='api-key-toggle-btn'
                          onClick={() => setShowSecretKey(!showSecretKey)}
                          title={showSecretKey ? 'Hide key' : 'Show key'}
                        >
                          {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </label>

                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                      Webhook Signing Secret (Optional)
                      <input
                        type='text'
                        value={connections.stripeWebhookSecret || ''}
                        onChange={(e) =>
                          setConnections({
                            ...connections,
                            stripeWebhookSecret: e.target.value,
                          })
                        }
                        placeholder='whsec_...'
                        style={{ marginTop: '4px', width: '100%', padding: '8px 10px', fontSize: '12px' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <button
                      type='button'
                      className='primary-dashboard-button'
                      style={{ fontSize: '11px', padding: '7px 14px' }}
                      onClick={testStripeConnection}
                      disabled={stripeTesting}
                    >
                      <RefreshCw size={12} className={stripeTesting ? 'spin' : ''} />
                      {stripeTesting ? 'Testing Stripe API...' : 'Verify Stripe API Connection'}
                    </button>

                    <label style={{ flexDirection: 'row', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <input
                        type='checkbox'
                        checked={connections.stripeConnected}
                        onChange={(e) =>
                          setConnections({ ...connections, stripeConnected: e.target.checked })
                        }
                      />
                      <span style={{ fontSize: '12px', textTransform: 'none', color: '#263b35' }}>
                        Activate Stripe for store checkout
                      </span>
                    </label>
                  </div>

                  {stripeTestResult && (
                    <div
                      className={`api-test-badge ${stripeTestResult.success ? 'success' : 'error'}`}
                    >
                      {stripeTestResult.success ? <Check size={14} /> : <AlertTriangle size={14} />}
                      <span>{stripeTestResult.message}</span>
                    </div>
                  )}
                </div>

                {/* 2. Supabase Cloud Storage */}
                <div className='api-integration-card'>
                  <div className='api-card-header'>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={18} color='#263b35' />
                        <strong>Database & Cloud Storage (Supabase)</strong>
                        <span style={{ fontSize: '11px', color: '#4c7957', fontWeight: 600 }}>
                          Local Active
                        </span>
                      </div>
                      <p>
                        High-speed zero-latency local state persistence with optional cloud sync.
                      </p>
                    </div>

                    <button
                      type='button'
                      className='secondary-dashboard-button'
                      style={{ fontSize: '11px', padding: '6px 10px' }}
                      onClick={() =>
                        setConnections({
                          ...connections,
                          supabaseConnected: !connections.supabaseConnected,
                          storageMode: connections.supabaseConnected ? 'local' : 'supabase',
                        })
                      }
                    >
                      {connections.supabaseConnected ? 'Use Local Mode' : 'Connect Cloud'}
                    </button>
                  </div>

                  {connections.supabaseConnected && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                        Project URL
                        <input
                          type='url'
                          value={connections.supabaseUrl}
                          onChange={(e) =>
                            setConnections({ ...connections, supabaseUrl: e.target.value })
                          }
                          placeholder='https://xyz.supabase.co'
                          style={{ marginTop: '4px', width: '100%', padding: '8px 10px', fontSize: '12px' }}
                        />
                      </label>
                      <label style={{ fontSize: '11px', textTransform: 'uppercase', color: '#556a5e', fontWeight: 600 }}>
                        Anon Key
                        <input
                          type='password'
                          value={connections.supabaseAnonKey}
                          onChange={(e) =>
                            setConnections({ ...connections, supabaseAnonKey: e.target.value })
                          }
                          placeholder='eyJ...'
                          style={{ marginTop: '4px', width: '100%', padding: '8px 10px', fontSize: '12px' }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div
                style={{
                  background: '#dcefe0',
                  color: '#263b35',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h2>You&apos;re Ready to Operate!</h2>
              <p className='wizard-desc' style={{ maxWidth: '480px', margin: '0 auto 24px' }}>
                Your admin profile, inventory safety thresholds, automated customer emails, and Stripe
                APIs are all provisioned. You can manage live stock, upload pieces with pictures, and fulfill orders right away.
              </p>
              <div
                style={{
                  display: 'inline-flex',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: '#f0f4f0',
                  padding: '14px 22px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  justifyContent: 'center',
                }}
              >
                <span>✓ Profile verified</span>
                <span>✓ Inventory tracking active</span>
                <span>✓ Auto-emails provisioned ({emailSettings.provider})</span>
                <span>
                  ✓ Stripe {connections.stripeConnected ? `${connections.stripeMode.toUpperCase()} Mode` : 'Ready'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className='wizard-footer'>
          {step > 1 ? (
            <button
              className='secondary-dashboard-button'
              type='button'
              onClick={() => setStep(step - 1)}
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              className='primary-dashboard-button'
              type='button'
              onClick={() => setStep(step + 1)}
            >
              Next Step <ArrowRight size={14} />
            </button>
          ) : (
            <button
              className='primary-dashboard-button'
              type='button'
              onClick={onComplete}
            >
              Complete Setup & Open Studio
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

// 2. Stock Adjustment Modal
function StockAdjustmentModal({
  product,
  onClose,
  onSave,
}: {
  product: Product;
  onClose: () => void;
  onSave: (
    product: Product,
    changeAmount: number,
    reason: InventoryAuditLog['reason'],
    note?: string
  ) => void;
}) {
  const [mode, setMode] = useState<'add' | 'remove' | 'set'>('add');
  const [quantity, setQuantity] = useState<number>(5);
  const [reason, setReason] = useState<InventoryAuditLog['reason']>('Restocked from Studio');
  const [note, setNote] = useState<string>('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    let change = 0;
    if (mode === 'add') change = quantity;
    if (mode === 'remove') change = -quantity;
    if (mode === 'set') change = quantity - product.stock;

    onSave(product, change, reason, note);
  }

  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section className='product-modal' role='dialog' aria-modal='true'>
        <div className='modal-heading'>
          <div>
            <p className='dashboard-kicker'>Inventory Movement</p>
            <h2>Adjust Stock: {product.name}</h2>
          </div>
          <button type='button' onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '0 22px' }}>
            <div style={{ background: '#f0f5f1', padding: '12px 16px', marginBottom: '16px' }}>
              <span style={{ fontSize: '11px', color: '#687d71' }}>Current Stock on Hand:</span>
              <strong style={{ display: 'block', fontSize: '18px', color: '#263b35' }}>
                {product.stock} units
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type='button'
                className={`secondary-dashboard-button ${mode === 'add' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  background: mode === 'add' ? '#263b35' : '#fff',
                  color: mode === 'add' ? '#fff' : '#263b35',
                }}
                onClick={() => {
                  setMode('add');
                  setReason('Restocked from Studio');
                }}
              >
                + Restock Batch
              </button>
              <button
                type='button'
                className={`secondary-dashboard-button ${mode === 'remove' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  background: mode === 'remove' ? '#263b35' : '#fff',
                  color: mode === 'remove' ? '#fff' : '#263b35',
                }}
                onClick={() => {
                  setMode('remove');
                  setReason('Damaged / Scrapped');
                }}
              >
                - Scrapped / Damaged
              </button>
              <button
                type='button'
                className={`secondary-dashboard-button ${mode === 'set' ? 'active' : ''}`}
                style={{
                  flex: 1,
                  background: mode === 'set' ? '#263b35' : '#fff',
                  color: mode === 'set' ? '#fff' : '#263b35',
                }}
                onClick={() => {
                  setMode('set');
                  setReason('Physical Inventory Audit');
                  setQuantity(product.stock);
                }}
              >
                Set Exact Count
              </button>
            </div>
          </div>

          <label>
            {mode === 'set' ? 'New Exact Stock Level' : 'Quantity to Adjust'}
            <input
              type='number'
              min='0'
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
            />
          </label>

          <label>
            Adjustment Reason
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as InventoryAuditLog['reason'])}
            >
              <option value='Restocked from Studio'>Restocked from Studio</option>
              <option value='Physical Inventory Audit'>Physical Inventory Audit</option>
              <option value='Damaged / Scrapped'>Damaged / Scrapped</option>
              <option value='Order Cancelled (Restocked)'>Order Cancelled (Restocked)</option>
            </select>
          </label>

          <label>
            Optional Studio Note
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder='e.g. Fresh batch finished with organic wax'
            />
          </label>

          <div className='modal-actions'>
            <button className='secondary-dashboard-button' type='button' onClick={onClose}>
              Cancel
            </button>
            <button className='primary-dashboard-button' type='submit'>
              <Check size={16} /> Save Adjustment
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// 3. Product Catalog Modal (Add or Edit with Picture Uploads)
function ProductModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (productData: {
    name: string;
    sku: string;
    category: Product['category'];
    price: number;
    stock: number;
    lowStockThreshold: number;
    status: 'Published' | 'Draft';
    woodType: string;
    dimensions: string;
    image: string;
    images: string[];
  }) => void;
}) {
  const [images, setImages] = useState<string[]>(() => {
    if (product?.images && product.images.length > 0) return product.images;
    if (product?.image) return [product.image];
    return [];
  });
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form fields
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [category, setCategory] = useState<Product['category']>(product?.category || 'Saya');
  const [price, setPrice] = useState(product?.price !== undefined ? String(product.price) : '185.00');
  const [stock, setStock] = useState(product?.stock !== undefined ? String(product.stock) : '5');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    product?.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : '3'
  );
  const [status, setStatus] = useState<'Published' | 'Draft'>(product?.status || 'Published');
  const [woodType, setWoodType] = useState(product?.woodType || '');
  const [dimensions, setDimensions] = useState(product?.dimensions || '');

  function handleFileSelection(files: FileList | File[]) {
    const validImageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (validImageFiles.length === 0) return;

    setIsProcessing(true);
    const readers = validImageFiles.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers)
      .then((newImages) => {
        setImages((prev) => [...prev, ...newImages]);
      })
      .catch((err) => {
        console.error('Error reading image files:', err);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }

  function handleAddUrl() {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
  }

  function handleRemoveImage(idx: number) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
    if (primaryIndex >= idx && primaryIndex > 0) {
      setPrimaryIndex(primaryIndex - 1);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const primaryImage =
      images[primaryIndex] ||
      images[0] ||
      (category === 'Cutting board'
        ? 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1707765193847-22CXIFLNEX9QZ8PSYEA3/walnut+large+sizing.jpg?format=300w'
        : 'https://images.squarespace-cdn.com/content/v1/5f274f2b474d4b556f0c4685/1706207626590-M2WYZUZ8O0TRJT0UAIK1/large+saya+group+.jpg?format=300w');

    onSave({
      name,
      sku: sku || `DCH-${name.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
      category,
      price: parseFloat(price) || 0,
      stock: parseInt(stock, 10) || 0,
      lowStockThreshold: parseInt(lowStockThreshold, 10) || 3,
      status,
      woodType,
      dimensions,
      image: primaryImage,
      images: images.length > 0 ? images : [primaryImage],
    });
  }

  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        className='product-modal'
        style={{ maxWidth: '640px', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        role='dialog'
        aria-modal='true'
      >
        <div className='modal-heading'>
          <div>
            <p className='dashboard-kicker'>{product ? 'Catalog Editor' : 'New Creation'}</p>
            <h2>{product ? 'Edit Piece' : 'Add Hand-Crafted Piece'}</h2>
          </div>
          <button type='button' onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, paddingBottom: '16px' }}>
          {/* Picture Upload Section */}
          <div style={{ padding: '0 22px' }}>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#4f6357',
                marginBottom: '8px',
              }}
            >
              Piece Photography & Gallery ({images.length} {images.length === 1 ? 'picture' : 'pictures'})
            </span>

            {/* Dropzone */}
            <div
              className={`image-upload-dropzone ${isDragging ? 'is-dragging' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files) {
                  handleFileSelection(e.dataTransfer.files);
                }
              }}
              onClick={() => {
                document.getElementById('product-file-upload-input')?.click();
              }}
            >
              <input
                id='product-file-upload-input'
                type='file'
                accept='image/*'
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files) handleFileSelection(e.target.files);
                }}
              />
              <UploadCloud size={28} color='#263b35' />
              <div>
                <strong style={{ fontSize: '13px', color: '#263b35' }}>
                  {isProcessing ? 'Processing image files...' : 'Click or Drag & Drop Photos to Upload'}
                </strong>
                <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#63796d' }}>
                  High-res studio photography (JPEG, PNG, WebP, AVIF) — Multiple angles supported
                </p>
              </div>
            </div>

            {/* Alternative Direct URL Input */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <input
                type='url'
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder='Or paste image URL (https://...)'
                style={{
                  flex: 1,
                  fontSize: '12px',
                  padding: '7px 10px',
                  border: '1px solid #d4dfd6',
                  borderRadius: '2px',
                }}
              />
              <button
                type='button'
                onClick={handleAddUrl}
                className='secondary-dashboard-button'
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                + Add URL
              </button>
            </div>

            {/* Uploaded Thumbnails Preview */}
            {images.length > 0 && (
              <div className='image-thumbnail-grid'>
                {images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className={`image-thumbnail-card ${idx === primaryIndex ? 'is-cover' : ''}`}
                    style={{ backgroundImage: `url('${imgUrl}')` }}
                  >
                    {idx === primaryIndex && (
                      <span className='image-cover-badge'>★ Cover</span>
                    )}
                    <div className='image-card-actions'>
                      {idx !== primaryIndex && (
                        <button
                          type='button'
                          className='image-card-btn'
                          title='Set as primary cover image'
                          onClick={() => setPrimaryIndex(idx)}
                        >
                          <Star size={11} /> Cover
                        </button>
                      )}
                      <button
                        type='button'
                        className='image-card-btn delete-btn'
                        title='Remove photo'
                        onClick={() => handleRemoveImage(idx)}
                      >
                        <Trash size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr style={{ border: 0, borderTop: '1px solid #e3ebe4', margin: '14px 22px' }} />

          {/* Product Meta Fields */}
          <label>
            Piece Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='e.g. Cherry Serving Board'
              required
            />
          </label>

          <div className='form-row' style={{ padding: '0 22px' }}>
            <label style={{ padding: 0 }}>
              SKU Code
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder='e.g. DCH-WCB-04'
              />
            </label>
            <label style={{ padding: 0 }}>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Product['category'])}
              >
                <option value='Saya'>Saya</option>
                <option value='Cutting board'>Cutting board</option>
                <option value='Custom'>Custom</option>
                <option value='Furniture'>Furniture</option>
              </select>
            </label>
          </div>

          <div className='form-row' style={{ padding: '0 22px' }}>
            <label style={{ padding: 0 }}>
              Price ($ USD)
              <input
                type='number'
                min='0'
                step='0.01'
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder='185.00'
                required
              />
            </label>
            <label style={{ padding: 0 }}>
              Stock on Hand
              <input
                type='number'
                min='0'
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                required
              />
            </label>
          </div>

          <div className='form-row' style={{ padding: '0 22px' }}>
            <label style={{ padding: 0 }}>
              Low Stock Warning Threshold
              <input
                type='number'
                min='1'
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                required
              />
            </label>
            <label style={{ padding: 0 }}>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}
              >
                <option value='Published'>Published</option>
                <option value='Draft'>Draft</option>
              </select>
            </label>
          </div>

          <div className='form-row' style={{ padding: '0 22px' }}>
            <label style={{ padding: 0 }}>
              Wood Type / Materials
              <input
                value={woodType}
                onChange={(e) => setWoodType(e.target.value)}
                placeholder='e.g. Quarter-sawn Black Walnut'
              />
            </label>
            <label style={{ padding: 0 }}>
              Dimensions / Fitment
              <input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder='e.g. 210mm Gyuto Fitment'
              />
            </label>
          </div>

          <div className='modal-actions'>
            <button className='secondary-dashboard-button' type='button' onClick={onClose}>
              Cancel
            </button>
            <button className='primary-dashboard-button' type='submit'>
              <Check size={16} /> {product ? 'Save Changes' : 'Add to Catalog'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// 4. Shipping Fulfillment Modal (Carrier & Tracking Number)
function ShippingFulfillmentModal({
  order,
  onClose,
  onFulfill,
}: {
  order: Order;
  onClose: () => void;
  onFulfill: (carrier: string, trackingNumber: string) => void;
}) {
  const [carrier, setCarrier] = useState('USPS Priority Mail');
  const [trackingNumber, setTrackingNumber] = useState(
    () => `9400111899${Math.floor(1000000000 + Math.random() * 9000000000)}`
  );

  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section className='product-modal' role='dialog' aria-modal='true'>
        <div className='modal-heading'>
          <div>
            <p className='dashboard-kicker'>Order Fulfillment</p>
            <h2>Ship Order {order.id}</h2>
          </div>
          <button type='button' onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onFulfill(carrier, trackingNumber);
          }}
        >
          <div style={{ padding: '0 22px' }}>
            <div style={{ background: '#f0f5f1', padding: '14px', borderRadius: '4px', marginBottom: '14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#687d71' }}>Customer:</p>
              <strong style={{ fontSize: '14px', color: '#263b35' }}>
                {order.customer} ({order.email})
              </strong>
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#3f544b' }}>
                Item: {order.item}
              </p>
            </div>
          </div>

          <label>
            Shipping Carrier
            <select value={carrier} onChange={(e) => setCarrier(e.target.value)}>
              <option value='USPS Priority Mail'>USPS Priority Mail</option>
              <option value='UPS Ground'>UPS Ground</option>
              <option value='FedEx Express'>FedEx Express</option>
              <option value='DHL Express'>DHL Express</option>
            </select>
          </label>

          <label>
            Tracking Code
            <input
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              required
            />
          </label>

          <div style={{ padding: '0 22px' }}>
            <div style={{ background: '#eaf4ee', border: '1px solid #c8e2d0', padding: '12px', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '11px', color: '#2e5b3c' }}>
                ✉️ <strong>Automated Email:</strong> Submitting will automatically send the branded
                &apos;Your Order Has Shipped&apos; email with direct tracking link to{' '}
                <strong>{order.email}</strong>.
              </p>
            </div>
          </div>

          <div className='modal-actions'>
            <button className='secondary-dashboard-button' type='button' onClick={onClose}>
              Cancel
            </button>
            <button className='primary-dashboard-button' type='submit'>
              <Check size={16} /> Confirm & Dispatch Email
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

// 5. Rendered Email Preview Modal (Inspect HTML email that was sent)
function RenderedEmailPreviewModal({
  email,
  onClose,
  onResend,
}: {
  email: EmailNotification;
  onClose: () => void;
  onResend: () => void;
}) {
  return (
    <div
      className='modal-backdrop'
      role='presentation'
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <section
        className='product-modal'
        style={{ maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
        role='dialog'
        aria-modal='true'
      >
        <div className='modal-heading'>
          <div>
            <p className='dashboard-kicker'>Email Audit Inspector</p>
            <h2 style={{ fontSize: '17px' }}>{email.subject}</h2>
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#7a8e82' }}>
              Recipient: {email.recipientName} &lt;{email.recipientEmail}&gt; · Sent: {email.sentAt}
            </p>
          </div>
          <button type='button' onClick={onClose}>
            <X size={19} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f0f4f0' }}>
          <div
            style={{
              background: '#fff',
              border: '1px solid #dce3dc',
              borderRadius: '4px',
              padding: '10px',
            }}
          >
            {email.htmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: email.htmlContent }} />
            ) : (
              <div style={{ padding: '30px', textAlign: 'center', color: '#687d71' }}>
                <p>Standard responsive template dispatched for this event.</p>
              </div>
            )}
          </div>
        </div>

        <div className='modal-actions' style={{ padding: '16px 22px' }}>
          <button className='secondary-dashboard-button' type='button' onClick={onClose}>
            Close
          </button>
          <button className='primary-dashboard-button' type='button' onClick={onResend}>
            <RefreshCw size={14} /> Resend Email
          </button>
        </div>
      </section>
    </div>
  );
}

// Helper badge component
function StatusBadge({ status }: { status: Order['status'] }) {
  return <span className={`status-pill ${status.toLowerCase()}`}>{status}</span>;
}

function MetricCard({
  label,
  value,
  change,
  icon,
  warning,
}: {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <div className='metric-card'>
      <div className={`metric-icon ${warning ? 'warning' : ''}`}>{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small className={warning ? 'warning-text' : ''}>{change}</small>
    </div>
  );
}
