'use server';

import { connectToDatabase } from '@/lib/database';
import User from '@/lib/database/models/user.model';
import { verifyTelegramInitData } from '@/lib/telegram/verify-init-data';

export async function requireAuthenticatedUser(initData: string) {
  const telegramUser = verifyTelegramInitData(initData);
  await connectToDatabase();

  const user = await User.findOne({ telegramID: String(telegramUser.id) });
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireAuthenticatedUserId(initData: string): Promise<string> {
  const user = await requireAuthenticatedUser(initData);
  return user._id.toString();
}
