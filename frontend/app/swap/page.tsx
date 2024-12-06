'use client';

import { Typography, Button, Card, CardContent, CardActions, TextField, IconButton, Slider } from '@mui/material';
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
  const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5% slippage

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
  const calculateOutput = async (input: string) => {
    if (!input || isNaN(parseFloat(input))) {
      setOutputAmount('');
      return;
    }

    try {
      const inputAmountWei = BigInt(parseFloat(input) * 1e18);
      
      // Get amount from contract
      const amountOut = await publicClient.readContract({
        address: liquidityPoolAddress,
        abi: liquidityPoolAbi,
        functionName: 'getAmountOut',
        args: [
          inputAmountWei,
          isEthToToken ? reserves.eth : reserves.nest,
          isEthToToken ? reserves.nest : reserves.eth
        ]
      }) as bigint;

      setOutputAmount((Number(amountOut) / 1e18).toFixed(6));
    } catch (err) {
      console.error('Error calculating output:', err);
      setOutputAmount('');
    }
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
      const inputAmountWei = BigInt(parseFloat(inputAmount) * 1e18); // 18 decimals
      
      // Calc min amount to receive with current slippage
      const minOutputAmountWei = BigInt(
        parseFloat(outputAmount) * (1 - slippage / 100) * 1e18
      );

      if (isEthToToken) {
        // ETH to Token swap
        const { request } = await publicClient.simulateContract({
          address: liquidityPoolAddress,
          abi: liquidityPoolAbi,
          functionName: 'swapExactETHForTokens',
          account: address,
          args: [
            minOutputAmountWei,
            address,
            deadline
          ],
          value: inputAmountWei
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
      } else {
        // Token to ETH swap
        // First approve token
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

  const SlippageSelector = () => (
    <div className="my-4">
      <Typography variant="body2" gutterBottom>
        Slippage Tolerance: {slippage}%
      </Typography>
      <Slider
        value={slippage}
        onChange={(_, newValue) => setSlippage(newValue as number)}
        step={0.1}
        marks
        min={0.1}
        max={5}
        valueLabelDisplay="auto"
      />
    </div>
  );

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

                <SlippageSelector />

                {inputAmount && outputAmount && (
                  <div className="mt-4 space-y-2">
                    <Typography variant="body2">
                      Rate: 1 {isEthToToken ? "ETH" : "NEST"} = {
                        (parseFloat(outputAmount) / parseFloat(inputAmount)).toFixed(6)
                      } {isEthToToken ? "NEST" : "ETH"}
                    </Typography>
                    <Typography variant="body2">
                      Minimum received: {
                        (parseFloat(outputAmount) * (1 - slippage / 100)).toFixed(6)
                      } {isEthToToken ? "NEST" : "ETH"}
                    </Typography>
                  </div>
                )}

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