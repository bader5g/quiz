import { toast } from "sonner";
import { WEBSOCKET_URL } from "../config/websocket";

interface WebSocketMessage {
  type: string;
  payload: any;
}

interface WebSocketOptions {
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export class WebSocketService {
  private socket: WebSocket | null = null;
  private url: string;
  private options: WebSocketOptions;
  private reconnectAttempt: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(url: string, options: WebSocketOptions = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: 5,
      reconnectInterval: 3000,
      ...options
    };
  }
  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket already connected or connecting');
      return;
    }

    console.log('Attempting to connect to WebSocket:', this.url);
    
    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log('WebSocket connected successfully to:', this.url);
        this.reconnectAttempt = 0;
        if (this.options.onOpen) this.options.onOpen();
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        if (this.options.onClose) this.options.onClose();
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        console.error('WebSocket URL was:', this.url);
        if (this.options.onError) this.options.onError(error);
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          if (this.options.onMessage) this.options.onMessage(message);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempt < (this.options.reconnectAttempts || 5)) {
      this.reconnectAttempt++;
      this.reconnectTimer = setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempt}/${this.options.reconnectAttempts})...`);
        this.connect();
      }, this.options.reconnectInterval);
    } else {
      toast.error("فشل في الاتصال بخدمة البيانات المباشرة. يرجى إعادة تحميل الصفحة.");
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  public send(type: string, payload: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = { type, payload };
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
}

// Singleton instance for app-wide WebSocket service
let webSocketInstance: WebSocketService | null = null;

export const getWebSocketService = (url: string = WEBSOCKET_URL, options: WebSocketOptions = {}): WebSocketService => {
  if (!webSocketInstance || webSocketInstance['url'] !== url) {
    webSocketInstance = new WebSocketService(url, options);
  }
  return webSocketInstance;
};
