import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CartProvider } from './context/CartContext';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Admin from './pages/Admin';

import StoreNavbar from './components/store/Navbar';
import PrivateRoute from './components/store/PrivateRoute';
import AdminRoute from './components/store/AdminRoute';
import Storefront from './pages/store/Storefront';
import ProductDetail from './pages/store/ProductDetail';
import Cart from './pages/store/Cart';
import Profile from './pages/store/Profile';
import StoreAdmin from './pages/store/Admin';
import StoreLogin from './pages/store/Login';
import StoreRegister from './pages/store/Register';
import StoreTerms from './pages/store/Terms';
import StoreNotFound from './pages/store/NotFound';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              {/* Labs Routes */}
              <Route path="/" element={<><Navbar /><Landing /></>} />
              <Route path="/admin/*" element={<Admin />} />

              {/* Store Routes */}
              <Route path="/store/*" element={
                <div className="store-app">
                  <StoreNavbar />
                  <Routes>
                    <Route index element={<Storefront />} />
                    <Route path="login" element={<StoreLogin />} />
                    <Route path="register" element={<StoreRegister />} />
                    <Route path="terms" element={<StoreTerms />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
                    <Route path="profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="admin" element={<AdminRoute><StoreAdmin /></AdminRoute>} />
                    <Route path="*" element={<StoreNotFound />} />
                  </Routes>
                </div>
              } />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
