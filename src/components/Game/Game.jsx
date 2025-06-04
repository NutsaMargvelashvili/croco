import { useState, useEffect, useRef } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import './Game.scss';

const Game = () => {
  const { globalConfig } = useGlobal();
  const [error, setError] = useState(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Only proceed if iframe is mounted
    console.log(iframeRef.current, "iframe ref");
    if (!iframeRef.current) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      let gameUrl = "http://192.168.88.201:3004/";
      
      // Get promotionId from globals first, then URL
      const promotionId = globalConfig.promotionId || 
                         urlParams.get("promotionId") || 
                         urlParams.get("promotionid") || 
                         urlParams.get("promotion-id");
      
      // Get token from globals first, then URL
      const token = globalConfig.token || urlParams.get("token");

      // Update URL parameters if values are from globals
      const newUrlParams = new URLSearchParams(window.location.search);
      
      if (promotionId && !urlParams.has("promotionid")) {
        newUrlParams.set("promotionid", promotionId);
      }
      
      if (token && !urlParams.has("token")) {
        newUrlParams.set("token", token);
      }

      // Update browser URL if parameters were added
      const newSearch = newUrlParams.toString();
      if (newSearch !== urlParams.toString()) {
        window.history.replaceState(
          {}, 
          '', 
          `${window.location.pathname}${newSearch ? '?' + newSearch : ''}`
        );
      }

      // Add promotionId if available
      if (promotionId) {
        gameUrl += `?promotionid=${promotionId}`;
      }
      
      // Add token if available
      if (token) {
        gameUrl += gameUrl.includes('?') ? `&token=${token}` : `?token=${token}`;
      }

      console.log('Setting game URL:', gameUrl);
      iframeRef.current.src = gameUrl;
    } catch (err) {
      console.error('Error setting game URL:', err);
      if (iframeRef.current) {
        iframeRef.current.src = 'about:blank';
      }
      setError(err.message);
    }
  }, [globalConfig.promotionId, globalConfig.token, iframeRef.current]);

  if (error) {
    return <div className="game-error">Error: {error}</div>;
  }

  return (
    <div className="game-container">
      <div className="game-area">
        <div className="game-frame-container">
          <iframe
            ref={iframeRef}
            className="game-frame"
            src="about:blank"
            title="Game Frame"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

export default Game; 