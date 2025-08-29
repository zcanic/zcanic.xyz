import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fetchPostById, getComments } from '../services/api';
import { useAuth } from '../context/AuthContext'; // Needed for potential actions later
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { ArrowLeft } from 'lucide-react';
import CommentSection from '../components/CommentSection';
import { useToast } from '../hooks/useToast'; // Import useToast for error reporting

function PostDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth(); // Get auth state
  const [isExpanded, setIsExpanded] = useState(false); // <-- 折叠状态
  const [needsTruncation, setNeedsTruncation] = useState(false); // <-- 是否需要截断
  const contentRef = useRef(null); // <-- 引用内容容器

  // Add state for comments
  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [errorComments, setErrorComments] = useState(null);
  const { showToast } = useToast(); // Initialize toast hook

  // --- Load Post Data Effect ---
  useEffect(() => {
    const loadPost = async () => {
      console.log(`[PostDetailPage] Fetching post with ID: ${postId}`);
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetchPostById(postId);
        setPost(response.data);
        console.log('[PostDetailPage] Post data fetched successfully.');
      } catch (err) {
        console.error('[PostDetailPage] Failed to fetch post:', err);
        setError(err.message || '加载日记详情失败了喵 T_T');
        // Show toast for post loading error
        showToast(err.message || '加载日记详情失败了喵 T_T', { type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      loadPost();
    } else {
      const errMsg = '无效的日记 ID 喵！';
      setError(errMsg);
      showToast(errMsg, { type: 'error' });
      setIsLoading(false);
    }
  }, [postId, showToast]); // Add showToast dependency

  // --- Load Comments Data Effect ---
  const loadComments = useCallback(async () => {
    if (!postId) return;
    console.log(`[PostDetailPage] Fetching comments for post ID: ${postId}`);
    setIsLoadingComments(true);
    setErrorComments(null);
    try {
      const response = await getComments(postId);
      setComments(response.data);
      console.log(`[PostDetailPage] Comments fetched successfully (${response.data.length} comments).`);
    } catch (err) {
      console.error('[PostDetailPage] Failed to fetch comments:', err);
      const errMsg = err.message || '加载评论失败了喵 T_T';
      setErrorComments(errMsg);
      showToast(errMsg, { type: 'error' }); // Show toast for comment loading error
    } finally {
      setIsLoadingComments(false);
    }
  }, [postId, showToast]); // Add dependencies

  useEffect(() => {
    loadComments();
  }, [loadComments]); // Depend on the stable loadComments callback

  // --- Check Content Height Effect ---
  useEffect(() => {
    if (contentRef.current) {
      const requiresTruncate = contentRef.current.scrollHeight > 650; 
      setNeedsTruncation(requiresTruncate);
      console.log(`[PostDetailPage] Content height check: scrollHeight=${contentRef.current.scrollHeight}, needsTruncation=${requiresTruncate}`);
    }
  }, [post]); 

  // --- Callback for adding comment ---
  const handleCommentAdded = useCallback((newComment) => {
    setComments(prevComments => [...prevComments, newComment]);
  }, []);

  // --- Render Logic ---

  // Render Loading Skeleton if post is loading
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Skeleton height={40} width={200} className="mb-4" />
        <Skeleton height={20} width={150} className="mb-6" />
        <Skeleton height={300} className="mb-6" />
        <Skeleton count={5} />
        {/* Maybe add a skeleton for the comment section too */}
        <div className="mt-8 pt-6 border-t">
           <Skeleton height={30} width={150} className="mb-4" />
           <Skeleton height={80} className="mb-6" />
           <Skeleton height={60} count={2} className="mb-4"/>
        </div>
      </div>
    );
  }

  // Render Post Loading Error
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl text-center text-red-600 dark:text-red-400">
        <p className="text-xl">喵呜！加载日记出错了！</p>
        <p>{error}</p>
        <Link to="/blog" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          返回日记列表
        </Link>
      </div>
    );
  }

  // Render Not Found if post is null after loading (shouldn't happen if no error)
  if (!post) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl text-center text-gray-500 dark:text-gray-400">
        找不到这篇日记喵...
        <Link to="/blog" className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:underline">
          返回日记列表
        </Link>
      </div>
    );
  }

  // --- Successful Render ---
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      {/* Back Link */}
      <Link 
        to="/blog" 
        className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mb-6 group"
      >
        <ArrowLeft size={16} className="mr-1 transition-transform duration-200 ease-in-out group-hover:-translate-x-1" />
        返回日记列表
      </Link>

      {/* Post Article */}
      <article className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-6 md:p-8 mb-8">
        {/* Header */}
        <header className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">{post.title}</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <time dateTime={post.created_at}>
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN })}
            </time>
          </div>
        </header>
        
        {/* Image */}
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt={`Image for ${post.title}`} 
            className="w-full h-auto max-h-[500px] object-contain rounded-md mb-6" // Use object-contain
            onError={(e) => { e.target.style.display = 'none'; console.warn('Image failed to load:', post.imageUrl); }} // Hide on error
          />
        )}

        {/* Content with Expansion Logic */}
        <div 
          ref={contentRef} 
          className={`prose prose-lg dark:prose-invert max-w-none break-words relative transition-all duration-500 ease-in-out ${!isExpanded && needsTruncation ? 'max-h-[600px] overflow-hidden' : 'max-h-none'}`}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
          {!isExpanded && needsTruncation && (
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/95 to-transparent pointer-events-none dark:from-gray-800/95 dark:to-transparent transition-colors duration-300"></div>
          )}
        </div>
        {!isExpanded && needsTruncation && (
            <button
              onClick={() => setIsExpanded(true)}
              className="mt-4 w-full text-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              展开阅读全文...
            </button>
        )}
      </article>

      {/* Comment Section with improved styling */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        {isLoadingComments && (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">正在加载评论喵...</div>
        )}
        {!isLoadingComments && errorComments && (
            <div className="text-center p-4 text-red-600 dark:text-red-400">加载评论失败: {errorComments}</div>
        )}
        {!isLoadingComments && !errorComments && (
          <CommentSection 
            postId={postId} 
            comments={comments} 
            onCommentAdded={handleCommentAdded} 
          />
        )}
      </div>
    </div>
  );
}

export default PostDetailPage; 