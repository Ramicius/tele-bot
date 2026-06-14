import { formations } from '@/constants/Formations';
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { ScrollArea, ScrollBar } from '../ui/scroll-area';
import { getUserByUserID, saveFormation } from '@/lib/actions/user.actions';
import { IUserData } from '@/lib/database/models/userData.model';
import { getImageID } from '@/lib/utils';

const colors = [
  { 'Forward': '#EE2E0C' },
  { 'Midfield': '#EE9F0C' },
  { 'Defense': '#0090DE' },
  { 'Goalkeeper': '#41B815' },
]

const LineupPage = ({ initData }: { initData: string }) => {
  const [height, setHeight] = useState<number>(window.innerHeight)
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<IUserData>()

  const updateDimensions = () => {
    setHeight(window.innerHeight);
  }

  useEffect(() => {
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  let currentFormation = formations.find(f => f.id === selectedFormation);

  useEffect(() => {
    const getUser = async () => {
      const userData = await getUserByUserID(initData)
      setUser(userData)
      setSelectedFormation(userData.formation)
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

  const getUserData = (positionSymbol: string) => {
    if (user) {
      const userData: any = user.positions.find((data: any) => data.position === positionSymbol);
      return userData ? userData.level : '';
    }
    return '';
  };


  const changeFormation = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    await saveFormation(initData, selectedFormation);
    setSaving(false);
  }

  const calculateOverallScore = (formation: any) => {
    let totalScore = 0;
    let positionCount = 0;

    formation.data.forEach((row: any) => {
      row.positions.forEach((position: any) => {
        if (position) {
          const score = getUserData(position);
          if (score !== '') {
            totalScore += score;
            positionCount++;
          }
        }
      });
    });

    return positionCount > 0 ? (totalScore / positionCount).toFixed(1) : '0.0';
  };

  const overallScore = calculateOverallScore(currentFormation);

  const findBestFormation = () => {
    const formationWithHighestOverall = formations.reduce((highest: any, formation) => {
      const overallScore = parseFloat(calculateOverallScore(formation));
      return highest && parseFloat(highest.score) > overallScore
        ? highest
        : { formation, score: overallScore };
    }, null);

    setSelectedFormation(formationWithHighestOverall.formation.id);
  };

  if (!user) {
    return (<Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />)
  }

  return (
    <section className='w-full h-screen bg-gradient-to-b from-slate-900 to-slate-900'>
      <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
        <p className='font-semibold text-white text-[13px]'>{user?.User.username} (Rank {user?.Rank})</p>
      </div>
      <div style={{ height: height - 210 }} className='relative'>
        <div className='h-full w-full absolute flex flex-col justify-around'>
          {currentFormation?.data.map((row, rowIndex) => (
            <div key={rowIndex} className='flex justify-around'>
              
              <div className='absolute bg-gradient-to-b from-slate-900 to-slate-700 bottom-2 left-3 border-b-[7px] border-[3px] border-white text-white px-3 rounded-sm font-semibold'>
                <p className='text-center text-[25px]'>{overallScore}</p>
              </div>
              {row.positions.map((position, posIndex) => (
                <div key={posIndex} className='px-2 py-[5px] rounded-lg text-white font-semibold border-white w-[55px] sm:w-[70px] sm:py-[10px]' style={{ backgroundColor: getColor(row.type, row.positions[posIndex]), borderWidth: row.positions[posIndex] ? 2 : 0, boxShadow: position ? `-8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},-8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px -8px 10px -4px ${getColor(row.type, row.positions[posIndex])},8px 8px 10px -4px ${getColor(row.type, row.positions[posIndex])}` : '' }}>
                  {row.positions[posIndex] && <p className='text-[15px] sm:text-[18px] text-center'>{position}</p>}
                  {position && <p className='text-center text-[17px] sm:text-[23px]'>{getUserData(position)}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
        <Image src={'/Field-dark-9.PNG'} alt='field' height={2000} width={2000} style={{ height: height - 210 }} className='w-full max-w-[700px] border-y-2 border-white' />
      </div>
      <ScrollArea className='py-2 px-2 h-[50px]'>
        <div className='flex gap-2'>
          <>
            <div className='flex flex-col h-full justify-center items-center border-[1px] border-white bg-slate-800 rounded-lg' onClick={() => findBestFormation()} style={{ height: '100%', width: 95 }}>
              <div className=' text-center w-full rounded-md font-semibold bg-white' >Find Best</div>
            </div>
            {formations.map((formation) => (
              <div key={formation.id} className='flex flex-col h-full justify-center items-center border-[1px] rounded-lg bg-white' onClick={() => setSelectedFormation(formation.id)} style={{ height: '100%', width: 95, borderColor: currentFormation?.id == formation.id ? '#EE9F0C' : 'white' }}>

                <div className=' text-center w-full rounded-md font-semibold' style={{ backgroundColor: currentFormation?.id == formation.id ? '#EE9F0C' : 'white', color: currentFormation?.id == formation.id ? 'white' : 'black' }}>{formation.id}</div>
              </div>
            ))}
          </>
        </div>
        <ScrollBar orientation="horizontal" className='hidden' />
      </ScrollArea>
      <div className='w-full flex justify-center items-center'>
        <p className='bg-green-600 text-white font-bold px-3 py-1 rounded-md' onClick={changeFormation}>{saving ? 'Saving...' : 'Save Formation'}</p>
      </div>
    </section>
  )
}

export default LineupPage