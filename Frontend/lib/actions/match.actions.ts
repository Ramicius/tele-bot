'use server'

import { connectToDatabase } from "../database"
import Match from "../database/models/match.model";
import User from "../database/models/user.model";
import UserData from "../database/models/userData.model";
import { requireAuthenticatedUserId } from "@/lib/telegram/require-auth";

export const populateMatch = (query: any) => {
    return query
        .populate({ path: 'Player', model: User, select: "_id username photo" })
        .populate({ path: 'Opponent', model: User, select: "_id username photo" })
}

export async function getMatchByID(initData: string, id: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const match = await populateMatch(Match.findById(id))
        if (!match) {
            throw new Error('Match not found');
        }

        const playerId = match.Player._id.toString();
        const opponentId = match.Opponent._id.toString();
        if (playerId !== userId && opponentId !== userId) {
            throw new Error('Unauthorized');
        }

        const player = await UserData.findOne({ User: match.Player._id })
        const opponent = await UserData.findOne({ User: match.Opponent._id })

        if (!player || !opponent) {
            throw new Error('Player or opponent not found');
        }

        let returnedMatch = {
            ...match._doc,
            playerPhoto: player.User.photo,
            opponentPhoto: opponent.User.photo,
            playerCountry: player.country,
            opponentCountry: opponent.country
        }

        return JSON.parse(JSON.stringify(returnedMatch))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load match');
    }
}

export async function getMatchesByUserID(initData: string, page: number) {
    const id = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const matches = await populateMatch(Match.find({
            $or: [{ Player: id }, { Opponent: id }]
        }).sort({ createdAt: -1 }).skip(page * 20).limit(20))

        return JSON.parse(JSON.stringify(matches))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load matches');
    }
}
