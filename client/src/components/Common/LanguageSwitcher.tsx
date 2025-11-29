import React, { useState } from 'react';
import { Globe, HelpCircle } from 'lucide-react';

interface LanguageSwitcherProps {
  showHelp?: boolean;
  onHelpClick?: () => void;
}

/**
 * LanguageSwitcher Component
 * Displays language toggle (中文/EN) with optional help icon
 */
const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  showHelp = true,
  onHelpClick,
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<'zh' | 'en'>('zh');

  const handleLanguageChange = (lang: 'zh' | 'en') => {
    setCurrentLanguage(lang);
    // TODO: Implement actual language switching logic
    console.log('Language changed to:', lang);
  };

  return (
    <div className="login-top-bar">
      {/* Language Switcher */}
      <div className="language-switcher">
        <Globe size={16} className="mr-1" />
        <button
          className={`language-option ${currentLanguage === 'zh' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('zh')}
        >
          中文
        </button>
        <span className="text-white/50">/</span>
        <button
          className={`language-option ${currentLanguage === 'en' ? 'active' : ''}`}
          onClick={() => handleLanguageChange('en')}
        >
          EN
        </button>
      </div>

      {/* Help Icon */}
      {showHelp && (
        <button
          className="help-icon"
          onClick={onHelpClick}
          aria-label="帮助"
          title="帮助"
        >
          <HelpCircle size={20} />
        </button>
      )}
    </div>
  );
};

export default LanguageSwitcher;
