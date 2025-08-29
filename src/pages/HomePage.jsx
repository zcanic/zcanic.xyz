import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CatButton, PageLayout } from '../components/ui';
import { Calendar, MessageCircle, BookOpen, ChevronRight } from 'lucide-react';

const HomePage = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [greeting, setGreeting] = useState('');
  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  // 获取问候语
  useEffect(() => {
    const getTimeBasedGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return '早上好';
      if (hour >= 12 && hour < 18) return '下午好';
      return '晚上好';
    };
    
    setGreeting(getTimeBasedGreeting());
  }, []);

  // 模拟获取最近活动
  useEffect(() => {
    if (isAuthenticated) {
      // 这里应该是实际API调用，现在用模拟数据
      setTimeout(() => {
        setRecentActivities([
          {
            id: 1,
            type: 'diary',
            title: '今天遇到了一只可爱的小猫！',
            date: '2023-09-15 14:30',
            excerpt: '今天在回家路上，遇到了一只超级可爱的橘猫，它蹭着我的腿...'
          },
          {
            id: 2,
            type: 'chat',
            title: '关于宠物猫的日常护理',
            date: '2023-09-14 19:45',
            excerpt: '我们讨论了猫咪的日常护理问题，包括梳毛、洗澡和定期体检...'
          },
          {
            id: 3,
            type: 'diary',
            title: '周末的咖啡馆时光',
            date: '2023-09-12 10:15',
            excerpt: '在这家新开的猫咪主题咖啡馆里，我度过了一个慵懒的周末上午...'
          }
        ]);
        setIsLoadingActivities(false);
      }, 1200);
    } else {
      setIsLoadingActivities(false);
    }
  }, [isAuthenticated]);

  // 活动图标映射
  const activityIcons = {
    diary: <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
    chat: <MessageCircle className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
  };

  // 活动卡片组件
  const ActivityCard = ({ activity }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={activity.type === 'diary' ? `/posts/${activity.id}` : `/chat`}>
        <Card 
          className="p-4 mb-4 group"
          variant={activity.type === 'diary' ? 'default' : 'outline'}
        >
          <div className="flex items-start gap-3">
            <div className="mt-1 flex-shrink-0">
              {activityIcons[activity.type]}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-lg text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {activity.title}
                </h3>
                <motion.div 
                  className="text-slate-400 dark:text-dark-muted"
                  initial={{ opacity: 0, x: -5 }}
                  whileHover={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center">
                <Calendar className="w-3 h-3 mr-1 inline" /> {activity.date}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                {activity.excerpt}
              </p>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );

  // 页面变体动画
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <div className="h-10 w-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
            <p className="ml-3 text-slate-600 dark:text-slate-300">加载中...</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-h-[60vh]"
          >
            {/* 欢迎部分 */}
            <motion.div
              variants={itemVariants}
              className="mb-8 text-center sm:text-left"
            >
              <h1 className="flex flex-col sm:flex-row sm:items-end text-3xl sm:text-4xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                <span className="mr-2">{greeting}，</span>
                {isAuthenticated ? (
                  <motion.span 
                    className="text-gradient"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                  >
                    {user?.username || '用户'}
                  </motion.span>
                ) : (
                  <span className="text-gradient">访客</span>
                )}
              </h1>
              
              <motion.p
                variants={itemVariants}
                className="text-slate-600 dark:text-slate-300 mb-6 max-w-xl mx-auto sm:mx-0"
              >
                欢迎来到您的
                <span className="text-indigo-600 dark:text-indigo-400 font-medium mx-1">
                  个人空间
                </span>
                —— 这里是记录心情、进行交流的私密空间
              </motion.p>
              
              {!isAuthenticated && (
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 mt-6 sm:mt-4"
                >
                  <Link to="/register" className="btn-primary inline-flex items-center justify-center">
                    立即注册 <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                  <Link to="/login" className="btn-outline inline-flex items-center justify-center">
                    登录
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* 已登录用户内容 */}
            {isAuthenticated && (
              <>
                {/* 最近活动 */}
                <motion.div
                  variants={itemVariants}
                  className="mt-8"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
                      最近动态
                    </h2>
                    <Link to="/posts" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
                      查看全部 <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {isLoadingActivities ? (
                    <div className="flex justify-center py-10">
                      <div className="h-8 w-8 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin"></div>
                      <p className="ml-3 text-slate-500 dark:text-slate-400">加载最近活动...</p>
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivities.map(activity => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      variants={itemVariants}
                      className="text-center py-10 bg-slate-50 dark:bg-dark-card/50 rounded-lg border border-slate-100 dark:border-dark-border"
                    >
                      <p className="text-slate-500 dark:text-slate-400">
                        还没有任何活动~ 开始写日记或参与聊天吧！
                      </p>
                      <div className="mt-4 flex justify-center space-x-3">
                        <Link to="/posts/new" className="btn-primary text-sm py-2">
                          写日记
                        </Link>
                        <Link to="/chat" className="btn-secondary text-sm py-2">
                          聊天
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              </>
            )}
          </motion.div>
        )}
      </div>
    </PageLayout>
  );
};

export default HomePage; 