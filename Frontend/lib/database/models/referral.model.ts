import { Schema, model, models, Document } from "mongoose";

const ReferralSchema = new Schema({
    referrerTelegramId: {
        type: String,
        required: true,
    },
    referredTelegramId: {
        type: String,
        required: true,
        unique: true,  // Ensures that a referred user can only be referred once
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
})

const Referral = models.Referral || model('Referral', ReferralSchema);

export default Referral;