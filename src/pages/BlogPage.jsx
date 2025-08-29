import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useBlog } from '../context/BlogContext';
import { useAuth } from '../context/AuthContext';
import { FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';
import { SkeletonTheme } from 'react-loading-skeleton';
import { useTheme } from '../context/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function BlogPage() {
  const { isDarkMode } = useTheme();
  const { blogPosts, isLoadingPosts: blogLoading, errorLoadingPosts: blogError, deleteBlogPost } = useBlog();
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(null);

  const handleDelete = async (postId) => {
    if (window.confirm('确定要删除这篇日记喵？')) {
      setIsDeleting(postId);
      try {
        await deleteBlogPost(postId);
      } catch (error) {
        console.error(`[BlogPage] Failed to delete post ${postId}:`, error);
      } finally {
        setIsDeleting(null);
      }
    }
    };

  const sortedPosts = useMemo(() => {
    if (!blogPosts) return [];
    return [...blogPosts].filter(p => p && p.id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [blogPosts]);

  const isLoading = blogLoading;
  const currentError = blogError;

  console.log('[BlogPage] Render. isLoading:', isLoading, 'Context Loading:', blogLoading, 'Post count:', sortedPosts.length);

  return (
    <SkeletonTheme baseColor={isDarkMode ? "#2D3748" : "#E2E8F0"} highlightColor={isDarkMode ? "#4A5568" : "#F7FAFC"}>
      <ErrorBoundary scope="/blog">
        <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-0">Zcanic 的日记本 📝</h1>
            <Link to="/new-post" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm sm:text-base">
              写新日记~
            </button>
          </Link>
        </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <div key={`skel-${i}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden p-4">
                  <Skeleton height={192} className="mb-4" />
                  <Skeleton height={28} width="75%" className="mb-2" />
                  <Skeleton height={16} width="50%" className="mb-3" />
                  <Skeleton count={2} height={16} className="mb-4"/>
                  <Skeleton height={20} width="30%" />
              </div>
            ))}
          </div>
        )}

          {!isLoading && currentError && (
            <div className="text-center py-10 text-red-600 dark:text-red-400">
              <p className="text-xl font-semibold mb-2">喵呜！加载日记出错了 T_T</p>
              <p>{currentError}</p>
          </div>
        )}

          {!isLoading && !currentError && sortedPosts.length === 0 && (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="text-xl">日记本空空如也喵...</p>
          </div>
        )}

          {!isLoading && !currentError && sortedPosts.length > 0 && (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
              {sortedPosts.map((post) => (
                (post && post.id) ? (
                  <div key={post.id} className="blog-grid-item break-inside-avoid">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex flex-col h-full">
                      {post.imageUrl && (
                        <Link to={`/blog/${post.id}`} className="block aspect-video overflow-hidden">
                          <img 
                            src={post.imageUrl} 
                            alt={`Image for ${post.title}`} 
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110" 
                            onError={(e) => { e.target.style.display = 'none'; console.warn('Image failed to load:', post.imageUrl); }}
                          />
                        </Link>
                      )}
                      <div className="p-4 flex flex-col flex-grow">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                          <Link to={`/blog/${post.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            {post.title}
                          </Link>
                        </h2>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          className="prose prose-sm dark:prose-invert max-h-24 overflow-hidden mb-3 text-gray-600 dark:text-gray-400"
                          components={{ // Disable heading rendering in preview
                            h1: 'p', h2: 'p', h3: 'p', h4: 'p', h5: 'p', h6: 'p',
                          }}
                        >
                          {post.content_preview}
                        </ReactMarkdown>
                        <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <time dateTime={post.created_at}>
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
                            </time>
                            {typeof post.comment_count === 'number' && post.comment_count >= 0 && (
                              <span className="ml-2">
                                · {post.comment_count} 条评论喵
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Link 
                              to={`/blog/${post.id}`} 
                              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              查看全文 <span className="ml-1">→</span>
                            </Link>
                            { (user?.id === post.user_id || user?.role === 'admin') && (
                              <button
                                onClick={() => handleDelete(post.id)}
                                disabled={isDeleting === post.id}
                                className={`p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-wait ${isDeleting === post.id ? 'animate-pulse' : ''}`}
                                aria-label="删除日记"
                              >
                                {isDeleting === post.id ? (
                                  <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                ) : (
                                  <FaTrash className="h-4 w-4" />
                                )
                              }
                            </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div key={`invalid-${post?.id || index}`} className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded shadow">
                    <p>喵呜，这条日记的数据好像有点问题...</p>
                  </div>
                )
              ))}
            </div>
        )}
      </div>
      </ErrorBoundary>
    </SkeletonTheme>
  );
}

export default BlogPage;
