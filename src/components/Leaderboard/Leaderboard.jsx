import { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { fetchLeaderboard, fetchCurrentLeaderboard, fetchLeaderboardTimeline } from '../../services/leaderboardService';
import socketService, { SOCKET_EVENTS } from '../../services/socketService';
import Timeline from './Timeline';
import './Leaderboard.scss';

const LeaderboardTable = ({ leaderboard, players, timeline, onTimelineChange, error }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasValidPlayers = players && Array.isArray(players) && players.length;
  const prizes = leaderboard?.prizes || [];

  return (
    <div className="leaderboard-container">
      <h2>{leaderboard.name}</h2>
      
      {timeline && <Timeline days={timeline} onTimelineChange={onTimelineChange} />}

      <div className="leaderboard-info">
        {leaderboard.description && (
          <p className="leaderboard-description">{leaderboard.description}</p>
        )}
        {leaderboard.startDate && leaderboard.endDate && (
          <div className="leaderboard-dates">
            <span>Start: {formatDate(leaderboard.startDate)}</span>
            <span>End: {formatDate(leaderboard.endDate)}</span>
          </div>
        )}
      </div>

      <div className="leaderboard-table">
        <div className="leaderboard-header">
          <div className="column-place">Place</div>
          <div className="column-player">Player</div>
          <div className="column-points">Points</div>
          <div className="column-prize">Prize</div>
        </div>

        <div className="leaderboard-body">
          {error ? (
            <div className="leaderboard-error-message">
              {error}
            </div>
          ) : hasValidPlayers ? (
            players
              .map((player, index) => (
                <div key={player.rank} className="leaderboard-row">
                  <div className="column-place">
                    <span className={`rank rank-${player.rank}`}>{player.rank}</span>
                  </div>
                  <div className="column-player">{player.name}</div>
                  <div className="column-points">{player.points}</div>
                  <div className="column-prize">
                    {prizes[index]?.amount ? `${prizes[index].amount} ${prizes[index].coinId?.split('_')[1] || ''}` : '-'}
                  </div>
                </div>
              ))
          ) : (
            <div className="leaderboard-empty-message">
              No players have participated yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Leaderboard = () => {
  const { globalConfig, fetchEndpoint } = useGlobal();
  const [leaderboards, setLeaderboards] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({});
  const [timelineData, setTimelineData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leaderboardErrors, setLeaderboardErrors] = useState({});

  // Handle timeline change and fetch appropriate data
  const handleTimelineChange = (leaderboard) => async (isCurrent) => {
    try {
      const { promotionId } = globalConfig;
      const currentExternalId = leaderboard.value.externalId.toString();

      if (!promotionId || !currentExternalId) {
        throw new Error('Missing required parameters');
      }

      // Use appropriate fetch function based on whether it's current period
      const data = isCurrent
        ? await fetchCurrentLeaderboard(fetchEndpoint, promotionId, currentExternalId)
        : await fetchLeaderboard(fetchEndpoint, promotionId, currentExternalId);

      if (!data) {
        throw new Error('Failed to fetch leaderboard data');
      }

      if (data.succeeded === false && data.message === "No results found") {
        setLeaderboardErrors(prev => ({
          ...prev,
          [currentExternalId]: "No data available for this period"
        }));
        setLeaderboardData(prev => ({
          ...prev,
          [currentExternalId]: []
        }));
        return;
      }

      if (data.players) {
        setLeaderboardData(prev => ({
          ...prev,
          [currentExternalId]: data.players
        }));
        setLeaderboardErrors(prev => ({
          ...prev,
          [currentExternalId]: null
        }));
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      const currentExternalId = leaderboard.value.externalId.toString();
      setLeaderboardErrors(prev => ({
        ...prev,
        [currentExternalId]: err.message || 'Failed to fetch leaderboard data'
      }));
      setLeaderboardData(prev => ({
        ...prev,
        [currentExternalId]: []
      }));
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!globalConfig.externalId1 || !globalConfig.externalId2) {
          throw new Error('Both leaderboard IDs are required');
        }

        // Create leaderboard objects
        const leaderboardsData = [
          { 
            name: 'Leaderboard 1',
            value: { 
              externalId: globalConfig.externalId1,
              id: 1
            }
          },
          { 
            name: 'Leaderboard 2',
            value: { 
              externalId: globalConfig.externalId2,
              id: 2
            }
          }
        ];

        setLeaderboards(leaderboardsData);

        // Fetch data for both leaderboards
        const [data1, data2, timeline1, timeline2] = await Promise.all([
          fetchCurrentLeaderboard(fetchEndpoint, globalConfig.promotionId, globalConfig.externalId1),
          fetchCurrentLeaderboard(fetchEndpoint, globalConfig.promotionId, globalConfig.externalId2),
          fetchLeaderboardTimeline(fetchEndpoint, globalConfig.externalId1),
          fetchLeaderboardTimeline(fetchEndpoint, globalConfig.externalId2)
        ]);

        // Set leaderboard data
        setLeaderboardData({
          [globalConfig.externalId1]: data1?.players || [],
          [globalConfig.externalId2]: data2?.players || []
        });

        // Set timeline data
        setTimelineData({
          [globalConfig.externalId1]: timeline1,
          [globalConfig.externalId2]: timeline2
        });

      } catch (err) {
        console.error('Error fetching leaderboards:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (globalConfig.promotionId && globalConfig.externalId1 && globalConfig.externalId2) {
      fetchInitialData();
    }
  }, [globalConfig.promotionId, globalConfig.externalId1, globalConfig.externalId2, fetchEndpoint]);

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboards...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">Error: {error}</div>;
  }

  return (
    <div className="leaderboards">
      {leaderboards.map((leaderboard) => (
        <LeaderboardTable
          key={leaderboard.value.externalId}
          leaderboard={leaderboard}
          players={leaderboardData[leaderboard.value.externalId] || []}
          error={leaderboardErrors[leaderboard.value.externalId]}
          timeline={timelineData[leaderboard.value.externalId]}
          onTimelineChange={handleTimelineChange(leaderboard)}
        />
      ))}
    </div>
  );
};

export default Leaderboard; 