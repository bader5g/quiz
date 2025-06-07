import React, { useEffect, useRef, useState } from "react";import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";import { Badge } from "../../../components/ui/badge";import { Button } from "../../../components/ui/button";import { Wifi, WifiOff, Users, Activity } from "lucide-react";interface WebSocketMessage {  type: string;  data: any;  timestamp: Date;  userId?: string;  userName?: string;}interface UserActivity {  id: string;  userId: string;  userName: string;  userRole: string;  action: "create" | "edit" | "delete" | "view" | "export";  entityType: "question" | "category" | "setting";  entityId?: string;  details: string;  timestamp: Date;  ipAddress?: string;  userAgent?: string;  metadata?: Record<string, any>;}interface WebSocketActivityHandlerProps {  onActivityReceived?: (activity: UserActivity) => void;  onConnectionChange?: (connected: boolean) => void;  wsUrl?: string;}export default function WebSocketActivityHandler({  onActivityReceived,  onConnectionChange,  wsUrl = "ws://localhost:5000/ws"}: WebSocketActivityHandlerProps) {  const [isConnected, setIsConnected] = useState(false);  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);  const [messageCount, setMessageCount] = useState(0);  const ws = useRef<WebSocket | null>(null);  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);  const reconnectAttempts = useRef(0);  const maxReconnectAttempts = 5;  const connect = () => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus("connecting");
    
    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttempts.current = 0;
        onConnectionChange?.(true);
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          setMessageCount(prev => prev + 1);

          // Handle activity messages
          if (message.type === "activity" && message.data && onActivityReceived) {
            const activity: UserActivity = {
              ...message.data,
              timestamp: new Date(message.timestamp)
            };
            onActivityReceived(activity);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.current.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onConnectionChange?.(false);

        // Attempt to reconnect unless it was a manual close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setConnectionStatus("disconnected");
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, "Manual disconnect");
      ws.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus("disconnected");
    onConnectionChange?.(false);
  };

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [wsUrl]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected": return "text-green-600";
      case "connecting": return "text-yellow-600";
      default: return "text-red-600";
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case "connected": return "متصل";
      case "connecting": return "جاري الاتصال...";
      default: return "غير متصل";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">حالة الاتصال المباشر</CardTitle>
            <CardDescription className="text-xs">
              تزامن النشاطات في الوقت الفعلي
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant={isConnected ? "default" : "destructive"}
              className="text-xs"
            >
              {isConnected ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {getStatusText()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">الرسائل: {messageCount}</span>
            </div>
            {lastMessage && (
              <div className="text-xs text-gray-500">
                آخر رسالة: {new Date(lastMessage.timestamp).toLocaleTimeString('ar-SA')}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            {isConnected ? (
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                className="text-xs"
              >
                قطع الاتصال
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={connect}
                className="text-xs"
              >
                إعادة الاتصال
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
