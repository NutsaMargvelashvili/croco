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
  
  // Get values from URL or fall back to global config
  const promotionIdFromUrl = urlParams.get("promotionId") || 
                           urlParams.get("promotionid") || 
                           urlParams.get("promotion-id") ||
                           urlParams.get("promoId") ||
                           urlParams.get("promoid");
  
  const externalId1FromUrl = urlParams.get("externalId1") ||
                           urlParams.get("externalid1") ||
                           urlParams.get("external-id1");
                           
  const externalId2FromUrl = urlParams.get("externalId2") ||
                           urlParams.get("externalid2") ||
                           urlParams.get("external-id2");
                           
  const tokenFromUrl = urlParams.get("token");

  // Initialize with URL values or global config values
  const [globalConfig, setGlobalConfig] = useState({
    ...globals,
    promotionId: promotionIdFromUrl || globals.promotionId,
    externalId1: externalId1FromUrl || globals.externalId1,
    externalId2: externalId2FromUrl || globals.externalId2,
    token: tokenFromUrl || globals.token,
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
      let valuesUpdated = false;
  
      // Get values from URL first, then globals
      const promotionId = urlParams.get("promotionId") || 
                         urlParams.get("promotionid") || 
                         urlParams.get("promotion-id") ||
                         urlParams.get("promoId") ||
                         urlParams.get("promoid") ||
                         globals.promotionId ||
                         prompt("Enter promotionId", "") 
  
      const externalId1 = urlParams.get("externalId1") ||
                         urlParams.get("externalid1") ||
                         urlParams.get("external-id1") ||
                         globals.externalId1 ||
                         prompt("Enter externalId1", "") 
  
      const externalId2 = urlParams.get("externalId2") ||
                         urlParams.get("externalid2") ||
                         urlParams.get("external-id2") ||
                         globals.externalId2 ||
                         prompt("Enter externalId2", "") 
  
      // Update state with new values
      setGlobalConfig(prev => ({
        ...prev,
        promotionId,
        externalId1,
        externalId2
      }));
  
      // Update URL with final values
      urlParams.set("promotionId", promotionId);
      if (externalId1) urlParams.set("externalId1", externalId1);
      if (externalId2) urlParams.set("externalId2", externalId2);
      window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    };
    setupGlobals()
  },[])
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
      const externalId1FromUrl = urlParams.get("externalId1") ||
                               urlParams.get("externalid1") ||
                               urlParams.get("external-id1");
                               
      const externalId2FromUrl = urlParams.get("externalId2") ||
                               urlParams.get("externalid2") ||
                               urlParams.get("external-id2");

      setGlobalConfig(prev => ({
        ...prev,
        promotionId: promotionIdFromUrl || globals.promotionId || prev.promotionId,
        externalId1: externalId1FromUrl || globals.externalId1 || prev.externalId1,
        externalId2: externalId2FromUrl || globals.externalId2 || prev.externalId2,
        token: tokenFromUrl || globals.token || prev.token
      }));
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