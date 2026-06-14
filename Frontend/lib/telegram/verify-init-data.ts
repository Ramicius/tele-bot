import crypto from 'crypto';
import { DEV_INIT_DATA } from '@/lib/telegram/constants';

export interface VerifiedTelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export function verifyTelegramInitData(initData: string): VerifiedTelegramUser {
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_DEV_AUTH === 'true' &&
    initData === DEV_INIT_DATA
  ) {
    const devTelegramId = process.env.DEV_TELEGRAM_ID;
    if (!devTelegramId) {
      throw new Error('DEV_TELEGRAM_ID is not configured');
    }
    return { id: Number(devTelegramId) };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  if (!initData) {
    throw new Error('Missing Telegram init data');
  }

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) {
    throw new Error('Invalid Telegram init data');
  }

  params.delete('hash');

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) {
    throw new Error('Invalid Telegram init data signature');
  }

  const authDate = Number(params.get('auth_date') || '0');
  const maxAgeSec = Number(process.env.TELEGRAM_INIT_DATA_MAX_AGE_SEC || '86400');
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) {
    throw new Error('Telegram init data expired');
  }

  const userJson = params.get('user');
  if (!userJson) {
    throw new Error('Telegram user missing from init data');
  }

  const user = JSON.parse(userJson) as VerifiedTelegramUser;
  if (!user?.id) {
    throw new Error('Telegram user id missing from init data');
  }

  return user;
}

export { DEV_INIT_DATA };
