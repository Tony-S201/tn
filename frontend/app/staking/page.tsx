'use client';

import { Typography, Button, Card, CardContent, CardActions, TextField, InputAdornment, MenuItem } from '@mui/material';
import { AttachMoney, ShowChart } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';

// Constants
import { publicClient, createWalletClientInstance } from '../constants/client';
import { 
  nestTokenAddress, 
  nestTokenAbi, 
  stakingAddress, 
  stakingAbi,
  stNestTokenAddress,
  stNestTokenAbi 
} from '../constants/tokens';

const StakingPage: React.FunctionComponent = (): JSX.Element => {
  const { address, isConnected } = useAccount();
  
  const [amount, setAmount] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [estimatedRewards, setEstimatedRewards] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [nestBalance, setNestBalance] = useState<string>('0');
  const [stakedBalance, setStakedBalance] = useState<string>('0');

  // Use Effect - Load balances
  useEffect(() => {
    const fetchBalances = async () => {
      if (!address) return;

      try {
        // Get NEST balance
        const balance = await publicClient.readContract({
          address: nestTokenAddress,
          abi: nestTokenAbi,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint;

        // Get StakedNest balance
        const stakedBalance = await publicClient.readContract({
          address: stNestTokenAddress,
          abi: stNestTokenAbi,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint;

        setNestBalance(formatEther(balance));
        setStakedBalance(formatEther(stakedBalance));
      } catch (err) {
        console.error('Error fetching balances:', err);
      }
    };

    fetchBalances();
  }, [address]);

  // Calc estimated rewards
  useEffect(() => {
    const calculateEstimatedRewards = async () => {
      if (!amount || isNaN(Number(amount))) return;

      try {
        const rewards = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'calcEstimatedRewardsForDays',
          args: [parseEther(amount), BigInt(selectedDays)]
        }) as bigint;

        setEstimatedRewards(formatEther(rewards));
      } catch (err) {
        console.error('Error calculating estimated rewards:', err);
        setEstimatedRewards('0');
      }
    };

    calculateEstimatedRewards();
  }, [amount, selectedDays]);

  // Staking function
  const handleStake = async () => {
    if (!address || !amount || isNaN(Number(amount))) return;

    setLoading(true);
    setError('');

    try {
      const walletClient = createWalletClientInstance();
      const amountInWei = parseEther(amount);

      // Approve spending first
      const { request: approveRequest } = await publicClient.simulateContract({
        address: nestTokenAddress,
        abi: nestTokenAbi,
        functionName: 'approve',
        args: [stakingAddress, amountInWei],
        account: address
      });

      const approveHash = await walletClient.writeContract(approveRequest);
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      // Then stake
      const { request: stakeRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'staking',
        args: [amountInWei],
        account: address
      });

      const stakeHash = await walletClient.writeContract(stakeRequest);
      await publicClient.waitForTransactionReceipt({ hash: stakeHash });

      // Reset form
      setAmount('');
      
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
            Staking
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Stake Your NEST Tokens
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Your NEST Balance: {Number(nestBalance).toFixed(2)} NEST<br />
            Your Staked Balance: {Number(stakedBalance).toFixed(2)} sNEST
          </Typography>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <Card>
            <CardContent>
              <Typography variant="h5" component="div" gutterBottom>
                Stake Your Tokens
              </Typography>
              <TextField
                label="Amount to Stake"
                fullWidth
                margin="normal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Estimation Period"
                fullWidth
                margin="normal"
                value={selectedDays}
                onChange={(e) => setSelectedDays(Number(e.target.value))}
              >
                <MenuItem value={1}>1 Day</MenuItem>
                <MenuItem value={7}>7 Days</MenuItem>
                <MenuItem value={30}>30 Days</MenuItem>
                <MenuItem value={365}>1 Year</MenuItem>
              </TextField>
              <TextField
                label="Estimated Rewards"
                fullWidth
                margin="normal"
                value={Number(estimatedRewards).toFixed(2)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShowChart />
                    </InputAdornment>
                  ),
                }}
                disabled
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
                disabled={!isConnected || loading || !amount || isNaN(Number(amount))}
                onClick={handleStake}
              >
                {loading ? 'Processing...' : 'Stake Now'}
              </Button>
            </CardActions>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StakingPage;