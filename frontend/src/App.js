import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

/* Context providers */
import { ThemeProvider }  from './context/ThemeContext';
import { AuthProvider }   from './auth/AuthContext';
import { CartProvider }   from './store/CartContext';

/* Guards */
import PrivateRoute from './store/PrivateRoute';
import AdminRoute   from './store/AdminRoute';

/* Components */
import LoadingScreen from './components/LoadingScreen';

/* Pages — Portfolio */
import Landing      from './portfolio/Landing';
import PortfolioAdmin from './admin/portfolio/Admin';

/* Pages — Auth */
import Signin from './auth/Signin';
import Signup from './auth/Signup';

/* Pages — Store */
import Storefront    from './store/Storefront';
import ProductDetail from './store/ProductDetail';
import Cart          from './store/Cart';
import Profile       from './store/Profile';
import StoreAdmin    from './admin/store/Admin';
import Terms         from './store/Terms';
import NotFound      from './store/NotFound';

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
