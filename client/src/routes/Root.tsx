import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import type { ContextType } from '~/common';
import {
  useSearchEnabled,
  useAssistantsMap,
  useAuthContext,
  useAgentsMap,
  useFileMap,
  useUrlParams,
} from '~/hooks';
import {
  PromptGroupsProvider,
  AssistantsMapContext,
  AgentsMapContext,
  SetConvoProvider,
  FileMapContext,
  UrlParamsProvider,
} from '~/Providers';
import { useUserTermsQuery, useGetStartupConfig } from '~/data-provider';
import { TermsAndConditionsModal } from '~/components/ui';
import { Nav, MobileNav } from '~/components/Nav';
import { useHealthCheck } from '~/data-provider';
import { Banner } from '~/components/Banners';
import FooterLinks from '~/components/Footer/FooterLinks';
import GovHeader from '~/components/Header/GovHeader';

export default function Root() {
  const [showTerms, setShowTerms] = useState(false);
  const [bannerHeight, setBannerHeight] = useState(0);
  
  // Parse URL parameters
  const { params: urlParams, errors: urlParamErrors } = useUrlParams();
  
  // Initialize navVisible state with URL parameter or localStorage
  const [navVisible, setNavVisible] = useState(() => {
    // URL parameter takes precedence over localStorage
    if (urlParams.sidebar === 'hidden') {
      return false;
    } else if (urlParams.sidebar === 'visible') {
      return true;
    }
    
    // Fall back to localStorage
    const savedNavVisible = localStorage.getItem('navVisible');
    return savedNavVisible !== null ? JSON.parse(savedNavVisible) : true;
  });

  const { isAuthenticated, logout } = useAuthContext();
  
  // Log URL parameter errors if any
  useEffect(() => {
    if (urlParamErrors.length > 0) {
      console.warn('URL parameter errors:', urlParamErrors);
    }
  }, [urlParamErrors]);

  // Global health check - runs once per authenticated session
  useHealthCheck(isAuthenticated);

  const assistantsMap = useAssistantsMap({ isAuthenticated });
  const agentsMap = useAgentsMap({ isAuthenticated });
  const fileMap = useFileMap({ isAuthenticated });

  const { data: config } = useGetStartupConfig();
  const { data: termsData } = useUserTermsQuery({
    enabled: isAuthenticated && config?.interface?.termsOfService?.modalAcceptance === true,
  });

  useSearchEnabled(isAuthenticated);

  useEffect(() => {
    if (termsData) {
      setShowTerms(!termsData.termsAccepted);
    }
  }, [termsData]);

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleDeclineTerms = () => {
    setShowTerms(false);
    logout('/login?redirect=false');
  };

  if (!isAuthenticated) {
    return null;
  }

  // Determine if navbar should be shown based on URL parameter
  const showNavbar = urlParams.navbar !== 'hidden';
  
  // Check if any URL parameters are controlling the UI
  const isUrlControlled = !!(urlParams.sidebar || urlParams.navbar);

  return (
    <UrlParamsProvider value={{ urlParams, isUrlControlled }}>
      <SetConvoProvider>
        <FileMapContext.Provider value={fileMap}>
          <AssistantsMapContext.Provider value={assistantsMap}>
            <AgentsMapContext.Provider value={agentsMap}>
              <PromptGroupsProvider>
                <Banner onHeightChange={setBannerHeight} />
                <div className="flex flex-col" style={{ height: `calc(100dvh - ${bannerHeight}px)` }}>
                  {/* 政府风格Header - conditionally rendered based on navbar URL parameter */}
                  {showNavbar && <GovHeader />}

                  <div className="relative z-0 flex h-full w-full overflow-hidden">
                    <Nav navVisible={navVisible} setNavVisible={setNavVisible} />
                    <div className="relative flex h-full max-w-full flex-1 flex-col overflow-hidden">
                      <MobileNav navVisible={navVisible} setNavVisible={setNavVisible} />
                      <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-auto">
                          <Outlet context={{ navVisible, setNavVisible } satisfies ContextType} />
                        </div>
                        <FooterLinks />
                      </div>
                    </div>
                  </div>
                </div>
              </PromptGroupsProvider>
            </AgentsMapContext.Provider>
            {config?.interface?.termsOfService?.modalAcceptance === true && (
              <TermsAndConditionsModal
                open={showTerms}
                onOpenChange={setShowTerms}
                onAccept={handleAcceptTerms}
                onDecline={handleDeclineTerms}
                title={config.interface.termsOfService.modalTitle}
                modalContent={config.interface.termsOfService.modalContent}
              />
            )}
          </AssistantsMapContext.Provider>
        </FileMapContext.Provider>
      </SetConvoProvider>
    </UrlParamsProvider>
  );
}
