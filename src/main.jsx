import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Filter out react-beautiful-dnd defaultProps warning
const originalConsoleError = console.error;
console.error = function(...args) {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('defaultProps will be removed') &&
    args[0].includes('react-beautiful-dnd')
  ) {
    // Don't log the defaultProps warning from react-beautiful-dnd
    return;
  }
  originalConsoleError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
