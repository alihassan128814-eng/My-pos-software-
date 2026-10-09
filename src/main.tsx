import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});

createRoot(document.getElementById('root')!).render(<App />);
