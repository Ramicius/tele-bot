import { connectToDatabase } from '@/lib/database';
import Referral from '@/lib/database/models/referral.model';
import User from '@/lib/database/models/user.model';
import UserData from '@/lib/database/models/userData.model';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const apiKey = request.headers.get('Authorization')?.split(' ')[1];

    if (apiKey !== process.env.API_KEY) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { telegramId, referrerId } = await request.json();

        if (!telegramId || !referrerId) {
            return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        const referredUser = await User.findOne({ telegramID: String(telegramId) });

        if (referredUser) {
            return NextResponse.json({ status: 'success', message: 'Referral not counted for existing user' });
        }

        const referrerUser = await User.findOne({ telegramID: String(referrerId) });

        if (!referrerUser) {
            return NextResponse.json({ status: 'error', message: 'Referrer not found' }, { status: 404 });
        }

        const existingReferral = await Referral.findOne({
            referrerTelegramId: String(referrerId),
            referredTelegramId: String(telegramId)
        });

        if (!existingReferral) {
            await Referral.create({
                referrerTelegramId: String(referrerId),
                referredTelegramId: String(telegramId)
            });

            await UserData.findOneAndUpdate(
                { User: referrerUser._id },
                { '$inc': { totalReferrals: 1, roundReferrals: 1 } }
            );
        }

        return NextResponse.json({ status: 'success', message: 'Referral processed' });
    } catch (error) {
        console.error('Error processing referral:', error);
        return NextResponse.json({ status: 'error', message: 'Failed to process referral' }, { status: 500 });
    }
}
