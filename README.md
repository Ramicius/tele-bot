# Football Titans

A Telegram Mini App football game with matchmaking, squad progression, upgrades, and Telegram Stars payments.

## Tech stack

- **Frontend / API:** Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Database:** MongoDB with Mongoose
- **Telegram:** Web App SDK, Grammy bot framework
- **Deployment:** Vercel (app + API), Vultr VPS (Telegram bot)

## Architecture

```text
Telegram user
    │
    ├─► Grammy bot (Vultr VPS)
    │       ├─ /start, referrals, privacy/terms
    │       ├─ Web App launch button
    │       └─ Telegram Stars payment events
    │
    └─► Next.js Mini App (Vercel)
            ├─ React UI (play, shop, earn, lineup, rankings)
            ├─ Server Actions (game logic, economy, matchmaking)
            ├─ API routes (referrals, payments, invoices)
            └─ MongoDB (users, matches, economy, referrals, payments)
```

### Telegram Stars payment flow

1. Player selects a diamond package in the Mini App shop.
2. `/api/create-invoice` verifies Telegram `initData`, looks up a trusted server-side package catalog, and sends a Telegram Stars invoice via Grammy.
3. The bot approves pre-checkout and forwards `invoice_payload` + `telegram_payment_charge_id` to `/api/telegram`.
4. The API validates the pending payment record, enforces idempotency, and credits the catalog diamond amount to `UserData`.

## Key features

- Telegram Mini App integration with server-side `initData` verification
- Rank-based matchmaking and Classic/Rank match modes
- Server-side match simulation and reward calculation
- Position-specific player upgrades and formation management
- In-game coins/diamonds economy and lucky spin rewards
- Daily match predictions with server-validated coin collection
- Referral tracking via bot `/start` deep links
- Friend search, requests, and friendly matches
- Telegram Stars invoice and payment fulfillment

## Security / hardening notes

This repo was originally built as an MVP and later hardened for safer public review:

- Telegram `initData` is verified on the server using the bot token before privileged mutations
- Server Actions derive the authenticated user from verified `initData`, not caller-supplied IDs
- Match rewards, spin outcomes, and prediction payouts are calculated or validated server-side
- Payment packages are defined in a trusted server catalog; clients send package IDs only
- Payment fulfillment uses invoice payload lookup + charge-id idempotency
- Dev-only seed/admin actions were removed from public Server Actions

## Local setup

### Prerequisites

- Node.js 18+
- MongoDB instance
- Telegram bot token from [@BotFather](https://t.me/BotFather)

### Environment variables

#### Frontend (`Frontend/.env`)

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
TELEGRAM_BOT_TOKEN=<your_bot_token>
API_KEY=<shared_secret_for_bot_api_routes>
PREDICTIONS_CSV_URL=<optional_google_sheets_csv_url>

# Local development only
ALLOW_DEV_AUTH=true
DEV_TELEGRAM_ID=<your_telegram_user_id>
NEXT_PUBLIC_ALLOW_DEV_AUTH=true
NEXT_PUBLIC_DEV_TELEGRAM_ID=<your_telegram_user_id>
```

#### Bot (`Bot/.env`)

```env
TELEGRAM_BOT_TOKEN=<your_bot_token>
API_KEY=<same_shared_secret_as_frontend>
APP_URL=https://<your-vercel-app>.vercel.app
WEB_APP_URL=https://<your-vercel-app>.vercel.app/
SUPPORT_EMAIL=support@example.com
```

### Install and run

```bash
# Frontend
cd Frontend
npm install
npm run dev

# Bot (separate terminal)
cd Bot
npm install
npm start
```

Open the Mini App through Telegram (or local dev auth if enabled).

## Deployment

### Vercel (Frontend)

1. Import the `Frontend` project into Vercel.
2. Add the environment variables listed above.
3. Deploy and note the production URL.

### Vultr VPS (Bot)

1. Provision a small VPS and install Node.js.
2. Clone the `Bot` folder and install dependencies.
3. Set `APP_URL` and `WEB_APP_URL` to your Vercel deployment.
4. Run the bot with a process manager such as PM2:

```bash
pm2 start bot.js --name football-titans-bot
```

## Disclaimer

Football Titans started as a personal MVP / learning project. The current codebase includes targeted hardening for auth, economy integrity, and payment safety, but it is not a guarantee of production-grade security without your own review, monitoring, and operational practices.

## Repository layout

```text
tele/
├── Frontend/   # Next.js Telegram Mini App + API routes + Server Actions
├── Bot/        # Grammy Telegram bot (Vultr)
└── README.md
```
