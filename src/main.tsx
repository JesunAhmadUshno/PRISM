/**
 * PRISM Application Entry Point
 * 
 * Initializes the React application with strict mode enabled.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Strict mode helps identify potential problems
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
