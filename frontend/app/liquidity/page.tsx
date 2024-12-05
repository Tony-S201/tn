'use client';

import { Typography, Button, Card, CardContent, CardActions, TextField } from '@mui/material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Constants
import { publicClient, createWalletClientInstance } from '../constants/client';
import { nestTokenAddress, liquidityPoolAddress, liquidityPoolAbi, nestTokenAbi } from '../constants/tokens';

const LiquidityPage: React.FunctionComponent = (): JSX.Element => {
  const { address, isConnected } = useAccount();

  const [ethAmount, setEthAmount] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [lpBalance, setLpBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [reserves, setReserves] = useState<{ eth: string; nest: string }>({ eth: '0', nest: '0' });

  // Fetch LP balance and reserves
  useEffect(() => {
    const fetchData = async () => {
      if (!address) return;

      try {
        // Fetch LP balance
        const balance = await publicClient.readContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'balanceOf',
          args: [address]
        });

        setLpBalance((Number(balance) / 1e18).toString());

        // Fetch reserves
        const reserves = await publicClient.readContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'getReserves'
        }) as [bigint, bigint];
        
        const [reserve0, reserve1] = reserves;

        setReserves({
          eth: (Number(reserve0) / 1e18).toString(),
          nest: (Number(reserve1) / 1e18).toString()
        });
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [address]);

  const handleAddLiquidity = async () => {
    if (!address || !ethAmount || !tokenAmount) return;

    setLoading(true);
    setError('');

    try {
      const walletClient = createWalletClientInstance();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
      const tokenAmountWei = BigInt(parseFloat(tokenAmount) * 1e18);
      const ethAmountWei = BigInt(parseFloat(ethAmount) * 1e18);

      // First approve NEST tokens
      const { request: approveRequest } = await publicClient.simulateContract({
        address: nestTokenAddress,
        abi: nestTokenAbi,
        functionName: 'approve',
        account: address,
        args: [liquidityPoolAddress, tokenAmountWei]
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Then add liquidity
      const { request } = await publicClient.simulateContract({
        address: liquidityPoolAddress,
        abi: liquidityPoolAbi,
        functionName: 'addLiquidity',
        account: address,
        args: [
          tokenAmountWei,    // amountTokenDesired
          tokenAmountWei,    // amountTokenMin
          ethAmountWei,      // amountETHMin
          address,           // to
          deadline           // deadline
        ],
        value: ethAmountWei
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      setEthAmount('');
      setTokenAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to add liquidity');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!address || !lpBalance) return;

    setLoading(true);
    setError('');

    try {
      const walletClient = createWalletClientInstance();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
      const lpAmountWei = BigInt(parseFloat(lpBalance) * 1e18);

      const { request } = await publicClient.simulateContract({
        address: liquidityPoolAddress,
        abi: liquidityPoolAbi,
        functionName: 'removeLiquidity',
        account: address,
        args: [
          lpAmountWei,   // liquidity
          BigInt(0),     // amountTokenMin
          BigInt(0),     // amountETHMin
          address,       // to
          deadline       // deadline
        ]
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash });

      setLpBalance('0');
    } catch (err: any) {
      setError(err.message || 'Failed to remove liquidity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            Liquidity Pool
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Provide Liquidity
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Add liquidity to the ETH-NEST pool and earn fees from trades.
          </Typography>
        </div>

        <div className="mx-auto mt-16 max-w-2xl space-y-6">
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Pool Information
              </Typography>
              <Typography variant="body1">
                ETH Reserve: {reserves.eth} ETH
              </Typography>
              <Typography variant="body1">
                NEST Reserve: {reserves.nest} NEST
              </Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Add Liquidity
              </Typography>
              
              <TextField
                label="ETH Amount"
                type="number"
                value={ethAmount}
                onChange={(e) => setEthAmount(e.target.value)}
                fullWidth
                className="mb-4"
              />

              <TextField
                label="NEST Amount"
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                fullWidth
                className="mb-4"
              />

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
                disabled={!isConnected || !ethAmount || !tokenAmount || loading}
                onClick={handleAddLiquidity}
              >
                {loading ? 'Processing...' : 'Add Liquidity'}
              </Button>
            </CardActions>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Remove Liquidity
              </Typography>
              
              <Typography variant="body1" className="mb-4">
                Your LP Balance: {lpBalance} LP
              </Typography>

            </CardContent>
            <CardActions>
              <Button 
                variant="contained" 
                className="bg-indigo-600"
                size="large" 
                fullWidth
                disabled={!isConnected || Number(lpBalance) === 0 || loading}
                onClick={handleRemoveLiquidity}
              >
                {loading ? 'Processing...' : 'Remove All Liquidity'}
              </Button>
            </CardActions>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiquidityPage;