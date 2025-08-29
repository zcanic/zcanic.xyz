import React, { useState, useEffect, useCallback } from 'react';
import { getComments, addComment } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { FaPaperPlane } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useToast } from '../hooks/useToast';
import { Button } from './ui';
import { Textarea } from './ui';
import { Avatar, AvatarFallback, AvatarImage } from './ui';

function CommentSection({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayedCommentsCount, setDisplayedCommentsCount] = useState(5);
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const loadComments = useCallback(async () => {
    if (!postId) return;
    console.info(`[CommentSection] Loading comments for post ID: ${postId}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await getComments(postId);
      setComments(response.data || []);
      console.info(`[CommentSection] Successfully loaded ${response.data?.length || 0} comments.`);
    } catch (err) {
      console.error('[CommentSection] Failed to load comments:', err);
      setError('加载评论失败了喵。');
      showToast('加载评论失败了喵 T_T', { type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [postId, showToast]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const commentData = { content: newComment.trim() };
      const response = await addComment(postId, commentData);
      const addedComment = response.data;
      
      if (onCommentAdded) {
        onCommentAdded(addedComment); 
      }
      
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
      showToast('评论成功喵！', { type: 'success' });
    } catch (error) {
      console.error('[CommentSection] Failed to add comment:', error);
      showToast(`评论失败喵: ${error.message || '未知错误'}`, { type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (username = '') => {
    return username.charAt(0).toUpperCase();
  };

  return (
    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-200">评论区喵</h2>
      
      {/* Comment Submission Form (Visible only if logged in) */}
      {isAuthenticated && (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex items-start space-x-3">
            <Avatar className="mt-1">
              <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <Textarea
                placeholder="添加你的评论喵... (支持 Markdown 哦)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                required
                disabled={isSubmitting}
              />
              <div className="flex justify-end">
                 <Button type="submit" disabled={isSubmitting || !newComment.trim()} size="sm">
                  {isSubmitting ? '正在发送...' : '发表评论喵'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}
      {!isAuthenticated && (
          <p className="mb-6 text-center text-gray-600 dark:text-gray-400">
              需要<a href="/login" className="text-blue-600 dark:text-blue-400 hover:underline">登录</a>才能发表评论哦喵~
          </p>
      )}

      {/* Loading/Error states for comments */}
      {isLoading && <div className="text-center p-4 text-gray-500 dark:text-gray-400">正在加载评论喵...</div>}
      {!isLoading && error && <div className="text-center p-4 text-red-600 dark:text-red-400">加载评论失败: {error}</div>}

      {/* Comment List */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {comments && comments.length > 0 ? (
            comments.slice(0, displayedCommentsCount).map((comment) => (
              <div key={comment.id} className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-sm relative group">
                  <Avatar className="mt-1">
                    <AvatarFallback>{getInitials(comment.username)}</AvatarFallback>
                  </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{comment.username || '匿名喵'}</span>
                    <time dateTime={comment.created_at} className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: zhCN })}
                    </time>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{comment.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">还没有评论喵，快来抢沙发吧！</p>
          )}
          {comments.length > displayedCommentsCount && (
            <button
              onClick={() => setDisplayedCommentsCount(comments.length)}
              className="mt-4 w-full text-center px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              查看全部 {comments.length} 条评论...
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentSection; 