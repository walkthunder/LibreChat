import { useState, useEffect } from 'react';
import { Globe, Mail } from 'lucide-react';
import { useGetStartupConfig } from '~/data-provider';

export default function GovHeader() {
  const { data: config } = useGetStartupConfig();
  const [currentTime, setCurrentTime] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);

  // 更新时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekday = weekdays[now.getDay()];

      setCurrentTime(`${year}年${month}月${day}日  ${weekday}`);
    };

    updateTime();
    const timer = setInterval(updateTime, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, []);

  const appTitle = config?.appTitle || '无线随申查（开放版）';
  const organizationPrimary = config?.interface?.organizationPrimary || '上海无线电监测站';
  // const organizationSecondary =
  //   config?.interface?.organizationSecondary || '国家无线电频谱管理中心';

  return (
    <div className="header-gov bg-gov-background-secondary border-gov-primary border-b-2 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Logo区域 */}
          <div className="flex items-center gap-3">
            <div className="bg-gov-primary flex h-12 w-12 items-center justify-center rounded-md md:h-16 md:w-16">
              <img
                src="/assets/radio-monitoring-logo.svg"
                alt={appTitle}
                className="h-10 w-10 md:h-14 md:w-14"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-gov-primary text-lg font-bold md:text-xl">{appTitle}</h1>
              <p className="text-gov-text-secondary text-xs md:text-sm">
                Radio Monitoring Platform
              </p>
            </div>
          </div>

          {/* 右侧功能区 */}
          <div className="flex flex-col gap-2 md:items-end">
            {/* 第一行：时间、语言、邮箱、微信 */}
            <div className="flex flex-wrap items-center gap-3 text-xs md:gap-4 md:text-sm">
              {/* 时间 */}
              <span className="text-gov-text-secondary">{currentTime}</span>

              {/* 语言切换 */}
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-primary hover:text-gov-primary-light flex items-center gap-1 transition-colors"
                title="English"
              >
                <Globe className="h-4 w-4" />
                <span>English</span>
              </a>

              {/* 邮箱 */}
              <a
                href="https://mail.srrc.org.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-primary hover:text-gov-primary-light transition-colors"
                title="邮箱"
              >
                <Mail className="h-4 w-4" />
              </a>

              {/* 微信公众号 */}
              <div className="relative">
                <button
                  onMouseEnter={() => setShowQRCode(true)}
                  onMouseLeave={() => setShowQRCode(false)}
                  className="text-gov-primary hover:text-gov-primary-light transition-colors"
                  title="微信公众号"
                  aria-label="微信公众号"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M8.5 9.5C8.5 10.0523 8.05228 10.5 7.5 10.5C6.94772 10.5 6.5 10.0523 6.5 9.5C6.5 8.94772 6.94772 8.5 7.5 8.5C8.05228 8.5 8.5 8.94772 8.5 9.5Z" />
                    <path d="M11.5 9.5C11.5 10.0523 11.0523 10.5 10.5 10.5C9.94772 10.5 9.5 10.0523 9.5 9.5C9.5 8.94772 9.94772 8.5 10.5 8.5C11.0523 8.5 11.5 8.94772 11.5 9.5Z" />
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9 2C4.58172 2 1 5.13401 1 9C1 11.0832 1.89543 13.0027 3.34508 14.4635C3.29168 15.0804 3.12404 16.0785 2.75176 17.0901C2.51264 17.7506 2.20754 18.4072 1.81328 18.9793C1.61554 19.2662 1.39326 19.5398 1.13566 19.7726C0.875 20.0078 0.5 20.2656 0.5 20.75C0.5 21.4404 1.05964 22 1.75 22C2.81879 22 4.49246 21.4771 6.13867 20.5625C7.0332 20.0527 7.91797 19.4258 8.66406 18.7344C8.77344 18.7441 8.88672 18.75 9 18.75C13.4183 18.75 17 15.616 17 12C17 8.38401 13.4183 5.25 9 5.25C4.58172 5.25 1 8.38401 1 12Z"
                    />
                  </svg>
                </button>

                {/* 二维码悬浮窗 */}
                {showQRCode && (
                  <div className="absolute right-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                    <div className="h-32 w-32 bg-gray-200 dark:bg-gray-700">
                      {/* 这里放置实际的二维码图片 */}
                      <div className="flex h-full items-center justify-center text-xs text-gray-500">
                        微信公众号
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 第二行：主办单位 */}
            <div className="text-gov-text-secondary flex flex-wrap items-center gap-1 text-xs">
              <span className="font-medium">主办：</span>
              <span className="text-gov-primary">{organizationPrimary}</span>
              {/* <span className="hidden md:inline">|</span>
              <span className="text-gov-primary">{organizationSecondary}</span> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
