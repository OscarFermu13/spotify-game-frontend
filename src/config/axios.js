import axios from 'axios';

axios.defaults.withCredentials = true;

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRoute = ['/auth/login', '/auth/callback'].some((p) =>
        window.location.pathname.startsWith(p)
      );
      if (!isAuthRoute && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(err);
  }
);

export default axios;