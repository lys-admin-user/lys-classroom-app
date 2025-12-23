import { WebSocketServer, WebSocket } from "ws";
import { Server, IncomingMessage } from "http";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { parse as parseCookie } from "cookie";

interface CollaborationClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  sessionId: string;
  cursorPosition?: { line: number; column: number; section?: string };
  color: string;
}

interface WSMessage {
  type: string;
  payload: any;
}

const clients: Map<string, CollaborationClient> = new Map();
const sessionClients: Map<string, Set<string>> = new Map();

const COLORS = [
  "#EE4E23", "#F8D842", "#016371", "#9333EA", "#059669",
  "#DC2626", "#2563EB", "#D97706", "#7C3AED", "#0891B2"
];

let colorIndex = 0;
function getNextColor(): string {
  const color = COLORS[colorIndex % COLORS.length];
  colorIndex++;
  return color;
}

interface AuthenticatedRequest extends IncomingMessage {
  sessionID?: string;
  session?: any;
}

const pendingAuths: Map<string, { userId: string; userName: string }> = new Map();

export function setAuthenticatedUser(clientId: string, userId: string, userName: string): void {
  pendingAuths.set(clientId, { userId, userName });
  setTimeout(() => pendingAuths.delete(clientId), 30000);
}

export function setupCollaborationWebSocket(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: "/ws/collaboration" 
  });

  wss.on("connection", (ws: WebSocket, request: AuthenticatedRequest) => {
    const clientId = randomUUID();

    ws.on("message", async (data: Buffer) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        
        switch (message.type) {
          case "join_session":
            await handleJoinSession(ws, clientId, message.payload);
            break;
          case "leave_session":
            await handleLeaveSession(clientId);
            break;
          case "cursor_move":
            handleCursorMove(clientId, message.payload);
            break;
          case "edit":
            await handleEdit(clientId, message.payload);
            break;
          case "chat":
            await handleChat(clientId, message.payload);
            break;
          case "request_sync":
            await handleRequestSync(ws, message.payload);
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        ws.send(JSON.stringify({ type: "error", payload: { message: "Invalid message format" } }));
      }
    });

    ws.on("close", async () => {
      await handleLeaveSession(clientId);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  return wss;
}

async function handleJoinSession(ws: WebSocket, clientId: string, payload: { sessionId: string; userId: string; userName: string }) {
  const { sessionId, userId, userName } = payload;
  
  const session = await storage.getCollaborationSession(sessionId);
  if (!session || session.status !== "active") {
    ws.send(JSON.stringify({ type: "error", payload: { message: "Session not found or inactive" } }));
    return;
  }

  const existingParticipant = await storage.getSessionParticipant(sessionId, userId);
  const isHost = session.hostUserId === userId;
  
  if (!existingParticipant && !isHost) {
    ws.send(JSON.stringify({ type: "error", payload: { message: "You must join this session through the API first" } }));
    return;
  }

  const activeParticipants = await storage.getActiveSessionParticipants(sessionId);
  if (session.maxParticipants && activeParticipants.length >= session.maxParticipants) {
    ws.send(JSON.stringify({ type: "error", payload: { message: "Session is full" } }));
    return;
  }

  let participant = await storage.getSessionParticipant(sessionId, userId);
  if (!participant) {
    participant = await storage.createSessionParticipant({
      sessionId,
      userId,
      role: session.hostUserId === userId ? "host" : "editor",
      status: "active",
    });
  } else {
    await storage.updateSessionParticipant(participant.id, { status: "active" });
  }

  const client: CollaborationClient = {
    ws,
    userId,
    userName,
    sessionId,
    color: getNextColor(),
  };

  clients.set(clientId, client);

  if (!sessionClients.has(sessionId)) {
    sessionClients.set(sessionId, new Set());
  }
  sessionClients.get(sessionId)!.add(clientId);

  const allParticipants = Array.from(sessionClients.get(sessionId) || [])
    .map(id => clients.get(id))
    .filter(Boolean)
    .map(c => ({
      id: c!.userId,
      name: c!.userName,
      color: c!.color,
      cursor: c!.cursorPosition,
    }));

  ws.send(JSON.stringify({
    type: "joined",
    payload: {
      sessionId,
      participants: allParticipants,
      yourColor: client.color,
      role: participant.role,
    },
  }));

  broadcastToSession(sessionId, {
    type: "participant_joined",
    payload: {
      id: userId,
      name: userName,
      color: client.color,
    },
  }, clientId);

  const recentMessages = await storage.getCollaborationMessages(sessionId, 50);
  ws.send(JSON.stringify({
    type: "chat_history",
    payload: { messages: recentMessages.reverse() },
  }));
}

async function handleLeaveSession(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  await storage.leaveSession(client.sessionId, client.userId);

  broadcastToSession(client.sessionId, {
    type: "participant_left",
    payload: { id: client.userId, name: client.userName },
  }, clientId);

  const sessionClientSet = sessionClients.get(client.sessionId);
  if (sessionClientSet) {
    sessionClientSet.delete(clientId);
    if (sessionClientSet.size === 0) {
      sessionClients.delete(client.sessionId);
    }
  }

  clients.delete(clientId);
}

function handleCursorMove(clientId: string, payload: { line: number; column: number; section?: string }) {
  const client = clients.get(clientId);
  if (!client) return;

  client.cursorPosition = payload;

  broadcastToSession(client.sessionId, {
    type: "cursor_update",
    payload: {
      userId: client.userId,
      userName: client.userName,
      color: client.color,
      cursor: payload,
    },
  }, clientId);
}

async function handleEdit(clientId: string, payload: { fieldPath: string; previousValue: string; newValue: string; editType: string }) {
  const client = clients.get(clientId);
  if (!client) return;

  await storage.createSessionEdit({
    sessionId: client.sessionId,
    userId: client.userId,
    editType: payload.editType || "update",
    fieldPath: payload.fieldPath,
    previousValue: payload.previousValue,
    newValue: payload.newValue,
  });

  broadcastToSession(client.sessionId, {
    type: "edit_applied",
    payload: {
      userId: client.userId,
      userName: client.userName,
      fieldPath: payload.fieldPath,
      newValue: payload.newValue,
      editType: payload.editType,
      timestamp: new Date().toISOString(),
    },
  }, clientId);
}

async function handleChat(clientId: string, payload: { content: string; messageType?: string }) {
  const client = clients.get(clientId);
  if (!client) return;

  const message = await storage.createCollaborationMessage({
    sessionId: client.sessionId,
    userId: client.userId,
    messageType: payload.messageType || "chat",
    content: payload.content,
  });

  broadcastToSession(client.sessionId, {
    type: "chat_message",
    payload: {
      id: message.id,
      userId: client.userId,
      userName: client.userName,
      content: payload.content,
      messageType: payload.messageType || "chat",
      createdAt: message.createdAt,
    },
  });
}

async function handleRequestSync(ws: WebSocket, payload: { sessionId: string }) {
  const session = await storage.getCollaborationSession(payload.sessionId);
  if (!session) {
    ws.send(JSON.stringify({ type: "error", payload: { message: "Session not found" } }));
    return;
  }

  let lessonData = null;
  if (session.lessonId) {
    lessonData = await storage.getLesson(session.lessonId);
  }

  const editHistory = await storage.getSessionEditHistory(payload.sessionId, 100);

  ws.send(JSON.stringify({
    type: "sync_data",
    payload: {
      session,
      lessonData,
      editHistory,
    },
  }));
}

function broadcastToSession(sessionId: string, message: WSMessage, excludeClientId?: string) {
  const sessionClientSet = sessionClients.get(sessionId);
  if (!sessionClientSet) return;

  const messageStr = JSON.stringify(message);
  
  sessionClientSet.forEach(clientId => {
    if (excludeClientId && clientId === excludeClientId) return;
    
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}

export function getSessionParticipantCount(sessionId: string): number {
  return sessionClients.get(sessionId)?.size || 0;
}

export function broadcastToAllSessions(message: WSMessage) {
  const messageStr = JSON.stringify(message);
  
  clients.forEach(client => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(messageStr);
    }
  });
}
