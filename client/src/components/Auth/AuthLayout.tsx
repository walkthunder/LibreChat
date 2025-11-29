import { ThemeSelector } from '@librechat/client';
import { TStartupConfig } from 'librechat-data-provider';
import { ErrorMessage } from '~/components/Auth/ErrorMessage';
import { TranslationKeys, useLocalize } from '~/hooks';
import SocialLoginRender from './SocialLoginRender';
import { BlinkAnimation } from './BlinkAnimation';
import { Banner } from '../Banners';
import Footer from './Footer';
import LoginBackground from './LoginBackground';
import LanguageSwitcher from '../Common/LanguageSwitcher';
import '~/styles/login-page.css';

function AuthLayout({
  children,
  header,
  isFetching,
  startupConfig,
  startupConfigError,
  pathname,
  error,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  isFetching: boolean;
  startupConfig: TStartupConfig | null | undefined;
  startupConfigError: unknown | null | undefined;
  pathname: string;
  error: TranslationKeys | null;
}) {
  const localize = useLocalize();

  const hasStartupConfigError = startupConfigError !== null && startupConfigError !== undefined;
  const DisplayError = () => {
    if (hasStartupConfigError) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize('com_auth_error_login_server')}</ErrorMessage>
        </div>
      );
    } else if (error === 'com_auth_error_invalid_reset_token') {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>
            {localize('com_auth_error_invalid_reset_token')}{' '}
            <a className="font-semibold text-green-600 hover:underline" href="/forgot-password">
              {localize('com_auth_click_here')}
            </a>{' '}
            {localize('com_auth_to_try_again')}
          </ErrorMessage>
        </div>
      );
    } else if (error != null && error) {
      return (
        <div className="mx-auto sm:max-w-sm">
          <ErrorMessage>{localize(error)}</ErrorMessage>
        </div>
      );
    }
    return null;
  };

  const subtitle = '安全、高效、积累的联务服务入口';

  return (
    <div className="relative flex min-h-screen flex-col">
      <Banner />
      <LoginBackground />
      <LanguageSwitcher showHelp={true} />
      <BlinkAnimation active={isFetching}>
        <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
          <div className="login-card">
            <img
              src="assets/radio-monitoring-logo.svg"
              className="login-logo"
              alt={startupConfig?.appTitle ?? '无线随申查（开放版）'}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'assets/logo.svg';
              }}
            />
            {!hasStartupConfigError && !isFetching && header && (
              <h1 className="login-title" style={{ userSelect: 'none' }}>
                {header}
              </h1>
            )}
            <p className="login-subtitle">{subtitle}</p>
            <DisplayError />
            {children}
            {!pathname.includes('2fa') &&
              (pathname.includes('login') || pathname.includes('register')) && (
                <SocialLoginRender startupConfig={startupConfig} />
              )}
          </div>
        </div>
      </BlinkAnimation>
      <div className="absolute bottom-4 left-4 z-20">
        <ThemeSelector />
      </div>
      <Footer startupConfig={startupConfig} />
    </div>
  );
}

export default AuthLayout;
