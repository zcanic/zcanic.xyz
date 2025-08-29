import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { SendHorizonal, Sparkles, Mic } from 'lucide-react';

const ChatInput = forwardRef(function ChatInput({ onSend, isLoading, value, onChange, onKeyDown, disabled, isVoiceMode }, ref) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim());
    }
  };

  // Paw print icon component for input
  const PawPrint = () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-indigo-400 dark:text-indigo-500 opacity-70 mr-2"
    >
      <path d="M12,8.5A1.5,1.5,0,1,1,13.5,7,1.5,1.5,0,0,1,12,8.5Zm-3.5-1A1.5,1.5,0,1,0,7,6,1.5,1.5,0,0,0,8.5,7.5Zm7,0A1.5,1.5,0,1,0,17,6,1.5,1.5,0,0,0,15.5,7.5ZM12,15a4,4,0,0,0-4-4,1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0Zm5-4a1.5,1.5,0,1,0,0,3,1,1,0,0,1,1,1,1.5,1.5,0,0,0,3,0A4,4,0,0,0,17,11Z" />
    </svg>
  );

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* Loading indicator - positioned above the input for better visibility */}
      {isLoading && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center">
          <motion.div
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-full shadow-sm"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <span className="mr-2">Zcanic 正在打字喵...</span>
            <motion.div
              className="w-2 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </div>
      )}

      {/* Message input field */}
      <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-600 focus-within:border-indigo-500 dark:focus-within:border-indigo-600 transition shadow-sm">
        <div className="flex-shrink-0">
          {isVoiceMode ? <Mic className="text-indigo-500 w-5 h-5" /> : <PawPrint />}
        </div>
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          disabled={disabled || isLoading}
          placeholder={isVoiceMode ? "输入中文文本，将自动翻译成日语并以语音回复..." : "有什么想要和zcanic聊的喵？"}
          className="flex-grow bg-transparent border-none focus:outline-none focus:ring-0 resize-none py-1 h-9 md:h-10 placeholder-slate-400 dark:placeholder-slate-500 text-slate-700 dark:text-slate-200"
          rows={1}
        />
        <motion.button
          type="submit"
          disabled={!value.trim() || isLoading || disabled}
          whileTap={{ scale: 0.9 }}
          className={`flex-shrink-0 p-2 rounded-lg ${
            value.trim() && !isLoading && !disabled
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
          } transition`}
        >
          <SendHorizonal className="w-5 h-5" />
        </motion.button>
      </div>
    </form>
  );
});

export default ChatInput;