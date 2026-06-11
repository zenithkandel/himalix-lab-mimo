import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState(null);

  const fetchWalletBalance = async (currentToken) => {
    const activeToken = currentToken || token || localStorage.getItem('token');
    if (!activeToken) return;
    try {
      const response = await fetch('/api/store/wallet/history', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setWalletBalance(data.walletBalance);
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          parsed.wallet_balance = data.walletBalance;
          localStorage.setItem('user', JSON.stringify(parsed));
          setUser(parsed);
        }
      }
    } catch (err) {
      console.error('Failed to fetch wallet balance:', err);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const response = await fetch(`/api/auth/config`);
      const data = await response.json();
      if (response.ok) {
        setSystemConfig(data);
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error);
    }
    return null;
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      fetchWalletBalance(savedToken);
    }
    fetchSystemConfig();
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setWalletBalance(parseFloat(data.user.wallet_balance || 0));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, referralCode) => {
    try {
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, referredByCode: referralCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setWalletBalance(parseFloat(data.user.wallet_balance || 0));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (googleIdToken) => {
    try {
      const response = await fetch(`/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: googleIdToken }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Google Login failed');
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      setWalletBalance(parseFloat(data.user.wallet_balance || 0));
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setWalletBalance(0);
  };

  return (
    <AuthContext.Provider value={{ user, token, walletBalance, fetchWalletBalance, login, register, loginWithGoogle, logout, loading, systemConfig, fetchSystemConfig }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
