'use server'

import { Ranks, positions } from "@/constants";
import { connectToDatabase } from "../database"
import User from "../database/models/user.model";
import UserData, { IUserData } from "../database/models/userData.model";
import { formations } from "@/constants/Formations";
import { simulateAttack } from "../utils";
import Match, { IMatch } from "../database/models/match.model";
import { populateMatch } from "./match.actions";
import { Icons } from "@/constants/Icons";
import RoundData from "../database/models/roundData.model";
import { requireAuthenticatedUser, requireAuthenticatedUserId } from "@/lib/telegram/require-auth";
import { verifyTelegramInitData } from "@/lib/telegram/verify-init-data";
import { getPredictionFixture } from "@/lib/predictions/fetch-prediction-data";

const populateUsers = (query: any) => {
    return query
        .populate({ path: 'User', model: User, select: "_id username bio photo chatId" })
}

export async function createUser(initData: string) {
    const telegramUser = verifyTelegramInitData(initData);
    await connectToDatabase();

    const existingUser = await User.findOne({ telegramID: String(telegramUser.id) });
    if (existingUser) {
        throw new Error('User already exists');
    }

    const username = generateRandomUsername();
    const chatId = String(telegramUser.id);

    const user = await User.create({
        telegramID: String(telegramUser.id),
        chatId,
        username,
        photo: 'galaxy_male_1'
    });

    const userData = await UserData.create({
        User: user._id,
        icons: [
            { name: 'galaxy_male_1', theme: 'galaxy', type: 'male' },
            { name: 'galaxy_male_2', theme: 'galaxy', type: 'male' },
            { name: 'galaxy_female_1', theme: 'galaxy', type: 'female' },
            { name: 'galaxy_female_2', theme: 'galaxy', type: 'female' }
        ]
    });

    await RoundData.create({ User: user._id });

    return JSON.parse(JSON.stringify(userData));
}

export async function findUserForLogin(initData: string) {
    const telegramUser = verifyTelegramInitData(initData);
    await connectToDatabase();

    const user = await User.findOne({ telegramID: String(telegramUser.id) });
    if (!user) {
        return null;
    }

    return JSON.parse(JSON.stringify(user));
}

export async function getUserByUserID(initData: string) {
    const userId = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    const user = await populateUsers(UserData.findOne({ User: userId }));
    if (!user) {
        throw new Error('User data not found');
    }

    return JSON.parse(JSON.stringify(user));
}

export async function getUserForPlayPage(initData: string) {
    const id = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const user = await populateUsers(UserData.findOne({ User: id }))

        let nextAvailableMatch;

        await Match.updateMany(
            {
                $and: [
                    { $or: [{ Player: id }, { Opponent: id }] },
                    { availableToWatch: { $lte: new Date() } }
                ]
            },
            { $set: { attacks: [] } }
        );

        const latestMatch = await Match.findOne({ Player: id, type: { $in: ['Rank', 'Classic'] } })
            .sort({ createdAt: -1 })
            .limit(1);

        if (latestMatch) {

            const now = new Date();
            const availableToWatchDate = new Date(latestMatch.availableToWatch);

            if (new Date(latestMatch.availableToWatch) > new Date()) {

                const timeDifferenceInMilliseconds = availableToWatchDate.getTime() - now.getTime();

                const timeDifferenceInMinutes = Math.ceil(timeDifferenceInMilliseconds / (1000 * 60));

                nextAvailableMatch = `${timeDifferenceInMinutes}m`;
            } else {

                nextAvailableMatch = null;
            }
        } else {

            nextAvailableMatch = null;
        }

        const userMatches = await populateMatch(Match.find({
            $or: [{ Player: id }, { Opponent: id }],
            availableToWatch: { $lte: new Date() }
        })
            .sort({ createdAt: -1 })
            .limit(5))

        const form = userMatches.reverse().map((match: IMatch) => match.winner.toString() === id ? 'W' : 'L').join('');

        const recentMatches = userMatches.reverse().slice(0, 2)

        const returnObject = {
            id: user.User._id,
            chatId: user.User.chatId,
            formation: user.formation,
            coins: user.coins,
            diamonds: user.diamonds,
            points: user.points,
            draws: user.draws,
            played: user.played,
            won: user.won,
            lost: user.lost,
            scored: user.scored,
            conceded: user.conceded,
            Rank: user.Rank,
            username: user.User.username,
            photo: user.User.photo,
            bio: user.User.bio,
            positions: user.positions,
            teamOverall: user.teamOverall,
            country: user.country,
            form,
            matches: recentMatches,
            roundReferrals: user.roundReferrals,
            totalReferrals: user.totalReferrals,
            nextAvailableMatch,
        }

        return JSON.parse(JSON.stringify(returnObject))

    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load play page data');
    }
}

export async function getPublicUserProfile(initData: string, targetUserId: string) {
    await requireAuthenticatedUser(initData);
    await connectToDatabase();

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        throw new Error('User not found');
    }

    const user = await populateUsers(UserData.findOne({ User: targetUserId }));
    if (!user) {
        throw new Error('User data not found');
    }

    const userMatches = await populateMatch(Match.find({
        $or: [{ Player: targetUserId }, { Opponent: targetUserId }],
        availableToWatch: { $lte: new Date() }
    }).sort({ createdAt: -1 }).limit(5));

    const form = userMatches.reverse().map((match: IMatch) => match.winner.toString() === targetUserId ? 'W' : 'L').join('');
    const recentMatches = userMatches.reverse().slice(0, 2);

    return JSON.parse(JSON.stringify({
        id: user.User._id,
        chatId: user.User.chatId,
        formation: user.formation,
        coins: user.coins,
        diamonds: user.diamonds,
        points: user.points,
        draws: user.draws,
        played: user.played,
        won: user.won,
        lost: user.lost,
        scored: user.scored,
        conceded: user.conceded,
        Rank: user.Rank,
        username: user.User.username,
        photo: user.User.photo,
        bio: user.User.bio,
        positions: user.positions,
        teamOverall: user.teamOverall,
        country: user.country,
        form,
        matches: recentMatches,
        roundReferrals: user.roundReferrals,
        totalReferrals: user.totalReferrals,
        nextAvailableMatch: null,
    }));
}

export async function saveFormation(initData: string, formation: string) {
    const id = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    if (!formations.some((item) => item.id === formation)) {
        throw new Error('Invalid formation');
    }

    await UserData.findOneAndUpdate({ User: id }, { '$set': { formation } });
}

export async function upgradePosition(initData: string, position: string) {
    const id = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    const user = await UserData.findOne({ User: id });

    if (!user) {
        throw new Error('User not found');
    }

    const userPosition = user.positions.find((pos: any) => pos.position === position);

    if (!userPosition) {
        throw new Error('Position not found');
    }

    const positionData = positions.find(pos => pos.symbol === position);

    if (!positionData) {
        throw new Error('Position data not found');
    }

    const initialPrice = positionData.initialPrice;
    const price = Math.round(initialPrice * (1.1 ** userPosition.level));

    if (user.coins < price) {
        throw new Error('Not enough coins');
    }

    userPosition.level += 1;
    user.coins -= price;
    user.teamOverall = calculateTeamOverall(user.positions);

    await user.save();

    const newUser = await getUserForPlayPage(initData);
    return JSON.parse(JSON.stringify(newUser));
}

type SpinPrize =
    | { type: 'coins'; amount: number }
    | { type: 'upgrade'; symbol: string; increment: number; color: string };

function generateWeightedSpinPrize(user: IUserData): SpinPrize {
    const userRank = Ranks.find(rank => rank.rank === user.Rank);
    if (!userRank) {
        throw new Error('Rank data not found');
    }

    const coinPrizesMultiple = user.draws < 4 ? 8 : 0;
    const prizes: SpinPrize[] = [];
    const minCoins = userRank.baseCoins * 6;
    const maxCoins = userRank.baseCoins * 9;
    const filteredPositions = positions.filter(pos => pos.type !== 'Staff');

    for (let i = 0; i < 3; i++) {
        prizes.push(
            ...filteredPositions.map((pos) => ({
                type: 'upgrade' as const,
                symbol: pos.symbol,
                increment: Math.floor(Math.random() * 2) + 1,
                color: pos.color,
            }))
        );
    }

    for (let i = 0; i < 40 * coinPrizesMultiple; i++) {
        prizes.push({
            type: 'coins',
            amount: Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins,
        });
    }

    if (prizes.length === 0) {
        return filteredPositions[0]
            ? {
                type: 'upgrade',
                symbol: filteredPositions[0].symbol,
                increment: 1,
                color: filteredPositions[0].color,
            }
            : { type: 'coins', amount: minCoins };
    }

    return prizes[Math.floor(Math.random() * prizes.length)];
}

export async function spinLuckyWheel(initData: string) {
    const id = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    const user = await UserData.findOne({ User: id });
    if (!user) {
        throw new Error('User not found');
    }

    if (user.diamonds < 5) {
        throw new Error('Not enough diamonds');
    }

    const prize = generateWeightedSpinPrize(user);

    user.diamonds -= 5;
    user.draws += 1;
    if (user.draws === 5) {
        user.draws = 0;
    }

    if (prize.type === 'coins') {
        user.coins += prize.amount;
    } else {
        const userPosition = user.positions.find((pos: any) => pos.position === prize.symbol);
        if (!userPosition) {
            throw new Error('Position not found');
        }
        userPosition.level += prize.increment;
    }

    user.teamOverall = calculateTeamOverall(user.positions);
    await user.save();

    const newUser = await getUserForPlayPage(initData);
    return {
        prize,
        user: JSON.parse(JSON.stringify(newUser)),
    };
}

function mapUserDataToPlayers(userData: IUserData, increment: number) {
    return userData.positions.map(pos => ({
        position: pos.position,
        level: pos.level + increment,
        attributes: { stamina: 70, skill: 80, speed: 75 } // Example attributes
    }));
}

function simulatePenalty(player: string) {
    let scenario: any[] = [];
    scenario.push({ scenario: 'Player ready to take the penalty', line: 9, wait: 4000 });
    scenario.push({ scenario: 'Player comes forward', line: 9, wait: 3000 });
    scenario.push({ scenario: 'Player shoots', line: 10, wait: 1500 });

    const PenaltyChance = Math.random();

    if (PenaltyChance < 0.25) {
        scenario.push({ scenario: 'Penalty Missed', line: 10, wait: 1500 });
    } else {
        scenario.push({ scenario: 'Penalty Scored', line: 10, wait: 1500 });
    }

    return scenario;
}

async function assertMatchCooldown(playerId: string, type: string) {
    if (type === 'Friendly') {
        return;
    }

    const latestMatch = await Match.findOne({
        Player: playerId,
        type: { $in: ['Rank', 'Classic'] },
    }).sort({ createdAt: -1 });

    if (latestMatch && new Date(latestMatch.availableToWatch) > new Date()) {
        throw new Error('Match cooldown active');
    }
}

function resolveMatchRewards(
    type: string,
    finalOutcome: string,
    prizes: { coins: number; diamonds: number; points: number }
) {
    if (type === 'Friendly') {
        return { coins: 0, diamonds: 0, points: 0 };
    }

    if (type === 'Classic') {
        if (finalOutcome === 'Player Wins!') {
            return { coins: prizes.coins * 2, diamonds: 0, points: 0 };
        }
        if (finalOutcome === 'Opponent Wins!') {
            return { coins: Math.floor(prizes.coins / 2), diamonds: 0, points: 0 };
        }
        return { coins: 0, diamonds: 0, points: 0 };
    }

    if (finalOutcome === 'Player Wins!') {
        return prizes;
    }

    return { coins: 0, diamonds: 0, points: 0 };
}

export async function playGame(initData: string, player2ID: string, type: string) {
    const player1ID = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();
        await assertMatchCooldown(player1ID, type);

        const player1 = await UserData.findOne({ User: player1ID })
        const player2 = await UserData.findOne({ User: player2ID })

        if (!player1 || !player2) {
            throw new Error('One or both players not found.');
        }

        const formation1 = formations.find(f => f.id === player1.formation);
        const formation2 = formations.find(f => f.id === player2.formation);

        if (!formation1 || !formation2) {
            throw new Error('Formations not found.');
        }

        const players1 = mapUserDataToPlayers(player1, 3);
        const players2 = mapUserDataToPlayers(player2, 3);

        let results = [{ minute: 0, player: 'Match', scenario: [{ scenario: 'Match Started', line: 5, wait: 2500 }] }];
        let score1 = 0;
        let score2 = 0;

        let totalMoves = 0;
        let player = 0;

        while (true) {
            let scenario;
            let lastScenario = '';

            if (results.length > 0 && results[results.length - 1].scenario.length > 0) {
                lastScenario = results[results.length - 1].scenario[results[results.length - 1].scenario.length - 1].scenario;
            }

            if (player % 2 === 0) {
                scenario = simulateAttack(formation1, formation2, players1, players2, lastScenario);
                if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                    score1++;
                }
                results.push({ minute: 0, player: 'Player', scenario });

                totalMoves = totalMoves + scenario.length

                if (totalMoves >= 90) {
                    break;
                }

                player++;

            } else {
                scenario = simulateAttack(formation2, formation1, players2, players1, lastScenario);
                if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                    score2++;
                }
                results.push({ minute: 0, player: 'Opponent', scenario });

                totalMoves = totalMoves + scenario.length

                if (totalMoves >= 90) {
                    break;
                }

                player++;
            }
        }

        results.push({ minute: 45, player: 'Match', scenario: [{ scenario: 'Half-time', line: 5, wait: 2500 }] });

        totalMoves = 0;

        player = 1

        while (true) {
            let scenario;
            let lastScenario = '';

            if (results.length > 0 && results[results.length - 1].scenario.length > 0) {
                lastScenario = results[results.length - 1].scenario[results[results.length - 1].scenario.length - 1].scenario;
            }

            if (player % 2 === 0) {
                scenario = simulateAttack(formation1, formation2, players1, players2, lastScenario);
                if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                    score1++;
                }
                results.push({ minute: 0, player: 'Player', scenario });

                totalMoves = totalMoves + scenario.length

                if (totalMoves >= 90) {
                    break;
                }

                player++;

            } else {
                scenario = simulateAttack(formation2, formation1, players2, players1, lastScenario);
                if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                    score2++;
                }
                results.push({ minute: 0, player: 'Opponent', scenario });

                totalMoves = totalMoves + scenario.length

                if (totalMoves >= 90) {
                    break;
                }

                player++;
            }
        }

        results.push({ minute: 90, player: 'Match', scenario: score1 === score2 ? [{ scenario: 'Awaiting Extra-time', line: 5, wait: 2500 }] : [{ scenario: 'Full time', line: 5, wait: 2500 }] });

        totalMoves = 0;

        player = 0

        if (score1 === score2) {
            // Extra time
            while (true) {
                let scenario;
                let lastScenario = '';

                if (results.length > 0 && results[results.length - 1].scenario.length > 0) {
                    lastScenario = results[results.length - 1].scenario[results[results.length - 1].scenario.length - 1].scenario;
                }

                if (player % 2 === 0) {
                    scenario = simulateAttack(formation1, formation2, players1, players2, lastScenario);
                    if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                        score1++;
                    }
                    results.push({ minute: 0, player: 'Player', scenario });

                    totalMoves = totalMoves + scenario.length

                    if (totalMoves >= 60) {
                        break;
                    }

                    player++;

                } else {
                    scenario = simulateAttack(formation2, formation1, players2, players1, lastScenario);
                    if (scenario[scenario.length - 1].scenario === 'Goal Scored' || scenario[scenario.length - 1].scenario === 'Penalty Scored' || scenario[scenario.length - 1].scenario === 'Freekick Scored') {
                        score2++;
                    }
                    results.push({ minute: 0, player: 'Opponent', scenario });

                    totalMoves = totalMoves + scenario.length

                    if (totalMoves >= 60) {
                        break;
                    }

                    player++;
                }
            }

            results.push({ minute: 120, player: 'Match', scenario: score1 === score2 ? [{ scenario: 'Awaiting Penalties', line: 5, wait: 2500 }] : [{ scenario: 'Full time', line: 5, wait: 2500 }] });
        }

        let playerPenalties = 0;
        let opponentPenalties = 0;

        if (score1 === score2) {
            // Initial 5 penalties for each team
            for (let i = 0; i < 5; i++) {
                let scenario;
                scenario = simulatePenalty('Player');
                results.push({ minute: 120, player: 'Player', scenario: scenario });
                if (scenario[scenario.length - 1].scenario === 'Penalty Scored') playerPenalties++;

                scenario = simulatePenalty('Opponent');
                results.push({ minute: 120, player: 'Opponent', scenario: scenario });
                if (scenario[scenario.length - 1].scenario === 'Penalty Scored') opponentPenalties++;

                // Check for early win
                if ((playerPenalties > opponentPenalties + (4 - i)) || (opponentPenalties > playerPenalties + (4 - i))) {
                    break;
                }
            }

            // Sudden death if tied after 5 penalties each
            let round = 6;
            while (playerPenalties === opponentPenalties) {
                let scenario;
                scenario = simulatePenalty('Player');
                results.push({ minute: 120, player: 'Player', scenario: scenario });
                if (scenario[scenario.length - 1].scenario === 'Penalty Scored') playerPenalties++;

                scenario = simulatePenalty('Opponent');
                results.push({ minute: 120, player: 'Opponent', scenario: scenario });
                if (scenario[scenario.length - 1].scenario === 'Penalty Scored') opponentPenalties++;

                round++;
            }
        }

        const finalOutcomeMinute = score1 === score2 ? 120 : 90;
        const finalOutcome = score1 === score2
            ? playerPenalties > opponentPenalties
                ? 'Player Wins!'
                : 'Opponent Wins!'
            : score1 > score2
                ? 'Player Wins!'
                : 'Opponent Wins!';

        results.push({ minute: finalOutcomeMinute, player: 'Match', scenario: [{ scenario: finalOutcome, line: 5, wait: 3000 }] });

        const player1Overall = calculateFormationOverall(player1);
        const opponentOverall = calculateFormationOverall(player2);
        const increment = player1.roundReferrals * 0.1;
        const prizes = calculatePrizes(player1Overall, opponentOverall, player1.Rank, increment);
        const rewards = resolveMatchRewards(type, finalOutcome, prizes);
        const { coins, diamonds, points } = rewards;

        if (type == 'Rank') {
            const rankData = Ranks.find(rank => rank.rank === player1.Rank);
            if (finalOutcome === 'Player Wins!') {
                const updatedPlayer1 = await UserData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, won: 1, points, coins, diamonds, scored: score1, conceded: score2 } }, { new: true })

                await RoundData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, won: 1, points, scored: score1 } })

                const newRank = Ranks.find(rank => updatedPlayer1.points <= rank.maxPoints) || Ranks[Ranks.length - 1];

                if (newRank.rank !== updatedPlayer1.Rank) {
                    await UserData.findOneAndUpdate(
                        { User: player1ID },
                        { Rank: newRank.rank }
                    );
                }

                await UserData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, lost: 1, scored: score2, conceded: score1 } })
                await RoundData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, scored: score2 } })

            } else if (finalOutcome === 'Opponent Wins!') {

                const deduction = rankData?.basePoints || 0;
                const currentPlayer1 = await UserData.findOne({ User: player1ID });
                const currentPlayerRound = await RoundData.findOne({ User: player1ID });

                const newPoints = Math.max(0, currentPlayer1.points - deduction);
                const roundPoints = Math.max(0, currentPlayerRound.points - deduction);

                const updatedPlayer1 = await UserData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, lost: 1, scored: score1, conceded: score2 }, '$set': { points: newPoints } }, { new: true })
                await RoundData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, scored: score1 }, '$set': { points: roundPoints } })

                const newRank = Ranks.find(rank => updatedPlayer1.points <= rank.maxPoints) || Ranks[Ranks.length - 1];

                if (newRank.rank !== updatedPlayer1.Rank) {
                    await UserData.findOneAndUpdate(
                        { User: player1ID },
                        { Rank: newRank.rank }
                    );
                }
                await UserData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, won: 1, scored: score2, conceded: score1 } })
                await RoundData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, won: 1, scored: score2 } })
            }
        } else if (type === 'Classic') {
            if (finalOutcome === 'Player Wins!') {

                await UserData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, won: 1, coins, scored: score1, conceded: score2 } })

                await RoundData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, won: 1, scored: score1 } })

                await UserData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, lost: 1, scored: score2, conceded: score1 } })

                await RoundData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, scored: score2 } })

            } else if (finalOutcome === 'Opponent Wins!') {
                await UserData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, lost: 1, coins: coins / 2, scored: score1, conceded: score2 } })

                await RoundData.findOneAndUpdate({ User: player1ID }, { '$inc': { played: 1, scored: score1 } })

                await UserData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, won: 1, scored: score2, conceded: score1 } })

                await RoundData.findOneAndUpdate({ User: player2ID }, { '$inc': { played: 1, won: 1, scored: score1 } })

            }
        }

        const match = new Match({
            Player: player1ID,
            Opponent: player2ID,
            attacks: results,
            status: 'finished',
            winner: finalOutcome === 'Player Wins!' ? player1ID : player2ID,
            playerScore: score1 + playerPenalties,
            opponentScore: score2 + opponentPenalties,
            type
        });

        await match.save();

        return JSON.parse(JSON.stringify(match))

    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to play game');
    }
}

export async function savePredictions(initData: string, predictions: Record<string, { predictedTeam1Score: number; predictedTeam2Score: number }>) {
    const userId = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    const fixtures = await Promise.all(
        Object.keys(predictions).map(async (matchId) => {
            const fixture = await getPredictionFixture(matchId);
            if (!fixture) {
                throw new Error(`Invalid prediction match: ${matchId}`);
            }
            if (new Date() > fixture.lastTimeToPredict) {
                throw new Error(`Prediction window closed for match: ${matchId}`);
            }
            return matchId;
        })
    );

    const predictionsArray = fixtures.map((matchId) => ({
        matchId,
        predictedTeam1Score: predictions[matchId].predictedTeam1Score,
        predictedTeam2Score: predictions[matchId].predictedTeam2Score,
        collected: false,
    }));

    await UserData.findOneAndUpdate({ User: userId }, { '$set': { dailyPredictions: predictionsArray } });
}

export async function collectCoins(initData: string, matchId: string) {
    const userId = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    const user = await UserData.findOne({ User: userId });

    if (!user) {
        throw new Error('User not found');
    }

    const prediction = user.dailyPredictions.find((p: any) => p.matchId === matchId);

    if (!prediction) {
        throw new Error('Prediction not found');
    }

    if (prediction.collected) {
        throw new Error('Prize already collected');
    }

    const fixture = await getPredictionFixture(matchId);
    if (!fixture) {
        throw new Error('Prediction fixture not found');
    }

    if (!fixture.finished || fixture.team1Score === null || fixture.team2Score === null) {
        throw new Error('Match result not available yet');
    }

    if (
        prediction.predictedTeam1Score !== fixture.team1Score ||
        prediction.predictedTeam2Score !== fixture.team2Score
    ) {
        throw new Error('Prediction was incorrect');
    }

    const prize = Ranks.find(r => r.rank === user.Rank);
    user.coins += prize?.predictionPrize || 0;
    prediction.collected = true;

    await user.save();
    await RoundData.findOneAndUpdate({ User: userId }, { '$inc': { predictions: 1 } });
}

const calculateTeamOverall = (userPositions: any) => {
    const validPositions = userPositions.filter((pos: any) => {
        const posData = positions.find((p: any) => p.symbol === pos.position);
        return posData && posData.type !== 'Staff';
    });

    if (validPositions.length === 0) {
        return 0; // or another default value if no valid positions
    }

    const totalLevels = validPositions.reduce((sum: any, pos: any) => sum + pos.level, 0);
    const averageLevel = totalLevels / validPositions.length;

    return averageLevel;
};

const generateRandomUsername = () => {
    const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let username = '';
    for (let i = 0; i < 8; i++) {
        username += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return username;
};

export async function findMatch(initData: string) {
    const id = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const user = await populateUsers(UserData.findOne({ User: id })).lean();

        if (!user) throw new Error('User not found');

        const count = await UserData.countDocuments({ Rank: { $in: [user.Rank, user.Rank + 1, user.Rank + 2, user.Rank + 3, user.Rank - 1] }, User: { $ne: id } });

        if (count === 0) {
            throw new Error('No opponents available');
        }

        const randomIndex = Math.floor(Math.random() * count);

        const opponent = await populateUsers(
            UserData.findOne({
                Rank: { $in: [user.Rank, user.Rank + 1, user.Rank + 2, user.Rank + 3, user.Rank - 1] },
                User: { $ne: id }
            })
                .skip(randomIndex)
                .lean()
        );

        if (!opponent) throw new Error('Opponent not found');

        const userOverall = calculateFormationOverall(user);
        const opponentOverall = calculateFormationOverall(opponent);

        let increment = user.roundReferrals * 0.1

        const prizes = calculatePrizes(userOverall, opponentOverall, user.Rank, increment);

        const matchDetails = {
            player: { ...user },
            opponent: { ...opponent },
            playerOverall: userOverall,
            opponentOverall: opponentOverall,
            prizes
        }

        return JSON.parse(JSON.stringify(matchDetails))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to find match');
    }
}

export async function getFriendlyMatchInfo(initData: string, opponentId: string) {
    const playerId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();
        const user = await populateUsers(UserData.findOne({ User: playerId })).lean();

        const opponent = await populateUsers(UserData.findOne({ User: opponentId })).lean();

        const userOverall = calculateFormationOverall(user);
        const opponentOverall = calculateFormationOverall(opponent);

        const matchDetails = {
            player: { ...user },
            opponent: { ...opponent },
            playerOverall: userOverall,
            opponentOverall: opponentOverall,
        }

        return JSON.parse(JSON.stringify(matchDetails))

    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to load friendly match');
    }
}

function calculateFormationOverall(userData: IUserData) {
    const userFormation = formations.find(f => f.id === userData.formation);

    if (!userFormation) {
        throw new Error('User formation not found');
    }

    // Extract the positions from the user's formation
    const formationPositions = userFormation.data.flatMap(data => data.positions).filter(pos => pos);

    // Filter user's positions based on the formation positions
    const validPositions = userData.positions.filter(userPos => formationPositions.includes(userPos.position));

    if (validPositions.length === 0) {
        return 0; // or another default value if no valid positions
    }

    // Calculate the average level of the positions
    const totalLevels = validPositions.reduce((sum, position) => sum + position.level, 0);
    const averageLevel = totalLevels / validPositions.length;

    return averageLevel;
}

function calculatePrizes(userOverall: number, opponentOverall: number, userRank: number, increment: number) {
    const rankData = Ranks.find(rank => rank.rank === userRank);

    if (!rankData) {
        throw new Error('Rank data not found');
    }

    let coins = rankData.baseCoins;
    let points = rankData.basePoints;
    let diamonds = 0;

    const difference = opponentOverall - userOverall;

    if (difference >= 2) {

        coins *= 2;
        points *= 2;
        diamonds = 2;
    } else if (difference <= -2) {

        coins = Math.floor(coins / 2);
        points = Math.floor(points / 2);
    }

    coins = coins + (coins * increment)

    diamonds = diamonds + (diamonds * increment)

    points = points + (points * increment)

    coins = Math.ceil(coins)

    diamonds = Math.ceil(diamonds)

    points = Math.ceil(points)

    return { coins, points, diamonds };
}

export async function changeCountry(initData: string, country: string) {
    const userId = await requireAuthenticatedUserId(initData);
    await connectToDatabase();

    await UserData.findOneAndUpdate({ User: userId }, { '$set': { country } });
}

export async function editProfile(initData: string, username: string, bio: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const existingUser = await User.findOne({ username });

        if (existingUser && existingUser._id.toString() !== userId) {
            return 'Username is already taken.';
        }

        await User.findByIdAndUpdate(
            userId,
            { '$set': { username, bio } },
            { new: true, runValidators: true }
        );

        return 'success';
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to update profile');
    }
}

export async function buyIcon(initData: string, iconName: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const user = await populateUsers(UserData.findOne({ User: userId }))
        const localIcon = Icons.find(i => i.name == iconName)

        if (!localIcon) {
            throw new Error('Icon not found');
        }

        if (user.diamonds < localIcon.price) {
            throw new Error('Insuffient Funds')
        }

        user.diamonds -= localIcon.price;

        user.icons.push({
            name: localIcon.name,
            theme: localIcon.theme,
            type: localIcon.type
        });

        await user.save();

        return JSON.parse(JSON.stringify(user));

    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to buy icon');
    }
}

export async function changeIcon(initData: string, iconName: string) {
    const userId = await requireAuthenticatedUserId(initData);

    try {
        await connectToDatabase();

        const ownedIcon = await UserData.findOne({ User: userId, 'icons.name': iconName });
        if (!ownedIcon) {
            throw new Error('Icon not owned');
        }

        await User.findByIdAndUpdate(userId, { '$set': { photo: iconName } })

        const user = await populateUsers(UserData.findOne({ User: userId }))

        return JSON.parse(JSON.stringify(user))
    } catch (error) {
        throw error instanceof Error ? error : new Error('Failed to change icon');
    }
}