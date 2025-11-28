import { useLocalize } from '~/hooks';
import { TStartupConfig } from 'librechat-data-provider';

function Footer({ startupConfig }: { startupConfig: TStartupConfig | null | undefined }) {
  const localize = useLocalize();
  if (!startupConfig) {
    return null;
  }
  const privacyPolicy = startupConfig.interface?.privacyPolicy;
  const termsOfService = startupConfig.interface?.termsOfService;

  const privacyPolicyRender = privacyPolicy?.externalUrl && (
    <a
      className="text-sm text-green-500"
      href={privacyPolicy.externalUrl}
      target={privacyPolicy.openNewTab ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_privacy_policy')}
    </a>
  );

  const termsOfServiceRender = termsOfService?.externalUrl && (
    <a
      className="text-sm text-green-500"
      href={termsOfService.externalUrl}
      target={termsOfService.openNewTab ? '_blank' : undefined}
      rel="noreferrer"
    >
      {localize('com_ui_terms_of_service')}
    </a>
  );

  return (
    <div className="m-4 flex flex-col items-center gap-3" role="contentinfo">
      {/* 政策链接 */}
      <div className="flex justify-center gap-2">
        {privacyPolicyRender}
        {privacyPolicyRender && termsOfServiceRender && (
          <div className="border-r-[1px] border-gray-300 dark:border-gray-600" />
        )}
        {termsOfServiceRender}
      </div>
      
      {/* 单位信息 */}
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          上海市经济和信息化委员会
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          上海市无线电监测站
        </p>
      </div>
      
      {/* 版权信息 */}
      <p className="text-xs text-gray-500 dark:text-gray-500">
        © 2025 上海市无线电监测站
      </p>
    </div>
  );
}

export default Footer;
