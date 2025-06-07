// WebSocket configuration
const getWebSocketUrl = () => {
  // In development, use the same port as the server
  if (import.meta.env.DEV) {
    return 'ws://localhost:5001/ws';
  }
  
  // In production, use the same host as the current page
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

export const WEBSOCKET_URL = getWebSocketUrl();

// Default WebSocket configuration
export const WEBSOCKET_CONFIG = {
  url: WEBSOCKET_URL,
  reconnectAttempts: 5,
  reconnectInterval: 3000,
  autoConnect: true
};
