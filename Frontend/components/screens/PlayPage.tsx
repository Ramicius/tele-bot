import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { ScrollArea, ScrollBar } from '../ui/scroll-area'
import { formations } from '@/constants/Formations'
import { positions } from '@/constants'
import { findMatch, getUserForPlayPage, playGame } from '@/lib/actions/user.actions'
import { IUserData } from '@/lib/database/models/userData.model'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useRouter } from 'next/navigation'
import { IMatch } from '@/lib/database/models/match.model'
import UserDialog from '../shared/UserDialog'
import { getImageID } from '@/lib/utils'
import InviteDialog from '../shared/InviteDialog'


const colors = [
  { 'Forward': '#EE2E0C' },
  { 'Midfield': '#EE9F0C' },
  { 'Defense': '#0090DE' },
  { 'Goalkeeper': '#41B815' },
]

const PlayPage = ({ initData }: { initData: string }) => {

  const [height, setHeight] = useState<number>(window.innerHeight)
  const [user, setUser] = useState<any>()
  const router = useRouter()
  const [waiting, setWaiting] = useState(false)
  const [searching, setSearching] = useState(false)
  const [match, setMatch] = useState<any>()
  const [activeTab, setActiveTab] = useState('Classic');

  useEffect(() => {
    const updateHeights = () => {
      setHeight(window.innerHeight);
      document.documentElement.style.setProperty('--dynamic-height', `calc(${window.innerHeight}px - 425px)`);
      document.documentElement.style.setProperty('--dynamic-height-sm', `calc(${window.innerHeight}px - 630px)`);
    };

    window.addEventListener('resize', updateHeights);
    updateHeights();

    return () => window.removeEventListener('resize', updateHeights);
  }, []);

  useEffect(() => {
    const getUser = async () => {
      const userData = await getUserForPlayPage(initData)

      setUser(userData)
    }

    getUser();
  }, [])

  const getColor = (type: any, position: any) => {
    if (!position) {
      return '';
    }
    const colorObj: any = colors.find((color: any) => color[type]);
    return colorObj ? colorObj[type] : '';
  };

  const formation = user && formations.find(f => f.id === user?.formation);

  const formationPositions = formation && formation.data.reduce((acc: any, row: any) => {
    row.positions.forEach((pos: any) => {
      if (pos) acc.push(pos);
    });
    return acc;
  }, []);

  const calculateOverallAverageLevel = (userPositions: any, formationId: any) => {
    // Find the formation data
    const formationData = formations.find(f => f.id === formationId);

    if (!formationData) {
      return 0; // Return 0 if formation data is not found
    }

    // Get all position symbols in the formation
    const formationPositionSymbols = formationData.data.reduce((acc: any, row: any) => {
      row.positions.forEach((pos: any) => {
        if (pos) acc.push(pos);
      });
      return acc;
    }, []);

    // Filter user positions to include only those in the formation and calculate their levels
    const relevantUserPositions = userPositions.filter((pos: any) => formationPositionSymbols.includes(pos.position));

    if (relevantUserPositions.length === 0) {
      return 0; // Avoid division by zero if there are no relevant positions
    }

    const totalLevel = relevantUserPositions.reduce((sum: any, pos: any) => sum + pos.level, 0);
    const overallAverageLevel = totalLevel / relevantUserPositions.length;

    return overallAverageLevel;
  };

  const overallAverageLevel = user && calculateOverallAverageLevel(user.positions, user.formation);

  const handlePlaying = async (opponentId: string) => {

    if (waiting) {
      return;
    }

    setWaiting(true);
    let matchType = activeTab

    const newMatch = await playGame(initData, opponentId, matchType)

    router.push(`/play/${newMatch._id}`);
  }

  const handleFindingMatch = async () => {
    if (searching) {
      return;
    }

    setSearching(true);

    const matchFound = await findMatch(initData);

    setMatch(matchFound);

    setSearching(false);
  }

  const handleSkipping = async () => {

    setSearching(true);

    setMatch(null)

    const matchFound = await findMatch(initData);

    setMatch(matchFound);

    setSearching(false);
  }

  let requiredOverall = 0;

  let canPlayRank = false;

  if (user) {
    if (user.Rank == 0 || user.Rank == 1 || user.Rank == 2) {
      requiredOverall = user.Rank;
      canPlayRank = user?.teamOverall >= requiredOverall;
    } else {
      requiredOverall = user.Rank - 3;
      canPlayRank = user?.teamOverall >= requiredOverall;
    }
  }

  if (!user) {
    return (<Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />)
  }


  return (
    <section className='w-full h-screen flex flex-col bg-gradient-to-b from-slate-800 to-gray-600'>
      <div className='flex flex-row justify-between'>
        <UserDialog user={user} initData={initData} />
        <InviteDialog userId={user.chatId} round={user.roundReferrals} total={user.totalReferrals} />
      </div>
      <div className='w-full flex justify-center items-center'>
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
                  <p className='text-[16px] sm:text-[20px]'>{user && user.played > 0 ? ((user.won / user.played) * 100).toFixed(1) : '0.00'}%</p>
                </div>
              </div>
              <div className='w-[90px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>Scored</p>
                </div>
                <div className='w-full bg-slate-900 text-green-500 text-center font-semibold h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>{user.scored}</p>
                </div>
              </div>
              <div className='w-[90px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                <div className='w-full bg-slate-900 text-white text-center font-semibold h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>Conceded</p>
                </div>
                <div className='w-full bg-slate-900 text-red-500 text-center font-semibold h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>{user.conceded}</p>
                </div>
              </div>
              <div className='w-[70px] flex flex-col h-[60px] sm:h-[80px] gap-[3px]'>
                <div className='w-full bg-slate-900 text-white text-center font-semibold rounded-tr-lg h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>Ratio</p>
                </div>
                <div className='w-full bg-slate-900 text-yellow-500 text-center font-semibold rounded-br-lg h-1/2 flex justify-center items-center'>
                  <p className='text-[16px] sm:text-[20px]'>{user && user.played > 0 ? ((user.scored / user.conceded)).toFixed(2) : '0.00'}</p>
                </div>
              </div>
            </div>
            <ScrollBar orientation="horizontal" className='hidden' />
          </ScrollArea>
        </div>
      </div>
      <div className='w-full flex flex-col justify-center items-center mt-2'>
        <div className='w-11/12'>
          <div className='flex flex-row items-center w-full'>
            <p className='text-white font-semibold bg-slate-900 px-3 py-1 inline-flex rounded-lg text-[16px] sm:text-[22px]'>History</p>
            <a href={`/history/${user.id}`} className='text-white font-semibold bg-slate-900 px-3 py-1 inline-flex rounded-lg text-[12px] sm:text-[22px] ml-auto mt-auto'>
              <p>View All</p>
              <Image src={'/icons/arrow-right.svg'} alt='arrow' height={9} width={9} className='rotate-90 ml-2 mt-[1.5px]' />
            </a>
          </div>
          <div className='flex flex-col gap-1 sm:gap-4 my-2'>
            {user && user.matches.map((match: IMatch, index: number) => (
              <div key={index} className='text-white font-semibold bg-slate-900 p-2 rounded-lg flex flex-row items-center gap-1 sm:gap-5'>
                {match.winner.toString() !== user.id ? (
                  <p className='h-[25px] w-[30px] sm:h-[45px] sm:w-[50px] text-[16px] sm:text-[30px] text-center bg-red-600 rounded-sm'>L</p>
                ) : (
                  <p className='h-[25px] w-[30px] sm:h-[45px] sm:w-[50px] text-[16px] sm:text-[30px] text-center bg-green-600 rounded-sm'>W</p>
                )}
                <p className='ml-2 text-[16px] sm:text-[30px]'>{match.playerScore}-{match.opponentScore}</p>
                <div className='ml-5 flex flex-row items-center bg-slate-900 px-2 py-1 rounded-lg'>
                  {match.Player._id.toString() !== user.id ? (
                    <>
                      <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Player.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[28px] w-[28px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                      <p className='text-[14px] sm:text-[30px] text-center ml-[6px] rounded-sm'>{match.Player.username}</p>
                    </>
                  ) : (
                    <>
                      <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Opponent.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[28px] w-[28px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                      <p className='text-[14px] sm:text-[30px] text-center ml-[6px] rounded-sm'>{match.Opponent.username}</p>
                    </>
                  )}
                </div>
                {match.type === 'Rank' && <p className='bg-orange-600 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg ml-auto shadow-md shadow-orange-500 border-b-[3px] sm:border-b-[6px] border-orange-800'>Rank</p>}
                {match.type === 'Friendly' && <p className='bg-purple-700 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg ml-auto shadow-md shadow-purple-500 border-b-[3px] sm:border-b-[6px] border-purple-800'>Friendly</p>}
                {match.type === 'Classic' && <p className='bg-blue-700 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg ml-auto shadow-md shadow-blue-500 border-b-[3px] sm:border-b-[6px] border-blue-800'>Classic</p>}
              </div>))}
            {(user && user.matches.length == 0) && [0, 1].map((_, index) => (
              <div key={index} className='text-white font-semibold bg-slate-800 p-2 rounded-lg flex flex-row items-center gap-1 sm:gap-5 h-[55px]'>

              </div>))}
          </div>
        </div>
      </div>
      <div className='w-full flex justify-center items-center mt-2'>
        <div className='grid grid-cols-2 gap-2 w-11/12'>
          {!user.nextAvailableMatch && <AlertDialog>
            <AlertDialogTrigger>
              <div className='bg-blue-500 px-3 py-2 font-semibold text-white rounded-xl shadow-blue-600 shadow-lg border-b-[4px] sm:border-b-[8px] border-blue-800 flex flex-row items-center justify-center gap-1'>
                <p className='text-[16px] sm:text-[34px] ml-1'>Find Match</p>
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent className='bg-slate-800 px-2 border-0 rounded-lg'>
              <AlertDialogHeader>
                {(match && activeTab == 'Rank') && <AlertDialogTitle className='w-1/2 place-self-center bg-orange-700 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg shadow-md shadow-orange-500 border-b-[3px] sm:border-b-[6px] border-orange-800 text-white mt-3'>Rank Match</AlertDialogTitle>}
                {(match && activeTab == 'Classic') && <AlertDialogTitle className='w-1/2 place-self-center bg-blue-700 px-2 text-[14px] sm:text-[24px] py-[2px] rounded-lg shadow-md shadow-blue-500 border-b-[3px] sm:border-b-[6px] border-blue-800 text-white mt-3'>Classic Match</AlertDialogTitle>}
                {!match && <AlertDialogTitle className='text-[18px] text-white my-3'>Find Match</AlertDialogTitle>}
              </AlertDialogHeader>
              {!match &&
                <div className='w-11/12 place-self-center flex justify-around bg-white rounded-md border-2 border-white mb-3'>
                  <div
                    className={`w-1/2 py-1 font-semibold text-center ${activeTab === 'Classic' ? 'bg-blue-600 text-white' : ' text-black'} rounded-md`}
                    onClick={() => setActiveTab('Classic')}
                  >
                    Classic
                  </div>
                  <div
                    className={`w-1/2 py-1 font-semibold text-center ${activeTab === 'Rank' ? 'bg-orange-600 text-white' : ' text-black'} rounded-md`}
                    onClick={() => setActiveTab('Rank')}
                  >
                    Rank
                  </div>
                </div>}
              {match && <>
                <div className='flex flex-row items-center gap-3'>
                  <div className='w-1/2'>
                    <div className='flex flex-row justify-center items-center gap-3 my-2'>
                      <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.player.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[28px] w-[28px] sm:h-[48px] sm:w-[48px] rounded-lg' />
                      <p className='font-bold text-white text-[14px]'>{match.player.User.username}</p>
                      <Image src={`/flags/${match?.player.country}.svg`} alt='flag' height={20} width={20} className='rounded-full h-[20px] w-[20px] bg-white' />
                    </div>
                    <div className='h-[250px] w-full flex flex-col justify-around rounded-md bg-slate-800 border-[1px] sm:border-4 border-white' style={{ backgroundImage: `url('/Field-dark-9.PNG')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                      {formations.find(f => f.id === match.player?.formation)?.data.map((row: any, rowIndex: number) => (
                        <div key={rowIndex} className='flex justify-around'>
                          {row.positions.map((position: any, posIndex: number) => (
                            <div key={posIndex} className='p-1 sm:px-3 sm:py-1 rounded-sm text-white font-semibold border-white' style={{ backgroundColor: getColor(row.type, row.positions[posIndex]), borderWidth: row.positions[posIndex] ? 2 : 0, boxShadow: position ? `-8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},-8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])}` : '' }}>
                              <p className='text-[10px] sm:text-[20px]'>{position}</p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                    <p className='bg-slate-900 text-white font-semibold my-1 rounded-full text-center'>{match.player.formation}</p>
                    <p className='bg-slate-900 text-white font-semibold my-1 rounded-full text-center'>Overall: {(match.playerOverall).toFixed(2)}</p>
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
                    <p className='bg-slate-900 text-white font-semibold my-1 rounded-full text-center'>{match.opponent.formation}</p>
                    <p className='bg-slate-900 text-white font-semibold my-1 rounded-full text-center'>Overall: {(match.opponentOverall).toFixed(2)}</p>
                  </div>
                </div>
                <div className='w-full flex justify-center items-center'>
                  <div className='w-11/12 bg-slate-700 flex flex-row justify-center items-center py-2 rounded-full gap-6'>
                    <div className='flex flex-row items-center gap-2'>
                      <Image src={'/icons/coin.svg'} alt='coin' height={100} width={100} className='w-[30px] h-[30px] sm:w-[35px] sm:h-[35px]' />
                      <p className='font-semibold text-white'>{activeTab === 'Classic' ? match.prizes.coins * 2 : match.prizes.coins}</p>
                    </div>
                    <div className='flex flex-row items-center gap-2'>
                      <Image src={'/icons/diamond.svg'} alt='coin' height={100} width={100} className='w-[30px] h-[30px] sm:w-[35px] sm:h-[35px]' />
                      <p className='font-semibold text-white'>{activeTab === 'Classic' ? 0 : match.prizes.diamonds}</p>
                    </div>
                    <div className='flex flex-row items-center gap-2'>
                      <Image src={'/icons/Ballon Dor.png'} alt='coin' height={100} width={100} className='w-[25px] h-[30px] sm:w-[35px] sm:h-[35px]' />
                      <p className='font-semibold text-white'>{activeTab === 'Classic' ? 0 : match.prizes.points}</p>
                    </div>
                  </div>
                </div>
                <div className='flex flex-row items-center gap-3 w-full'>
                  <div className='w-1/2 bg-green-700 text-white font-semibold rounded-md py-1 flex flex-row items-center justify-center gap-2' onClick={() => handlePlaying(match.opponent.User._id)}>
                    <p>{waiting ? 'Please Wait' : 'Play'}</p>
                  </div>
                  <div className='w-1/2 bg-red-700 text-white font-semibold rounded-md py-1 flex flex-row items-center justify-center gap-2' onClick={handleSkipping}>
                    <p>Skip</p>
                  </div>
                </div>
              </>}
              {!match && activeTab === 'Rank' && !canPlayRank && (
                <div className='py-2 px-3 bg-slate-400 w-3/4 place-self-center text-white font-bold flex flex-row items-center justify-center gap-3 text-[18px] rounded-lg'>
                  <p>Rank Match Unavailable</p>
                </div>
              )}
              {!match && (activeTab === 'Classic' || canPlayRank) && (
                <div className={`py-2 px-3 ${activeTab === 'Classic' ? 'bg-blue-600' : 'bg-orange-600'} w-3/4 place-self-center text-white font-bold flex flex-row items-center justify-center gap-3 text-[18px] rounded-lg`} onClick={handleFindingMatch}>
                  <Image src={'/icons/search.svg'} alt='search' height={20} width={20} />
                  <p>{searching ? 'Searching...' : 'Search For Opponents'}</p>
                </div>
              )}
              {(!canPlayRank && activeTab === 'Rank') &&
                <div className='flex flex-row items-center gap-2 place-self-center text-[15px] text-white font-semibold w-5/6'>
                  <p className='text-center'>
                    You need at least <span className='text-green-500'>{requiredOverall.toFixed(2)}</span> team overall to play rank
                  </p>
                </div>}
              <AlertDialogCancel className='absolute text-white right-2 top-0 bg-transparent border-0' onClick={() => setMatch(null)}>
                <Image src={'/icons/x.svg'} alt='coin' height={100} width={100} className='w-[25px] h-[25px] sm:w-[40px] sm:h-[40px]' />
              </AlertDialogCancel>
            </AlertDialogContent>
          </AlertDialog>}
          {user.nextAvailableMatch &&
            <div className='bg-blue-500 px-3 py-2 font-semibold text-white rounded-xl shadow-blue-600 shadow-lg border-b-[4px] sm:border-b-[8px] border-blue-800 flex flex-row items-center justify-center gap-1'>
              <p className='text-[16px] sm:text-[34px] ml-1'>Available in {user.nextAvailableMatch}</p>
            </div>
          }
          <div className='bg-green-700 py-2 font-semibold text-white rounded-xl shadow-green-600 shadow-lg border-b-[4px] sm:border-b-[8px] border-green-900 flex flex-row justify-center items-center gap-1'>
            <a href={`/friends/${user.id}`} className='text-[16px] sm:text-[34px]'>Play with friends</a>
          </div>
        </div>
      </div>
      <div className='w-full flex flex-col h-full justify-center items-center flex-grow mt-3'>
        <div className='w-11/12 flex flex-row items-center h-full gap-2'>
          <div className='h-full w-3/5 flex flex-col justify-around rounded-md bg-slate-900 relative'>
            <Image src={'/Field-dark-9.PNG'} alt='field' height={1000} width={1000} className='absolute h-full w-full rounded-lg border-2 border-white' />
            {formation?.data.map((row: any, rowIndex: number) => (
              <div key={rowIndex} className='flex justify-around z-10'>
                {row.positions.map((position: any, posIndex: number) => (
                  <div key={posIndex} className='p-1 sm:px-3 sm:py-1 rounded-sm text-white font-semibold border-white' style={{ backgroundColor: getColor(row.type, row.positions[posIndex]), borderWidth: row.positions[posIndex] ? 2 : 0, boxShadow: position ? `-8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},-8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])}` : '' }}>
                    <p className='text-[13.5px] sm:text-[20px]'>{position}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className='w-2/5 flex flex-col justify-around rounded-md scroll-area'>
            <ScrollArea>
              <div className='flex flex-col gap-1 w-full'>
                <div className='bg-slate-900 p-2 sm:p-4 rounded-lg'>
                  <div className='flex flex-row items-center justify-center'>
                    <p className='text-yellow-400 font-bold text-[20px] sm:text-[22px]'>{user && user?.formation}</p>
                  </div>
                </div>
                <div className='bg-slate-900 p-2 sm:p-4 rounded-lg'>
                  <div className='flex flex-row items-center'>
                    <p className='inline-flex py-1 px-2 text-white font-semibold rounded-md text-[15px] sm:text-[25px]'>Overall</p>
                    {/* <p className='ml-auto mr-2 text-green-500 font-bold'>Ready</p> */}
                    <p className='ml-auto mr-2 text-green-500 font-bold text-[15px] sm:text-[22px]'>{overallAverageLevel.toFixed(2)}</p>
                  </div>
                </div>
                {positions
                  .filter(position => formationPositions.includes(position.symbol))
                  .map((position) => {
                    // Find user position level
                    const userPosition = user.positions.find((p: any) => p.position === position.symbol);
                    const level = userPosition ? userPosition.level : 0;

                    return (
                      <div key={position.symbol} className='bg-slate-900 p-2 sm:p-4 rounded-lg'>
                        <div className='flex flex-row items-center'>
                          <p style={{ backgroundColor: position.color }} className='inline-flex py-1 px-2 text-white font-semibold rounded-md text-[13px] sm:text-[25px]'>
                            {position.symbol}
                          </p>
                          <div className='ml-auto mr-2 font-bold flex flex-col'>
                            <p className='text-[18px] sm:text-[22px]' style={{ color: position.color }}>{level}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
      <div className='h-[220px]' />
    </section>
  )
}

export default PlayPage