const PREDICTIONS_CSV_URL =
  process.env.PREDICTIONS_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQKBI-Q_xoyrftx-gcjxlt6SQ5WPDZerYkSHLzyfpwjIAvN3XbafJGjl3ojm6kKnNbyzCxDAFeuERKG/pub?gid=0&single=true&output=csv';

export interface PredictionFixture {
  id: string;
  lastTimeToPredict: Date;
  team1Score: number | null;
  team2Score: number | null;
  finished: boolean;
}

export async function fetchPredictionFixtures(): Promise<PredictionFixture[]> {
  const response = await fetch(PREDICTIONS_CSV_URL, { next: { revalidate: 60 } });
  if (!response.ok) {
    throw new Error('Failed to fetch prediction fixtures');
  }

  const csv = await response.text();
  return csv
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((row) => {
      const [
        id,
        lastTimeToPredict,
        ,
        ,
        ,
        ,
        team1Score,
        team2Score,
        finished,
      ] = row.split(',').map((cell) => cell.trim());

      return {
        id,
        lastTimeToPredict: new Date(lastTimeToPredict),
        team1Score: team1Score ? Number(team1Score) : null,
        team2Score: team2Score ? Number(team2Score) : null,
        finished: finished?.toLowerCase() === 'true',
      };
    });
}

export async function getPredictionFixture(matchId: string) {
  const fixtures = await fetchPredictionFixtures();
  return fixtures.find((fixture) => fixture.id === matchId) ?? null;
}
