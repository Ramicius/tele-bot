'use client'

import { Icons } from '@/constants/Icons'
import { buyIcon, changeIcon, getUserByUserID } from '@/lib/actions/user.actions'
import { IUserData } from '@/lib/database/models/userData.model'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '../ui/scroll-area'
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer'
import { getImageID } from '@/lib/utils'
import useTelegram from '@/hooks/useTelegram'

const Themes = [{ name: 'galaxy', Banner: 'GalaxyBanner' }, { name: 'cyberknight', Banner: 'CyberKnightBanner' }]

const IconsPage = () => {
    const { state } = useTelegram();
    const { initData } = state;

    const [user, setUser] = useState<IUserData>()
    const [selectedGender, setSelectedGender] = useState<'male' | 'female'>('male');
    const [selectedTheme, setSelectedTheme] = useState<string>('galaxy');
    const [loading, setLoading] = useState(false)
    const [changing, setChanging] = useState(false)
    const drawerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        if (!initData) return;

        const getUser = async () => {
            const userData = await getUserByUserID(initData)
            setUser(userData)
        }

        getUser()
    }, [initData])

    if (!user) {
        return (
            <section className='w-full h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-800 to-gray-600'>
                <Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />
            </section>)
    }

    const handleBuyIcon = async (iconName: string, iconPrice: number) => {
        if (loading || (user.diamonds < iconPrice) || !initData) {
            return;
        }

        setLoading(true);

        const updatedUser = await buyIcon(initData, iconName)

        setUser(updatedUser);

        if (drawerRefs.current[iconName]) {
            drawerRefs.current[iconName]!.click();
        }

        setLoading(false);
    }

    const handleChangeIcon = async (iconName: string) => {
        if (changing || !initData) {
            return;
        }

        setChanging(true);

        const updatedUser = await changeIcon(initData, iconName)

        setUser(updatedUser)

        setTimeout(() => {
            if (drawerRefs.current[iconName]) {
                drawerRefs.current[iconName]!.click();
            }
        }, 2000);

        setChanging(false);
    }

    const filteredIcons = Icons.filter(icon => icon.type === selectedGender && icon.theme === selectedTheme);

    return (
        <div className='w-full h-screen bg-gradient-to-b from-slate-900 to-gray-700'>
            <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
                <a href='/' className='py-2 px-3 rounded-md text-white font-bold'>
                    <Image src={'/icons/back.svg'} alt='back' height={10} width={10} />
                </a>
                <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user?.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
                <p className='font-semibold text-white text-[13px]'>{user?.User.username} (Rank {user?.Rank})</p>
                <Image src={'/icons/diamond.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px] ml-auto' />
                <p className='font-bold text-white text-[16px] sm:text-[22px]'>{user?.diamonds}</p>
            </div>

            <div className="flex flex-row justify-center items-center gap-2 my-2 w-full">
                {Themes.map((theme, index) => (
                    <Image key={index} src={`/banners/${theme.Banner}.jpg`} alt='banner' height={200} width={200} className={`h-[40px] w-[120px] rounded-md border-2 ${selectedTheme === theme.name ? 'border-yellow-500' : 'border-slate-900'}`} onClick={() => setSelectedTheme(theme.name)} />
                ))}
            </div>

            <ScrollArea className='h-[83%]'>
                <div className="flex flex-row justify-center items-center mt-4 w-full">
                    <div className='w-4/5 flex flex-row bg-white rounded-md font-semibold border-[1px] border-white'>
                        <button
                            className={`w-1/2 gap-2 flex justify-center items-center px-3 py-1 bg-gradient-to-b ${selectedGender === 'male' ? 'from-blue-800 to-blue-600' : 'bg-white'} text-white rounded-l-md`}
                            onClick={() => setSelectedGender('male')}
                        >
                            <Image src={'/icons/male.svg'} alt='male' height={18} width={18} />
                            <p>Male</p>
                        </button>
                        <button
                            className={`w-1/2 gap-2 flex justify-center items-center px-3 py-1 bg-gradient-to-b ${selectedGender === 'female' ? 'from-red-800 to-red-600' : 'bg-white'} text-white rounded-r-md`}
                            onClick={() => setSelectedGender('female')}
                        >
                            <Image src={'/icons/female.svg'} alt='male' height={16} width={16} />
                            <p>Female</p>
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-3 px-5 gap-4">
                    {filteredIcons.map(icon => {
                        const isOwned = user.icons.some(i => i.name === icon.name);
                        return (
                            <Drawer key={icon.name}>
                                <DrawerTrigger>
                                    <div className='flex flex-col relative h-[130px]' ref={el => { drawerRefs.current[icon.name] = el; }}>
                                        <Image
                                            key={icon.id}
                                            src={`https://drive.google.com/uc?export=view&id=${icon.id}`}
                                            alt={icon.type}
                                            width={100}
                                            height={100}
                                            className="rounded-lg z-10"
                                        />
                                        <div className='w-[100px] flex flex-row justify-center items-center gap-2 rounded-b-lg bg-slate-900 absolute bottom-0 h-[40px] pt-2'>
                                            {!isOwned ? (
                                                <>
                                                    <Image src={'/icons/diamond.svg'} alt='coin' height={100} width={100} className='w-[20px] h-[20px] sm:w-[40px] sm:h-[40px]' />
                                                    <p className={` ${user.diamonds < icon.price ? 'text-red-500' : 'text-white'} font-semibold`}>{icon.price}</p>
                                                </>
                                            ) : (
                                                <p className='text-white font-semibold'>Owned</p>
                                            )}
                                        </div>
                                    </div>
                                </DrawerTrigger>
                                <DrawerContent className={`h-[65%] sm:h-[40%] border-t-8 ${selectedGender === 'male' ? 'border-blue-700' : 'border-red-700'} border-x-0 bg-gradient-to-b from-slate-900 to-gray-700`}>
                                    <DrawerHeader>
                                        <DrawerTitle className='text-white my-3'>Buy {icon.theme} Icon</DrawerTitle>
                                    </DrawerHeader>
                                    <div className='flex flex-col gap-3 w-full justify-center items-center'>
                                        <Image
                                            key={icon.id}
                                            src={`https://drive.google.com/uc?export=view&id=${icon.id}`}
                                            alt={icon.type}
                                            width={250}
                                            height={250}
                                            className="rounded-lg z-10 h-[200px] w-[200px]"
                                        />
                                    </div>
                                    <DrawerClose className='absolute text-white right-4 top-4'>
                                        <Image src={'/icons/x.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
                                    </DrawerClose>
                                    <DrawerFooter className='mb-5'>
                                        {!isOwned ? (
                                            loading ? (
                                                <div className='w-3/4 py-2 rounded-lg text-white font-bold text-center place-self-center bg-slate-900 flex flex-row items-center justify-center'>
                                                    <p className='text-[20px]'>Processing</p>
                                                </div>
                                            ) : (
                                                <div className='w-3/4 py-2 rounded-lg text-white font-bold text-center place-self-center bg-slate-900 flex flex-row items-center justify-center' onClick={() => handleBuyIcon(icon.name, icon.price)}>
                                                    <p className='text-[20px]'>Buy</p>
                                                    <div className='flex flex-row items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg'>
                                                        <Image src={'/icons/diamond.svg'} alt='coin' height={100} width={100} className='w-[30px] h-[30px] sm:w-[40px] sm:h-[40px]' />
                                                        <p className={`${user.diamonds < icon.price ? 'text-red-500' : 'text-white'} font-semibold text-[20px]`}>{icon.price}</p>
                                                    </div>
                                                </div>
                                            )
                                        ) : (
                                            <div className={`w-3/4 py-2 rounded-lg text-white font-bold text-center place-self-center ${selectedGender === 'male' ? 'bg-blue-700' : 'bg-red-700'} flex flex-row items-center justify-center`} onClick={() => handleChangeIcon(icon.name)}>
                                                <p className='text-[20px]'>{changing ? 'Please wait..' : 'Set as default'}</p>
                                            </div>
                                        )}
                                        <DrawerClose className='flex justify-center items-center'>
                                            <div className='bg-white text-black font-bold py-2 rounded-lg w-3/4'>Cancel</div>
                                        </DrawerClose>
                                    </DrawerFooter>
                                </DrawerContent>
                            </Drawer>
                        )
                    })}
                </div>
            </ScrollArea >
        </div >
    )
}

export default IconsPage