import mongoose from 'mongoose'
import { Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

interface Cached {
    conn: Connection | null;
    promise: Promise<Connection> | null;
}

let cached: Cached = (global as any).mongoose as Cached;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async (): Promise<Connection> => {
    if (cached.conn) return cached.conn;

    if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

    cached.promise = cached.promise || mongoose.connect(MONGODB_URI, {
        dbName: 'titans',
        bufferCommands: false,
    }).then((mongoose) => mongoose.connection)

    cached.conn = await cached.promise;

    return cached.conn;
}