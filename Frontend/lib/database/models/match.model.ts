import { Schema, model, models, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IMatch extends Document {
    _id: string,
    Player: IUser,
    Opponent: IUser,
    attacks: any,
    winner: IUser
    createdAt: Date,
    playerScore: number,
    opponentScore: number,
    type: string,
    availableToWatch: Date
}

const MatchSchema = new Schema({
    Player: { type: Schema.Types.ObjectId, ref: "User", index: true },
    Opponent: { type: Schema.Types.ObjectId, ref: "User", index: true },
    attacks: [{
        minute: Number,
        player: String,
        scenario: [{
            scenario: String,
            line: Number,
            wait: Number
        }]
    }],
    winner: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String },
    playerScore: { type: Number },
    opponentScore: { type: Number },
    createdAt: { type: Date, default: Date.now },
    availableToWatch: { type: Date, default: () => new Date(Date.now() + 4 * 60 * 1000) }
})

const Match = models.Match || model('Match', MatchSchema);

export default Match;