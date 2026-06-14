import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Input } from '../ui/input'
import { ScrollArea } from '../ui/scroll-area'
import { IUserData } from '@/lib/database/models/userData.model';
import { collectCoins, getUserByUserID, savePredictions } from '@/lib/actions/user.actions';
import { Ranks } from '@/constants';
import { getImageID } from '@/lib/utils';
import axios from 'axios';

const EarnPage = ({ initData }: { initData: string }) => {

  const [user, setUser] = useState<IUserData>()
  const [predictions, setPredictions] = useState<any>({});
  const [predictionData, setPredictionData] = useState<any>([]);
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      const userData = await getUserByUserID(initData)
      setUser(userData)

      const initialPredictions: any = {};
      userData.dailyPredictions.forEach((prediction: any) => {
        initialPredictions[prediction.matchId] = {
          team1: prediction.predictedTeam1Score,
          team2: prediction.predictedTeam2Score
        };
      });
      setPredictions(initialPredictions);
    }

    const fetchPredictionData = async () => {
      try {
        const res = await axios.get('https://docs.google.com/spreadsheets/d/e/2PACX-1vQKBI-Q_xoyrftx-gcjxlt6SQ5WPDZerYkSHLzyfpwjIAvN3XbafJGjl3ojm6kKnNbyzCxDAFeuERKG/pub?gid=0&single=true&output=csv');
        const data = res.data.split('\n').slice(1).map((row: any) => {
          const [
            id, lastTimeToPredict, team1Country, team2Country, team1, team2, team1Score, team2Score, finished
          ] = row.split(',').map((cell: any) => cell.trim());

          return {
            id,
            lastTimeToPredict: new Date(lastTimeToPredict),
            team1Country,
            team2Country,
            team1,
            team2,
            team1Score: team1Score ? Number(team1Score) : null,
            team2Score: team2Score ? Number(team2Score) : null,
            finished: finished.toLowerCase() === 'true'
          };
        });

        setPredictionData(data);
      } catch (error) {
        console.error("Error fetching predictions from Google Sheets:", error);
      }
    };


    getUser()

    fetchPredictionData();
  }, [])


  const handlePredictionChange = (matchId: string, score: string, team: string) => {
    setPredictions((prevPredictions: any) => ({
      ...prevPredictions,
      [matchId]: {
        ...prevPredictions[matchId],
        [team]: score === '' ? '' : parseInt(score) // Allow the input to be empty
      }
    }));
  };

  const saveAllPredictions = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);

      const validPredictions = Object.keys(predictions).reduce((acc: any, matchId) => {
        const { team1, team2 } = predictions[matchId];
        if (team1 !== undefined && team2 !== undefined) {
          acc[matchId] = {
            matchId,
            predictedTeam1Score: parseInt(team1),
            predictedTeam2Score: parseInt(team2),
          };
        }
        return acc;
      }, {});

      await savePredictions(initData, validPredictions)

      setSaving(false);
    } catch (error) {
      console.error("Error saving predictions:", error);
      setSaving(false);
    }
  };


  const handleCollectCoins = async (matchId: string) => {
    try {
      await collectCoins(initData, matchId);
      const updatedUser = await getUserByUserID(initData);
      setUser(updatedUser);
    } catch (error) {
      console.error(error);
    }
  };

  if (!user || !predictionData) {
    return (<Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />)
  }

  return (
    <div className='w-full h-screen bg-gradient-to-b from-slate-900 to-gray-600'>
      <div className='w-full ml-auto mb-auto p-2 flex flex-row items-center gap-2'>
        <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(user.User.photo)}`} alt='user' height={50} width={50} className='bg-slate-500 h-[30px] w-[30px] rounded-lg' />
        <p className='font-semibold text-white text-[13px]'>{user?.User.username} (Rank {user?.Rank})</p>
      </div>
      <div className='w-full flex justify-center items-center'>
        <p className='font-semibold text-white text-[20px] mt-2 bg-gradient-to-b from-slate-800 to-slate-600 border-b-[5px] border-[3px] border-white w-1/2 text-center py-1 rounded-md'>Predictions</p>
      </div>
      {predictionData.length > 0 && <ScrollArea style={{ height: 'calc(100vh - 180px)' }}>
        <div className='w-full flex flex-col justify-center items-center my-3'>
          {predictionData.map((prediction: any) => {
            const isPredictionTimePassed = new Date() > new Date(prediction.lastTimeToPredict);
            const userPrediction = user && user.dailyPredictions.find((p: any) => p.matchId === prediction.id);
            const isCorrectPrediction = userPrediction &&
              userPrediction.predictedTeam1Score === prediction.team1Score &&
              userPrediction.predictedTeam2Score === prediction.team2Score;
            const isCollected = userPrediction && userPrediction.collected;
            const rankData = Ranks.find(rank => rank.rank === user.Rank);
            return (
              <div key={prediction.id} className='w-10/12 flex flex-col gap-1 items-center justify-around relative'>
                <div className='w-full flex flex-row gap-2 items-center justify-around my-4 relative bg-gradient-to-b from-slate-900 to-slate-600 px-2 py-4 rounded-lg text-white'>
                  <div className='flex flex-col justify-center items-center gap-2 font-semibold w-1/3'>
                    <Image src={`/flags/${prediction.team1Country}.svg`} alt='es' height={40} width={40} className='rounded-full border-2 border-white' />
                    <p>{prediction.team1}</p>
                  </div>
                  <div className='flex flex-col gap-3 justify-center items-center'>
                    <div className='flex flex-row items-center gap-2'>
                      <Input
                        type='number'
                        className='text-[16px] w-[40px] font-bold text-center text-black'
                        value={predictions[prediction.id]?.team1 !== undefined ? predictions[prediction.id]?.team1 : (userPrediction ? userPrediction.predictedTeam1Score : '')}
                        onChange={(e) => handlePredictionChange(prediction.id, e.target.value, 'team1')}
                        disabled={isPredictionTimePassed || isCollected}
                      />
                      <p className='text-white font-bold'>-</p>
                      <Input
                        type='number'
                        className='text-[16px] w-[40px] font-bold text-center text-black'
                        value={predictions[prediction.id]?.team2 !== undefined ? predictions[prediction.id]?.team2 : (userPrediction ? userPrediction.predictedTeam2Score : '')}
                        onChange={(e) => handlePredictionChange(prediction.id, e.target.value, 'team2')}
                        disabled={isPredictionTimePassed || isCollected}
                      />
                    </div>
                    {prediction.finished && isCorrectPrediction && !isCollected ? (
                      <div
                        className='flex flex-row items-center justify-center gap-3 bg-green-600 px-2 py-1 rounded-md cursor-pointer'
                        onClick={() => handleCollectCoins(prediction.id)}
                      >
                        <Image src={'/icons/coin.svg'} alt='coin' height={20} width={20} />
                        <p className='font-bold'>{rankData ? (rankData.predictionPrize).toLocaleString() : 0}</p>
                      </div>
                    ) : (
                      <div className='flex flex-row items-center justify-center gap-3 bg-red-500 px-2 py-1 rounded-md'>
                        <Image src={'/icons/coin.svg'} alt='coin' height={20} width={20} />
                        <p className='font-bold text-white'>{rankData ? (rankData.predictionPrize).toLocaleString() : 0}</p>
                      </div>
                    )}
                  </div>
                  <div className='flex flex-col justify-center items-center gap-2 font-semibold w-1/3'>
                    <Image src={`/flags/${prediction.team2Country}.svg`} alt='es' height={40} width={40} className='rounded-full  border-2 border-white' />
                    <p>{prediction.team2}</p>
                  </div>
                </div>
              </div>
            )
          })}
          <div className='w-full flex justify-center items-center mt-3'>
            <div
              className='bg-green-700 flex flex-row items-center gap-2 px-4 py-1 rounded-full'
              onClick={saveAllPredictions}
            >
              <Image src={'/icons/save.svg'} alt='save' height={20} width={20} />
              <p className='font-bold text-white'>{saving ? `Saving...` : 'Save All Predictions'}</p>
            </div>
          </div>
          <div className='w-full flex justify-center items-center mt-3 h-[200px]'/>
        </div>
      </ScrollArea>}
      {predictionData.length === 0 && <div style={{ height: 'calc(100vh - 130px)' }} className='flex justify-center items-center'>
        <p className='text-white font-semibold'>No Matches Available</p>
      </div>}
      <div className='h-[80px] mt-auto' />
    </div>
  );
};

export default EarnPage