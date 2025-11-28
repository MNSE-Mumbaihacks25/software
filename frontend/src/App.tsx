import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AgentDashboard from './pages/AgentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Cockpit from './pages/Cockpit';
import Login from './pages/Login';

// --- SECURITY WRAPPER ---
// If no user is found in LocalStorage, kick them back to Login.
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const user = localStorage.getItem('sb_user');
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function App() {
  return (
    <BrowserRouter>
      {/* Removed global bg-color so pages can control their own theme (Light vs Dark) */}
      <div className="font-sans antialiased">
        <Routes>
          
          {/* PUBLIC ROUTE */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED ROUTES */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <AgentDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/cockpit/:id" 
            element={
              <ProtectedRoute>
                <Cockpit />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;