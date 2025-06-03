const WITHDRAW_OPTIONS_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  definitions: {
    ApiErrorI: {
      properties: {
        code: { type: "number" },
        message: { type: "string" }
      },
      type: "object"
    },
    GameI: {
      properties: {
        name: { type: "string" },
        url: { type: "string" }
      },
      type: "object"
    },
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
    },
    PromotionCoinI: {
      properties: {
        coinType: { type: "number" },
        description: { type: "string" },
        id: { type: "string" },
        imageUrl: { type: "string" },
        isDeleted: { type: "boolean" },
        name: { type: "string" }
      },
      type: "object"
    },
    PromotionDataI: {
      properties: {
        createDate: { type: "string" },
        description: { type: "string" },
        endDate: { type: "string" },
        games: {
          items: { $ref: "#/definitions/GameI" },
          type: "array"
        },
        id: { type: "number" },
        leaderboards: {
          items: { $ref: "#/definitions/LeaderboardI" },
          type: "array"
        },
        promotionCoins: {
          items: { $ref: "#/definitions/PromotionCoinI" },
          type: "array"
        },
        segments: {
          items: { type: "string" },
          type: "array"
        },
        startDate: { type: "string" },
        status: { type: "number" },
        title: { type: "string" }
      },
      type: "object"
    }
  },
  properties: {
    data: { $ref: "#/definitions/PromotionDataI" },
    errors: {
      items: { $ref: "#/definitions/ApiErrorI" },
      type: "array"
    },
    success: { type: "boolean" }
  },
  type: "object"
};

export const fetchWithdrawOptions = async (fetchEndpoint, promotionId, token) => {
  try {
    console.log('Fetching withdraw options for promotion:', promotionId);
    
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const promotion = {
      endpoint: "http://192.168.88.201:5002/Hub/GetWithdrawOptionsAndGroups",
      requestMethod: "GET",
      schemaType: {},
      endpointType: "RT",
      schema: JSON.stringify(WITHDRAW_OPTIONS_SCHEMA),
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await fetchEndpoint(promotion, {
      query: { promotionId }
    });

    if (!response.succeeded) {
      throw new Error(response.errors?.[0]?.message || 'Failed to fetch withdraw options');
    }

    return response.data;
  } catch (error) {
    console.error('Error in fetchWithdrawOptions:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
}; 

export const fetchFreespinValue = async (fetchEndpoint, promotionId) => {
  const promotion = {
    endpoint: "http://192.168.88.201:5003/api/Builder/GetPromotionCoins",
    requestMethod: "GET",
    schemaType: {},
    endpointType: "DT",
  };

  const response = await fetchEndpoint(promotion, {
    query: { promotionId: promotionId }
  });

  return response.find(coin => coin.coinType === 2)?.value || 0;
};

export const withdrawBalance = async (fetchEndpoint, promotionId, withdrawOptionId, token) => {
  const promotion = {
    endpoint: "http://192.168.88.201:5002/Hub/WithdrawBalance",
    requestMethod: "POST",
    schemaType: {},
    endpointType: "RT",
    headers: {
      'accept': 'text/plain',
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const response = await fetchEndpoint(promotion, {
    body: {
      promotionId: Number(promotionId),
      withdrawOptionId: Number(withdrawOptionId)
    }
  });

  return response;
};
  