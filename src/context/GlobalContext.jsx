import { createContext, useContext, useState, useEffect } from 'react';
import { globals } from '../configs/global.config';
import { fetchEndpoint } from '../utils/fetchEndpoint.util';

export const GlobalContext = createContext();

const tryParseJson = (text) => {
  let processedText = text.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  processedText = processedText.replace(/'/g, '"');
  try {
    return { parsedObject: JSON.parse(processedText), parsedSuccessfully: true };
  } catch (e) {
    return { parsedObject: text, parsedSuccessfully: false };
  }
};

export const GlobalProvider = ({ children }) => {
  const urlParams = new URLSearchParams(window.location.search);
  const promotionIdFromUrl = urlParams.get("promotionId") || 
                           urlParams.get("promotionid") || 
                           urlParams.get("promotion-id") ||
                           urlParams.get("promoId") ||
                           urlParams.get("promoid");
  
  const tokenFromUrl = urlParams.get("token");
  const externalIdFromUrl = urlParams.get("externalId") || 
                          urlParams.get("externalid") || 
                          urlParams.get("external-id") || 
                          urlParams.get("leaderboardId") || 
                          urlParams.get("leaderboardid");

  const [globalConfig, setGlobalConfig] = useState({
    ...globals,
    promotionId: promotionIdFromUrl || globals.promotionId,
    token: tokenFromUrl || globals.token,
    externalId: externalIdFromUrl,
    translate: (text, lang) => {
      const parsed = tryParseJson(text);
      if (parsed.parsedSuccessfully) {
        return (
          parsed.parsedObject[lang] ||
          parsed.parsedObject[globals.defaultLanguage] ||
          "<strong>content not found</strong>"
        );
      }
      return text;
    }
  });

  useEffect(() => {
    const setupGlobals = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      let promotionId = globalConfig.promotionId;
      
      if (!promotionId) {
        const userInput = prompt("Enter promotionId", "");
        if (userInput) {
          promotionId = userInput;
        } else {
          promotionId = "default-promotion";
        }
        setGlobalConfig(prev => ({
          ...prev,
          promotionId
        }));
      }
      
      // Always update URL with current promotionId
      urlParams.set("promotionId", promotionId);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    };

    setupGlobals();
  }, []);

  // Add effect to handle URL parameter changes
  useEffect(() => {
    const handleUrlChange = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const promotionIdFromUrl = urlParams.get("promotionId") || 
                               urlParams.get("promotionid") || 
                               urlParams.get("promotion-id") ||
                               urlParams.get("promoId") ||
                               urlParams.get("promoid");
      
      const tokenFromUrl = urlParams.get("token");
      const externalIdFromUrl = urlParams.get("externalId") || 
                              urlParams.get("externalid") || 
                              urlParams.get("external-id") || 
                              urlParams.get("leaderboardId") || 
                              urlParams.get("leaderboardid");

      if (promotionIdFromUrl) {
        setGlobalConfig(prev => ({
          ...prev,
          promotionId: promotionIdFromUrl
        }));
      }

      if (tokenFromUrl) {
        setGlobalConfig(prev => ({
          ...prev,
          token: tokenFromUrl
        }));
      }

      if (externalIdFromUrl) {
        setGlobalConfig(prev => ({
          ...prev,
          externalId: externalIdFromUrl
        }));
      }
    };

    // Listen for URL changes
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  return (
    <GlobalContext.Provider value={{ 
      globalConfig,
      setGlobalConfig,
      fetchEndpoint 
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
}; 