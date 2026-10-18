import { EmailNotification, EmailSettings, Order, Product } from '@/types/store';
import {
  getOrderConfirmationEmailHtml,
  getOrderDeliveredEmailHtml,
  getOrderShippedEmailHtml,
  getLowStockAlertEmailHtml,
  getAdminShippingLabelEmailHtml,
} from './emailTemplates';

export async function dispatchEmail(params: {
  order?: Order;
  product?: Product;
  recipientEmail: string;
  recipientName: string;
  type: EmailNotification['type'];
  subject: string;
  settings: EmailSettings;
  carrier?: string;
  trackingNumber?: string;
  customNote?: string;
}): Promise<EmailNotification> {
  const {
    order,
    product,
    recipientEmail,
    recipientName,
    type,
    subject,
    settings,
    carrier,
    trackingNumber,
    customNote,
  } = params;

  let htmlContent = '';

  if (type === 'order_confirmation' && order) {
    htmlContent = getOrderConfirmationEmailHtml(order, customNote || settings.customStudioNote);
  } else if (type === 'order_shipped' && order) {
    htmlContent = getOrderShippedEmailHtml(order, carrier, trackingNumber);
  } else if (type === 'order_delivered' && order) {
    htmlContent = getOrderDeliveredEmailHtml(order);
  } else if (type === 'low_stock_alert' && product) {
    htmlContent = getLowStockAlertEmailHtml(product, product.stock);
  } else if (type === 'admin_shipping_label' && order) {
    htmlContent = getAdminShippingLabelEmailHtml(order);
  } else {
    htmlContent = `<p>${subject}</p>`;
  }

  const notificationId = `mail_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let status: EmailNotification['status'] = 'simulated';

  // If live provider with API key is enabled, attempt live send
  if (settings.provider === 'resend' && settings.apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${settings.senderName} <${settings.senderEmail}>`,
          to: [recipientEmail],
          subject,
          html: htmlContent,
        }),
      });
      if (res.ok) {
        status = 'delivered';
      } else {
        console.warn('Resend API returned non-OK status:', await res.text());
        status = 'simulated';
      }
    } catch (err) {
      console.warn('Live email dispatch failed, falling back to simulated outbox:', err);
      status = 'simulated';
    }
  } else if (settings.provider === 'sendgrid' && settings.apiKey) {
    try {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipientEmail, name: recipientName }] }],
          from: { email: settings.senderEmail, name: settings.senderName },
          subject,
          content: [{ type: 'text/html', value: htmlContent }],
        }),
      });
      if (res.ok || res.status === 202) {
        status = 'delivered';
      } else {
        status = 'simulated';
      }
    } catch (err) {
      console.warn('SendGrid dispatch error, saved to outbox:', err);
      status = 'simulated';
    }
  }

  const result: EmailNotification = {
    id: notificationId,
    orderId: order?.id,
    recipientEmail,
    recipientName,
    type,
    subject,
    htmlContent,
    sentAt: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    }),
    status,
    carrier,
    trackingNumber,
  };

  return result;
}

