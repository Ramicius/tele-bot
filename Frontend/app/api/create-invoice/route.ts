import { Bot } from 'grammy';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';
import Payment from '@/lib/database/models/payment.model';
import { getPaymentPackage } from '@/lib/constants/payment-packages';
import { verifyTelegramInitData } from '@/lib/telegram/verify-init-data';

function getBot() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined');
  }
  return new Bot(botToken);
}

const invoiceAttempts = new Map<string, number[]>();
const INVOICE_RATE_LIMIT_WINDOW_MS = 60_000;
const INVOICE_RATE_LIMIT_MAX = 5;

function isInvoiceRateLimited(telegramId: string) {
  const now = Date.now();
  const recentAttempts = (invoiceAttempts.get(telegramId) || []).filter(
    (timestamp) => now - timestamp < INVOICE_RATE_LIMIT_WINDOW_MS
  );

  if (recentAttempts.length >= INVOICE_RATE_LIMIT_MAX) {
    invoiceAttempts.set(telegramId, recentAttempts);
    return true;
  }

  recentAttempts.push(now);
  invoiceAttempts.set(telegramId, recentAttempts);
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const { initData, packageId } = await request.json();

    if (!initData || !packageId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const telegramUser = verifyTelegramInitData(initData);

    if (isInvoiceRateLimited(String(telegramUser.id))) {
      return NextResponse.json({ success: false, error: 'Too many invoice requests' }, { status: 429 });
    }
    const paymentPackage = getPaymentPackage(packageId);

    if (!paymentPackage) {
      return NextResponse.json({ success: false, error: 'Invalid package' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findOne({ telegramID: String(telegramUser.id) });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const invoicePayload = `pay_${crypto.randomUUID()}`;

    await Payment.create({
      invoicePayload,
      telegramId: String(telegramUser.id),
      packageId: paymentPackage.id,
      diamonds: paymentPackage.diamonds,
      starsAmount: paymentPackage.stars,
      status: 'pending',
    });

    await getBot().api.sendInvoice(
      user.chatId,
      '💎 Purchase Diamonds',
      `Get ${paymentPackage.diamonds} diamonds to use them on the lucky spin for a chance to upgrade a position on your team, or use them to unlock new icons.`,
      invoicePayload,
      'XTR',
      [{ label: `${paymentPackage.diamonds} Diamonds`, amount: paymentPackage.stars }],
      {
        provider_token: '',
        start_parameter: 'start',
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create and send invoice' }, { status: 500 });
  }
}
