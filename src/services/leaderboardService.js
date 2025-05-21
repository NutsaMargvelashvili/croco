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

export const fetchLeaderboards = async (fetchEndpoint, promotionId) => {
  try {
    console.log('Fetching leaderboards for promotion:', promotionId);
    
    const promotion = {
      endpoint: "https://st-admapi.onaim.io/api/Builder/GetPromotionForBuilder",
      requestMethod: "GET",
      schemaType: {},
      endpointType: "DT",
      schema: JSON.stringify(LEADERBOARD_SCHEMA)
    };

    console.log('Making API request with:', {
      endpoint: promotion.endpoint,
      promotionId
    });

    const response = await fetchEndpoint(promotion, {
      query: { id: promotionId }
    });

    console.log('API response:', response);

    if (response.data?.leaderboards) {
      const leaderboards = response.data.leaderboards.map(leaderboard => ({
        name: leaderboard.title,
        value: leaderboard,
        prizes: leaderboard.prizes,
        startDate: new Date(leaderboard.startDate),
        endDate: new Date(leaderboard.endDate),
        description: leaderboard.description,
        externalId: leaderboard.externalId
      }));
      console.log('Processed leaderboards:', leaderboards);
      return leaderboards;
    }

    console.log('No leaderboards found in response');
    return [];
  } catch (error) {
    console.error('Error in fetchLeaderboards:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

export const fetchLeaderboard = async (fetchEndpoint, promotionId, externalId) => {
  try {
    console.log('Fetching specific leaderboard:', { promotionId, externalId });
    
    const endpointInfo = {
      endpoint: "https://st-apigateway.onaim.io/leaderboardapi/LeaderboardProgress/GetLeaderboardProgressForUser",
      requestMethod: "GET",
      endpointType: "RT",
      schemaType: {},
      schema: JSON.stringify(LEADERBOARD_PROGRESS_SCHEMA)
    };

    // Log the query parameters before making the request
    console.log('Query parameters:', {
      ExternalId: externalId,
      promotionId: promotionId
    });

    const response = await fetchEndpoint(endpointInfo, {
      query: {
        ExternalId: externalId,
        promotionId: promotionId
      }
    });

    console.log('API Response:', response);

    if (!response.succeeded) {
      throw new Error(response.message || 'Failed to fetch leaderboard progress');
    }

    const progressData = response.data;
    
    // Transform the data to match our component's expectations
    const leaderboardData = {
      name: `Leaderboard ${externalId}`,
      value: {
        id: Number(externalId),
        externalId: externalId
      },
      players: progressData.items.map(item => ({
        rank: item.placement,
        name: item.playerUsername || '-',
        points: item.amount,
        prizeAmount: item.prizeAmount,
        coinId: item.coinId
      })),
      currentUser: progressData.currentUser,
      totalPlayers: progressData.totalCount
    };

    console.log('Processed leaderboard data:', leaderboardData);
    return leaderboardData;
  } catch (error) {
    console.error('Error in fetchLeaderboard:', error);
    throw error;
  }
};