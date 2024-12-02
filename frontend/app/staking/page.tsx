'use client';

import { 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  TextField, 
  InputAdornment, 
  MenuItem, 
  Grid,
  Box
} from '@mui/material';
import { AttachMoney, ShowChart } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther, parseEther } from 'viem';

// Constants imports
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
  // States for user data and interactions
  const { address, isConnected } = useAccount();
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [unstakeAmount, setUnstakeAmount] = useState<string>('');
  const [selectedDays, setSelectedDays] = useState<number>(1);
  const [estimatedRewards, setEstimatedRewards] = useState<string>('0');
  const [earnedRewards, setEarnedRewards] = useState<string>('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [nestBalance, setNestBalance] = useState<string>('0');
  const [stNestBalance, setStNestBalance] = useState<string>('0');

  // Function to generate bonding curve data points
  const generateCurvePoints = () => {
    const points = [];
    const width = 600;
    const height = 400;
    const padding = 40;
    
    // Generate points for quadratic curve: y = x^2
    for (let i = 0; i <= width - 2 * padding; i += 2) {
      const x = i + padding;
      const normalizedX = i / (width - 2 * padding);
      const y = height - padding - (normalizedX * normalizedX * (height - 2 * padding));
      points.push(`${x},${y}`);
    }
    
    return points.join(' ');
  };

  // Stake handling function
  const handleStake = async () => {
    if (!address || !stakeAmount) return;
    setLoading(true);
    setError('');

    try {
      const walletClient = await createWalletClientInstance();
      
      // First approve spending of NEST tokens
      const { request: approveRequest } = await publicClient.simulateContract({
        address: nestTokenAddress,
        abi: nestTokenAbi,
        functionName: 'approve',
        args: [stakingAddress, parseEther(stakeAmount)],
        account: address,
      });
      await walletClient.writeContract(approveRequest);

      // Then stake
      const { request: stakeRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'stake',
        args: [parseEther(stakeAmount)],
        account: address,
      });
      await walletClient.writeContract(stakeRequest);

      setStakeAmount('');
      // Refresh balances
      fetchData();
    } catch (err) {
      console.error('Staking error:', err);
      setError('Failed to stake tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Unstake handling function
  const handleUnstake = async () => {
    if (!address || !unstakeAmount) return;
    setLoading(true);
    setError('');

    try {
      const walletClient = await createWalletClientInstance();
      
      // First approve spending of stNEST tokens
      const { request: approveRequest } = await publicClient.simulateContract({
        address: stNestTokenAddress,
        abi: stNestTokenAbi,
        functionName: 'approve',
        args: [stakingAddress, parseEther(unstakeAmount)],
        account: address,
      });
      await walletClient.writeContract(approveRequest);

      // Then unstake
      const { request: unstakeRequest } = await publicClient.simulateContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'unstake',
        args: [parseEther(unstakeAmount)],
        account: address,
      });
      await walletClient.writeContract(unstakeRequest);

      setUnstakeAmount('');
      // Refresh balances
      fetchData();
    } catch (err) {
      console.error('Unstaking error:', err);
      setError('Failed to unstake tokens. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user data
  const fetchData = async () => {
    if (!address) return;

    try {
      // Get NEST token balance
      const nestBal = await publicClient.readContract({
        address: nestTokenAddress,
        abi: nestTokenAbi,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;

      // Get stNEST token balance
      const stNestBal = await publicClient.readContract({
        address: stNestTokenAddress,
        abi: stNestTokenAbi,
        functionName: 'balanceOf',
        args: [address]
      }) as bigint;

      // Get earned rewards
      const rewards = await publicClient.readContract({
        address: stakingAddress,
        abi: stakingAbi,
        functionName: 'calcRewards',
        args: [address]
      }) as bigint;

      setNestBalance(formatEther(nestBal));
      setStNestBalance(formatEther(stNestBal));
      setEarnedRewards(formatEther(rewards));
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  // Effect hook to load user balances and rewards
  useEffect(() => {
    fetchData();
  }, [address]);

  // Effect hook to calculate estimated rewards
  useEffect(() => {
    const calculateEstimatedRewards = async () => {
      if (!stakeAmount || isNaN(Number(stakeAmount))) return;

      try {
        const rewards = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'calcEstimatedRewardsForDays',
          args: [parseEther(stakeAmount), BigInt(selectedDays)]
        }) as bigint;

        setEstimatedRewards(formatEther(rewards));
      } catch (err) {
        console.error('Error calculating estimated rewards:', err);
        setEstimatedRewards('0');
      }
    };

    calculateEstimatedRewards();
  }, [stakeAmount, selectedDays]);

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            Staking
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            NEST Staking Portal
          </Typography>
          
          {/* User balances display */}
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Available NEST: {Number(nestBalance).toFixed(2)} NEST<br />
            Staked NEST: {Number(stNestBalance).toFixed(2)} stNEST<br />
            Earned Rewards: {Number(earnedRewards).toFixed(2)} NEST
          </Typography>
        </div>

        {/* Main content grid */}
        <div className="mx-auto mt-16 max-w-2xl">
          <Grid container spacing={3}>
            {/* Staking card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Stake NEST
                  </Typography>
                  <TextField
                    label="Amount to Stake"
                    fullWidth
                    margin="normal"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                  {/* Days selector */}
                  <TextField
                    select
                    label="Estimation Period"
                    fullWidth
                    margin="normal"
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(Number(e.target.value))}
                  >
                    <MenuItem value={1}>1 Day (10%)</MenuItem>
                    <MenuItem value={3}>3 Days (30%)</MenuItem>
                    <MenuItem value={7}>7 Days (70%)</MenuItem>
                    <MenuItem value={14}>14 Days (140%)</MenuItem>
                    <MenuItem value={30}>30 Days (300%)</MenuItem>
                  </TextField>
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Estimated Rewards: {Number(estimatedRewards).toFixed(2)} NEST
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    disabled={!isConnected || loading || !stakeAmount} 
                    onClick={handleStake}
                  >
                    {loading ? 'Processing...' : 'Stake NEST'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Unstaking card */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Unstake NEST
                  </Typography>
                  <TextField
                    label="Amount to Unstake"
                    fullWidth
                    margin="normal"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoney />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                    Available to unstake: {Number(stNestBalance).toFixed(2)} stNEST
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    fullWidth 
                    disabled={!isConnected || loading || !unstakeAmount} 
                    onClick={handleUnstake}
                  >
                    {loading ? 'Processing...' : 'Unstake NEST'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Bonding Curve Section */}
            <Grid item xs={12}>
              <Card className="mt-8">
                <CardContent>
                  <Typography variant="h5" component="div" gutterBottom>
                    Bonding Curve Mechanism
                  </Typography>
                  
                  {/* SVG Graph */}
                  <Box sx={{ width: '100%', height: '500px', position: 'relative', mt: 4 }}>
                    <svg width="100%" height="100%" viewBox="0 0 700 500">
                      {/* Graph border */}
                      <rect x="40" y="40" width="600" height="400" fill="none" stroke="#ccc" />
                      
                      {/* X and Y axis */}
                      <line x1="40" y1="440" x2="640" y2="440" stroke="black" />
                      <line x1="40" y1="40" x2="40" y2="440" stroke="black" />
                      
                      {/* Curve */}
                      <polyline
                        points={generateCurvePoints()}
                        fill="none"
                        stroke="#4F46E5"
                        strokeWidth="2"
                      />
                      
                      {/* Axis labels */}
                      <text x="320" y="480" textAnchor="middle">Total Supply</text>
                      <text x="20" y="240" transform="rotate(-90, 20, 240)">Price</text>
                    </svg>
                  </Box>

                  {/* Formula explanation */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      Formula Explanation
                    </Typography>
                    <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body1" gutterBottom>
                        The NEST token price is determined by the following formula:
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', p: 2, bgcolor: 'common.white' }}>
                        Price = (Current Supply / 1000)²
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        • The price increases quadratically with supply
                        <br />
                        • Early stakers benefit from lower entry prices
                        <br />
                        • Price stability is maintained through mathematical backing
                      </Typography>
                    </Card>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Rewards Calculation Section */}
          <Grid item xs={12}>
            <Card className="mt-8">
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Rewards Calculation System
                </Typography>

                {/* Rewards visualization */}
                <Box sx={{ width: '100%', height: '400px', position: 'relative', mt: 4 }}>
                  <svg width="100%" height="100%" viewBox="0 0 700 400">
                    {/* Background grid */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Linear rewards line */}
                    <line 
                      x1="50" 
                      y1="350" 
                      x2="650" 
                      y2="50" 
                      stroke="#4F46E5" 
                      strokeWidth="3"
                    />

                    {/* Points on line */}
                    <circle cx="150" cy="300" r="5" fill="#4F46E5" />
                    <circle cx="350" cy="200" r="5" fill="#4F46E5" />
                    <circle cx="550" cy="100" r="5" fill="#4F46E5" />

                    {/* Labels */}
                    <text x="350" y="380" textAnchor="middle">Staking Duration (Days)</text>
                    <text x="30" y="200" transform="rotate(-90, 30, 200)" textAnchor="middle">Rewards (NEST)</text>
                    
                    {/* Day markers */}
                    <text x="150" y="320" textAnchor="middle">1 Day</text>
                    <text x="350" y="220" textAnchor="middle">7 Days</text>
                    <text x="550" y="120" textAnchor="middle">30 Days</text>
                  </svg>
                </Box>

                {/* Rewards Calculation Details */}
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Rewards Calculation Formula
                  </Typography>
                  <Card variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1" gutterBottom>
                      The staking rewards are calculated using a fixed daily rate formula:
                    </Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace', p: 2, bgcolor: 'common.white' }}>
                      Rewards = (Staked Amount * 10% * Days) / (100 * 100)
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        Components Breakdown:
                      </Typography>
                      <Typography variant="body2" component="div">
                        <ul>
                          <li><strong>Daily Rate:</strong> Fixed 10% daily returns</li>
                          <li><strong>Time Factor:</strong> Number of days staked</li>
                          <li><strong>Calculation Example:</strong>
                            <ul>
                              <li>Staking 1000 NEST for 1 day = 100 NEST reward</li>
                              <li>Staking 1000 NEST for 7 days = 700 NEST rewards</li>
                              <li>Staking 1000 NEST for 30 days = 3000 NEST rewards</li>
                            </ul>
                          </li>
                        </ul>
                      </Typography>
                    </Box>
                  </Card>
                </Box>

              </CardContent>
            </Card>
          </Grid>

          {/* Error display */}
          {error && (
            <Typography color="error" className="mt-4 text-center">
              {error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default StakingPage;