'use client'
import React, { useEffect, useState } from 'react'
import { getMatchByID } from '@/lib/actions/match.actions';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import RollingNumber from '../shared/RollingNumber';
import { getImageID } from '@/lib/utils';
import PlayerDialog from '../shared/PlayerDialog';
import { useRouter } from 'next/navigation';
import useTelegram from '@/hooks/useTelegram';

type Stats = {
  possession: number;
  shots: number;
  saves: number;
  corners: number;
  longBalls: number;
  fouls: number;
  passes: number;
  freeKicks: number;
  penalties: number;
  woodwork: number;
  offsides: number;
  interceptions: number;
};

let moves = 0;

const MatchPage = ({ id }: { id: string }) => {
  const [match, setMatch] = useState<any | null>(null);
  const [displayedScenarios, setDisplayedScenarios] = useState<{ minute: number; player: string; scenario: string }[]>([]);
  const [mainScenario, setMainScernario] = useState<{ minute: number; player: string; scenario: any }>()
  const [currentAttackIndex, setCurrentAttackIndex] = useState<number>(0);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState<number>(0);
  const [currentScenario, setCurrentScenario] = useState({ line: 4, player: 'Match' });
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [half, setHalf] = useState<string>('First half');
  const [currentMinute, setCurrentMinute] = useState<number>(0);
  const [finished, setFinished] = useState(false)
  const [currentInGameMinute, setCurrentInGameMinute] = useState(0);
  const [playerStats, setPlayerStats] = useState<Stats>({
    possession: 0,
    shots: 0,
    saves: 0,
    corners: 0,
    longBalls: 0,
    fouls: 0,
    passes: 0,
    freeKicks: 0,
    penalties: 0,
    woodwork: 0,
    offsides: 0,
    interceptions: 0
  });
  const [opponentStats, setOpponentStats] = useState<Stats>({
    possession: 0,
    shots: 0,
    saves: 0,
    corners: 0,
    longBalls: 0,
    fouls: 0,
    passes: 0,
    freeKicks: 0,
    penalties: 0,
    woodwork: 0,
    offsides: 0,
    interceptions: 0
  });

  const router = useRouter();
  const { state } = useTelegram();
  const { initData } = state;


  const updateStats = (scenario: string, player: string) => {
    const statsUpdate: any = {
      possession: 0,
      shots: 0,
      saves: 0,
      corners: 0,
      longBalls: 0,
      fouls: 0,
      passes: 0,
      freeKicks: 0,
      penalties: 0,
      woodwork: 0,
      offsides: 0,
      interceptions: 0
    };

    switch (scenario) {
      case 'Pass':
        statsUpdate.possession++;
        statsUpdate.passes++;
        break;
      case 'Goalkeeper save':
      case 'Goalkeeper catches the ball':
        statsUpdate.saves++;
        break;
      case 'Long Ball':
      case 'Corner kick cross':
        statsUpdate.longBalls++
        break;
      case 'Offside':
        statsUpdate.offsides++;
        break;
      case 'Fouled':
        statsUpdate.fouls++;
        break;
      case 'Penalty awarded':
      case 'Freekick awarded':
        statsUpdate.freeKicks++;
        break;
      case 'Player shoots':
      case 'Forward shoots':
      case 'Midfielder shoots':
      case 'Header':
        statsUpdate.shots++;
        break;
      case 'Corner awarded':
        statsUpdate.corners++;
        break;
      case 'Hits woodwork':
        statsUpdate.woodwork++;
        break;
      case 'Forward Interception':
      case 'Attacking Midfield Interception':
      case 'Frontline Midfield Interception':
      case 'Backline Midfield Interception':
      case 'Frontline Defense Interception':
      case 'Center Defesne Interception':
      case 'Backline Defense Interception':
        statsUpdate.interceptions++;
        statsUpdate.possession++;
        break;
      default:
        break;
    }

    const isOpponentStat = ['Fouled', 'Goalkeeper save', 'Goalkeeper catches the ball', 'Forward Interception', 'Attacking Midfield Interception', 'Frontline Midfield Interception', 'Backline Midfield Interception', 'Frontline Defense Interception', 'Center Defesne Interception', 'Backline Defense Interception'].includes(scenario);

    if (isOpponentStat) {
      if (player === 'Player') {
        setOpponentStats((prevStats: any) => ({
          ...prevStats,
          ...Object.keys(statsUpdate).reduce((acc: any, key: any) => {
            acc[key] = prevStats[key] + statsUpdate[key];
            return acc;
          }, {})
        }));
      } else if (player === 'Opponent') {
        setPlayerStats((prevStats: any) => ({
          ...prevStats,
          ...Object.keys(statsUpdate).reduce((acc: any, key: any) => {
            acc[key] = prevStats[key] + statsUpdate[key];
            return acc;
          }, {})
        }));
      }
    } else {
      if (player === 'Player') {
        setPlayerStats((prevStats: any) => ({
          ...prevStats,
          ...Object.keys(statsUpdate).reduce((acc: any, key: any) => {
            acc[key] = prevStats[key] + statsUpdate[key];
            return acc;
          }, {})
        }));
      } else if (player === 'Opponent') {
        setOpponentStats((prevStats: any) => ({
          ...prevStats,
          ...Object.keys(statsUpdate).reduce((acc: any, key: any) => {
            acc[key] = prevStats[key] + statsUpdate[key];
            return acc;
          }, {})
        }));
      }
    }
  };



  useEffect(() => {
    const getMatch = async () => {
      const matchID = id;
      if (matchID && initData) {
        const thisMatch = await getMatchByID(initData, matchID);
        setMatch(thisMatch);
      }
    };

    getMatch();
  }, [id, initData]);

  useEffect(() => {
    if (!match || !match.availableToWatch) return;

    const now = new Date();
    const availableToWatchDate = new Date(match.availableToWatch);
    const matchDurationInMinutes = 90; // Total in-game minutes
    const realWorldMatchDurationInMs = 4 * 60 * 1000; // 4 minutes in milliseconds (total match watch time)
    const timeElapsedSinceAvailable = now.getTime() - availableToWatchDate.getTime(); // Time elapsed since match became available

    // Calculate the current in-game minute based on how much real time has passed
    const calculatedInGameMinute = Math.floor((timeElapsedSinceAvailable / realWorldMatchDurationInMs) * matchDurationInMinutes);

    setCurrentInGameMinute(90 + calculatedInGameMinute);

    console.log(currentInGameMinute)

  }, [match]);

  useEffect(() => {
    if (!match || !match.attacks) return;

    const interval = setInterval(() => {
      if (match && currentAttackIndex < match.attacks.length) {
        const currentAttack = match.attacks[currentAttackIndex];

        if (currentScenarioIndex < currentAttack.scenario.length) {
          const scenario = currentAttack.scenario[currentScenarioIndex];
          const scenarioText = currentAttack.scenario[currentScenarioIndex].scenario;

          if (scenarioText === 'Half-time') {
            setHalf('Second half');
            setCurrentMinute(45);
          } else if (scenarioText === 'Awaiting Extra-time') {
            setHalf('Extra time');
            setCurrentMinute(90);
          }

          if (currentAttack.player != 'Match') {
            moves++;
          }

          if (moves % 2 === 0) {
            if ((half === 'First half' && currentMinute < 45) ||
              (half === 'Second half' && currentMinute < 90) ||
              (half === 'Extra time' && currentMinute < 120)) {
              setCurrentMinute(prev => {
                const newMinute = prev + 1;
                setProgress((newMinute / 90) * 100); // Update progress
                return newMinute;
              });

            }
          }

          setMainScernario({ minute: currentMinute, player: currentAttack.player, scenario: currentAttack.scenario[currentScenarioIndex] })

          setCurrentScenario({
            line: scenario.line,
            player: currentAttack.player
          });

          if (scenarioText === 'Goal Scored' || scenarioText === 'Penalty Scored' || scenarioText === 'Freekick Scored') {
            if (currentAttack.player === 'Player') {
              setPlayerScore(prevScore => prevScore + 1);
            } else if (currentAttack.player === 'Opponent') {
              setOpponentScore(prevScore => prevScore + 1);
            }
          }

          updateStats(scenarioText, currentAttack.player);

          const highlightEvents = ['Match Started', 'Half-time', 'Awaiting Extra-time', 'Awaiting Penalties', 'Goal Scored', 'Penalty Scored', 'Penalty Missed', 'Freekick Scored', 'Hits woodwork', 'Offside', 'Full time']

          if (currentAttack.scenario[currentScenarioIndex].scenario === 'Full time') {
            setFinished(true);
          }

          if (highlightEvents.includes(currentAttack.scenario[currentScenarioIndex].scenario)) {
            setDisplayedScenarios(prev => [
              { minute: currentMinute, player: currentAttack.player, scenario: currentAttack.scenario[currentScenarioIndex] },
              ...prev
            ]);
          }


          setCurrentScenarioIndex(currentScenarioIndex + 1);
        } else {
          setCurrentAttackIndex(currentAttackIndex + 1);
          setCurrentScenarioIndex(0);
        }
      } else {
        clearInterval(interval);
      }
    }, (currentMinute < currentInGameMinute ? 1 : (match && match.attacks[currentAttackIndex]?.scenario[currentScenarioIndex]?.wait) || 2200));

    return () => clearInterval(interval);
  }, [match, currentAttackIndex, currentScenarioIndex]);

  const goBack = () => {
    if (!finished) {
      return;
    }

    router.push('/')
  }

  if (!match) {
    return (
      <section className='w-full h-screen flex flex-col justify-center items-center bg-gradient-to-b from-slate-800 to-gray-600'>
        <Image src={'/icons/spinner.svg'} alt='spinner' height={30} width={30} className='animate-spin' />
      </section>)
  }

  return (
    <section className='w-full h-screen flex flex-col bg-gradient-to-b from-slate-900 to-gray-600'>
      <div className='flex flex-row items-center ml-3 mt-2 gap-2'>
        <div className=' py-2 px-3 rounded-md text-white font-bold' onClick={goBack}>
          <Image src={finished ? '/icons/back.svg' : '/icons/back-grey.svg'} alt='back' height={10} width={10} />
        </div>
        <p className='font-bold text-white'>{match?.type} Match</p>
      </div>
      <div className='flex flex-row items-center justify-evenly my-3 h-[140px]'>
        <div className='flex flex-col justify-center items-center gap-2 w-[120px] overflow-hidden'>
          <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Player.photo)}`} alt='user' height={120} width={120} className='bg-slate-500 h-[70px] w-[70px] rounded-md' />
          <div className='flex flex-row items-center gap-1'>
            <p className='text-white font-semibold text-[14px] line-clamp-1'>{match.Player.username}</p>
            <Image src={`/flags/${match.playerCountry}.svg`} alt='flag' height={20} width={20} className='bg-white h-[18px] w-[18px] rounded-full border-[1px] border-slate-800' />
          </div>
        </div>
        <div className='flex flex-col justify-center items-center'>
          <div className='text-yellow-400 font-semibold h-[70px] flex flex-row items-center text-[50px]'>
            <RollingNumber number={playerScore} />
            <div className='h-[6px] bg-gradient-to-t from-yellow-400 to-yellow-500 w-[20px] rounded-md' />
            <RollingNumber number={opponentScore} />
          </div>
          <p className='text-yellow-400 font-semibold'>{currentMinute}{`'`}</p>
        </div>
        {/* <PlayerDialog userPhoto={match.Opponent.photo} userName={match.Opponent.username} userId={match.Opponent._id} userCountry={match.opponentCountry} page='Match' /> */}
        <div className='flex flex-col justify-center items-center gap-2 w-[120px] overflow-hidden'>
          <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Opponent.photo)}`} alt='user' height={120} width={120} className='bg-slate-500 h-[70px] w-[70px] rounded-md' />
          <div className='flex flex-row items-center gap-1'>
            <p className='text-white font-semibold text-[14px] line-clamp-1'>{match.Opponent.username}</p>
            <Image src={`/flags/${match.opponentCountry}.svg`} alt='flag' height={20} width={20} className='bg-white h-[18px] w-[18px] rounded-full border-[1px] border-slate-800' />
          </div>
        </div>
      </div>
      <div className='w-full flex justify-center items-center'>
        <div className='progress-container w-11/12'>
          <div className='progress-bar bg-yellow-500' style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      <ScrollArea className='h-[85%]'>
        <div className='flex justify-center items-center my-4'>
          <Field scenarioText={mainScenario?.scenario.scenario || ''} currentLine={currentScenario.line} player={currentScenario.player} match={match} />
        </div>
        <div className='w-full flex justify-center items-center'>
          <MatchStats playerStats={playerStats} opponentStats={opponentStats} />
        </div>
        <div className='w-full flex justify-center items-center my-3'>
          <p className='place-self-center text-white font-semibold mb-2'>All Highlights</p>
        </div>
        <div className='flex flex-col justify-center items-center gap-3'>
          {displayedScenarios.map((scenario: any, index: number) => (
            <div className='bg-gradient-to-b from-slate-700 to-slate-800 w-5/6 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800' key={index}>
              {scenario.player === 'Player' &&
                <div className='w-5/6 rounded-md flex flex-row items-center justify-center py-3 px-2'>
                  <div className='w-1/4 flex flex-col justify-center items-center gap-2'>
                    <IconDisplay scenario={scenario.scenario.scenario} />
                    <p className='text-yellow-500 font-semibold'>{scenario.minute}{`'`}</p>
                  </div>
                  <div className='w-3/4 flex flex-col justify-center items gap-2 text-[15px]'>
                    <p>{scenario.scenario.scenario}</p>
                  </div>
                </div>}
              {scenario.player === 'Opponent' &&
                <div className='w-5/6 rounded-md flex flex-row items-center justify-center py-3 ml-auto px-2'>
                  <div className='w-3/4 flex flex-col justify-center items gap-2 text-[15px]'>
                    <p>{scenario.scenario.scenario}</p>
                  </div>
                  <div className='w-1/4 flex flex-col justify-center items-center gap-2'>
                    <IconDisplay scenario={scenario.scenario.scenario} />
                    <p className='text-yellow-500 font-semibold'>{scenario.minute}{`'`}</p>
                  </div>
                </div>}
              {scenario.player === 'Match' &&
                <div className='text-center'>
                  {scenario.scenario.scenario === 'Player Wins!' ? (
                    <p>{match?.Player.username} Wins!</p>
                  ) : scenario.scenario.scenario === 'Opponent Wins!' ? (
                    <p>{match?.Opponent.username} Wins!</p>
                  ) : (
                    <p>{scenario.scenario.scenario}</p>
                  )}
                </div>}
            </div>
          ))}
        </div>
      </ScrollArea>
    </section >
  );
};
export default MatchPage

const Field = ({ currentLine, player, scenarioText, match }: { currentLine: number, player: string, scenarioText: string, match: any }) => {

  const fieldHeight = 190;
  const fieldWidth = 290;
  const lines = 10;

  const shadingWidth = (fieldWidth / lines) * currentLine;
  const isPlayer = player === 'Player';
  const shadingColor = player === 'Player'
    ? 'rgba(0, 255, 0, 0.45)'
    : player === 'Opponent'
      ? 'rgba(31, 129, 232, 0.60)'
      : 'transparent';
  const shadingLeft = isPlayer ? '0' : 'auto';
  const shadingRight = isPlayer ? 'auto' : '0';

  return (
    <div className="field flex justify-center items-center" style={{ width: fieldWidth, height: fieldHeight, position: 'relative' }}>
      <div
        className="shading"
        style={{
          width: `${shadingWidth}px`,
          height: '100%',
          backgroundColor: shadingColor,
          position: 'absolute',
          left: shadingLeft,
          right: shadingRight,
          transform: !isPlayer ? 'none' : 'scale(-1,-1)',
          boxShadow: `-8px -8px 10px -4px #149820,-8px 8px 10px -4px #149820,8px -8px 10px -4px #149820,8px 8px 10px -4px #149820`,
        }}
      />
      {(scenarioText && scenarioText === 'Player Wins!') &&
        <div className='flex flex-col justify-center items-center gap-2 overflow-hidden animate-in'>
          <Image src={'/icons/crown.svg'} alt='user' height={70} width={70} className='h-[50px] w-[50px] rounded-md' />
          <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Player.photo)}`} alt='user' height={70} width={70} className='bg-slate-500 h-[70px] w-[70px] rounded-md' />
          <div className='flex flex-row items-center gap-1 bg-gradient-to-b from-slate-700 to-slate-800 px-2 py-1 rounded-lg'>
            <p className='text-white font-semibold text-[16px]'>{match?.Player.username}</p>
            <Image src={`/flags/${match.playerCountry}.svg`} alt='flag' height={20} width={20} className='bg-white h-[20px] w-[20px] rounded-full' />
            <p className='text-white font-semibold text-[16px] ml-1'>Wins!</p>
          </div>
        </div>}
      {(scenarioText && scenarioText === 'Opponent Wins!') &&
        <div className='flex flex-col justify-center items-center gap-2 overflow-hidden animate-in'>
          <Image src={'/icons/crown.svg'} alt='user' height={70} width={70} className='h-[50px] w-[50px] rounded-md' />
          <Image src={`https://drive.google.com/uc?export=view&id=${getImageID(match.Opponent.photo)}`} alt='user' height={70} width={70} className='bg-slate-500 h-[70px] w-[70px] rounded-md' />
          <div className='flex flex-row items-center gap-1 bg-gradient-to-b from-slate-700 to-slate-800 px-2 py-1 rounded-lg'>
            <p className='text-white font-semibold text-[16px]'>{match?.Opponent.username}</p>
            <Image src={`/flags/${match.opponentCountry}.svg`} alt='flag' height={20} width={20} className='bg-white h-[20px] w-[20px] rounded-full' />
            <p className='text-white font-semibold text-[16px] ml-1'>Wins!</p>
          </div>
        </div>}
      {(scenarioText && scenarioText.includes('Interception')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Interception'} />
          <p>Interception</p>
        </div>}
      {(scenarioText && scenarioText.includes('Clearance')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Clearance'} />
          <p>Clearance</p>
        </div>}
      {(scenarioText && scenarioText.includes('Penalty awarded')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Penalty awarded'} />
          <p>Penalty Awarded</p>
        </div>}
      {(scenarioText && scenarioText.includes('Freekick awarded')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Freekick awarded'} />
          <p>Freekick Awarded</p>
        </div>}
      {(scenarioText && scenarioText.includes('Offside')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Offside'} />
          <p>Offside</p>
        </div>}
      {(scenarioText && scenarioText.includes('Corner awarded')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Corner awarded'} />
          <p>Corner Kick</p>
        </div>}
      {(scenarioText && scenarioText.includes('Goal Scored')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Goal Scored'} />
          <p>Goal Scored</p>
        </div>}
      {(scenarioText && scenarioText.includes('Penalty Scored')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Penalty Scored'} />
          <p>Penalty Scored</p>
        </div>}
      {(scenarioText && scenarioText.includes('Penalty Missed')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Penalty Missed'} />
          <p>Penalty Missed</p>
        </div>}
      {(scenarioText && scenarioText.includes('Handball')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Handball'} />
          <p>Handball</p>
        </div>}
      {(scenarioText && scenarioText.includes('Shot Blocked')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Shot Blocked'} />
          <p>Shot Blocked</p>
        </div>}
      {(scenarioText && scenarioText.includes('Freekick Scored')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Freekick Scored'} />
          <p>Freekick Scored</p>
        </div>}
      {(scenarioText && scenarioText.includes('Match Started')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Match Started</p>
        </div>}
      {(scenarioText && scenarioText.includes('Half-time')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Half-time</p>
        </div>}
      {(scenarioText && scenarioText.includes('Full time')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Full time</p>
        </div>}
      {(scenarioText && scenarioText.includes('Awaiting Extra-time')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Awaiting Extra-time</p>
        </div>}
      {(scenarioText && scenarioText.includes('Awaiting Penalties')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Awaiting Penalties</p>
        </div>}
      {(scenarioText && scenarioText.includes('Goalkeeper save')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Goalkeeper save'} />
          <p>Goalkeeper save</p>
        </div>}
      {(scenarioText && scenarioText.includes('Goalkeeper catches the ball')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Goalkeeper catches the ball'} />
          <p>Goalkeeper catch</p>
        </div>}
      {(scenarioText && scenarioText.includes('Hits woodwork')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Hits woodwork'} />
          <p>Hits woodwork</p>
        </div>}
      {(scenarioText && scenarioText.includes('Off target')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Off target'} />
          <p>Off target</p>
        </div>}
      {(scenarioText && scenarioText.includes('Fouled')) &&
        <div className='flex flex-row justify-center items-center gap-2 bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <IconDisplay scenario={'Fouled'} />
          <p>Fouled</p>
        </div>}
      {(scenarioText && scenarioText.includes('Play kicks-off')) &&
        <div className='bg-gradient-to-b from-slate-700 to-slate-800 w-3/4 text-center py-2 text-white font-semibold rounded-md shadow-md shadow-slate-800 animate-in'>
          <p>Kick off</p>
        </div>}
    </div>
  );
};

const IconDisplay = ({ scenario }: { scenario: string }) => {
  const { src, alt, size } = getIconProps(scenario);
  return <img src={src} alt={alt} height={size} width={size} />;
};

const getIconProps = (scenario: string) => {
  switch (scenario) {
    case 'Play kicks-off':
      return { src: '/icons/whistle-green.svg', alt: 'whistle', size: 30 }
    case 'Goal Scored':
    case 'Freekick Scored':
      return { src: '/icons/football-green-1.svg', alt: 'Goal Scored', size: 35 };
    case 'Fouled':
      return { src: '/icons/whistle-red.svg', alt: 'Fouled', size: 30 };
    case 'Freekick awarded':
      return { src: '/icons/freekick-yellow.svg', alt: 'Free kick awarded', size: 50 };
    case 'Penalty awarded':
      return { src: '/icons/penalty-yellow.svg', alt: 'Penalty awarded', size: 50 };
    case 'Penalty Missed':
      return { src: '/icons/penalty-red.svg', alt: 'Penalty missed', size: 50 };
    case 'Off target':
      return { src: '/icons/off-target-red.svg', alt: 'Off target', size: 50 };
    case 'Goalkeeper save':
    case 'Goalkeeper catches the ball':
      return { src: '/icons/goalkeeper-red.svg', alt: 'Goalkeeper saves', size: 50 };
    case 'Hits woodwork':
      return { src: '/icons/woodwork-red.svg', alt: 'Hits woodwork', size: 45 };
    case 'Penalty Scored':
      return { src: '/icons/penalty-green.svg', alt: 'Penalty scored', size: 50 };
    case 'Clearance':
    case 'Shot Blocked':
      return { src: '/icons/shield-green.svg', alt: 'Clears ball', size: 45 };
    case 'Corner awarded':
      return { src: '/icons/corner-green.svg', alt: 'Out for a corner', size: 45 };
    case 'Offside':
      return { src: '/icons/offside-red.svg', alt: 'Caught offside', size: 45 };
    case 'Handball':
      return { src: '/icons/handball-red.svg', alt: 'Handball committed', size: 45 };
    case 'Interception':
      return { src: '/icons/shield-green.svg', alt: 'Intercepts', size: 45 };
    default:
      return { src: '/icons/football-yellow-1.svg', alt: 'Default icon', size: 35 }; // Fallback
  }
}

const MatchStats = ({ playerStats, opponentStats }: any) => {
  // Calculate possession percentages
  const totalPossession = playerStats.possession + opponentStats.possession;
  const playerPossessionPercent = totalPossession ? (playerStats.possession / totalPossession) * 100 : 0;
  const opponentPossessionPercent = totalPossession ? (opponentStats.possession / totalPossession) * 100 : 0;

  const createBar = (value: number, max: number) => {
    const percentage = max ? (value / max) * 100 : 0;
    return (
      <div className="relative w-full h-6 bg-blue-500 rounded-lg overflow-hidden">
        <div className="absolute top-0 left-0 h-full bg-green-500" style={{ width: `${percentage}%` }}></div>
      </div>
    );
  };

  return (
    <div className='w-11/12 bg-gradient-to-b from-slate-800 to-slate-900 text-white p-4 rounded-md shadow-md shadow-slate-800'>
      <h2 className='text-center font-bold mb-2'>Match Statistics</h2>
      <div className='flex flex-col gap-2 font-semibold'>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerPossessionPercent.toFixed(1)}%</span>
            <span>Possession</span>
            <span>{opponentPossessionPercent.toFixed(1)}%</span>
          </div>
          {createBar(playerPossessionPercent, 100)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.passes}</span>
            <span>Passes</span>
            <span>{opponentStats.passes}</span>
          </div>
          {createBar(playerStats.passes, playerStats.passes + opponentStats.passes)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.shots}</span>
            <span>Shots</span>
            <span>{opponentStats.shots}</span>
          </div>
          {createBar(playerStats.shots, playerStats.shots + opponentStats.shots)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.saves}</span>
            <span>Saves</span>
            <span>{opponentStats.saves}</span>
          </div>
          {createBar(playerStats.saves, playerStats.saves + opponentStats.saves)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.interceptions}</span>
            <span>Interceptions</span>
            <span>{opponentStats.interceptions}</span>
          </div>
          {createBar(playerStats.interceptions, playerStats.interceptions + opponentStats.interceptions)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.corners}</span>
            <span>Corners</span>
            <span>{opponentStats.corners}</span>
          </div>
          {createBar(playerStats.corners, playerStats.corners + opponentStats.corners)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.fouls}</span>
            <span>Fouls</span>
            <span>{opponentStats.fouls}</span>
          </div>
          {createBar(playerStats.fouls, playerStats.fouls + opponentStats.fouls)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.freeKicks}</span>
            <span>Freekicks & Pens</span>
            <span>{opponentStats.freeKicks}</span>
          </div>
          {createBar(playerStats.freeKicks, playerStats.freeKicks + opponentStats.freeKicks)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.longBalls}</span>
            <span>Long Balls</span>
            <span>{opponentStats.longBalls}</span>
          </div>
          {createBar(playerStats.longBalls, playerStats.longBalls + opponentStats.longBalls)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.woodwork}</span>
            <span>Hit Woodwork</span>
            <span>{opponentStats.woodwork}</span>
          </div>
          {createBar(playerStats.woodwork, playerStats.woodwork + opponentStats.woodwork)}
        </div>
        <div className='flex flex-col items-center gap-2 mt-2'>
          <div className='flex flex-row items-center justify-between w-11/12'>
            <span>{playerStats.offsides}</span>
            <span>Offside</span>
            <span>{opponentStats.offsides}</span>
          </div>
          {createBar(playerStats.offsides, playerStats.offsides + opponentStats.offsides)}
        </div>
      </div>
    </div>
  );
};
