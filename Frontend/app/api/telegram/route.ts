import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';
import UserData from '@/lib/database/models/userData.model';
import Payment from '@/lib/database/models/payment.model';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const apiKey = request.headers.get('Authorization')?.split(' ')[1];

    if (apiKey !== process.env.API_KEY) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { telegramId, invoicePayload, paymentChargeId } = await request.json();

        if (!telegramId || !invoicePayload || !paymentChargeId) {
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const existingCharge = await Payment.findOne({ telegramPaymentChargeId: paymentChargeId });
        if (existingCharge?.status === 'completed') {
            const userData = await UserData.findOne({ User: (await User.findOne({ telegramID: String(telegramId) }))?._id });
            return NextResponse.json({
                status: 'success',
                diamonds: userData?.diamonds ?? 0,
                alreadyProcessed: true,
            });
        }

        const payment = await Payment.findOne({ invoicePayload, telegramId: String(telegramId), status: 'pending' });
        if (!payment) {
            return NextResponse.json({ status: 'error', message: 'Payment not found' }, { status: 404 });
        }

        const user = await User.findOne({ telegramID: String(telegramId) });
        if (!user) {
            return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
        }

        const userData = await UserData.findOne({ User: user._id });
        if (!userData) {
            return NextResponse.json({ status: 'error', message: 'User data not found' }, { status: 404 });
        }

        userData.diamonds += payment.diamonds;
        await userData.save();

        payment.status = 'completed';
        payment.telegramPaymentChargeId = paymentChargeId;
        payment.completedAt = new Date();
        await payment.save();

        return NextResponse.json({ status: 'success', diamonds: userData.diamonds, creditedDiamonds: payment.diamonds });
    } catch (error) {
        console.error('Error updating diamonds:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to update diamonds' }, { status: 500 });
    }
}
