import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
    _id: string,
    username: string,
    photo: string,
    bio: string
}

const UserSchema = new Schema({
    telegramID: { type: String, required: true, unique: true },
    chatId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    bio: { type: String, default: '' },
    photo: { type: String },
    type: { type: String, default: 'User' },
})

const User = models.User || model('User', UserSchema);

export default User;