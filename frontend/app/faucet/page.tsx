'use client';

import { Typography, Button, Card, CardContent, CardActions } from '@mui/material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Constants
import { publicClient, createWalletClientInstance, writeContract } from '../constants/client';
import { nestFaucetAddress, nestFaucetAbi } from '../constants/tokens';

const FaucetPage: React.FunctionComponent = (): JSX.Element => {

  const { address, isConnected } = useAccount();

  const [cooldownEnds, setCooldownEnds] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const canRequest = cooldownEnds < Math.floor(Date.now() / 1000);
  const timeRemaining = cooldownEnds - Math.floor(Date.now() / 1000);

  // Use Effect
  useEffect(() => {
    const fetchLastRequest = async () => {
      if (!address) return;
      
      try {
        const lastTime = await publicClient.readContract({
          address: nestFaucetAddress,
          abi: nestFaucetAbi,
          functionName: 'lastFaucetTime',
          args: [address]
        });

        setCooldownEnds(Number(lastTime) + (24 * 60 * 60)); // 24 hours in second
      } catch (err) {
        console.error('Error fetching last request:', err);
      }
    };

    fetchLastRequest();
  }, [address]);

  // Request token part
  const requestTokens = async () => {
    if (!address) return;

    setLoading(true);
    setError('');

    try {
      const walletClient = createWalletClientInstance();

      // Simulate tx
      const { request } = await publicClient.simulateContract({
        address: nestFaucetAddress,
        abi: nestFaucetAbi,
        functionName: 'requestTokens',
        account: address
      });

      // If simulation success, execute tx
      const hash = await walletClient.writeContract(request);

      await publicClient.waitForTransactionReceipt({ hash });
      
      // Update last request time
      const newLastTime = Math.floor(Date.now() / 1000);
      setCooldownEnds(newLastTime + (24 * 60 * 60));

    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            NEST Faucet
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Get Test NEST Tokens
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Request NEST tokens for testing purposes. You can request 1000 NEST tokens every 24 hours.
          </Typography>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Request Tokens
              </Typography>
                  <Typography variant="body1" className="mb-4">
                    Amount to receive: 1000 NEST
                  </Typography>

                  {timeRemaining > 0 && (
                    <Typography variant="body2" color="textSecondary">
                      Time remaining: {Math.floor(timeRemaining / 3600)}h {Math.floor((timeRemaining % 3600) / 60)}m
                    </Typography>
                  )}

                  {error && (
                    <Typography color="error" className="mt-2">
                      {error}
                    </Typography>
                  )}
            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                className="bg-indigo-600"
                size="large" 
                fullWidth
                disabled={!isConnected || !canRequest || loading}
                onClick={requestTokens}
              >
                {loading ? 'Processing...' : 'Request NEST Tokens'}
              </Button>
            </CardActions>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FaucetPage;