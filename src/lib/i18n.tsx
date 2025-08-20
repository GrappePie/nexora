import React, {createContext, useContext} from 'react';
import messages from '@/messages/es.json';

const I18nContext = createContext(messages);

export function I18nProvider({children}:{children:React.ReactNode}) {
  return <I18nContext.Provider value={messages}>{children}</I18nContext.Provider>;
}

export function useTranslations() {
  return useContext(I18nContext);
}

