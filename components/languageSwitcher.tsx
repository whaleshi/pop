import { useState } from 'react';
import { Button } from '@heroui/button';
import { Listbox, ListboxItem } from '@heroui/listbox';
import { Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
];

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  // Handle cases where i18n.language might be 'zh-CN' instead of 'zh'
  const getCurrentLanguage = () => {
    const currentLang = i18n.language;
    // First try exact match
    let found = languages.find(lang => lang.code === currentLang);
    // If not found, try matching the first part (e.g., 'zh' from 'zh-CN')
    if (!found && currentLang.includes('-')) {
      const langCode = currentLang.split('-')[0];
      found = languages.find(lang => lang.code === langCode);
    }
    return found || languages[0];
  };

  const currentLanguage = getCurrentLanguage();

  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button
          variant="light"
          size="sm"
          className="min-w-0 px-3 gap-2"
          startContent={<span className="text-lg">{currentLanguage.flag}</span>}
        >
          {currentLanguage.code.toUpperCase()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Listbox
          aria-label={t('common.language')}
          onAction={(key) => handleLanguageChange(key as string)}
          className="p-1"
        >
          {languages.map((language) => (
            <ListboxItem
              key={language.code}
              className="p-3"
              startContent={<span className="text-lg">{language.flag}</span>}
            >
              {language.name}
            </ListboxItem>
          ))}
        </Listbox>
      </PopoverContent>
    </Popover>
  );
}