import { Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistPage from './pages/ArtistPage';
import CreateMomentPage from './pages/CreateMomentPage';
import FaceQuizPage from './pages/FaceQuizPage';
import PosterMakerPage from './pages/PosterMakerPage';
import VoiceQuizPage from './pages/VoiceQuizPage';
import MerchPage from './pages/MerchPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import MyContentPage from './pages/MyContentPage';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AISafetyPage from './pages/admin/modules/AISafetyPage';
import DeepFakePipelinePage from './pages/admin/modules/DeepFakePipelinePage';
import VoiceCloningPage from './pages/admin/modules/VoiceCloningPage';
import FaceSimilarityPage from './pages/admin/modules/FaceSimilarityPage';
import AIPosterMakerAdminPage from './pages/admin/modules/AIPosterMakerAdminPage';
import AIAvatarGeneratorPage from './pages/admin/modules/AIAvatarGeneratorPage';
import MerchVersePage from './pages/admin/modules/MerchVersePage';
import BillingPage from './pages/admin/modules/BillingPage';
import ContentModerationPage from './pages/admin/modules/ContentModerationPage';
import ArtistsManagementPage from './pages/admin/modules/ArtistsManagementPage';

function App() {
  return (
    <Routes>
      {/* Face Quiz - standalone on port 4001 */}
      <Route path="/face-quiz" element={<FaceQuizPage />} />

      {/* Main site routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/artists/:id" element={<ArtistPage />} />
        <Route path="/create-moment" element={<CreateMomentPage />} />
        <Route path="/poster-maker" element={<PosterMakerPage />} />
        <Route path="/voice-quiz" element={<VoiceQuizPage />} />
        <Route path="/merch" element={<MerchPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/my-content" element={<MyContentPage />} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/ai-safety" element={<ProtectedRoute><AISafetyPage /></ProtectedRoute>} />
      <Route path="/admin/deepfake-pipeline" element={<ProtectedRoute><DeepFakePipelinePage /></ProtectedRoute>} />
      <Route path="/admin/voice-cloning" element={<ProtectedRoute><VoiceCloningPage /></ProtectedRoute>} />
      <Route path="/admin/face-similarity" element={<ProtectedRoute><FaceSimilarityPage /></ProtectedRoute>} />
      <Route path="/admin/poster-maker" element={<ProtectedRoute><AIPosterMakerAdminPage /></ProtectedRoute>} />
      <Route path="/admin/avatar-generator" element={<ProtectedRoute><AIAvatarGeneratorPage /></ProtectedRoute>} />
      <Route path="/admin/merchverse" element={<ProtectedRoute><MerchVersePage /></ProtectedRoute>} />
      <Route path="/admin/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/admin/content-moderation" element={<ProtectedRoute><ContentModerationPage /></ProtectedRoute>} />
      <Route path="/admin/artists" element={<ProtectedRoute><ArtistsManagementPage /></ProtectedRoute>} />
    </Routes>
  );
}

export default App;
