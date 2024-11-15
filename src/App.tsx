import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import YumertsCanvas from './component/yumerts-canvas';

function App() {
  return (
    <div className="App">
      <YumertsCanvas websocketUrl={'ws://localhost:8080'}/>
    </div>
  );
}

export default App;
