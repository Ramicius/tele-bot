import { connectToDatabase } from '@/lib/database';
import Payment from '@/lib/database/models/payment.model';
import { getPaymentPackage } from '@/lib/constants/payment-packages';
import { NextRequest, NextResponse } from 'next/server';

const PENDING_PAYMENT_MAX_AGE_MS = Number(process.env.PAYMENT_PENDING_MAX_AGE_MS || 3600000);

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('Authorization')?.split(' ')[1];

  if (apiKey !== process.env.API_KEY) {
    return NextResponse.json({ valid: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { telegramId, invoicePayload, totalAmount } = await request.json();

    if (!telegramId || !invoicePayload || totalAmount === undefined || totalAmount === null) {
      return NextResponse.json({ valid: false, message: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    const payment = await Payment.findOne({ invoicePayload: String(invoicePayload) });

    if (!payment) {
      return NextResponse.json({ valid: false, message: 'Payment not found' });
    }

    if (payment.status === 'completed') {
      return NextResponse.json({ valid: false, message: 'Payment already completed' });
    }

    if (payment.telegramId !== String(telegramId)) {
      return NextResponse.json({ valid: false, message: 'Payment user mismatch' });
    }

    const paymentPackage = getPaymentPackage(payment.packageId);
    if (!paymentPackage) {
      return NextResponse.json({ valid: false, message: 'Invalid payment package' });
    }

    if (payment.starsAmount !== paymentPackage.stars || payment.diamonds !== paymentPackage.diamonds) {
      return NextResponse.json({ valid: false, message: 'Payment catalog mismatch' });
    }

    if (Number(totalAmount) !== payment.starsAmount) {
      return NextResponse.json({ valid: false, message: 'Payment amount mismatch' });
    }

    const paymentAgeMs = Date.now() - new Date(payment.createdAt).getTime();
    if (paymentAgeMs > PENDING_PAYMENT_MAX_AGE_MS) {
      return NextResponse.json({ valid: false, message: 'Payment expired' });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Error validating checkout:', error);
    return NextResponse.json({ valid: false, message: 'Validation failed' }, { status: 500 });
  }
}
