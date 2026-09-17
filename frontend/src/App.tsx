import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Chat } from './pages/Chat';
import { Journal } from './pages/Journal';
import { Mood } from './pages/Mood';
import { Support } from './pages/Support';
import { Settings } from './pages/Settings';
import { VoiceAssistant } from './pages/VoiceAssistant';
import { Assessment } from './pages/Assessment';
import { Exercises } from './pages/Exercises';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="voice" element={<VoiceAssistant />} />
          <Route path="chat" element={<Chat />} />
          <Route path="journal" element={<Journal />} />
          <Route path="mood" element={<Mood />} />
          <Route path="assessments" element={<Assessment />} />
          <Route path="exercises" element={<Exercises />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

