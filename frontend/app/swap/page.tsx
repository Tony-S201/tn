'use client';

import { Typography, Button, Card, CardContent, CardActions, TextField, IconButton } from '@mui/material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import SwapVertIcon from '@mui/icons-material/SwapVert';

// Constants
import { publicClient, createWalletClientInstance } from '../constants/client';
import { nestTokenAddress, liquidityPoolAddress, liquidityPoolAbi, nestTokenAbi } from '../constants/tokens';

const SwapPage: React.FunctionComponent = (): JSX.Element => {
  const { address, isConnected } = useAccount();

  const [inputAmount, setInputAmount] = useState<string>('');
  const [outputAmount, setOutputAmount] = useState<string>('');
  const [isEthToToken, setIsEthToToken] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [reserves, setReserves] = useState<{ eth: bigint; nest: bigint }>({ eth: BigInt(0), nest: BigInt(0) });

  // Fetch reserves
  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const reserves = await publicClient.readContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'getReserves'
        }) as [bigint, bigint];

        const [reserve0, reserve1] = reserves;
        setReserves({
          eth: reserve0,
          nest: reserve1
        });
      } catch (err) {
        console.error('Error fetching reserves:', err);
      }
    };

    fetchReserves();
    // Set up interval to refresh reserves
    const interval = setInterval(fetchReserves, 15000); // every 15 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate output amount based on input
  const calculateOutput = (input: string) => {
    if (!input || isNaN(parseFloat(input))) {
      setOutputAmount('');
      return;
    }

    const inputAmountWei = BigInt(parseFloat(input) * 1e18);
    let outputAmountWei: bigint;

    if (isEthToToken) {
      // ETH to Token
      outputAmountWei = (inputAmountWei * reserves.nest) / (reserves.eth + inputAmountWei);
    } else {
      // Token to ETH
      outputAmountWei = (inputAmountWei * reserves.eth) / (reserves.nest + inputAmountWei);
    }

    setOutputAmount((Number(outputAmountWei) / 1e18).toFixed(6));
  };

  const handleSwitch = () => {
    setIsEthToToken(!isEthToToken);
    setInputAmount('');
    setOutputAmount('');
  };

  const handleInputChange = (value: string) => {
    setInputAmount(value);
    calculateOutput(value);
  };

  const handleSwap = async () => {
    if (!address || !inputAmount || !outputAmount) return;

    setLoading(true);
    setError('');

    try {
      const walletClient = createWalletClientInstance();
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 minutes
      const inputAmountWei = BigInt(parseFloat(inputAmount) * 1e18);
      const minOutputAmountWei = BigInt(parseFloat(outputAmount) * 0.99 * 1e18); // 1% slippage

      if (isEthToToken) {
        // ETH to Token swap
        const { request } = await publicClient.simulateContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'swapExactETHForTokens',
          account: address,
          args: [
            minOutputAmountWei,  // amountOutMin
            address,             // to
            deadline            // deadline
          ],
          value: inputAmountWei
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        // Token to ETH swap
        // First approve tokens
        const { request: approveRequest } = await publicClient.simulateContract({
          address: nestTokenAddress,
          abi: nestTokenAbi,
          functionName: 'approve',
          account: address,
          args: [liquidityPoolAddress, inputAmountWei]
        });

        const approveHash = await walletClient.writeContract(approveRequest);
        await publicClient.waitForTransactionReceipt({ hash: approveHash });

        // Then swap
        const { request } = await publicClient.simulateContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'swapExactTokensForETH',
          account: address,
          args: [
            inputAmountWei,      // amountIn
            minOutputAmountWei,  // amountOutMin
            address,             // to
            deadline            // deadline
          ]
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setInputAmount('');
      setOutputAmount('');
    } catch (err: any) {
      setError(err.message || 'Failed to execute swap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            Swap
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Swap Tokens
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Swap between ETH and NEST tokens instantly
          </Typography>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Swap
              </Typography>

              <div className="space-y-4">
                <TextField
                  label={isEthToToken ? "ETH Amount" : "NEST Amount"}
                  type="number"
                  value={inputAmount}
                  onChange={(e) => handleInputChange(e.target.value)}
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography>{isEthToToken ? "ETH" : "NEST"}</Typography>
                  }}
                />

                <div className="flex justify-center">
                  <IconButton onClick={handleSwitch} color="primary">
                    <SwapVertIcon />
                  </IconButton>
                </div>

                <TextField
                  label={isEthToToken ? "NEST Amount" : "ETH Amount"}
                  type="number"
                  value={outputAmount}
                  disabled
                  fullWidth
                  InputProps={{
                    endAdornment: <Typography>{isEthToToken ? "NEST" : "ETH"}</Typography>
                  }}
                />

                {error && (
                  <Typography color="error">
                    {error}
                  </Typography>
                )}
              </div>
            </CardContent>
            
            <CardActions>
              <Button 
                variant="contained" 
                className="bg-indigo-600"
                size="large" 
                fullWidth
                disabled={!isConnected || !inputAmount || !outputAmount || loading}
                onClick={handleSwap}
              >
                {loading ? 'Processing...' : 'Swap'}
              </Button>
            </CardActions>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SwapPage;