import { useState, useEffect } from 'react';
import { useGlobal } from '../../context/GlobalContext';
import balanceService, { fetchPlayerBalances } from '../../services/balanceService';
import './Balance.scss';

const Balance = () => {
  const { globalConfig, fetchEndpoint } = useGlobal();
  const [balance, setBalance] = useState({
    coinIn: { amount: 0, name: '' },
    freespins: { amount: 0, name: '' },
    promoCoin: { amount: 0, name: '' },
    assetCoin: { amount: 0, name: '' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initial balance fetch
  useEffect(() => {
    const loadInitialBalance = async () => {
      try {
        if (!globalConfig.token || !globalConfig.promotionId) {
          throw new Error('Missing token or promotionId');
        }

        setLoading(true);
        const balanceData = await fetchPlayerBalances(
          fetchEndpoint,
          globalConfig.promotionId,
          globalConfig.token
        );

        // Transform and set initial balance
        const transformedBalance = balanceService.transformBalanceData(balanceData);
        setBalance(transformedBalance);
      } catch (err) {
        console.error('Failed to fetch initial balance:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadInitialBalance();
  }, [globalConfig.token, globalConfig.promotionId, fetchEndpoint]);

  // Socket connection and updates
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        if (!globalConfig.token || !globalConfig.promotionId) {
          return;
        }

        // Initialize balance service with socket connection
        await balanceService.initialize(
          globalConfig.token,
          globalConfig.promotionId
        );

        // Subscribe to balance updates
        const unsubscribe = balanceService.subscribe((socketBalance) => {
          setBalance(prev => ({
            coinIn: { ...prev.coinIn, amount: socketBalance.coinIn },
            freespins: { ...prev.freespins, amount: socketBalance.freespins },
            promoCoin: { ...prev.promoCoin, amount: socketBalance.promoCoin },
            assetCoin: { ...prev.assetCoin, amount: socketBalance.assetCoin }
          }));
        });

        return () => {
          unsubscribe();
          balanceService.cleanup();
        };
      } catch (err) {
        console.error('Failed to initialize socket:', err);
      }
    };

    initializeSocket();
  }, [globalConfig.token, globalConfig.promotionId]);

  if (loading) {
    return <div className="balance-loading">Loading balance...</div>;
  }

  if (error) {
    return <div className="balance-error">Error: {error}</div>;
  }

  return (
    <div className="balance">
      <div className="balance-header">
        <h2>ბალანსი</h2>
      </div>
      <div className="balance-content">
        <div className="balance-amount">
          <span className="amount">{balance.coinIn.amount}</span>
          <span className="currency">{balance.coinIn.name}</span>
        </div>
        <div className="balance-amount">
          <span className="amount">{balance.freespins.amount}</span>
          <span className="currency">{balance.freespins.name}</span>
        </div>
        <div className="balance-amount">
          <span className="amount">{balance.promoCoin.amount}</span>
          <span className="currency">{balance.promoCoin.name}</span>
        </div>
        <div className="balance-amount">
          <span className="amount">{balance.assetCoin.amount}</span>
          <span className="currency">{balance.assetCoin.name}</span>
        </div>
      </div>
    </div>
  );
};

export default Balance; 