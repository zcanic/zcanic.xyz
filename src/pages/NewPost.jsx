import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { uploadImage, createPost } from '../services/api';
import { useAuth } from '../context/AuthContext';

function NewPostForm() {
  console.log('[NewPostForm] Render started.');

  // --- Authentication Check --- 
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only check when auth state is definitive (not loading)
    if (!isAuthLoading && !isAuthenticated) {
      console.log(`[NewPostForm][AuthCheck] User not authenticated. Navigating from ${location.pathname} to /login.`);
      navigate('/login', { state: { from: location }, replace: true });
    }
  }, [isAuthLoading, isAuthenticated, navigate, location]);

  // --- Form State --- 
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', type: '' });

  // --- Event Handlers --- 
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    console.log('[NewPostForm] handleImageChange triggered. File:', file?.name, file?.type);
    if (file && file.type.startsWith('image/')) {
      console.log('[NewPostForm] Valid image file selected.');
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadstart = () => console.log('[NewPostForm] FileReader started reading...');
      reader.onloadend = () => {
        console.log('[NewPostForm] FileReader finished reading. Setting image preview.');
        setImagePreview(reader.result);
      };
      reader.onerror = (err) => console.error('[NewPostForm] FileReader error:', err);
      reader.readAsDataURL(file);
    } else {
      console.log('[NewPostForm] No file or invalid file type selected. Clearing image state.');
      setImageFile(null);
      setImagePreview(null);
      if (file) {
        alert('请选择图片文件喵！');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[NewPostForm] handleSubmit triggered.');
    if (!title.trim() || !content.trim()) {
      console.warn('[NewPostForm] Submission aborted: Title or content is empty.');
      setSubmitStatus({ message: '标题和内容都不能为空哦喵！', type: 'error' });
      return;
    }

    console.log('[NewPostForm] Setting isSubmitting to true.');
    setIsSubmitting(true);
    setSubmitStatus({ message: '正在处理喵...', type: 'info' });

    let finalImageUrl = null;

    try {
      if (imageFile) {
        console.log('[NewPostForm] Image file exists. Attempting to upload...');
        setSubmitStatus({ message: '正在上传图片喵...', type: 'info' });
        const formData = new FormData();
        formData.append('image', imageFile);

        // API call logging is handled by the wrapper in api.js
        const uploadResponse = await uploadImage(formData);
        const uploadResult = uploadResponse.data;

        if (!uploadResult || !uploadResult.imageUrl) { // Added check for uploadResult itself
          console.error('[NewPostForm] Upload response missing imageUrl:', uploadResult);
          throw new Error('图片上传成功但未返回图片地址喵！');
        }
        finalImageUrl = uploadResult.imageUrl;
        console.log('[NewPostForm] Image upload successful. URL:', finalImageUrl);
        setSubmitStatus({ message: '图片上传成功！正在保存日记...', type: 'info' });
      } else {
        console.log('[NewPostForm] No image file to upload.');
      }

      const postData = {
        title,
        content,
        imageUrl: finalImageUrl // Will be null if no image was uploaded
      };
      console.log("[NewPostForm] Preparing to create post with data:", postData);

      // API call logging is handled by the wrapper in api.js
      await createPost(postData);

      console.log('[NewPostForm] Post creation successful.');
      setSubmitStatus({ message: '日记保存成功喵！正在跳转...', type: 'success' });
      setTimeout(() => {
        console.log('[NewPostForm] Navigating to /blog.');
        navigate('/blog');
      }, 1500);

    } catch (error) {
      // Error logging is handled by the interceptor and wrapper in api.js
      const errorMsg = error.message || '操作失败了喵 T_T'; // 保留，获取友好消息
      setSubmitStatus({ message: `操作失败喵 T_T: ${errorMsg}`, type: 'error' }); // 保留，内联状态显示
      // Keep submitting state false only if error occurred
      setIsSubmitting(false); // 保留
    }
    // Do not set isSubmitting to false here if successful, wait for navigation
  };

  const handleTitleChange = (e) => {
    console.log(`[NewPostForm] Title changed: "${e.target.value}"`);
    setTitle(e.target.value);
  };

  const handleContentChange = (e) => {
    console.log(`[NewPostForm] Content changed (length: ${e.target.value.length})`);
    setContent(e.target.value);
  };

  // --- Render Logic based on Auth State --- 
  if (isAuthLoading) {
    console.log('[NewPostForm] Auth is loading. Rendering loading indicator.');
    return <div className="flex justify-center items-center h-screen text-gray-500 dark:text-gray-400">检查登录状态中喵...</div>;
  }

  if (!isAuthenticated) {
    console.log('[NewPostForm] User not authenticated. Rendering null while redirecting.');
    return null; // Render null while the useEffect triggers the navigation
  }

  // --- Authenticated Render --- 
  console.log('[NewPostForm] User authenticated. Rendering form.');

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* {console.log('[NewPostForm] Rendering form container.')} */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">写点什么呢，主人？🖋️</h1>
      {/* Optionally wrap form in ErrorBoundary */}
      {/* <ErrorBoundary> */}
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标题喵~
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={handleTitleChange} // Use specific handler for logging
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            配图喵~
          </label>
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900 file:text-blue-700 dark:file:text-blue-200 hover:file:bg-blue-100 dark:hover:file:bg-blue-800 disabled:opacity-50"
            disabled={isSubmitting}
          />
          {imagePreview && (
            <div className="mt-4">
              <img src={imagePreview} alt="Image preview" className="max-h-60 rounded-md border dark:border-gray-600" />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            内容喵~ (支持 Markdown 哦)
          </label>
          <textarea
            id="content"
            value={content}
            onChange={handleContentChange} // Use specific handler for logging
            rows={15}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 dark:bg-gray-700 disabled:opacity-50"
            required
            disabled={isSubmitting}
          />
        </div>

        {submitStatus.message && (
          <p className={`text-sm ${submitStatus.type === 'error' ? 'text-red-600 dark:text-red-400' : (submitStatus.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400')}`}>
            {/* {console.log('[NewPostForm] Rendering submit status:', submitStatus)} */}
            {submitStatus.message}
          </p>
        )}

        <div className="text-right">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? '处理中...' : '保存日记喵~'}
          </button>
        </div>
      </form>
      {/* </ErrorBoundary> */}
    </div>
  );
}

export default NewPostForm; 