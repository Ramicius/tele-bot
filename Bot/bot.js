import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
const appUrl = process.env.APP_URL;
const webAppUrl = process.env.WEB_APP_URL;
const supportEmail = process.env.SUPPORT_EMAIL || 'support@example.com';

if (!appUrl || !webAppUrl) {
  throw new Error('APP_URL and WEB_APP_URL must be configured');
}

bot.command('start', async (ctx) => {
    const text = ctx.message.text;
    let referralUserId = null;

    if (text.includes('/start ')) {
        referralUserId = text.split('/start ')[1];
    }

    if (referralUserId) {
        try {
            await axios.post(`${appUrl}/api/referral`, {
                telegramId: ctx.from.id,
                referrerId: referralUserId,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`
                }
            });
        } catch (error) {
            console.error('Error processing referral:', error);
        }
    }

    const keyboard = new InlineKeyboard()
        .webApp("Launch Football Titans ⚽️", webAppUrl);

    ctx.reply(`\nWelcome to Football Titans!\n
You're now the mastermind behind your own team. Choose your formations, level up your players, and dominate the field.\n
Win Rank and Classic games to collect coins and upgrade your squad.\n
Got a tough match? Beat stronger teams to earn diamonds! Use those diamonds to get special match tokens or try your luck with the lucky spin.\n
Don't keep the excitement to yourself—invite your friends, compete together, and build your dream team.\n\n`,
        {
            reply_markup: keyboard
        });
});

bot.command('privacy', (ctx) => {
    ctx.reply(`Your privacy is important to us. This game collects minimal personal information, such as usernames and gameplay data, solely to enhance your experience. We do not share your data with third parties unless required by law.

As a Telegram mini app, we do not use cookies or display ads. Your data is stored securely and is only used to improve your gameplay experience.

If you have any questions or concerns about your data, please contact us at ${supportEmail}`)
})

bot.command('terms', (ctx) => {
    ctx.reply(`Acceptance: By playing this game, you agree to these terms.

Account: You are responsible for keeping your account secure. Any activity using your account is your responsibility.

Gameplay: The game is for entertainment purposes only. We reserve the right to modify or discontinue any aspect of the game at any time.

Fair Play: Cheating, exploiting bugs, or using unauthorized software is strictly prohibited and may result in account suspension or termination.

Updates: We may update the game and these terms as needed. Continued use of the game after updates constitutes acceptance of the new terms.

Liability: We are not liable for any losses or damages resulting from the use of this game.

Support: If you need assistance, please contact us at ${supportEmail}`)
})

const CHECKOUT_REJECT_MESSAGE = 'This payment could not be verified. Please try again or contact support.';

bot.on('pre_checkout_query', async (ctx) => {
    const query = ctx.preCheckoutQuery;

    try {
        const response = await axios.post(`${appUrl}/api/validate-checkout`, {
            telegramId: query.from.id,
            invoicePayload: query.invoice_payload,
            totalAmount: query.total_amount,
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.API_KEY}`
            }
        });

        if (response.data?.valid === true) {
            await ctx.answerPreCheckoutQuery(true);
            return;
        }

        await ctx.answerPreCheckoutQuery(false, { error_message: CHECKOUT_REJECT_MESSAGE });
    } catch (error) {
        console.error('Error validating pre-checkout:', error);
        await ctx.answerPreCheckoutQuery(false, { error_message: CHECKOUT_REJECT_MESSAGE });
    }
});

bot.on('message', async (ctx) => {
    if (ctx.message.successful_payment) {
        const { from, successful_payment } = ctx.message;

        try {
            const response = await axios.post(`${appUrl}/api/telegram`, {
                telegramId: from.id,
                invoicePayload: successful_payment.invoice_payload,
                paymentChargeId: successful_payment.telegram_payment_charge_id,
            }, {
                headers: {
                    'Authorization': `Bearer ${process.env.API_KEY}`
                }
            });

            const creditedDiamonds = response.data?.creditedDiamonds ?? 0;
            await ctx.reply(`Thank you for your purchase! You have received ${creditedDiamonds} diamonds.`);
        } catch (error) {
            console.error('Error sending webhook:', error);
            await ctx.reply('There was an error processing your purchase. Please contact support.');
        }
    }
});

bot.start();
