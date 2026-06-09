import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Admin from './pages/Admin';
import Footer from './components/Footer';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<><Navbar /><Landing /><Footer /></>} />
          <Route path="/admin/*" element={<Admin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
