import React, { useRef, useState } from 'react'
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogTrigger } from '../ui/alert-dialog'
import Image from 'next/image'
import { Drawer, DrawerContent, DrawerHeader, DrawerTrigger } from '../ui/drawer'
import { Input } from '../ui/input'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { Flags } from '@/constants/Flags'
import { changeCountry, editProfile } from '@/lib/actions/user.actions'
import { Textarea } from '../ui/textarea'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getImageID } from '@/lib/utils'

const UserDialog = ({ user, initData }: { user: any; initData: string }) => {

    const [search, setSearch] = useState('');
    const [filteredFlags, setFilteredFlags] = useState(Flags);
    const [selectedCountry, setSelectedCountry] = useState<any>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [error, setError] = useState<string>('');
    const [usernameLimitError, setUsernameLimitError] = useState(false);
    const [bioLimitError, setBioLimitError] = useState(false);
    const [country, setCountry] = useState(user?.country)
    const drawerRef = useRef<any>(null)

    let canSave = !usernameLimitError && !bioLimitError && username.length > 0

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    const handleSaveProfile = async () => {

        if (!canSave) {
            return;
        }

        const result: any = await editProfile(initData, username, bio)

        if (result === 'Username is already taken.') {
            setError('Username is taken');
        } else {
            setIsEditMode(false);
            setError('');
        }
    };

    const handleSearchChange = (event: any) => {
        const value = event.target.value.toLowerCase();
        setSearch(value);
        setFilteredFlags(Flags.filter(flag => flag.name.toLowerCase().includes(value)));
    };

    const handleCountrySelect = (flag: any) => {
        setSelectedCountry(flag);
    };

    const handleChangeCountry = async () => {
        await changeCountry(initData, selectedCountry.src)
        setCountry(selectedCountry.src)
        if (drawerRef.current) {
            drawerRef.current.click(); // Assuming `close` is the method to close the drawer
        }
    }

    const handleChangeUsername = (e: any) => {
        const newUsername = e.target.value;
        setUsername(newUsername);
        if (newUsername.length <= 13) {
            setUsernameLimitError(false);
        } else {
            setUsernameLimitError(true);
        }
    }

    const handleChangeBio = (e: any) => {
        const newBio = e.target.value;
        setBio(newBio);
        if (newBio.length <= 100) {
            setBioLimitError(false);
        } else {
            setBioLimitError(true);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger>
                <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
                    <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user?.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
                    <p className='font-semibold text-white text-[13px]'>{username} (Rank {user?.Rank})</p>
                    <Image src={'/icons/arrow-right.svg'} alt='user' height={50} width={50} className='h-[12px] w-[12px] rounded-lg mt-[2px] rotate-90' />
                </div>
            </AlertDialogTrigger>
            <AlertDialogContent className='bg-slate-800 px-2 border-0 rounded-lg flex flex-col justify-center items-center'>
                <div className='w-10/12 flex flex-orw items-center mt-6'>
                    <Link href={`/icons/${user.id}`} className='relative'>
                        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user?.photo)}`} alt='user' height={200} width={200} className='bg-slate-500 h-[100px] w-[100px] rounded-lg' />
                        <div className='absolute bottom-0 w-full text-center bg-slate-600 text-[12px] rounded-b-lg text-white opacity-70'>Click to edit</div>
                    </Link>
                    <div className='flex flex-col ml-3 gap-2'>
                        {isEditMode ? (
                            <Input value={username} onChange={(e) => handleChangeUsername(e)} className='w-32 bg-slate-900 text-white border-0 font-semibold' />
                        ) : (
                            <div className='flex flex-row items-center gap-2'>
                                <p className='font-semibold text-white text-[15px]'>{username}</p>
                                <Drawer>
                                    <DrawerTrigger>
                                        <Image ref={drawerRef} src={`/flags/${country}.svg`} alt='flag' height={20} width={20} className='rounded-full bg-white h-[25px] w-[25px]' />
                                    </DrawerTrigger>
                                    <DrawerContent className='h-[90%] bg-gradient-to-b from-slate-900 to-slate-700'>
                                        <DrawerHeader className='text-white font-semibold text-[18px]'>Find your country</DrawerHeader>
                                        <div className='w-full flex py-2 justify-center items-center'>
                                            <Input className='w-11/12 bg-slate-700 text-white' placeholder='Find country' value={search} onChange={handleSearchChange} />
                                        </div>
                                        <ScrollArea className='h-full'>
                                            <div className='w-full px-2 py-3 grid grid-cols-3 gap-2'>
                                                {filteredFlags.map((flag) => (
                                                    <div key={flag.src} className={`bg-slate-900 border-2 ${selectedCountry?.src === flag.src ? 'border-green-500' : 'border-white'} flex flex-col justify-center items-center gap-2 py-2 rounded-md`}
                                                        onClick={() => handleCountrySelect(flag)}>
                                                        <Image src={`/flags/${flag.src}.svg`} alt={flag.name} height={50} width={50} className='rounded-full bg-white' />
                                                        <p className='text-white line-clamp-1 px-2'>{flag.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                        <div className='bg-transparent' onClick={handleChangeCountry}>
                                            <p className={`w-full py-4 ${selectedCountry ? 'bg-green-600' : 'bg-gray-500 cursor-not-allowed'} text-white font-semibold text-center`}>Set As Country</p>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>)}
                        <p className='font-semibold text-white text-[15px]'>Rank: {user?.Rank}</p>
                        <p className='font-semibold text-white text-[15px]'>Overall: {(user?.teamOverall).toFixed(2)}</p>
                    </div>
                </div>
                {error && <p className='text-red-500 font-semibold text-[14px]'>Username is taken</p>}
                {usernameLimitError && <p className='text-red-500 font-semibold text-[14px]'>Username must be 13 characters or less</p>}
                <div className='w-11/12 py-1 flex flex-row items-center gap-2 bg-slate-900 rounded-lg text-white font-semibold text-[13px]'>
                    {isEditMode ? (
                        <Textarea value={bio} onChange={(e) => handleChangeBio(e)} className='w-full bg-slate-900 border-0 focus:border-0' />
                    ) : (
                        <p className='px-4 py-1'>{bio.split('\n').map((line: any, index: number) => (
                            <span key={index}>
                                {line}
                                <br />
                            </span>
                        ))}</p>
                    )}
                </div>
                {bioLimitError && <p className='text-red-500 font-semibold text-[14px]'>Bio must be 100 characters or less</p>}
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
                <AlertDialogCancel className='absolute text-white right-2 top-0 bg-transparent border-0'>
                    <Image src={'/icons/x.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
                </AlertDialogCancel>
                {!isEditMode ? (
                    <div
                        className='bg-blue-700 text-white w-11/12 py-1 rounded-lg text-center font-semibold cursor-pointer'
                        onClick={toggleEditMode}
                    >
                        Edit Profile
                    </div>
                ) : (
                    <div
                        className={`${canSave ? 'bg-blue-700' : 'bg-slate-500'} text-white w-11/12 py-1 rounded-lg text-center font-semibold cursor-pointer`}
                        onClick={handleSaveProfile}
                    >
                        Save
                    </div>
                )}
            </AlertDialogContent>
        </AlertDialog>
    )
}

export default UserDialog