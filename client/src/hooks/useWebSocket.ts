import { useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketService, getWebSocketService } from '../services/websocket';
import { WEBSOCKET_URL } from '../config/websocket';

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

export function useWebSocket({
  url = WEBSOCKET_URL,
  autoConnect = true,
  onMessage,
  onOpen,
  onClose,
  onError
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsService = useRef<WebSocketService | null>(null);

  // Initialize the WebSocket service
  useEffect(() => {
    wsService.current = getWebSocketService(url, {
      onOpen: () => {
        setIsConnected(true);
        if (onOpen) onOpen();
      },
      onClose: () => {
        setIsConnected(false);
        if (onClose) onClose();
      },
      onError,
      onMessage: (message) => {
        setLastMessage(message);
        if (onMessage) onMessage(message);
      }
    });

    if (autoConnect) {
      wsService.current.connect();
    }

    return () => {
      if (wsService.current) {
        wsService.current.disconnect();
      }
    };
  }, [url]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsService.current) {
      wsService.current.connect();
    }
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (wsService.current) {
      wsService.current.disconnect();
    }
  }, []);

  // Send a message through WebSocket
  const sendMessage = useCallback((type: string, payload: any): boolean => {
    if (wsService.current) {
      return wsService.current.send(type, payload);
    }
    return false;
  }, []);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    sendMessage
  };
}

export default useWebSocket;
