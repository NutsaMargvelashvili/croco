import socketService, { SOCKET_EVENTS } from './socketService';

const BALANCE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    balances: {
      type: "array",
      items: {
        type: "object",
        properties: {
          amount: { type: "number" },
          coinId: { type: "string" },
          coinType: { type: "number" }
        },
        required: ["amount", "coinId", "coinType"]
      }
    },
    playerId: { type: "number" },
    playerName: { type: "string" }
  },
  required: ["balances", "playerId", "playerName"]
};

export const fetchPlayerBalances = async (fetchEndpoint, promotionId, token) => {
  try {
    console.log('Fetching player balances for promotion:', promotionId);
    
    if (!token) {
      throw new Error('Authentication token is required');
    }

    const promotion = {
      endpoint: "http://192.168.88.201:5002/Hub/PlayerBalances",
      requestMethod: "GET",
      schemaType: {},
      endpointType: "RT",
      schema: JSON.stringify(BALANCE_SCHEMA),
      headers: {
        'accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await fetchEndpoint(promotion, {
      query: { promotionId }
    });

    if (!response) {
      throw new Error('Failed to fetch player balances');
    }

    // Transform the balances data to match our component's expectations
    const balanceData = {
      balances: response.balances.map(balance => ({
        amount: balance.amount,
        coinId: balance.coinId,
        coinType: balance.coinType,
        coin: balance.coin
      })),
      playerId: response.playerId,
      playerName: response.playerName
    };

    return balanceData;
  } catch (error) {
    console.error('Error in fetchPlayerBalances:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

class BalanceService {
  constructor() {
    this.balanceSubscribers = new Set();
    this.currentBalance = {
      coinIn: { amount: 0, name: '' },
      freespins: { amount: 0, name: '' },
      promoCoin: { amount: 0, name: '' },
      assetCoin: { amount: 0, name: '' }
    };
  }

  // Initialize socket connection
  async initialize(token, promotionId) {
    try {
      // Connect to socket if not already connected
      if (!socketService.isConnected()) {
        await socketService.connect(token, 'Balance', promotionId);
      }

      // Subscribe to balance updates
      socketService.subscribe(SOCKET_EVENTS.BALANCE_UPDATE, this.handleBalanceUpdate);
    } catch (err) {
      console.error('Failed to initialize balance service:', err);
      throw err;
    }
  }

  // Handle balance updates from socket
  handleBalanceUpdate = ({ message, data }) => {
    try {
      console.log('Handling balance update:', { message, data });
      
      if (!data) {
        console.warn('No data in balance update');
        return;
      }

      let updatedBalance;
      if (message === 'GameBalanceUpdate') {
        // Handle game-specific balance update format
        updatedBalance = { ...this.currentBalance };
        Object.entries(data).forEach(([key, value]) => {
          if (updatedBalance[key]) {
            updatedBalance[key].amount = value;
          }
        });
      } else {
        // Handle general balance update format
        updatedBalance = this.transformBalanceData(data);
      }

      console.log('Updated balance:', updatedBalance);
      this.currentBalance = updatedBalance;
      this.notifySubscribers(this.currentBalance);
    } catch (err) {
      console.error('Error handling balance update:', err);
    }
  };

  // Subscribe to balance updates
  subscribe(callback) {
    this.balanceSubscribers.add(callback);
    // Immediately send current balance to new subscriber
    callback(this.currentBalance);
    return () => this.unsubscribe(callback);
  }

  // Unsubscribe from balance updates
  unsubscribe(callback) {
    this.balanceSubscribers.delete(callback);
  }

  // Notify all subscribers of balance changes
  notifySubscribers(balance) {
    this.balanceSubscribers.forEach(callback => {
      try {
        callback(balance);
      } catch (err) {
        console.error('Error in balance subscriber callback:', err);
      }
    });
  }

  // Get current balance
  getCurrentBalance() {
    return { ...this.currentBalance };
  }

  // Clean up service
  cleanup() {
    this.balanceSubscribers.clear();
    socketService.unsubscribe(SOCKET_EVENTS.BALANCE_UPDATE, this.handleBalanceUpdate);
  }

  // Transform balance data from API format to our format
  transformBalanceData(balanceData) {
    const transformedBalance = {
      coinIn: { ...this.currentBalance.coinIn },
      freespins: { ...this.currentBalance.freespins },
      promoCoin: { ...this.currentBalance.promoCoin },
      assetCoin: { ...this.currentBalance.assetCoin }
    };

    if (balanceData && balanceData.balances) {
      balanceData.balances.forEach(balance => {
        switch (balance.coinType) {
          case 1: // Coin-in
            transformedBalance.coinIn.amount = balance.amount;
            transformedBalance.coinIn.name = balance.coin;
            break;
          case 2: // Freespins
            transformedBalance.freespins.amount = balance.amount;
            transformedBalance.freespins.name = balance.coin;
            break;
          case 3: // Promo coin
            transformedBalance.promoCoin.amount = balance.amount;
            transformedBalance.promoCoin.name = balance.coin;
            break;
          case 4: // Asset coin
            transformedBalance.assetCoin.amount = balance.amount;
            transformedBalance.assetCoin.name = balance.coin;
            break;
          default:
            break;
        }
      });
    }

    return transformedBalance;
  }
}

// Create singleton instance
const balanceService = new BalanceService();
export default balanceService;
