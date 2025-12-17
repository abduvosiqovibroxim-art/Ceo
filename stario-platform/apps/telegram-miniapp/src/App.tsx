import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ArtistsPage from './pages/ArtistsPage';
import ArtistPage from './pages/ArtistPage';
import CreateMomentPage from './pages/CreateMomentPage';
import FaceQuizPage from './pages/FaceQuizPage';
import MyContentPage from './pages/MyContentPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/artists" element={<ArtistsPage />} />
        <Route path="/artists/:id" element={<ArtistPage />} />
        <Route path="/create-moment" element={<CreateMomentPage />} />
        <Route path="/face-quiz" element={<FaceQuizPage />} />
        <Route path="/my-content" element={<MyContentPage />} />
      </Route>
    </Routes>
  );
}

export default App;
