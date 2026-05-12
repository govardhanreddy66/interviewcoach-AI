/**
 * This utility monkey-patches the global window.fetch to provide a consistent 
 * way to handle authentication failures (401 Unauthorized) across the entire app.
 * 
 * Since many pages use raw fetch instead of a central wrapper, this interceptor
 * ensures that any 'Token expired' or 'Invalid token' response results in 
 * an automatic logout and redirect.
 */

export const initAuthInterceptor = () => {
  const { fetch: originalFetch } = window;

  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);

      // Check if we got a 401 Unauthorized
      if (response.status === 401) {
        const url = args[0] ? args[0].toString() : '';
        
        // Skip redirect for login/signup endpoints to allow them to show error messages
        const isAuthEndpoint = url.includes('/api/login') || url.includes('/api/signup') || url.includes('/api/verify-email');
        
        if (!isAuthEndpoint) {
          console.warn('[AuthInterceptor] 401 Unauthorized detected on protected resource. Forcing logout.');
          
          // Clear local auth data
          localStorage.removeItem('ic_token');
          localStorage.removeItem('ic_user');
          
          // Only redirect if we are not already on the login or landing page
          const path = window.location.pathname;
          if (path !== '/login' && path !== '/') {
            // Use a small timeout to ensure other code can finish processing if needed,
            // but the redirect will happen shortly.
            setTimeout(() => {
              window.location.href = '/login?expired=true';
            }, 100);
          }
        }
      }

      return response;
    } catch (error) {
      // Re-throw network errors
      throw error;
    }
  };

  console.log('[AuthInterceptor] Global fetch interceptor initialized.');
};
