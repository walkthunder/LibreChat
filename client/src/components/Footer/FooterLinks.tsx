import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useGetStartupConfig } from '~/data-provider';

interface LinkItem {
  title: string;
  url: string;
}

interface LinkCategory {
  title: string;
  links: LinkItem[];
}

const defaultFooterLinksData: LinkCategory[] = [
  {
    title: '友情链接',
    links: [
      { title: '中华人民共和国工业和信息化部', url: 'http://www.miit.gov.cn' },
      { title: '北京东方波泰无线电频谱技术研究所有限公司', url: 'http://www.oetsi.com' },
      { title: '国家无线电监测中心检测中心', url: 'https://www.srtc.org.cn' },
      { title: '中国通信标准化协会', url: 'http://www.ccsa.org.cn' },
      { title: '中国电子学会', url: 'http://www.cie-info.org.cn' },
      { title: '中国工信产业网', url: 'http://www.cnii.com.cn' },
      { title: '电子信息产业网', url: 'http://www.cena.com.cn' },
      { title: '《数字通信世界》', url: 'http://www.dcw.org.cn' },
      { title: '中国无线电协会', url: 'http://www.rachina.org.cn' },
      { title: 'ITU无线通信局', url: 'http://www.itu.int/zh/Pages/default.aspx' },
      { title: '亚太电信组织APT', url: 'http://www.aptsec.org' },
    ],
  },
  {
    title: '地方频道',
    links: [
      { title: '北京', url: 'http://jxj.beijing.gov.cn/' },
      { title: '天津', url: 'http://gyxxh.tj.gov.cn/' },
      { title: '河北', url: 'http://gxt.hebei.gov.cn/hbgyhxxht/index/index.html' },
      { title: '山西', url: 'http://gxt.shanxi.gov.cn/' },
      { title: '内蒙古', url: 'http://gxt.nmg.gov.cn/index.html' },
      { title: '辽宁', url: 'http://gxt.ln.gov.cn/' },
      { title: '吉林', url: 'http://gxt.jl.gov.cn' },
      { title: '黑龙江', url: 'http://www.hljrm.cn' },
      { title: '上海', url: 'http://www.shanghai.gov.cn/' },
      { title: '江苏', url: 'http://gxt.jiangsu.gov.cn/' },
      { title: '浙江', url: 'http://jxt.zj.gov.cn/' },
      { title: '安徽', url: 'http://jx.ah.gov.cn/' },
      { title: '福建', url: 'http://gxt.fujian.gov.cn/' },
      { title: '江西', url: 'http://gxt.jiangxi.gov.cn/' },
      { title: '山东', url: 'http://gxt.shandong.gov.cn/index.html' },
      { title: '河南', url: 'http://gxt.henan.gov.cn/' },
      { title: '湖北', url: 'http://jxt.hubei.gov.cn/' },
      { title: '湖南', url: 'http://gxt.hunan.gov.cn/wxd_ycl/' },
      { title: '广东', url: 'http://gdii.gd.gov.cn/' },
      { title: '广西', url: 'http://gxt.gxzf.gov.cn/' },
      { title: '海南', url: 'http://iitb.hainan.gov.cn/' },
      { title: '重庆', url: 'http://jjxxw.cq.gov.cn/' },
      { title: '四川', url: 'https://jxt.sc.gov.cn/' },
      { title: '贵州', url: 'http://gxt.guizhou.gov.cn/' },
      { title: '云南', url: 'http://gxt.yn.gov.cn/' },
      { title: '西藏', url: 'http://jxt.xizang.gov.cn/index.html' },
      { title: '陕西', url: 'http://wxd.shaanxi.gov.cn' },
      { title: '甘肃', url: 'http://gxt.gansu.gov.cn/' },
      { title: '青海', url: 'http://www.qhrm.gov.cn' },
      { title: '宁夏', url: 'http://nxww.nx.gov.cn/' },
      { title: '新疆', url: 'http://gxt.xinjiang.gov.cn/' },
    ],
  },
  {
    title: '国际链接',
    links: [
      { title: '美国电子电气工程师学会', url: 'http://www.ieee.org/index.html' },
      { title: '欧洲无线电通信办公室/美洲电信组织', url: 'http://www.citel.oas.org' },
      { title: '美国联邦通信委员会', url: 'http://www.fcc.gov' },
      { title: '乌克兰国家无线电频率和电信监管中心', url: 'http://www.ucrf.gov.ua' },
      { title: '法国频率署', url: 'http://www.anfr.fr/fr/anfr.html' },
      { title: '英国通信办公室', url: 'http://www.ofcom.org.uk' },
      { title: '韩国通信委员会', url: 'http://eng.kcc.go.kr/user/ehpMain.do' },
      { title: '日本总务省信息与通信局', url: 'http://www.soumu.go.jp/english/icb/index.html' },
    ],
  },
];

export default function FooterLinks() {
  const { data: config } = useGetStartupConfig();
  const [openPopover, setOpenPopover] = useState<string | null>(null);
  const popoverRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Use config data if available, otherwise use default data
  const footerLinksData = config?.interface?.footerLinks || defaultFooterLinksData;
  const supervisionEmail = config?.interface?.supervisionEmail || 'jijian@srrc.org.cn';
  const supervisionPhone = config?.interface?.supervisionPhone || '010-68009150';

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openPopover && popoverRefs.current[openPopover]) {
        const popoverElement = popoverRefs.current[openPopover];
        if (popoverElement && !popoverElement.contains(event.target as Node)) {
          setOpenPopover(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPopover]);

  const togglePopover = (title: string) => {
    setOpenPopover(openPopover === title ? null : title);
  };

  return (
    <div className="footer-gov bg-gov-background-tertiary border-gov-primary border-t-2 py-3">
      <div className="mx-auto max-w-7xl px-4">
        {/* 友情链接分类 - 水平排列 */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
          {footerLinksData.map((category) => (
            <div
              key={category.title}
              className="relative"
              ref={(el) => (popoverRefs.current[category.title] = el)}
            >
              {/* 分类按钮 */}
              <button
                onClick={() => togglePopover(category.title)}
                className="text-gov-primary hover:text-gov-primary-light flex items-center gap-1 rounded-md bg-white px-3 py-2 text-xs font-semibold shadow-sm transition-all hover:shadow-md dark:bg-gray-800 dark:hover:bg-gray-700 md:px-4 md:text-sm"
                aria-expanded={openPopover === category.title}
              >
                <span>{category.title}</span>
                <ChevronDown
                  className={`h-3 w-3 transition-transform md:h-4 md:w-4 ${
                    openPopover === category.title ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 悬浮窗 */}
              {openPopover === category.title && (
                <div className="absolute bottom-full left-1/2 z-50 mb-2 w-[85vw] max-w-md -translate-x-1/2 transform rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 md:w-96">
                  {/* 箭头 */}
                  <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 transform border-b border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"></div>

                  {/* 内容 */}
                  <div className="relative max-h-[60vh] overflow-y-auto rounded-lg p-3 md:max-h-96 md:p-4">
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {category.links.map((link) => (
                        <a
                          key={link.url}
                          href={link.url}
                          target="_blank"
                          rel="nofollow noopener noreferrer"
                          className="link-gov rounded px-2 py-2 text-xs transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 md:px-3"
                          title={link.title}
                          onClick={() => setOpenPopover(null)}
                        >
                          {link.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 纪检监督信息 - 紧凑显示，移动端隐藏 */}
          <div className="text-gov-text-secondary ml-4 hidden border-l border-gray-300 pl-4 text-xs dark:border-gray-600 md:block">
            <span>
              纪检监督：
              <a
                href={`mailto:${supervisionEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-gov ml-1"
              >
                {supervisionEmail}
              </a>
              {' | '}
              {supervisionPhone}
            </span>
          </div>
        </div>

        {/* 移动端纪检监督信息 - 单独一行 */}
        <div className="text-gov-text-secondary mt-3 border-t border-gray-300 pt-3 text-center text-xs dark:border-gray-600 md:hidden">
          <div className="space-y-1">
            <div>
              纪检监督：
              <a
                href={`mailto:${supervisionEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                className="link-gov ml-1"
              >
                {supervisionEmail}
              </a>
            </div>
            <div>{supervisionPhone}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
