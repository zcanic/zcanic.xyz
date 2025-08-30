import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/globals.css';
import 'react-loading-skeleton/dist/skeleton.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { BlogProvider } from './context/BlogContext';
import { ChatProvider } from './context/ChatContext';
import ErrorBoundary from './components/ErrorBoundary';
// 初始化性能监控系统
import './utils/performanceMonitor';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <ThemeProvider>
            <BlogProvider>
              <ChatProvider>
                <App />
              </ChatProvider>
            </BlogProvider>
          </ThemeProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>,
); 