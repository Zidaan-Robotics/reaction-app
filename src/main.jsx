import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global error handlers
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  const root = document.getElementById('root');
  if (root && !root.querySelector('.error-display')) {
    root.innerHTML = `
      <div class="error-display" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; background: white;">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">JavaScript Error</h1>
        <p style="color: #666; margin-bottom: 20px;">${event.error?.message || 'An error occurred'}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4a90e2; color: white; border: none; border-radius: 4px;">Reload Page</button>
      </div>
    `;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  const root = document.getElementById('root');
  if (root && !root.querySelector('.error-display')) {
    root.innerHTML = `
      <div class="error-display" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; background: white;">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">Promise Rejection</h1>
        <p style="color: #666; margin-bottom: 20px;">${event.reason?.message || 'A promise was rejected'}</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4a90e2; color: white; border: none; border-radius: 4px;">Reload Page</button>
      </div>
    `;
  }
});

const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="padding: 20px; color: red;">Error: Root element not found!</div>';
} else {
  try {
    console.log('Starting React app render...');
    const reactRoot = createRoot(root);
    reactRoot.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app rendered successfully');
  } catch (error) {
    console.error('Failed to render app:', error);
    root.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 20px; text-align: center; background: white;">
        <h1 style="color: #d32f2f; margin-bottom: 20px;">Failed to Load App</h1>
        <p style="color: #666; margin-bottom: 20px;">${error.message || 'An unexpected error occurred'}</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 10px; border-radius: 4px; max-width: 600px; overflow: auto;">${error.stack || ''}</pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background-color: #4a90e2; color: white; border: none; border-radius: 4px; margin-top: 20px;">Reload Page</button>
      </div>
    `;
  }
}
