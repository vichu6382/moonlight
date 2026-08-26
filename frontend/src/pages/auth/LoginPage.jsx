import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PasswordInput } from '../../components/common/PasswordInput';
import toast from 'react-hot-toast';
import logoPng from '../../assets/moonlight_logo.png';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast.success('Logged in successfully');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div
          className="login-brand"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <img src={logoPng} alt="Moon Light Resort" className="login-logo" />
          <h1>Moon Light Resort</h1>
          <p>Billing Management System</p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="login-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <div className="login-field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@moonlight.com"
              autoComplete="email"
              disabled={loading}
              autoFocus
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <motion.button
            type="submit"
            className="login-btn"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.1 }}
          >
            {loading ? (
              <span className="login-btn-loading">Signing in...</span>
            ) : (
              <>
                <LogIn size={16} />
                Sign In
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
}
