import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Context providers */
import { ThemeProvider }  from './context/ThemeContext';
import { AuthProvider }   from './context/AuthContext';
import { CartProvider }   from './context/CartContext';

/* Guards */
import PrivateRoute from './components/store/PrivateRoute';
import AdminRoute   from './components/store/AdminRoute';

/* Components */
import LoadingScreen from './components/LoadingScreen';

/* Pages — Portfolio */
import Landing      from './pages/Landing';
import PortfolioAdmin from './pages/Admin';

/* Pages — Auth */
import Signin from './pages/auth/Signin';
import Signup from './pages/auth/Signup';

/* Pages — Store */
import Storefront    from './pages/store/Storefront';
import ProductDetail from './pages/store/ProductDetail';
import Cart          from './pages/store/Cart';
import Profile       from './pages/store/Profile';
import StoreAdmin    from './pages/store/Admin';
import Terms         from './pages/store/Terms';
import NotFound      from './pages/store/NotFound';

export default function App() {
  const [appReady, setAppReady] = useState(false);

  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <CartProvider>
            {!appReady && <LoadingScreen onDone={() => setAppReady(true)} />}

            <div style={{ visibility: appReady ? 'visible' : 'hidden' }}>
              <Routes>
                {/* ── Portfolio ── */}
                <Route path="/"      element={<Landing />} />

                {/* ── Auth (universal) ── */}
                <Route path="/signin" element={<Signin />} />
                <Route path="/signup" element={<Signup />} />

                {/* ── Portfolio Admin ── */}
                <Route
                  path="/admin/*"
                  element={
                    <AdminRoute>
                      <PortfolioAdmin />
                    </AdminRoute>
                  }
                />

                {/* ── Store ── */}
                <Route path="/store"              element={<Storefront />} />
                <Route path="/store/product/:id"  element={<ProductDetail />} />
                <Route path="/store/terms"        element={<Terms />} />

                <Route
                  path="/store/cart"
                  element={
                    <PrivateRoute>
                      <Cart />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/store/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />

                <Route
                  path="/store/admin/*"
                  element={
                    <AdminRoute>
                      <StoreAdmin />
                    </AdminRoute>
                  }
                />

                {/* ── 404 ── */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </CartProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
