import { Icons } from "@/constants/Icons";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function calculatePossessionChance(formation: any, players: any) {
  let midfielders = 0;
  let totalLevel = 0;

  formation.data.forEach((line: any) => {
    if (line.type === 'Midfield') {
      line.positions.forEach((pos: any) => {
        if (pos) {
          const player = players.find((p: any) => p.position === pos);
          if (player) {
            midfielders++;
            totalLevel += player.level;
          }
        }
      });
    }
  });

  const averageLevel = midfielders > 0 ? totalLevel / midfielders : 0;

  const numberWeight = 0.6;
  const levelWeight = 0.4;

  const possessionFactor = (numberWeight * midfielders) + (levelWeight * averageLevel);
  return possessionFactor;
}

function calculateDefenseInterception(formation: any, players: any) {
  let defenders = 0;
  let totalLevel = 0;

  formation.data.forEach((line: any) => {
    if (line.type === 'Defense') {
      line.positions.forEach((pos: any) => {
        if (pos) {
          const player = players.find((p: any) => p.position === pos);
          if (player) {
            defenders++;
            totalLevel += player.level;
          }
        }
      });
    }
  });

  return { defenders, averageLevel: defenders > 0 ? totalLevel / defenders : 0 };
}

function calculateOffensivePower(formation: any, players: any) {
  let forwards = 0;
  let totalLevel = 0;

  formation.data.forEach((line: any) => {
    if (line.type === 'Forward') {
      line.positions.forEach((pos: any) => {
        if (pos) {
          const player = players.find((p: any) => p.position === pos);
          if (player) {
            forwards++;
            totalLevel += player.level;
          }
        }
      });
    }
  });

  forwards = forwards * 0.7
  totalLevel = totalLevel * 0.3

  return { forwards, totalLevel };
}

export function calculateGoalkeeperChance(goalkeeper: any, offensivePower: any) {
  const totalLevel = goalkeeper.level + offensivePower.totalLevel;
  const saveChance = goalkeeper.level / totalLevel;
  return saveChance;
}

function calculateDefensiveControl(formation: any, players: any) {
  let totalLevel = 0;
  let defenderCount = 0;

  formation.data.forEach((line: any) => {
    if (line.type === 'Defense') {
      line.positions.forEach((pos: any) => {
        if (pos) {
          const player = players.find((d: any) => d.position === pos);
          if (player) {
            totalLevel += player.level;
            defenderCount++;
          }
        }
      });
    }
  });

  const averageLevel = defenderCount > 0 ? totalLevel / defenderCount : 0;

  // 60% weight on the number of defenders, 40% on their levels
  const controlFactor = (0.6 * defenderCount) + (0.4 * averageLevel);
  return controlFactor;
}

function calculateOffensivePressingPower(formation: any, players: any) {
  let totalLevel = 0;
  let attackerCount = 0;

  formation.data.forEach((line: any) => {
    if (line.type === 'Forward') {
      line.positions.forEach((pos: any) => {
        if (pos) {
          const player = players.find((a: any) => a.position === pos);
          if (player) {
            totalLevel += player.level;
            attackerCount++;
          }
        }
      });
    }
  });

  const averageLevel = attackerCount > 0 ? totalLevel / attackerCount : 0;

  // 60% weight on the number of attackers, 40% on their levels
  const pressingPower = (0.6 * attackerCount) + (0.4 * averageLevel);
  return pressingPower;
}

function handlePenalty(scenario: any, level: any): any {
  const penaltyOutcome = Math.random();
  const saveChance = 0.35 * (1 - level * 0.01); // Decreasing save chance as level increases
  const woodworkChance = 0.1;


  scenario.push({ scenario: 'Player shoots', line: 10, wait: 1000 });

  if (penaltyOutcome < saveChance) {

    scenario.push({ scenario: 'Penalty Missed', line: 10, wait: 1000 });
    scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
    return handleFollowUp(scenario, level, 'save');
  } else if (penaltyOutcome < saveChance + woodworkChance) {
    scenario.push({ scenario: 'Penalty Missed', line: 10, wait: 1000 });
    scenario.push({ scenario: 'Hits woodwork', line: 9, wait: 1000 });
    return handleFollowUp(scenario, level, 'woodwork');
  } else if (penaltyOutcome < saveChance + woodworkChance + 0.15) {
    scenario.push({ scenario: 'Penalty Missed', line: 10, wait: 1000 });
    scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
  } else {
    scenario.push({ scenario: 'Penalty Scored', line: 10, wait: 1000 });
  }

  return scenario;
}

// Function to handle follow-up scenarios
function handleFollowUp(scenario: any, level: any, outcome: string): any {
  const followUpEvent = Math.random();

  if (outcome === 'save') {
    if (followUpEvent < 0.3) {
      scenario.push({ scenario: 'Goalkeeper catches the ball', line: 10, wait: 1000 });
    } else if (followUpEvent < 0.6) {
      scenario.push({ scenario: 'Clearance', line: 8, wait: 1000 });
    } else if (followUpEvent < 0.9) {
      scenario.push({ scenario: 'Forward shoots', line: 10, wait: 1000 });
      return handleRebound(scenario, level);
    } else {
      scenario.push({ scenario: 'Corner awarded', line: 10, wait: 1000 });
      handleCorner(scenario, level)
    }
  } else if (outcome === 'woodwork') {
    if (followUpEvent < 0.3) {
      scenario.push({ scenario: 'Goalkeeper catches the ball', line: 10, wait: 1000 });
    } else if (followUpEvent < 0.6) {
      scenario.push({ scenario: 'Clearance', line: 8, wait: 1000 });
    } else {
      scenario.push({ scenario: 'Forward shoots', line: 10, wait: 1000 });
      return handleRebound(scenario, level);
    }
  }

  return scenario;
}

// Function to handle rebound scenarios
function handleRebound(scenario: any, level: any): any {
  const reboundOutcome = Math.random();
  if (reboundOutcome < 0.25) {
    scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
    return handleFollowUp(scenario, level, 'save');
  } else if (reboundOutcome < 0.4) {
    scenario.push({ scenario: 'Hits woodwork', line: 9, wait: 1000 });
    return handleFollowUp(scenario, level, 'woodwork');
  } else if (reboundOutcome < 0.5) {
    scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
  } else if (reboundOutcome < 0.6) {
    scenario.push({ scenario: 'Goal Scored', line: 10, wait: 1000 });
  } else if (reboundOutcome < 0.7) {
    scenario.push({ scenario: 'Shot Blocked', line: 9, wait: 1000 });
    return handleBlock(scenario, level);
  } else {
    scenario.push({ scenario: 'Corner awarded', line: 10, wait: 1000 });
    handleCorner(scenario, level)
  }
  return scenario;
}

// Function to handle blocked shot scenarios
function handleBlock(scenario: any, level: any): any {
  const blockOutcome = Math.random();
  if (blockOutcome < 0.5) {
    scenario.push({ scenario: 'Corner awarded', line: 10, wait: 1000 });
    handleCorner(scenario, level)
  } else if (blockOutcome < 0.7) {
    scenario.push({ scenario: 'Clearence', line: 8, wait: 1000 });
  } else {
    scenario.push({ scenario: 'Handball', line: 9, wait: 1000 });
    scenario.push({ scenario: 'Penalty awarded', line: 9, wait: 1000 });
    return handlePenalty(scenario, level);
  }
  return scenario;
}

function handleCorner(scenario: any[], level: number) {

  scenario.push({ scenario: 'Corner kick cross', line: 9, wait: 1000 });

  const cornerOutcome = Math.random();

  if (cornerOutcome < 0.4) {

    scenario.push({ scenario: 'Clearence', line: 9, wait: 1000 });

  } else {
    scenario.push({ scenario: 'Header', line: 10, wait: 1000 });

    const headerOutcome = Math.random();
    if (headerOutcome < 0.3) {
      scenario.push({ scenario: 'Goal Scored', line: 10, wait: 1000 });
    } else if (headerOutcome < 0.6) {
      scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
      scenario = handleFollowUp(scenario, 1, 'save')
    } else if (headerOutcome < 0.8) {
      scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
    } else if (headerOutcome < 0.9) {
      scenario.push({ scenario: 'Shot Blocked', line: 9, wait: 1000 });
      handleBlock(scenario, level)
    } else {
      scenario.push({ scenario: 'Hits woodwork', line: 9, wait: 1000 });
      scenario = handleFollowUp(scenario, 1, 'woodwork')
    }
  }

  return scenario;
}

function handleFreekick(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any, type: string) {

  console.log('Freekick Here')

  switch (type) {
    case 'Attacking Midfield':
      const offensivePower = calculateOffensivePower(playerFormation, players1);
      scenario.push({ scenario: 'Midfielder shoots', line: 10, wait: 1000 });
      const goalkeeper = players2.find((p: any) => p.position === 'GK');
      const saveChance = calculateGoalkeeperChance(goalkeeper, offensivePower);

      const shotOutcome = Math.random();
      if (shotOutcome < saveChance) {
        scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'save');
      } else if (shotOutcome < saveChance + 0.1) {
        scenario.push({ scenario: 'Hits woodwork', line: 9, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'woodwork');
      } else if (shotOutcome < saveChance + 0.2) {
        scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
      } else {
        scenario.push({ scenario: 'Freekick Scored', line: 10, wait: 1000 });
      }
      break;

    case 'Frontline Midfield':
      let FrontLinePass = Math.random();
      if (FrontLinePass < 0.25) {
        scenario.push({ scenario: 'Pass', line: 9, wait: 1000 });
        scenario = calculateForward(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (FrontLinePass < 0.5) {
        scenario.push({ scenario: 'Pass', line: 8, wait: 1000 });
        scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      }
      break;

    case 'Backline Midfield':
      const BackLinePass = Math.random();
      if (BackLinePass < 0.2) {
        scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
        scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (BackLinePass < 0.6) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (BackLinePass < 0.8) {
        scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Long Ball', line: 8, wait: 1000 });
        scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      }
      break;

    case 'Frontline Defense':
      const FrontLineDefPass = Math.random();
      if (FrontLineDefPass < 0.2) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (FrontLineDefPass < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 7, wait: 1000 });
        scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (FrontLineDefPass < 0.6) {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 3, wait: 1000 });
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
      break;

    case 'Center Defense':
      const CenterDefPass = Math.random();
      if (CenterDefPass < 0.2) {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (CenterDefPass < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (CenterDefPass < 0.6) {
        scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 2, wait: 1000 });
        scenario = calculateBackLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
      break;

    case 'Backline Defense':
      const BackLineDefPass = Math.random();
      if (BackLineDefPass < 0.2) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (BackLineDefPass < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 7, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
      break;

    default:
      break;
  }

  return scenario;
}


function calculateForward(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const defense = calculateDefenseInterception(opponentFormation, players2);
  const offensivePower = calculateOffensivePower(playerFormation, players1);
  const defenseFactor = defense.averageLevel / (defense.averageLevel + offensivePower.totalLevel + 5);

  let eventChance = Math.random();

  if (eventChance < defenseFactor * 0.7) {


    scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 9, wait: 1000 });
    scenario.push({ scenario: 'Forward Interception', line: 9, wait: 500 });

  } else {

    eventChance = Math.random();

    if (eventChance < 0.2) {

      scenario.push({ scenario: 'Offside', line: 9, wait: 1000 });

    } else if (eventChance < 0.4) {

      scenario.push({ scenario: 'Fouled', line: 9, wait: 1000 });
      scenario.push({ scenario: 'Penalty awarded', line: 9, wait: 1000 });
      scenario = handlePenalty(scenario, 1);

    } else {
      // Forward gets a shot on goal
      scenario.push({ scenario: 'Forward shoots', line: 10, wait: 1000 });

      const goalkeeper = players2.find((p: any) => p.position === 'GK');
      const saveChance = calculateGoalkeeperChance(goalkeeper, offensivePower);
      const eventChance = Math.random();

      if (eventChance < saveChance * 0.6) {
        scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'save'); // Continue with follow-up scenarios
      } else if (eventChance < saveChance * 0.6 + 0.1) {
        scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
      } else if (eventChance < saveChance * 0.6 + 0.2) {
        scenario.push({ scenario: 'Hits woodwork', line: 9, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'woodwork'); // Continue with follow-up scenarios
      } else if (eventChance < saveChance * 0.6 + 0.3) {
        scenario.push({ scenario: 'Shot Blocked', line: 9, wait: 1000 });
        scenario = handleBlock(scenario, 1); // Continue with follow-up scenarios
      } else {
        scenario.push({ scenario: 'Goal Scored', line: 10, wait: 1000 });
      }
    }
  }

  return scenario
}

function calculateFrontLineMidfield(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const possessionChance = calculatePossessionChance(playerFormation, players1);
  const defenseInterception = calculateDefenseInterception(opponentFormation, players2);
  const interceptionChance = (defenseInterception.averageLevel * 0.1) / (defenseInterception.averageLevel * 0.1 + possessionChance);

  // Check for interception
  if (Math.random() < interceptionChance) {

    scenario.push({ scenario: 'Pass', line: 8, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
    scenario.push({ scenario: 'Frontline Midfield Interception', line: 7, wait: 500 });
  } else {
    const randomEvent = Math.random();

    // Check for foul
    if (randomEvent < 0.05) {
      scenario.push({ scenario: 'Fouled', line: 7, wait: 500 });
      scenario.push({ scenario: 'Freekick awarded', line: 7, wait: 1000 });
      scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Frontline Midfield');
    } else {
      const passType = Math.random();
      if (passType < 0.25) {
        scenario.push({ scenario: 'Pass', line: 9, wait: 1000 });
        scenario = calculateForward(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.35) {
        const offensivePower = calculateOffensivePower(playerFormation, players1);
        const goalkeeper = players2.find((p: any) => p.position === 'GK');
        const saveChance = calculateGoalkeeperChance(goalkeeper, offensivePower);
        const eventChance = Math.random();

        scenario.push({ scenario: 'Player shoots', line: 10, wait: 1000 });

        if (eventChance < saveChance) {
          scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
          scenario = handleFollowUp(scenario, 1, 'save');
        } else if (eventChance < saveChance + 0.1) {
          scenario.push({ scenario: 'Hits woodwork', line: 10, wait: 1000 });
          scenario = handleFollowUp(scenario, 1, 'woodwork');
        } else if (eventChance < saveChance + 0.2) {
          scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
        } else if (eventChance < saveChance + 0.3) { // Adjusted range for shot blocked
          scenario.push({ scenario: 'Shot blocked', line: 9, wait: 1000 });
          scenario = handleFollowUp(scenario, 1, 'blocked');
        } else {
          scenario.push({ scenario: 'Goal Scored', line: 10, wait: 1500 });
        }
      } else if (passType < 0.5) {
        scenario.push({ scenario: 'Pass', line: 8, wait: 1000 });
        scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      }
    }
  }

  return scenario;
}

function calculateAttackingMidfield(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const randomEvent = Math.random();

  // Check for foul
  if (randomEvent < 0.05) {
    scenario.push({ scenario: 'Fouled', line: 8, wait: 1000 });
    scenario.push({ scenario: 'Freekick awarded', line: 8, wait: 1000 });
    scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Attacking Midfield');
  } else {
    const passType = Math.random();

    // Check for shooting on target
    if (passType < 0.25) {
      scenario.push({ scenario: 'Pass', line: 9, wait: 1000 });
      scenario = calculateForward(scenario, playerFormation, opponentFormation, players1, players2);
    } else if (passType < 0.45) {
      const offensivePower = calculateOffensivePower(playerFormation, players1);
      const goalkeeper = players2.find((p: any) => p.position === 'GK');
      const saveChance = calculateGoalkeeperChance(goalkeeper, offensivePower);
      const eventChance = Math.random();

      scenario.push({ scenario: 'Player shoots', line: 10, wait: 1000 });

      if (eventChance < saveChance) {
        scenario.push({ scenario: 'Goalkeeper save', line: 9, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'save');
      } else if (eventChance < saveChance + 0.1) {
        scenario.push({ scenario: 'Hits woodwork', line: 10, wait: 1000 });
        scenario = handleFollowUp(scenario, 1, 'woodwork');
      } else if (eventChance < saveChance + 0.2) {
        scenario.push({ scenario: 'Off target', line: 10, wait: 1000 });
      } else if (eventChance < saveChance + 0.3) { // Adjusted range for shot blocked
        scenario.push({ scenario: 'Shot blocked', line: 9, wait: 1000 });
        scenario = handleBlock(scenario, 1);
      } else {
        scenario.push({ scenario: 'Goal Scored', line: 10, wait: 1500 });
      }
    } else {
      scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
      scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
    }
  }

  return scenario;
}

function calculateBackLineMidfield(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const possessionChance = calculatePossessionChance(playerFormation, players1);
  const defenseInterception = calculateDefenseInterception(opponentFormation, players2);
  const interceptionChance = (defenseInterception.averageLevel * 0.1) / (defenseInterception.averageLevel * 0.1 + possessionChance);

  // Check for interception
  if (Math.random() < interceptionChance) {
    scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
    scenario.push({ scenario: 'Backline Midfield Interception', line: 5, wait: 500 });
  } else {
    const randomEvent = Math.random();

    // Check for foul
    if (randomEvent < 0.05) {
      scenario.push({ scenario: 'Fouled', line: 5, wait: 500 });
      scenario.push({ scenario: 'Freekick awarded', line: 5, wait: 1000 });
      scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Backline Midfield');
    } else {

      // Determine the type of pass
      const passType = Math.random();
      if (passType < 0.2) {
        scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
        scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.6) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.8) {
        scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Long Ball', line: 8, wait: 1000 });
        scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      }
    }
  }

  return scenario;
}


function calculateCenterMidfield(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {

  const passType = Math.random();
  if (passType < 0.33) {
    scenario.push({ scenario: 'Pass', line: 8, wait: 1000 });
    scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2);
  } else if (passType < 0.66) {
    scenario.push({ scenario: 'Pass', line: 7, wait: 1000 });
    scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
  } else {
    scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
    scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
  }

  return scenario;
}

function calculateCenterDefense(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const defenseControl = calculateDefensiveControl(playerFormation, players1);
  const offensivePress = calculateOffensivePressingPower(opponentFormation, players2);

  const totalPower = defenseControl + offensivePress;
  let defenseChance = defenseControl / totalPower;
  let offenseChance = offensivePress / totalPower;

  // Limit the offensive chance to ensure balance
  offenseChance = Math.min(offenseChance, 0.05);
  defenseChance = 1 - offenseChance;

  // Check for interception
  if (Math.random() < offenseChance) {
    scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 3, wait: 1000 });
    scenario.push({ scenario: 'Center Defesne Interception', line: 3, wait: 500 });
  } else {
    const randomEvent = Math.random();

    // Check for foul
    if (randomEvent < 0.05) {
      scenario.push({ scenario: 'Fouled', line: 3, wait: 500 });
      scenario.push({ scenario: 'Freekick awarded', line: 3, wait: 1000 });
      scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Center Defense');
    } else {

      // Determine the type of pass
      const passType = Math.random();
      if (passType < 0.2) {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.6) {
        scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 2, wait: 1000 });
        scenario = calculateBackLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
    }
  }

  return scenario;
}

function calculateFrontLineDefense(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const defenseControl = calculateDefensiveControl(playerFormation, players1);
  const offensivePress = calculateOffensivePressingPower(opponentFormation, players2);

  const totalPower = defenseControl + offensivePress;
  let defenseChance = defenseControl / totalPower;
  let offenseChance = offensivePress / totalPower;

  // Limit the offensive chance to ensure balance
  offenseChance = Math.min(offenseChance, 0.05);
  defenseChance = 1 - offenseChance;

  // Check for interception
  if (Math.random() < offenseChance) {
    scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
    scenario.push({ scenario: 'Frontline Defense Interception', line: 4, wait: 500 });
  } else {
    const randomEvent = Math.random();

    // Check for foul
    if (randomEvent < 0.05) {
      scenario.push({ scenario: 'Fouled', line: 4, wait: 500 });
      scenario.push({ scenario: 'Freekick awarded', line: 4, wait: 1000 });
      scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Frontline Defense');
    } else {

      // Determine the type of pass
      const passType = Math.random();
      if (passType < 0.2) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 7, wait: 1000 });
        scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.6) {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 3, wait: 1000 });
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
    }
  }

  return scenario;
}

function calculateBackLineDefense(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {
  const defenseControl = calculateDefensiveControl(playerFormation, players1);
  const offensivePress = calculateOffensivePressingPower(opponentFormation, players2);

  const totalPower = defenseControl + offensivePress;
  let defenseChance = defenseControl / totalPower;
  let offenseChance = offensivePress / totalPower;

  // Limit the offensive chance to ensure balance
  offenseChance = Math.min(offenseChance, 0.05);
  defenseChance = 1 - offenseChance;

  // Check for interception
  if (Math.random() < offenseChance) {
    scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
    scenario.push({ scenario: 'Pass', line: 4, wait: 1000 });
    scenario.push({ scenario: 'Backline Defense Interception', line: 4, wait: 500 });
  } else {
    const randomEvent = Math.random();

    // Check for foul
    if (randomEvent < 0.05) {
      scenario.push({ scenario: 'Fouled', line: 4, wait: 500 });
      scenario.push({ scenario: 'Freekick awarded', line: 4, wait: 1000 });
      scenario = handleFreekick(scenario, playerFormation, opponentFormation, players1, players2, 'Backline Defense');
    } else {

      // Determine the type of pass
      const passType = Math.random();
      if (passType < 0.2) {
        scenario.push({ scenario: 'Pass', line: 6, wait: 1000 });
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
      } else if (passType < 0.4) {
        scenario.push({ scenario: 'Long Ball', line: 7, wait: 1000 });
        scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
      } else {
        scenario.push({ scenario: 'Pass', line: 5, wait: 1000 });
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2);
      }
    }
  }

  return scenario;
}


function calculateGoalkeeper(scenario: any[], playerFormation: any, opponentFormation: any, players1: any, players2: any) {

  const passType = Math.random();

  if (passType < 0.3) {

    scenario.push({ scenario: 'Long Ball', line: 5, wait: 1000 });
    scenario = calculateBackLineMidfield(scenario, playerFormation, opponentFormation, players1, players2);
  } else if (passType < 0.6) {
    // Short pass to Backline Defense
    scenario.push({ scenario: 'Pass', line: 2, wait: 1000 });
    scenario = calculateBackLineDefense(scenario, playerFormation, opponentFormation, players1, players2);
  } else {
    // Through pass to Center Defense
    scenario.push({ scenario: 'Pass', line: 3, wait: 1000 });
    scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2);
  }

  return scenario;
}

export function simulateAttack(playerFormation: any, opponentFormation: any, players1: any, players2: any, lastSenario: string) {

  let scenario: any[] = [];

  console.log(lastSenario)

  if (lastSenario) {
    switch (lastSenario) {
      case 'Goalkeeper catches the ball':
      case 'Goalkeeper save':
      case 'Off target':
        scenario.push({ scenario: 'Goalkeeper has the ball', line: 1, wait: 1000 })
        scenario = calculateGoalkeeper(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Clearance':
      case 'Offside':
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Forward Interception':
        scenario = calculateBackLineDefense(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Attacking Midfield Interception':
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Frontline Midfield Interception':
        scenario = calculateFrontLineDefense(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Backline Midfield Interception':
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Frontline Defense Interception':
        scenario = calculateFrontLineMidfield(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Center Defesne Interception':
        scenario = calculateAttackingMidfield(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Backline Defense Interception':
        scenario = calculateForward(scenario, playerFormation, opponentFormation, players1, players2)
        break;

      case 'Goal Scored':
      case 'Penalty Scored':
      case 'Freekick Scored':
      case 'Match Started':
      case 'Half-time':
      case 'Awaiting Extra-time':
        scenario.push({ scenario: 'Play kicks-off', line: 5, wait: 1000 })
        scenario = calculateCenterMidfield(scenario, playerFormation, opponentFormation, players1, players2)
        break;
      default:
        scenario = calculateCenterDefense(scenario, playerFormation, opponentFormation, players1, players2)
        break;
    }
  }

  return scenario;
}

export function timeAgo(dateInput: Date | string): string {
  const date = new Date(dateInput); // Convert to Date object if it isn't already
  const now = new Date();
  const diff = now.getTime() - date.getTime(); // Difference in milliseconds

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));

  if (years >= 1) {
    return `${years}y`;
  } else if (weeks >= 1) {
    return `${weeks}w`;
  } else if (days >= 1) {
    return `${days}d`;
  } else if (hours >= 1) {
    return `${hours}h`;
  } else if (minutes >= 1) {
    return `${minutes}m`;
  } else {
    return "1s";
  }
}

export function getImageID(iconName:string){
  const requestedIcon = Icons.find(i => i.name === iconName)

  return requestedIcon?.id
}