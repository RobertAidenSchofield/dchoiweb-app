import { NextResponse } from 'next/server';
import { dispatchEmail } from '@/lib/emailService';
import { EmailSettings, EmailType, Order, Product } from '@/types/store';
import { isAuthenticatedAdmin } from '@/lib/adminAuth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
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
      internalSecret,
    } = body as {
      order?: Order;
      product?: Product;
      recipientEmail: string;
      recipientName: string;
      type: EmailType;
      subject: string;
      settings: EmailSettings;
      carrier?: string;
      trackingNumber?: string;
      customNote?: string;
      internalSecret?: string;
    };

    if (!recipientEmail || !type || !subject) {
      return NextResponse.json(
        { error: 'Missing required email dispatch fields (recipientEmail, type, subject)' },
        { status: 400 }
      );
    }

    // Rate-limiting & Access Check:
    // Only allow verified admin sessions OR valid internal checkout triggers
    const isAuthed = await isAuthenticatedAdmin();
    const hasInternalKey = internalSecret === process.env.INTERNAL_API_SECRET;

    // Allow order confirmations from storefront, but require auth for manual/admin triggers
    const isCustomerConfirmation = type === 'order_confirmation' && order;

    if (!isAuthed && !hasInternalKey && !isCustomerConfirmation) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required to dispatch arbitrary transactional emails.' },
        { status: 401 }
      );
    }

    const emailRecord = await dispatchEmail({
      order,
      product,
      recipientEmail,
      recipientName: recipientName || recipientEmail,
      type,
      subject,
      settings: settings || {
        provider: 'simulation',
        autoSendConfirmation: true,
        autoSendShipment: true,
        autoSendDelivered: true,
        autoSendLowStockAlert: true,
        apiKey: '',
        senderEmail: 'orders@dchoidesigns.com',
        senderName: 'David Choi — DCHOI DESIGNS',
        customStudioNote: 'Every piece at DCHOI DESIGNS is crafted slowly in our Chicago studio.',
      },
      carrier,
      trackingNumber,
      customNote,
    });

    return NextResponse.json({
      success: true,
      email: emailRecord,
    });
  } catch (err: unknown) {
    console.error('Email dispatch API error:', err);
    const message = err instanceof Error ? err.message : 'Failed to dispatch email';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
