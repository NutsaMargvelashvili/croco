import { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import { fetchLeaderboards, fetchLeaderboard, fetchCurrentLeaderboard, fetchLeaderboardTimeline } from '../../services/leaderboardService';
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
                    {leaderboard.prizes[index]?.amount ? `${leaderboard.prizes[index].amount} ${leaderboard.prizes[index].coinId?.split('_')[1] || ''}` : '-'}
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

  // Connect to socket when component mounts
  useEffect(() => {
    const connectSocket = async () => {
      try {
        if (!globalConfig.token || !globalConfig.promotionId) {
          console.warn('Missing token or promotionId for socket connection');
          return;
        }

        await socketService.connect(
          globalConfig.token,
          'Leaderboard',
          globalConfig.promotionId
        );

        // Subscribe to leaderboard updates
        const unsubscribe = socketService.subscribe(
          SOCKET_EVENTS.LEADERBOARD_UPDATE,
          handleLeaderboardUpdate
        );

        return () => {
          unsubscribe();
          socketService.disconnect();
        };
      } catch (err) {
        console.error('Failed to connect to socket:', err);
      }
    };

    connectSocket();
  }, [globalConfig.token, globalConfig.promotionId]);

  // Handle leaderboard updates from socket
  const handleLeaderboardUpdate = (data) => {
    try {
      const { externalId, players } = data;
      if (externalId && Array.isArray(players)) {
        setLeaderboardData(prev => ({
          ...prev,
          [externalId]: players
        }));
        // Clear any errors for this leaderboard
        setLeaderboardErrors(prev => ({
          ...prev,
          [externalId]: null
        }));
      }
    } catch (err) {
      console.error('Error handling leaderboard update:', err);
    }
  };

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

      // Check if the response indicates no results
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
        // Clear any previous errors for this leaderboard
        setLeaderboardErrors(prev => ({
          ...prev,
          [currentExternalId]: null
        }));
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
      const currentExternalId = leaderboard.value.externalId.toString();
      // Set error for this specific leaderboard
      setLeaderboardErrors(prev => ({
        ...prev,
        [currentExternalId]: err.message || 'Failed to fetch leaderboard data'
      }));
      // Clear any previous data for this leaderboard
      setLeaderboardData(prev => ({
        ...prev,
        [currentExternalId]: []
      }));
    }
  };

  // Fetch all leaderboards
  useEffect(() => {
    const loadLeaderboards = async () => {
      try {
        setLoading(true);
        const { promotionId } = globalConfig;
        
        if (!promotionId) {
          throw new Error('Promotion ID not found');
        }

        const leaderboardsData = await fetchLeaderboards(fetchEndpoint, promotionId);
        
        if (!leaderboardsData || !Array.isArray(leaderboardsData)) {
          throw new Error('Invalid leaderboards data received');
        }

        setLeaderboards(leaderboardsData);

        // Fetch data for each leaderboard
        const dataPromises = leaderboardsData.map(async (leaderboard) => {
          try {
            const data = await fetchCurrentLeaderboard(
              fetchEndpoint,
              promotionId,
              leaderboard.value.externalId.toString()
            );
            return [leaderboard.value.externalId, data?.players || []];
          } catch (err) {
            console.error(`Error fetching leaderboard ${leaderboard.value.externalId}:`, err);
            return [leaderboard.value.externalId, []];
          }
        });

        // Fetch timeline for each leaderboard
        const timelinePromises = leaderboardsData.map(async (leaderboard) => {
          try {
            const timeline = await fetchLeaderboardTimeline(
              fetchEndpoint,
              leaderboard.value.externalId.toString()
            );
            return [leaderboard.value.externalId, timeline];
          } catch (err) {
            console.error(`Error fetching timeline ${leaderboard.value.externalId}:`, err);
            return [leaderboard.value.externalId, null];
          }
        });

        const [dataResults, timelineResults] = await Promise.all([
          Promise.all(dataPromises),
          Promise.all(timelinePromises)
        ]);

        setLeaderboardData(Object.fromEntries(dataResults));
        setTimelineData(Object.fromEntries(timelineResults));
      } catch (err) {
        setError(err.message || 'Failed to load leaderboards');
        console.error('Error loading leaderboards:', err);
      } finally {
        setLoading(false);
      }
    };

    if (globalConfig.promotionId) {
      loadLeaderboards();
    }
  }, [globalConfig.promotionId, fetchEndpoint]);

  if (loading) {
    return <div className="leaderboard-loading">Loading leaderboards...</div>;
  }

  if (error) {
    return <div className="leaderboard-error">Error: {error}</div>;
  }

  if (!leaderboards.length) {
    return <div className="leaderboard-empty">No leaderboards available</div>;
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