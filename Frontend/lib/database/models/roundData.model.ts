import { Schema, model, models } from "mongoose";

const RoundDataSchema = new Schema({
    User: { type: Schema.Types.ObjectId, ref: "User", index: true },
    played: { type: Number, default: 0 },
    won: { type: Number, default: 0 },
    scored: { type: Number, default: 0 },
    predictions: { type: Number, default: 0 },
    points: { type: Number, default: 0 }
})

const RoundData = models.RoundData || model('RoundData', RoundDataSchema);

export default RoundData;