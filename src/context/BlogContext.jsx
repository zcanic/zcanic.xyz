import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchPosts, createPost, deletePost } from '../services/api'; // Import API service functions

const BlogContext = createContext();

export function BlogProvider({ children }) {
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [errorLoadingPosts, setErrorLoadingPosts] = useState(null);
  // Consider adding specific error states for add/delete if needed
  // const [addPostError, setAddPostError] = useState(null);
  // const [deletePostError, setDeletePostError] = useState(null);

  // Effect to fetch blog posts on mount
  useEffect(() => {
    const loadPosts = async () => {
      console.log('[BlogContext] Fetching posts via API service...');
      setIsLoadingPosts(true);
      setErrorLoadingPosts(null);
      try {
        const response = await fetchPosts();
        setBlogPosts(response.data);
        console.log('[BlogContext] Blog posts loaded via API service 喵~', response.data);
      } catch (error) {
        console.error('[BlogContext] 获取博客失败喵:', error);
        setErrorLoadingPosts(error.response?.data?.message || error.message || '无法加载日记喵');
      } finally {
        setIsLoadingPosts(false);
      }
    };
    loadPosts();
  }, []); // Empty dependency array, runs once on mount

  // Function to add a blog post
  const addBlogPost = useCallback(async (newPostData) => {
    console.log('[BlogContext] Calling createPost service:', newPostData);
    // setIsLoadingPosts(true); // Optionally set loading state for add action
    // setAddPostError(null);
    try {
      const response = await createPost(newPostData);
      const addedPost = response.data;
      // Update local state immediately for better UX
      setBlogPosts(prev => [addedPost, ...prev]);
      console.log('[BlogContext] Blog post added via service:', addedPost);
      return addedPost; // Return the added post
    } catch (error) {
      console.error('[BlogContext] 添加博客失败喵:', error);
      // setAddPostError(error.response?.data?.message || error.message || '添加日记失败了喵');
      // Rethrow the error so the component can handle it (e.g., show status message)
      throw new Error(error.response?.data?.message || error.message || '添加日记失败了喵');
    } finally {
      // setIsLoadingPosts(false);
    }
  }, []);

  // Function to delete a blog post
  const deleteBlogPost = useCallback(async (postId) => {
    console.log(`[BlogContext] Calling deletePost service for id: ${postId}`);
    // setIsLoadingPosts(true); // Optionally set loading state for delete action
    // setDeletePostError(null);
    try {
      await deletePost(postId); // API call
      // Update local state on success
      setBlogPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
      console.log(`[BlogContext] Deleted blog post with id: ${postId} via service`);
      return true; // Indicate success
    } catch (error) {
      console.error('[BlogContext] 删除博客失败喵:', error);
      // setDeletePostError(error.response?.data?.message || error.message || '删除日记失败了喵');
       // Rethrow the error so the component can handle it
      throw new Error(error.response?.data?.message || error.message || '删除日记失败了喵');
    } finally {
      // setIsLoadingPosts(false);
    }
  }, []);

  const value = {
    blogPosts,
    isLoadingPosts,
    errorLoadingPosts,
    addBlogPost,
    deleteBlogPost,
  };

  return (
    <BlogContext.Provider value={value}>
      {children}
    </BlogContext.Provider>
  );
}

// Custom hook
export function useBlog() {
  const context = useContext(BlogContext);
  if (context === undefined) {
    throw new Error('useBlog must be used within a BlogProvider');
  }
  return context;
} 