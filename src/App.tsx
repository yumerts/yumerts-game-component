import React, { useRef, useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import YumertsCanvas from './component/yumerts-canvas';

function App() {
  const canvasRef = useRef<YumertsCanvas | null>(null);
  let [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newSocket = new WebSocket('ws://localhost:8080');
      setSocket(newSocket);

      newSocket.onopen = () => {
        console.log('Connected to the WebSocket server');
      };

      newSocket.onmessage = (event) => {
        console.log('Message from server ', event.data);
        if (canvasRef.current) {
          // Assuming YumertsCanvas has a method to handle the message
          canvasRef.current.updateState(event.data);
        }
      };

      newSocket.onclose = () => {
        console.log('Disconnected from the WebSocket server');
      };

      newSocket.onerror = (error) => {
        console.error('WebSocket error: ', error);
      };
    }, 200);

    return () => {
      clearTimeout(timer);
      if (socket) {
        socket.close();
      }
    };
  }, []);

  return (
    <div className="App">
      <YumertsCanvas ref={canvasRef} inputReceived={(input) => {
        if(!socket)
          return;
        socket.send(JSON.stringify(input));
      }} />
    </div>
  );
}

export default App;
