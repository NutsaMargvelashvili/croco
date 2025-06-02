import * as signalR from "@microsoft/signalr";

// Socket events enum
export const SOCKET_EVENTS = {
  BALANCE_UPDATE: "BALANCE_UPDATE",
  LEADERBOARD_UPDATE: "LEADERBOARD_UPDATE",
  CONNECTION_CLOSED: "CONNECTION_CLOSED",
  ERROR: "ERROR"
};

class SocketService {
  constructor() {
    this.subscribers = new Map();
    this.connected = false;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  async connect(jwtToken, url, promotionId) {
    if (this.connected) return;

    try {
      // Use the provided hub URL from your environment with query parameters
      const hubUrl = `http://192.168.88.201:5002/messagingHub?url=${encodeURIComponent(url)}&promotionId=${encodeURIComponent(promotionId)}`;
      console.log("Connecting to hub:", hubUrl);

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => jwtToken,
          withCredentials: false,
          skipNegotiation: true, // Skip negotiation since the server doesn't support it
          transport: signalR.HttpTransportType.WebSockets
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
        .configureLogging(signalR.LogLevel.Debug)
        .build();

      // Handle balance updates through ReceiveMessage
      this.connection.on("ReceiveMessage", (sender, message, data) => {
        console.log("Received message:", { sender, message, data });
        
        // Check if this is a balance update message
        if (message === "BalanceChanged" || message === "GameBalanceUpdate") {
          console.log("Processing balance update:", data);
          this.emit(SOCKET_EVENTS.BALANCE_UPDATE, { sender, message, data });
        }
      });

      // Handle leaderboard updates
      this.connection.on("LeaderboardUpdate", (data) => {
        console.log("Received leaderboard update:", data);
        this.emit(SOCKET_EVENTS.LEADERBOARD_UPDATE, data);
      });

      // Handle server-requested disconnection
      this.connection.on("CloseConnection", () => {
        console.log("Server requested to close connection");
        this.disconnect();
      });

      // Handle connection closure
      this.connection.onclose((error) => {
        console.warn("SignalR connection closed:", error);
        this.connected = false;
        this.emit(SOCKET_EVENTS.CONNECTION_CLOSED, error);
      });

      // Handle reconnection
      this.connection.onreconnecting((error) => {
        console.log("Attempting to reconnect...", error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error("Max reconnection attempts reached");
          this.disconnect();
        }
      });

      this.connection.onreconnected((connectionId) => {
        console.log("Reconnected successfully", connectionId);
        this.reconnectAttempts = 0;
        this.connected = true;

        // Request immediate balance update after reconnection
        this.requestBalanceUpdate();
      });

      console.log("Starting SignalR connection...", {
        url: hubUrl,
        transport: "WebSockets",
        skipNegotiation: true
      });

      await this.connection.start();
      this.connected = true;
      console.log("SignalR connected successfully");

      // Join player's group if available
      const playerId = this.extractPlayerId(jwtToken);
      if (playerId) {
        await this.connection.invoke("JoinGroup", playerId);
        console.log(`Joined group for player ${playerId}`);
        
        // Request initial balance update
        this.requestBalanceUpdate();
      }
    } catch (err) {
      console.error("SignalR connection error:", err);
      this.emit(SOCKET_EVENTS.ERROR, err);
      throw err;
    }
  }

  // Request an immediate balance update from the server
  async requestBalanceUpdate() {
    try {
      if (this.connected && this.connection) {
        await this.connection.invoke("RequestBalanceUpdate");
      }
    } catch (err) {
      console.error("Error requesting balance update:", err);
    }
  }

  disconnect() {
    if (!this.connection) return;
    
    try {
      this.connection.stop();
      this.connected = false;
      this.subscribers.clear();
      console.log("Disconnected from SignalR hub");
    } catch (err) {
      console.error("Error during disconnection:", err);
    }
  }

  subscribe(event, callback) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event).add(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event, callback) {
    if (!this.subscribers.has(event)) return;
    this.subscribers.get(event).delete(callback);
  }

  emit(event, data) {
    if (!this.subscribers.has(event)) return;
    this.subscribers.get(event).forEach((callback) => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in ${event} event handler:`, err);
      }
    });
  }

  // Helper method to extract playerId from JWT
  extractPlayerId(jwtToken) {
    try {
      const payload = JSON.parse(atob(jwtToken.split('.')[1]));
      return payload.PlayerId;
    } catch (err) {
      console.error("Invalid JWT token:", err);
      return null;
    }
  }

  // Check connection status
  isConnected() {
    return this.connected && this.connection?.state === signalR.HubConnectionState.Connected;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService; 