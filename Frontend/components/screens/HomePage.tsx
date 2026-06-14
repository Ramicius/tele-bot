import { Ranks } from '@/constants'
import { getUserForPlayPage } from '@/lib/actions/user.actions'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import UserDialog from '../shared/UserDialog'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../ui/carousel'
import { ScrollArea } from '../ui/scroll-area'
import { XEmbed, YouTubeEmbed } from 'react-social-media-embed';
import TweetEmbed from '../shared/TweetEmbed'
import axios from 'axios'
import InviteDialog from '../shared/InviteDialog'
import Link from 'next/link'

const HomePage = ({ initData }: { initData: string }) => {

    const [user, setUser] = useState<any>()
    const [height, setHeight] = useState<number>(0)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setHeight(window.innerHeight);

            const updateDimensions = () => {
                setHeight(window.innerHeight);
            };

            window.addEventListener("resize", updateDimensions);

            return () => window.removeEventListener("resize", updateDimensions);
        }
    }, []);


    useEffect(() => {
        const getUser = async () => {
            const userData = await getUserForPlayPage(initData)
            setUser(userData)
        }

        getUser();
    }, [])

    const getRankData = (rank: any) => Ranks.find(r => r.rank === rank);

    const getPreviousRankData = (currentRank: any) => {
        const index = Ranks.findIndex(r => r.rank === currentRank);
        return index > 0 ? Ranks[index - 1] : null;
    };

    const calculateProgress = (userRank: number, userPoints: number) => {
        const currentRankData = getRankData(userRank);
        const previousRankData = getPreviousRankData(userRank);

        if (!currentRankData) return 0;

        const previousMaxPoints = previousRankData ? previousRankData.maxPoints : 0;
        const rangeInCurrentRank = currentRankData.maxPoints - previousMaxPoints;
        const pointsInCurrentRank = userPoints - previousMaxPoints;

        const progress = (pointsInCurrentRank / rangeInCurrentRank) * 100;

        return progress;
    };

    // Usage in your component
    const maxPoints = getRankData(user?.Rank)?.maxPoints || 0;
    const progress = calculateProgress(user?.Rank || '', user?.points || 0);

    if (!user) {
        return (<Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />)
    }

    return (
        <section className='w-full h-screen bg-gradient-to-b from-slate-900 to-gray-600'>
            <div className='flex flex-row justify-between'>
                <UserDialog user={user} initData={initData} />
                <InviteDialog userId={user.chatId} round={user.roundReferrals} total={user.totalReferrals} />
            </div>
            <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
                <div className='w-1/2 bg-slate-800 flex flex-col justify-center items-center rounded-lg h-[53px] sm:h-[75px] gap-[3px]'>
                    <div className='flex flex-row items-center gap-2'>
                        <Image src={'/icons/Ballon Dor.png'} alt='dor' height={20} width={20} />
                        {user && <p className='font-bold text-white text-[13px] sm:text-[22px]'>{user?.points} / {maxPoints}</p>}
                    </div>
                    {user && <div className='w-11/12 flex flex-row items-center mt-1'>
                        <div style={{ width: `${progress}%` }} className='h-[5px] sm:h-[10px] rounded-l-lg bg-orange-600' />
                        <div style={{ width: `${100 - progress}%` }} className='h-[5px] sm:h-[10px] rounded-r-lg bg-orange-300' />
                    </div>}
                </div>
                <div className='w-1/2 bg-slate-800 flex flex-row gap-2 justify-center items-center rounded-lg h-[53px] sm:h-[75px]'>
                    <p className='font-bold text-white text-[15px] sm:text-[22px]'>Team Overall:</p>
                    <p className='font-bold text-green-500 text-[15px]'>{(user?.teamOverall).toFixed(2)}</p>
                </div>
            </div>
            <ScrollArea style={{ height: height - 195 }}>
                <div className='w-full flex flex-col justify-center items-center'>
                    <Link href={'https://x.com/KoiosPika'} target='blank' className='w-11/12 flex flex-row justify-center items-center gap-2 py-2 bg-gradient-to-b from-slate-800 to-slate-600 rounded-lg my-2 border-2 border-slate-600'>
                        <p className='text-white font-semibold'>Follow us on</p>
                        <Image src={'/icons/x-twitter.svg'} alt='x' height={30} width={30}/>
                        <p className='text-white font-semibold'>for more {`->`}</p>
                    </Link>
                    <TweetEmbed />
                </div>
            </ScrollArea>
        </section>
    )
}

export default HomePage