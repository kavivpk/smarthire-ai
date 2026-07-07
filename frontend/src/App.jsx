import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import MockInterview from './pages/MockInterview';
import FakeSkillDetection from './pages/FakeSkillDetection';
import Layout from './components/Layout';
import Header from './components/Header';
import AdminDashboard from "./pages/AdminDashboard";
import LiveInterview from "./pages/LiveInterview";
import CodingAssessment from "./pages/CodingAssessment";
import BulkScreening from './pages/BulkScreening';
const ProtectedLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

const ProtectedNoFooterLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950 transition-colors duration-300">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedLayout><Dashboard /></ProtectedLayout>
        } />
        <Route path="/resume" element={
          <ProtectedLayout><ResumeAnalyzer /></ProtectedLayout>
        } />
        <Route path="/interview" element={
          <ProtectedLayout><MockInterview /></ProtectedLayout>
        } />
        <Route path="/fakeskill" element={
          <ProtectedLayout><FakeSkillDetection /></ProtectedLayout>
        } />
              <Route path="/admin" element={<AdminDashboard />} />
<Route path="/live-interview" element={
  <ProtectedNoFooterLayout><LiveInterview /></ProtectedNoFooterLayout>
} />
<Route path="/coding" element={
  <ProtectedNoFooterLayout><CodingAssessment /></ProtectedNoFooterLayout>
} />
        <Route path="/bulk-screening" element={
          <ProtectedLayout><BulkScreening /></ProtectedLayout>
        } />
      </Routes>

    </BrowserRouter>
  );
}