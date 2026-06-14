'use client'

import EarnPage from '@/components/screens/EarnPage';
import HomePage from '@/components/screens/HomePage';
import LineupPage from '@/components/screens/LineupPage';
import PlayPage from '@/components/screens/PlayPage';
import ShopPage from '@/components/screens/ShopPage';
import TopPage from '@/components/screens/TopPage';
import BottomNavBar from '@/components/shared/BottomNavBar';
import useTelegram from '@/hooks/useTelegram';
import { IUser } from '@/lib/database/models/user.model';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'

const Page = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const { state } = useTelegram();
  const { loading, isLoggedIn, currentUser, initData } = state
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push(`/create-account`);
    }
  }, [loading, isLoggedIn, router]);

  if (loading) {
    return (
      <section className='w-full h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-900 to-gray-600'>
        <Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />
      </section>
    );
  }

  const renderPage = (currentUser: IUser) => {
    if (!initData) return null;

    switch (currentPage) {
      case 'home':
        return <HomePage initData={initData} />;
      case 'shop':
        return <ShopPage initData={initData} />;
      case 'play':
        return <PlayPage initData={initData} />;
      case 'earn':
        return <EarnPage initData={initData} />;
      case 'lineup':
        return <LineupPage initData={initData} />;
      case 'top':
        return <TopPage initData={initData} />;
      default:
        return <HomePage initData={initData} />;
    }
  };

  if (isLoggedIn) {
    return (
      <div className='h-screen w-screen max-w-[700px] flex justify-center items-center bg-gradient-to-b from-slate-900 to-gray-600'>
        {currentUser && renderPage(currentUser)}
        <BottomNavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>
    )
  }
}

export default Page