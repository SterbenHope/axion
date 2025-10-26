import { useState, useEffect, useRef } from 'react';
import socketManager from '../../lib/websocket/socketManager';
import { WS_EVENTS } from '../../lib/constants';

export const useWebSocket = (url, token, autoConnect = true) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const listenersRef = useRef(new Map());

  useEffect(() => {
    if (!autoConnect || !url || !token) return;

    const handleConnected = () => {
      setIsConnected(true);
      setError(null);
    };

    const handleDisconnected = () => {
      setIsConnected(false);
    };

    const handleError = (error) => {
      setError(error);
      setIsConnected(false);
    };

    socketManager.on(WS_EVENTS.CONNECTED, handleConnected);
    socketManager.on(WS_EVENTS.DISCONNECTED, handleDisconnected);
    socketManager.on(WS_EVENTS.ERROR, handleError);

    socketManager.connect(url, token);

    return () => {
      socketManager.off(WS_EVENTS.CONNECTED, handleConnected);
      socketManager.off(WS_EVENTS.DISCONNECTED, handleDisconnected);
      socketManager.off(WS_EVENTS.ERROR, handleError);
      
      // Clean up event listeners
      listenersRef.current.forEach((callback, event) => {
        socketManager.off(event, callback);
      });
      listenersRef.current.clear();
    };
  }, [url, token, autoConnect]);

  const send = (type, payload) => {
    if (isConnected) {
      socketManager.send(type, payload);
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  const subscribe = (event, callback) => {
    socketManager.on(event, callback);
    listenersRef.current.set(event, callback);

    // Return unsubscribe function
    return () => {
      socketManager.off(event, callback);
      listenersRef.current.delete(event);
    };
  };

  const connect = () => {
    if (url && token) {
      socketManager.connect(url, token);
    }
  };

  const disconnect = () => {
    socketManager.disconnect();
  };

  return {
    isConnected,
    error,
    send,
    subscribe,
    connect,
    disconnect,
  };
};


