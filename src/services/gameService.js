const PROMOTION_SCHEMA = {
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
    PromotionDataI: {
      properties: {
        games: {
          items: { $ref: "#/definitions/GameI" },
          type: "array"
        }
      },
      type: "object"
    }
  }
};

// export const fetchGames = async (fetchEndpoint, promotionId) => {
//   try {
//     console.log('Fetching games for promotion:', promotionId);
    
//     const promotion = {
//       endpoint: "http://192.168.88.201:5003/api/Builder/GetPromotionForBuilder",
//       requestMethod: "GET",
//       schemaType: {},
//       endpointType: "DT",
//       schema: JSON.stringify(PROMOTION_SCHEMA)
//     };

//     console.log('Making API request with:', {
//       endpoint: promotion.endpoint,
//       promotionId
//     });

//     const response = await fetchEndpoint(promotion, {
//       query: { id: promotionId }
//     });

//     console.log('API response:', response);

//     if (response.data?.games) {
//       const games = response.data.games.map(game => ({
//         name: game.name,
//         value: game
//       }));
//       console.log('Processed games:', games);
//       return games;
//     }

//     console.log('No games found in response');
//     return [];
//   } catch (error) {
//     console.error('Error in fetchGames:', error);
//     console.error('Error details:', {
//       message: error.message,
//       stack: error.stack
//     });
//     throw error;
//   }
// }; 