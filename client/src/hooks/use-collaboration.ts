import { useState, useEffect, useRef, useCallback } from "react";

interface Participant {
  id: string;
  name: string;
  color: string;
  cursor?: { line: number; column: number; section?: string };
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  content: string;
  messageType: string;
  createdAt: string;
}

interface EditEvent {
  userId: string;
  userName: string;
  fieldPath: string;
  newValue: string;
  editType: string;
  timestamp: string;
}

interface UseCollaborationOptions {
  sessionId: string;
  userId: string;
  userName: string;
  onEdit?: (edit: EditEvent) => void;
  onParticipantJoin?: (participant: Participant) => void;
  onParticipantLeave?: (participant: { id: string; name: string }) => void;
  onCursorUpdate?: (update: Participant) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onSync?: (data: any) => void;
}

export function useCollaboration(options: UseCollaborationOptions) {
  const { sessionId, userId, userName, onEdit, onParticipantJoin, onParticipantLeave, onCursorUpdate, onChatMessage, onSync } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [myColor, setMyColor] = useState<string>("#016371");
  const [role, setRole] = useState<string>("viewer");
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/collaboration`;
    
    try {
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        wsRef.current?.send(JSON.stringify({
          type: "join_session",
          payload: { sessionId, userId, userName },
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleMessage(message);
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };
      
      wsRef.current.onclose = () => {
        setIsConnected(false);
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else {
          setError("Connection lost. Please refresh the page.");
        }
      };
      
      wsRef.current.onerror = () => {
        setError("Connection error");
      };
    } catch (e) {
      setError("Failed to connect");
    }
  }, [sessionId, userId, userName]);

  const handleMessage = useCallback((message: { type: string; payload: any }) => {
    switch (message.type) {
      case "joined":
        setParticipants(message.payload.participants);
        setMyColor(message.payload.yourColor);
        setRole(message.payload.role);
        break;
        
      case "participant_joined":
        setParticipants(prev => [...prev, message.payload]);
        onParticipantJoin?.(message.payload);
        break;
        
      case "participant_left":
        setParticipants(prev => prev.filter(p => p.id !== message.payload.id));
        onParticipantLeave?.(message.payload);
        break;
        
      case "cursor_update":
        setParticipants(prev => prev.map(p => 
          p.id === message.payload.userId 
            ? { ...p, cursor: message.payload.cursor }
            : p
        ));
        onCursorUpdate?.(message.payload);
        break;
        
      case "edit_applied":
        onEdit?.(message.payload);
        break;
        
      case "chat_message":
        const newMessage = message.payload;
        setMessages(prev => [...prev, newMessage]);
        onChatMessage?.(newMessage);
        break;
        
      case "chat_history":
        setMessages(message.payload.messages);
        break;
        
      case "sync_data":
        onSync?.(message.payload);
        break;
        
      case "error":
        setError(message.payload.message);
        break;
    }
  }, [onEdit, onParticipantJoin, onParticipantLeave, onCursorUpdate, onChatMessage, onSync]);

  const sendCursorMove = useCallback((position: { line: number; column: number; section?: string }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "cursor_move",
        payload: position,
      }));
    }
  }, []);

  const sendEdit = useCallback((edit: { fieldPath: string; previousValue: string; newValue: string; editType?: string }) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "edit",
        payload: { ...edit, editType: edit.editType || "update" },
      }));
    }
  }, []);

  const sendChat = useCallback((content: string, messageType = "chat") => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "chat",
        payload: { content, messageType },
      }));
    }
  }, []);

  const requestSync = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "request_sync",
        payload: { sessionId },
      }));
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "leave_session", payload: {} }));
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setParticipants([]);
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    participants,
    messages,
    myColor,
    role,
    error,
    sendCursorMove,
    sendEdit,
    sendChat,
    requestSync,
    disconnect,
    reconnect: connect,
  };
}
