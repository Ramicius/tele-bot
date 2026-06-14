'use client'

import { getFriendlyMatchInfo, getUserByUserID, playGame } from '@/lib/actions/user.actions'
import { IUserData } from '@/lib/database/models/userData.model'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog'
import { Input } from '../ui/input'
import { acceptFriendRequest, deleteFriendRequest, findUsersByUsernames, getFriendRequests, getFriends, sendFriendRequest } from '@/lib/actions/friendship.actions'
import { IUser } from '@/lib/database/models/user.model'
import { ScrollArea } from '../ui/scroll-area'
import { formations } from '@/constants/Formations'
import { useRouter } from 'next/navigation'
import { getImageID } from '@/lib/utils'
import useTelegram from '@/hooks/useTelegram'

const colors = [
    { 'Forward': '#EE2E0C' },
    { 'Midfield': '#EE9F0C' },
    { 'Defense': '#0090DE' },
    { 'Goalkeeper': '#41B815' },
]

const FriendsPage = () => {
    const { state } = useTelegram();
    const { initData } = state;

    const [user, setUser] = useState<IUserData>()
    const [activeTab, setActiveTab] = useState('friends');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [loadingRequests, setLoadingRequests] = useState<any>({});
    const [friendRequests, setFriendRequests] = useState<any[]>([]);
    const [friendsList, setFriendsList] = useState<IUser[]>([]);
    const [match, setMatch] = useState<any>(); // State for selected friend data
    const [loadingUserData, setLoadingUserData] = useState(false); // State for loading data
    const [waiting, setWaiting] = useState(false)
    const router = useRouter();

    useEffect(() => {

        if (!initData) return;

        const getUser = async () => {
            const userData = await getUserByUserID(initData)
            setUser(userData)
        }

        getUser();
    }, [initData])

    useEffect(() => {
        if (activeTab === 'requests') {
            fetchFriendRequests();
        }
        if (activeTab === 'friends') {
            fetchFriendsList();
        }
    }, [activeTab]);

    const fetchFriendsList = async () => {
        if (!initData) return;
        const friends = await getFriends(initData);
        setFriendsList(friends);
    };

    const fetchFriendRequests = async () => {
        if (!initData) return;
        const requests = await getFriendRequests(initData);
        setFriendRequests(requests);
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 3) {
                findUsers(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 300); // debounce time

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const findUsers = async (query: string) => {
        if (!initData) return;
        const users = await findUsersByUsernames(initData, query)
        setSearchResults(users);
    };

    const sendRequest = async (id: string) => {
        if (!initData) return;
        setLoadingRequests((prev: any) => ({ ...prev, [id]: true }));

        await sendFriendRequest(initData, id);

        setLoadingRequests((prev: any) => ({ ...prev, [id]: false }));

        setSearchResults((prev) =>
            prev.map(user =>
                user.id === id ? { ...user, hasRequest: true } : user
            )
        );
    }

    const handleAcceptRequest = async (requestId: string) => {
        if (!initData) return;
        await acceptFriendRequest(initData, requestId);
        setFriendRequests((prev) =>
            prev.filter(request => request._id !== requestId)
        );
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (!initData) return;
        await deleteFriendRequest(initData, requestId);
        setFriendRequests((prev) =>
            prev.filter(request => request._id !== requestId)
        );
    };

    const getColor = (type: any, position: any) => {
        if (!position) {
            return '';
        }
        const colorObj: any = colors.find((color: any) => color[type]);
        return colorObj ? colorObj[type] : '';
    };

    const handlePlaying = async (opponentId: string) => {

        if (waiting || !initData) {
            return;
        }

        setWaiting(true);
        const match = await playGame(initData, opponentId, 'Friendly')

        router.push(`/play/${match._id}`);
    }


    const handleOpenDialog = async (friendId: string) => {
        if (!initData) return;
        setLoadingUserData(true);
        const friendlyMatch = await getFriendlyMatchInfo(initData, friendId);
        setMatch(friendlyMatch);
        setLoadingUserData(false);
    };

    if (!user) {
        return (
            <section className='w-full h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-800 to-gray-600'>
                <Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />
            </section>)
    }

    return (
        <section className='w-full h-screen flex flex-col bg-gradient-to-b from-slate-800 to-gray-600'>
            <div className='w-full ml-auto p-2 flex flex-row items-center gap-2'>
                <a href='/' className='py-2 px-3 rounded-md text-white font-bold'>
                    <Image src={'/icons/back.svg'} alt='back' height={10} width={10} />
                </a>
                <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user?.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
                <p className='font-semibold text-white text-[13px]'>{user?.User.username} (Rank {user?.Rank})</p>
            </div>
            <div className='w-full p-4'>
                <div className='w-full flex flex-row items-center gap-2'>
                    <div className='w-full flex justify-around bg-white rounded-md border-2 border-white'>
                        <button
                            className={`w-1/2 py-1 font-semibold ${activeTab === 'friends' ? 'bg-slate-900 text-white' : ' text-black'} rounded-md`}
                            onClick={() => setActiveTab('friends')}
                        >
                            Friends
                        </button>
                        <button
                            className={`w-1/2 py-1 font-semibold ${activeTab === 'requests' ? 'bg-slate-900 text-white' : ' text-black'} rounded-md`}
                            onClick={() => setActiveTab('requests')}
                        >
                            Requests
                        </button>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger>
                            <div className='flex justify-center items-center px-3 h-[35px] rounded-md bg-white text-[20px] font-bold'>
                                <p>+</p>
                            </div>
                        </AlertDialogTrigger>
                        <AlertDialogContent className='bg-slate-900 px-4 py-6 border-0 rounded-lg min-h-[400px] flex flex-col justify-start items-center'>
                            <AlertDialogHeader>
                                <AlertDialogTitle className='text-white mt-7 mb-3 text-xl font-semibold'>Find Players</AlertDialogTitle>
                            </AlertDialogHeader>
                            <div className='w-full flex justify-center mb-4'>
                                <Input
                                    className='w-11/12 max-w-md bg-gray-800 text-white border-2 border-gray-600 rounded-md p-2'
                                    placeholder='Search players...'
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <ScrollArea className='w-11/12 flex flex-col justify-center items-center overflow-y-auto place-self-center h-[250px]'>
                                {searchResults.length > 0 ? (
                                    searchResults.map((user) => (
                                        <div key={user.id} className='w-full max-w-md bg-gray-800 rounded-md px-3 py-2 mb-2 text-white flex justify-start items-center gap-2'>
                                            <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user.photo)}`} alt='friend' height={60} width={60} className='h-[40px] w-[40px] rounded-md' />
                                            <p className='text-[15px] font-medium'>{user.username}</p>
                                            {!user.hasRequest ? (
                                                <div
                                                    className='bg-blue-500 text-white font-semibold text-[13px] px-3 py-1 rounded-md ml-auto'
                                                    onClick={() => sendRequest(user.id)}
                                                >
                                                    {loadingRequests[user.id] ? 'Sending...' : 'Request'}
                                                </div>
                                            ) : (
                                                <p className='text-gray-400 text-[13px] ml-auto'>Request Sent</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className='text-gray-400 text-center'>No players found</p>
                                )}
                            </ScrollArea>
                            <AlertDialogCancel className='absolute text-white right-4 top-4 bg-transparent border-0'>
                                <Image src='/icons/x.svg' alt='close' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
                            </AlertDialogCancel>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className='mt-4'>
                    {activeTab === 'friends' ? (
                        <div className='w-full flex flex-col items-center overflow-y-auto'>
                            {friendsList.length > 0 ? (
                                friendsList.map(friend => (
                                    <div key={friend._id} className='w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-800 rounded-md p-3 mb-1 text-white flex items-center'>
                                        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(friend.photo)}`} alt='friend' height={60} width={60} className='h-[40px] w-[40px] rounded-md' />
                                        <p className='text-[14px] font-medium ml-3'>{friend.username}</p>
                                        <AlertDialog>
                                            <AlertDialogTrigger className='ml-auto'>
                                                <div className='ml-auto mr-2 shadow-purple-500 border-b-[3px] border-purple-800 bg-purple-600 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg shadow-md font-semibold' onClick={() => handleOpenDialog(friend._id)}>Play Friendly</div>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className='bg-slate-800 px-2 border-0 rounded-lg'>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className='w-1/2 place-self-center bg-purple-700 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg shadow-md shadow-purple-500 border-b-[3px] sm:border-b-[6px] border-purple-800 text-white mt-3'>Friendly Match</AlertDialogTitle>
                                                    {loadingUserData ? (
                                                        <Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin place-self-center' />
                                                    ) : match && <>
                                                        <div className='flex flex-row items-center gap-3'>
                                                            <div className='w-1/2'>
                                                                <div className='flex flex-row justify-center items-center gap-3 my-2'>
                                                                    <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.player.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[28px] w-[28px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                                                                    <p className='font-bold text-white text-[14px]'>{match.player.User.username}</p>
                                                                    <Image src={`/flags/${match?.player.country}.svg`} alt='flag' height={20} width={20} className='rounded-full h-[20px] w-[20px] bg-white' />
                                                                </div>
                                                                <div className='h-[250px] w-full flex flex-col justify-around rounded-md bg-slate-800 border-[1px] sm:border-4 border-white' style={{ backgroundImage: `url('/Field-dark-9.PNG')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                                    {formations.find(f => f.id === match?.player.formation)?.data.map((row: any, rowIndex: number) => (
                                                                        <div key={rowIndex} className='flex justify-around'>
                                                                            {row.positions.map((position: any, posIndex: number) => (
                                                                                <div key={posIndex} className='p-1 sm:px-3 sm:py-1 rounded-sm text-white font-semibold border-white' style={{ backgroundColor: getColor(row.type, row.positions[posIndex]), borderWidth: row.positions[posIndex] ? 2 : 0, boxShadow: position ? `-8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},-8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])}` : '' }}>
                                                                                    <p className='text-[10px] sm:text-[20px]'>{position}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className='bg-slate-900 text-white font-semibold my-1 rounded-full'>{match?.player.formation}</p>
                                                                <p className='bg-slate-900 text-white font-semibold my-1 rounded-full'>Overall: {(match?.playerOverall).toFixed(2)}</p>
                                                            </div>
                                                            <div className='w-1/2'>
                                                                <div className='flex flex-row justify-center items-center gap-3 my-2'>
                                                                    <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.opponent.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[28px] w-[28px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                                                                    <p className='font-bold text-white text-[14px]'>{match.opponent.User.username}</p>
                                                                    <Image src={`/flags/${match?.opponent.country}.svg`} alt='flag' height={20} width={20} className='rounded-full h-[20px] w-[20px] bg-white' />
                                                                </div>
                                                                <div className='h-[250px] w-full flex flex-col justify-around rounded-md bg-slate-800 border-[1px] sm:border-4 border-white' style={{ backgroundImage: `url('/Field-dark-9.PNG')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                                                                    {formations.find(f => f.id === match.opponent?.formation)?.data.map((row: any, rowIndex: number) => (
                                                                        <div key={rowIndex} className='flex justify-around'>
                                                                            {row.positions.map((position: any, posIndex: number) => (
                                                                                <div key={posIndex} className='p-1 sm:px-3 sm:py-1 rounded-sm text-white font-semibold border-white' style={{ backgroundColor: getColor(row.type, row.positions[posIndex]), borderWidth: row.positions[posIndex] ? 2 : 0, boxShadow: position ? `-8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},-8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])}` : '' }}>
                                                                                    <p className='text-[10px] sm:text-[20px]'>{position}</p>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <p className='bg-slate-900 text-white font-semibold my-1 rounded-full'>{match.opponent.formation}</p>
                                                                <p className='bg-slate-900 text-white font-semibold my-1 rounded-full'>Overall: {(match.opponentOverall).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                        <div className='w-full bg-green-700 text-white font-semibold rounded-md py-1 flex flex-row items-center justify-center gap-2' onClick={() => handlePlaying(match.opponent.User._id)}>
                                                            <p>{waiting ? 'Wait' : 'Play Friendly Match'}</p>
                                                        </div>

                                                    </>}
                                                </AlertDialogHeader>
                                                <AlertDialogCancel className='absolute text-white right-2 top-0 bg-transparent border-0'>
                                                    <Image src={'/icons/x.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
                                                </AlertDialogCancel>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                ))
                            ) : (
                                <p className='text-gray-400'>No friends found</p>
                            )}
                        </div>
                    ) : (
                        <div className='w-full flex flex-col items-center overflow-y-auto'>
                            {friendRequests.length > 0 ? (
                                friendRequests.map(request => (
                                    <div key={request._id} className='w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-800 rounded-md p-3 mb-2 text-white flex flex-row gap-3 items-center'>
                                        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(request.photo)}`} alt='user' height={20} width={20} />
                                        <p className='text-[16px] font-medium'>{request.Requester.username}</p>
                                        <div className='flex flex-row items-center gap-2 ml-auto'>
                                            <div className='bg-green-500 text-white py-[5.5px] px-[9px] rounded-md font-semibold' onClick={() => handleAcceptRequest(request._id)}>
                                                <Image src={'/icons/check.svg'} alt='check' height={15} width={15} />
                                            </div>
                                            <div className='bg-red-500 text-white py-1 px-2 rounded-md font-semibold' onClick={() => handleDeleteRequest(request._id)}>
                                                <Image src={'/icons/x-white.svg'} alt='check' height={15} width={15} />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className='text-gray-400'>No friend requests</p>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </section>
    )
}

export default FriendsPage