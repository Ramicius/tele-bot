import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { IUserData } from '@/lib/database/models/userData.model';
import { getUserByUserID } from '@/lib/actions/user.actions';
import { getImageID } from '@/lib/utils';

const TopPage = ({ initData }: { initData: string }) => {

    const [user, setUser] = useState<IUserData>()

    useEffect(() => {
        const getUser = async () => {
            const userData = await getUserByUserID(initData)
            setUser(userData)

        }
        getUser()
    }, [])

    if (!user) {
        return (<Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />)
    }

    return (
        <div className='w-full flex flex-col h-screen bg-gradient-to-b from-slate-900 to-gray-600'>
            <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
                <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
                <p className='font-semibold text-white text-[13px]'>{user?.User.username} (Rank {user?.Rank})</p>
            </div>
            <div className='w-full flex flex-row gap-2 items-center px-2 mt-1'>
                <div className='w-1/2 text-center bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-yellow-500 rounded-lg font-semibold'>All Time</div>
                <div className='w-1/2 text-center bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white rounded-lg font-semibold'>This Round</div>
            </div>
            <ScrollArea className='py-2 px-2 h-[65px]'>
                <div className='flex gap-2'>
                    <>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 120 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-yellow-500' >Most Games</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 120 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Most Wins</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 120 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Most Goals</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 150 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Most Predictions</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 120 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Most Points</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 150 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Highest Rank</div>
                        </div>
                        <div className='flex flex-col h-full justify-center items-center rounded-lg' style={{ height: '100%', width: 150 }}>
                            <div className=' text-center w-full rounded-md font-semibold bg-gradient-to-b from-slate-800 to-slate-600 py-1 text-white' >Highest Overall</div>
                        </div>
                    </>
                </div>
                <ScrollBar orientation="horizontal" className='hidden' />
            </ScrollArea>
            <div className='flex flex-col h-full justify-center items-center flex-grow text-white text-[20px] font-semibold'>
                Rewards Coming Soon...
            </div>
            <div className='h-[120px] mt-auto' />
        </div>
    );
};

export default TopPage