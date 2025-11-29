import React from 'react';
import { User, Lock } from 'lucide-react';
import { useLocalize } from '~/hooks';

interface LoginCardProps {
  onSubmit?: (e: React.FormEvent) => void;
  children?: React.ReactNode;
}

/**
 * LoginCard Component
 * Displays the white card container with logo, title, subtitle, and login form
 */
const LoginCard: React.FC<LoginCardProps> = ({ onSubmit, children }) => {
  const localize = useLocalize();
  const [rememberMe, setRememberMe] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <div className="login-card">
      {/* Logo */}
      <img
        src="/assets/radio-monitoring-logo.svg"
        alt="无线随申查（开放版）"
        className="login-logo"
      />

      {/* Title */}
      <h1 className="login-title">无线电监测平台政务管理系统</h1>

      {/* Subtitle */}
      <p className="login-subtitle">安全、高效、积累的联务服务入口</p>

      {/* Login Form */}
      {children || (
        <form onSubmit={handleSubmit}>
          {/* Username Input */}
          <div className="login-input-group">
            <User className="login-input-icon" />
            <input
              type="text"
              className="login-input"
              placeholder={localize('com_auth_email')}
              name="username"
              required
            />
          </div>

          {/* Password Input */}
          <div className="login-input-group">
            <Lock className="login-input-icon" />
            <input
              type="password"
              className="login-input"
              placeholder={localize('com_auth_password')}
              name="password"
              required
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="login-remember-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="mr-2"
              />
              记住我
            </label>
            <a href="/forgot-password" className="login-forgot-link">
              忘记密码？
            </a>
          </div>

          {/* Login Button */}
          <button type="submit" className="login-button">
            登录
          </button>

          {/* Register Link */}
          <div className="login-register-link">
            没有账号？<a href="/register">立即注册</a>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginCard;
