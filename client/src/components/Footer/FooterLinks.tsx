import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LinkItem {
  title: string;
  url: string;
}

interface LinkCategory {
  title: string;
  links: LinkItem[];
}

const footerLinksData: LinkCategory[] = [
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (title: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  return (
    <div className="footer-gov border-t-2 border-gov-primary bg-gov-background-tertiary py-6">
      <div className="mx-auto max-w-7xl px-4">
        {/* 友情链接分类 */}
        <div className="space-y-4">
          {footerLinksData.map((category) => (
            <div key={category.title} className="rounded-gov border border-gov-border-light bg-white dark:bg-gray-800">
              {/* 分类标题 */}
              <button
                onClick={() => toggleCategory(category.title)}
                className="flex w-full items-center justify-between rounded-gov bg-gray-50 px-4 py-3 text-left font-semibold text-gov-primary transition-colors hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                aria-expanded={expandedCategories.has(category.title)}
              >
                <span>{category.title}</span>
                {expandedCategories.has(category.title) ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </button>

              {/* 链接列表 */}
              {expandedCategories.has(category.title) && (
                <div className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {category.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="link-gov rounded px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                      title={link.title}
                    >
                      {link.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 纪检监督信息 */}
        <div className="mt-6 border-t border-gov-border-light pt-4 text-center text-sm text-gov-text-secondary">
          <div className="space-y-1">
            <p>
              中心纪检监督举报信箱{' '}
              <a
                href="mailto:jijian@srrc.org.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="link-gov"
              >
                jijian@srrc.org.cn
              </a>
            </p>
            <p>中心纪检监督举报电话 010-68009150</p>
          </div>
        </div>
      </div>
    </div>
  );
}
