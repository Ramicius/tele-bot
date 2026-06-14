import React, { useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from '../ui/alert-dialog'
import Image from 'next/image'
import { getPublicUserProfile } from '@/lib/actions/user.actions'
import { getImageID } from '@/lib/utils'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'

const PlayerDialog = ({ userPhoto, userName, userId, page, userCountry, initData }: { userPhoto: string, userName: string, userId: string, userCountry: string, page: string, initData: string }) => {

    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const getUser = async () => {
        if (loading) {
            return;
        }

        setLoading(true);

        const requestedUser = await getPublicUserProfile(initData, userId)

        setUser(requestedUser);

        setLoading(false)
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger>
                {page === 'History' && <div className='flex flex-row items-center' onClick={getUser}>
                    <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(userPhoto)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[45px] w-[45px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                    <p className='text-[13px] sm:text-[30px] text-center ml-[6px] rounded-sm line-clamp-1'>{userName}</p>
                </div>}
                {page === 'Match' && <div className='flex flex-col justify-center items-center gap-2 w-[120px] overflow-hidden' onClick={getUser}>
                    <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(userPhoto)}`} alt='user' height={120} width={120} className='bg-slate-500 h-[70px] w-[70px] rounded-md' />
                    <div className='flex flex-row items-center gap-1'>
                        <p className='text-white font-semibold text-[14px] line-clamp-1'>{userName}</p>
                        <Image src={`/flags/${userCountry}.svg`} alt='flag' height={20} width={20} className='bg-white h-[18px] w-[18px] rounded-full border-[1px] border-slate-800' />
                    </div>
                </div>}
            </AlertDialogTrigger>
            <AlertDialogContent className='bg-slate-800 px-2 border-0 rounded-lg flex flex-col justify-center items-center'>
                {user && <>
                    <div className='w-10/12 flex flex-orw items-center mt-6'>
                        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(userPhoto)}`} alt='user' height={100} width={100} className='bg-slate-500 h-[100px] w-[100px] rounded-lg' />
                        <div className='flex flex-col ml-3 gap-2'>
                            <div className='flex flex-row items-center gap-2'>
                                <p className='font-semibold text-white text-[15px]'>{user.username}</p>
                                <Image src={`/flags/${user.country}.svg`} alt='flag' height={20} width={20} className='rounded-full bg-white h-[25px] w-[25px]' />
                            </div>
                            <p className='font-semibold text-white text-[15px]'>Rank: {user?.Rank}</p>
                            <p className='font-semibold text-white text-[15px]'>Overall: {(user?.teamOverall).toFixed(2)}</p>
                        </div>
                    </div>
                    <div className='w-11/12 py-1 flex flex-row items-center gap-2 bg-slate-900 rounded-lg text-white font-semibold text-[13px]'>
                        <p className='px-4 py-1'>{user.bio.split('\n').map((line: any, index: number) => (
                            <span key={index}>
                                {line}
                                <br />
                            </span>
                        ))}</p>
                    </div>
                    <div className='w-11/12'>
                        <ScrollArea>
                            <div className='flex items-center gap-1 w-full'>
                                <div className='w-[140px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold rounded-tl-lg h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Form</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold rounded-bl-lg flex flex-row items-center justify-center gap-1 h-1/2'>
                                        {user.form.split('').map((result: any, index: number) => (
                                            <p
                                                key={index}
                                                className={`rounded-sm w-1/6 text-[13px] sm:text-[18px] ${result === 'W' ? 'bg-green-600' : 'bg-red-600'}`}
                                            >
                                                {result}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div className='w-[70px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Played</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>{user && user?.played}</p>
                                    </div>
                                </div>
                                <div className='w-[70px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Won</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>{user && user?.won}</p>
                                    </div>
                                </div>
                                <div className='w-[70px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Rate</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-green-500 text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>%{user && ((user?.won / user?.played) * 100).toFixed(1)}</p>
                                    </div>
                                </div>
                                <div className='w-[70px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Scored</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-green-500 text-center font-semibold h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>{user && user?.scored}</p>
                                    </div>
                                </div>
                                <div className='w-[90px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                                    <div className='w-full bg-slate-900 text-white text-center font-semibold rounded-tr-lg h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>Conceded</p>
                                    </div>
                                    <div className='w-full bg-slate-900 text-red-500 text-center font-semibold rounded-br-lg h-1/2 flex justify-center items-center'>
                                        <p className='text-[16px] sm:text-[20px]'>{user && user?.conceded}</p>
                                    </div>
                                </div>
                            </div>
                            <ScrollBar orientation="horizontal" className='hidden' />
                        </ScrollArea>
                    </div>
                </>}
                {!user && <Image src={'/icons/spinner.svg'} alt='spinner' height={20} width={20} className='animate-spin' />}
                <AlertDialogCancel className='absolute text-white right-2 top-0 bg-transparent border-0'>
                    <Image src={'/icons/x.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
                </AlertDialogCancel>
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default PlayerDialog