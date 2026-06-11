import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PopularPage from './pages/PopularPage';
import SubredditPage from './pages/SubredditPage';
import PostDetailPage from './pages/PostDetailPage';
import SubmitPage from './pages/SubmitPage';
import CreateSubredditPage from './pages/CreateSubredditPage';
import UserProfilePage from './pages/UserProfilePage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/r/popular" element={<PopularPage />} />
          <Route path="/u/:username" element={<UserProfilePage />} />
          <Route path="/r/:name" element={<SubredditPage />} />
          <Route
            path="/r/:name/comments/:postId"
            element={<PostDetailPage />}
          />
          <Route
            path="/r/:name/comments/:postId/:slug"
            element={<PostDetailPage />}
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit"
            element={
              <ProtectedRoute>
                <SubmitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/r/:name/submit"
            element={
              <ProtectedRoute>
                <SubmitPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subreddits/create"
            element={
              <ProtectedRoute>
                <CreateSubredditPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
