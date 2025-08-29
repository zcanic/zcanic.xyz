import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Menu, X, Sun, Moon, User, LogOut, ChevronDown } from 'lucide-react';
import Logo from './ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Navigation items
  const navItems = [
    { label: '博客', path: '/blog' },
    { label: '聊天', path: '/chat' },
    { label: '喵语', path: '/news' }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Handle clicks outside the user menu to close it
  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-slate-700/30 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-2 flex-1 justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm'
                      : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center space-x-2">
            {/* Theme toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors backdrop-blur-sm"
              aria-label={isDarkMode ? '切换到亮色模式' : '切换到暗色模式'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User menu/login button */}
            {isAuthenticated ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className={`
                    flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-medium 
                    text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70
                    transition-colors backdrop-blur-sm
                  `}
                >
                  <User size={18} />
                  <span className="hidden sm:inline">{user?.username || '用户'}</span>
                  <ChevronDown size={16} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Desktop User Dropdown Menu */}
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden shadow-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/30">
                      <NavLink
                        to="/profile"
                        className={({ isActive }) => `
                          block px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 
                          ${isActive ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : ''}
                        `}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        个人资料
                      </NavLink>
              <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <div className="flex items-center">
                          <LogOut size={16} className="mr-2" />
                          退出登录
                        </div>
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                to="/login"
                className={({isActive}) => `
                  px-4 py-2 ${isActive 
                    ? 'bg-indigo-700 hover:bg-indigo-800' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  } 
                  text-white rounded-xl text-sm font-medium transition-colors shadow-sm
                `}
              >
                登录
              </NavLink>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 transition-colors backdrop-blur-sm"
              onClick={toggleMenu}
              aria-label="菜单"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
        </div>
      </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 mt-3">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20'
                        : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                    }`
                  }
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              {isAuthenticated && (
                <>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      `px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-900/20'
                          : 'text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      }`
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    个人资料
                  </NavLink>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/10 transition-colors text-left flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    退出登录
                  </button>
                </>
              )}
            </nav>
          </div>
        )}
        </div>
    </header>
  );
};

export default Navbar; 