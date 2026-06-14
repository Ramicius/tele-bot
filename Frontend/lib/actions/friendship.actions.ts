'use server'

import { connectToDatabase } from "../database";
import Friendship from "../database/models/friendship.model";
import User from "../database/models/user.model";
import { requireAuthenticatedUserId } from "@/lib/telegram/require-auth";

const populateRequests = (query: any) => {
    return query
        .populate({ path: 'Requester', model: User, select: "_id username photo" })
        .populate({ path: 'Receiver', model: User, select: "_id username photo" })
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function findUsersByUsernames(initData: string, query: string) {
    const userId = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    try {
        const users = await User.find({ username: new RegExp(escapeRegex(query), 'i') }).limit(10);

        const usersWithFriendshipStatus = await Promise.all(users.map(async (user) => {
            const existingRequest = await Friendship.findOne({
                $or: [
                    { Requester: userId, Receiver: user._id },
                    { Requester: user._id, Receiver: userId }
                ],
            });

            return {
                id: user._id,
                username: user.username,
                photo: user.photo,
                hasRequest: !!existingRequest
            };
        }));

        return JSON.parse(JSON.stringify(usersWithFriendshipStatus))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to search users');
    }
}

export async function sendFriendRequest(initData: string, receiverId: string) {
    const requesterId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const existingRequest = await Friendship.findOne({
            Requester: requesterId,
            Receiver: receiverId
        });

        if (existingRequest) {
            throw new Error('Request Exists')
        }

        const newRequest = new Friendship({
            Requester: requesterId,
            Receiver: receiverId,
            status: false
        });

        await newRequest.save();
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to send friend request');
    }
}

export async function getFriendRequests(initData: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const requests = await populateRequests(Friendship.find({ Receiver: userId, status: false }))

        return JSON.parse(JSON.stringify(requests))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load friend requests');
    }
}

export async function getFriends(initData: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const friends = await populateRequests(Friendship.find({
            $or: [
                { Requester: userId, status: true },
                { Receiver: userId, status: true }
            ]
        }))

        const friendsList = friends.map((friend: any) => {
            return friend.Requester._id.toString() === userId
                ? friend.Receiver
                : friend.Requester;
        });

        return JSON.parse(JSON.stringify(friendsList))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load friends');
    }
}

export async function acceptFriendRequest(initData: string, requestId: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const request = await Friendship.findOne({ _id: requestId, Receiver: userId, status: false });
        if (!request) {
            throw new Error('Friend request not found');
        }

        request.status = true;
        await request.save();

        return JSON.parse(JSON.stringify(request))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to accept friend request');
    }
}

export async function deleteFriendRequest(initData: string, requestId: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const request = await Friendship.findOne({
            _id: requestId,
            $or: [{ Receiver: userId }, { Requester: userId }],
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        await Friendship.findByIdAndDelete(requestId);
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to delete friend request');
    }
}
