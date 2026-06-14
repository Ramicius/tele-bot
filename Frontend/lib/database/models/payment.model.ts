import { Schema, model, models, Document } from 'mongoose';

export interface IPayment extends Document {
  invoicePayload: string;
  telegramId: string;
  packageId: string;
  diamonds: number;
  starsAmount: number;
  status: 'pending' | 'completed';
  telegramPaymentChargeId?: string;
  createdAt: Date;
  completedAt?: Date;
}

const PaymentSchema = new Schema({
  invoicePayload: { type: String, required: true, unique: true, index: true },
  telegramId: { type: String, required: true, index: true },
  packageId: { type: String, required: true },
  diamonds: { type: Number, required: true },
  starsAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending', index: true },
  telegramPaymentChargeId: { type: String, unique: true, sparse: true, index: true },
  completedAt: { type: Date },
}, { timestamps: true });

const Payment = models.Payment || model<IPayment>('Payment', PaymentSchema);

export default Payment;
