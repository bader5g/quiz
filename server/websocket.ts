import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  action: string;
  details: string;
  timestamp: Date;
  questionId?: string;
  questionTitle?: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      log(`WebSocket client connected from ${req.socket.remoteAddress} to path: ${req.url}`);
      this.clients.add(ws);

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connection',
        message: 'WebSocket connected successfully',
        timestamp: new Date().toISOString()
      }));

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (error) {
          log(`WebSocket message parse error: ${error}`);
        }
      });

      // Handle client disconnect
      ws.on('close', (code, reason) => {
        log(`WebSocket client disconnected - Code: ${code}, Reason: ${reason}`);
        this.clients.delete(ws);
      });      // Handle errors
      ws.on('error', (error) => {
        log(`WebSocket error: ${error.message}`);
        this.clients.delete(ws);
      });

      // Send periodic ping to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    log('WebSocket server initialized on path /ws');
  }

  private handleClientMessage(ws: WebSocket, message: any) {
    log(`WebSocket received message: ${JSON.stringify(message)}`);
    
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({
          type: 'pong',
          timestamp: new Date().toISOString()
        }));
        break;
      
      case 'subscribe':
        // Handle subscription to specific channels
        log(`Client subscribed to: ${message.channel}`);
        break;
      
      default:
        log(`Unknown WebSocket message type: ${message.type}`);
    }
  }

  // Broadcast user activity to all connected clients
  broadcastActivity(activity: UserActivity) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'activity',
      data: activity,
      timestamp: new Date().toISOString()
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          log(`Error sending WebSocket message: ${error}`);
          this.clients.delete(client);
        }
      }
    });

    log(`Broadcasted activity to ${this.clients.size} clients: ${activity.action}`);
  }

  // Broadcast question updates
  broadcastQuestionUpdate(questionId: string, action: string, details: any) {
    if (!this.wss) return;

    const message = JSON.stringify({
      type: 'question_update',
      data: {
        questionId,
        action,
        details,
        timestamp: new Date().toISOString()
      }
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          log(`Error sending WebSocket message: ${error}`);
          this.clients.delete(client);
        }
      }
    });

    log(`Broadcasted question update to ${this.clients.size} clients: ${action} for question ${questionId}`);
  }

  // Send system notification to all clients
  broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    if (!this.wss) return;

    const notification = JSON.stringify({
      type: 'system_notification',
      data: {
        message,
        notificationType: type,
        timestamp: new Date().toISOString()
      }
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(notification);
        } catch (error) {
          log(`Error sending WebSocket notification: ${error}`);
          this.clients.delete(client);
        }
      }
    });

    log(`Broadcasted system notification to ${this.clients.size} clients: ${message}`);
  }

  // Get connection status
  getStatus() {
    return {
      isRunning: this.wss !== null,
      connectedClients: this.clients.size,
      serverPath: '/ws'
    };
  }

  // Generate mock activities for testing
  generateMockActivity(): UserActivity {
    const actions = [
      'أنشأ سؤال جديد',
      'حدث سؤال موجود',
      'حذف سؤال',
      'أضاف فئة جديدة',
      'أجاب على سؤال',
      'بدأ جلسة لعب',
      'انتهى من جلسة لعب'
    ];

    const userNames = [
      'أحمد محمد',
      'فاطمة علي',
      'خالد أحمد',
      'مريم حسن',
      'عمر يوسف',
      'نور الدين'
    ];

    const questionTitles = [
      'ما هي عاصمة مصر؟',
      'من هو مؤلف رواية الأسود يليق بك؟',
      'كم عدد أيام السنة الميلادية؟',
      'ما هي أكبر قارة في العالم؟',
      'من اخترع الهاتف؟'
    ];

    return {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
      userName: userNames[Math.floor(Math.random() * userNames.length)],
      userAvatar: undefined,
      action: actions[Math.floor(Math.random() * actions.length)],
      details: 'تم تنفيذ العملية بنجاح',
      timestamp: new Date(),
      questionId: `q_${Math.floor(Math.random() * 100)}`,
      questionTitle: questionTitles[Math.floor(Math.random() * questionTitles.length)]
    };
  }

  // Start mock activity generator for testing
  startMockActivityGenerator(intervalMs: number = 5000) {
    setInterval(() => {
      const mockActivity = this.generateMockActivity();
      this.broadcastActivity(mockActivity);
    }, intervalMs);

    log(`Started mock activity generator with ${intervalMs}ms interval`);
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager();
