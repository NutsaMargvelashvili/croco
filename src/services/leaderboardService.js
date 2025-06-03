const LEADERBOARD_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    LeaderboardI: {
      properties: {
        announcementDate: { type: "string" },
        creationDate: { type: "string" },
        description: { type: "string" },
        endDate: { type: "string" },
        eventType: { type: "number" },
        id: { type: "number" },
        isGenerated: { type: "boolean" },
        prizes: {
          items: { $ref: "#/definitions/PrizeI" },
          type: "array"
        },
        startDate: { type: "string" },
        status: { type: "number" },
        title: { type: "string" }
      },
      type: "object"
    },
    PrizeI: {
      properties: {
        amount: { type: "number" },
        coinId: { type: "string" },
        endRank: { type: "number" },
        id: { type: "number" },
        startRank: { type: "number" }
      },
      type: "object"
    }
  }
};

const LEADERBOARD_PROGRESS_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          leaderboardRecordId: { type: "number" },
          externalId: { type: "number" },
          playerId: { type: ["number", "null"] },
          playerUsername: { type: ["string", "null"] },
          amount: { type: "number" },
          placement: { type: "number" },
          coinId: { type: ["string", "null"] },
          prizeAmount: { type: ["number", "null"] }
        }
      }
    },
    currentUser: { type: ["object", "null"] },
    pageNumber: { type: "number" },
    pageSize: { type: "number" },
    totalCount: { type: "number" },
    totalPages: { type: "number" }
  }
};

const LEADERBOARD_TIMELINE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    data: {
      type: "array",
      items: {
        type: "object",
        properties: {
          date: { type: "string" },
          isActive: { type: "boolean" },
          isCompleted: { type: "boolean" }
        }
      }
    },
    success: { type: "boolean" },
    message: { type: ["string", "null"] }
  }
};


export const fetchCurrentLeaderboard = async (fetchEndpoint, promotionId, externalId) => {
  try {
    console.log('Fetching specific leaderboard:', { promotionId, externalId });
    
    const endpointInfo = {
      endpoint: "http://192.168.88.201:5004/LeaderboardProgress/GetLeaderboardProgressForUser",
      requestMethod: "GET",
      endpointType: "RT",
      schemaType: {},
      schema: JSON.stringify(LEADERBOARD_PROGRESS_SCHEMA)
    };

    // Log the query parameters before making the request
    // console.log('Query parameters:', {
    //   ExternalId: externalId
    // });

    const response = await fetchEndpoint(endpointInfo, {
      query: {
        ExternalId: externalId
      }
    });

    console.log('API Response:', response);

    if (!response) {
      throw new Error('Failed to fetch leaderboard progress');
    }

    const progressData = response;
    console.log('Progress Data:', progressData);
    // Transform the data to match our component's expectations
    const leaderboardData = {
      name: `Leaderboard ${externalId}`,
      value: {
        id: Number(externalId),
        externalId: externalId
      },
      players: progressData.data.items.map(item => ({
        rank: item.placement,
        name: item.playerUsername || '-',
        points: item.amount,
        prizeAmount: item.prizeAmount,
        coinId: item.coinId
      })),
      currentUser: progressData.currentUser,
      totalPlayers: progressData.totalCount
    };
    console.log('Nuts:', progressData);
    console.log('Processed leaderboard data:', leaderboardData);
    return leaderboardData;
  } catch (error) {
    console.error('Error in fetchLeaderboard:', error);
    throw error;
  }
};

export const fetchLeaderboard = async (fetchEndpoint, promotionId, externalId) => {
  try {
    console.log('Fetching specific leaderboard:', { promotionId, externalId });
    
    const endpointInfo = {
      endpoint: "http://192.168.88.201:5004/LeaderboardResult/GetLeaderboardResults",
      requestMethod: "GET",
      endpointType: "RT",
      schemaType: {},
      schema: JSON.stringify(LEADERBOARD_PROGRESS_SCHEMA)
    };

    // Log the query parameters before making the request
    // console.log('Query parameters:', {
    //   LeaderboardRecordId: 0
    // });

    const response = await fetchEndpoint(endpointInfo, {
      query: {
        LeaderboardRecordId: 0
      }
    });

    console.log('API Response:', response);

    if (!response) {
      // throw new Error('Failed to fetch leaderboard progress');
    }

    const progressData = response;
    console.log('Progress Data:', progressData);
    // Transform the data to match our component's expectations
    const leaderboardData = {
      name: `Leaderboard ${externalId}`,
      value: {
        id: Number(externalId),
        externalId: externalId
      },
      players: progressData.data.items.map(item => ({
        rank: item.placement,
        name: item.playerUsername || '-',
        points: item.amount,
        prizeAmount: item.prizeAmount,
        coinId: item.coinId
      })),
      currentUser: progressData.currentUser,
      totalPlayers: progressData.totalCount
    };
    console.log('Nuts:', progressData);
    console.log('Processed leaderboard data:', leaderboardData);
    return leaderboardData;
  }
   catch (error) {
    console.error('Error in fetchLeaderboard:', error);
    // throw error;
  }
};

export const fetchLeaderboardTimeline = async (fetchEndpoint, externalId) => {
  try {
    console.log('Fetching leaderboard timeline:', { externalId });
    
    const endpointInfo = {
      endpoint: "http://192.168.88.201:5004/Leaderboard/GetTimeline",
      requestMethod: "GET",
      endpointType: "RT",
      schemaType: {},
      schema: JSON.stringify(LEADERBOARD_TIMELINE_SCHEMA)
    };

    const response = await fetchEndpoint(endpointInfo, {
      query: { ExternalId: externalId }
    });

    if (!response) {
      throw new Error(response.message || 'Failed to fetch leaderboard timeline');
    }

    return response.sort((a, b) => new Date(a.date) - new Date(b.date));

  } catch (error) {
    console.error('Error in fetchLeaderboardTimeline:', error);
    throw error;
  }
};