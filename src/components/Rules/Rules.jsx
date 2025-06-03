import { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import './Rules.scss';

const RuleItem = ({ title, content, isOpen, onToggle }) => {
  return (
    <div className={`rule-item ${isOpen ? 'open' : ''}`}>
      <button className="rule-item-header" onClick={onToggle}>
        <span className="rule-subtitle">{title}</span>
        <span className="rule-arrow">{isOpen ? '▼' : '▲'}</span>
      </button>
      {isOpen && (
        <div className="rule-item-content">
          <p className="rule-text">{content}</p>
        </div>
      )}
    </div>
  );
};

const RuleSection = ({ title, content, isOpen, onToggle }) => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (index) => {
    setOpenItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <div className={`rule-section ${isOpen ? 'open' : ''}`}>
      <button className="rule-header" onClick={onToggle}>
        <span className="rule-title">{title}</span>
        <span className="rule-arrow">{isOpen ? '▼' : '▲'}</span>
      </button>
      {isOpen && Array.isArray(content) && (
        <div className="rule-content">
          {content.map((rule, index) => (
            <RuleItem
              key={index}
              title={rule.title}
              content={rule.content}
              isOpen={openItems[index]}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>
      )}
      {isOpen && !Array.isArray(content) && (
        <div className="rule-content">
          {content}
        </div>
      )}
    </div>
  );
};

const Rules = () => {
  const { globalConfig, fetchEndpoint } = useGlobal();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        // const rulesData = await fetchRules(fetchEndpoint, globalConfig.promotionId);
        
        const parsedRules = [
            {
          title: "წესები",
          content: [
            {
              title: "რა არის CASINO VIP ფრომოუშენი?",
              content: "Casino VIP ლიდერბორდი არის კროკობეთის სპეციალური აქცია, რომელიც საშუალებას გაძლევს მოხვდე ყოველკვირეულ და ფინალურ ლიდერბორდებში რულეტკაში განთავსებული ფსონით, მოიგო წილი 200 000 ლარის ფრიჩიპიდან და გახდე Volvo"
            },
            {
              title: "როდის იწყება და მთავრდება აქცია?",
              content: "აქცია იწყება 31 მარტს, 00:00 საათზე და მთავრდება 25 მაისს, 23:59 საათზე"
            },
            {
              title: "როგორი თამაშები მონაწილეობს აქციაში?",
              content: "აქციაში მონაწილეობს Evolution Gaming-ის რულეტკები, Crocobet Live Auto Roulette და Crocobet live Roulette"
            }
          ]
        },
        {
            title: "დამატებითი წესები",
            content: "აქცია იწყება 31 მარტს, 00:00 საათზე და მთავრდება 25 მაისს, 23:59 საათზე"
          }
    ];
        
        setRules(parsedRules);
        // setOpenSections({ 0: true });
      } catch (err) {
        setError(err.message);
        console.error('Error loading rules:', err);
      } finally {
        setLoading(false);
      }
    };

    if (globalConfig.promotionId) {
      loadRules();
    }
  }, [globalConfig.promotionId, fetchEndpoint]);

  const toggleSection = (index) => {
    setOpenSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  if (loading) {
    return <div className="rules-loading">Loading rules...</div>;
  }

  if (error) {
    return <div className="rules-error">Error: {error}</div>;
  }

  if (!rules.length) {
    return null;
  }

  return (
    <div className="rules">
      {rules.map((rule, index) => (
        <RuleSection
          key={index}
          title={rule.title}
          content={rule.content}
          isOpen={openSections[index]}
          onToggle={() => toggleSection(index)}
        />
      ))}
    </div>
  );
};

export default Rules; 