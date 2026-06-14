import { Schema, model, models, Document } from "mongoose";
import { IUser } from "./user.model";

export interface IFriendship extends Document {
    _id: string,
    Requester: IUser,
    Receiver: IUser,
    status: boolean,
    createdAt: boolean
}

const FriendshipSchema = new Schema({
    Requester: { type: Schema.Types.ObjectId, ref: "User", index: true },
    Receiver: { type: Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

const Friendship = models.Friendship || model('Friendship', FriendshipSchema);

export default Friendship;