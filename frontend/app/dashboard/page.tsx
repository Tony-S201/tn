'use client';

import { Typography, Card, CardContent, Grid } from '@mui/material';
import { AttachMoney, ShowChart, Receipt, AccountBalance, LocalFireDepartment } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';

// Constants
import { publicClient } from '../constants/client';
import { 
  stakingAddress, 
  stakingAbi,
  stNestTokenAddress,
  stNestTokenAbi 
} from '../constants/tokens';

interface DashboardItem {
  title: string;
  value: string;
  icon: JSX.Element;
}

const DashboardPage: React.FunctionComponent = (): JSX.Element => {
  const { address } = useAccount();

  const [totalStaked, setTotalStaked] = useState<string>('0');
  const [totalRewards, setTotalRewards] = useState<string>('0');
  const [stakingPeriod, setStakingPeriod] = useState<string>('0');
  const [annualReturns, setAnnualReturns] = useState<string>('0');
  const [burnedTokens, setBurnedTokens] = useState<string>('0');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!address) return;

      try {
        // Get total staked amount
        const stakedBalance = await publicClient.readContract({
          address: stNestTokenAddress,
          abi: stNestTokenAbi,
          functionName: 'balanceOf',
          args: [address]
        }) as bigint;

        // Get total rewards earned (before burn)
        const rawRewards = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'calcRewards',
          args: [address]
        }) as bigint;

        // Get burn rate
        const burnRate = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'BURN_RATE'
        }) as bigint;

        // Calculate actual rewards and burned amount
        const burnedAmount = (rawRewards * burnRate) / BigInt(1000);
        const actualRewards = rawRewards - burnedAmount;

        // Get staking period
        const period = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'stakingPeriod',
          args: [address]
        }) as bigint;

        // Get annual returns
        const apr = await publicClient.readContract({
          address: stakingAddress,
          abi: stakingAbi,
          functionName: 'getCurrentAPR'
        }) as bigint;

        setTotalStaked(formatEther(stakedBalance));
        setTotalRewards(formatEther(actualRewards));
        setBurnedTokens(formatEther(burnedAmount));
        setStakingPeriod(period.toString());
        setAnnualReturns(formatEther(apr));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };

    fetchDashboardData();
  }, [address]);

  const dashboardData: DashboardItem[] = [
    {
      title: 'Total Staked',
      value: `${Number(totalStaked).toFixed(2)} NEST`,
      icon: <AttachMoney fontSize="large" />,
    },
    {
      title: 'Total Rewards Earned',
      value: `${Number(totalRewards).toFixed(2)} NEST`,
      icon: <ShowChart fontSize="large" />,
    },
    {
      title: 'Tokens Burned',
      value: `${Number(burnedTokens).toFixed(2)} NEST`,
      icon: <LocalFireDepartment fontSize="large" sx={{ color: '#ff4444' }} />,
    },
    {
      title: 'Current Staking Period',
      value: `${stakingPeriod} Days`,
      icon: <Receipt fontSize="large" />,
    },
    {
      title: 'Current Annual Returns',
      value: `${Number(annualReturns).toFixed(2)}%`,
      icon: <AccountBalance fontSize="large" />,
    },
  ];

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            Dashboard
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            NEST Staking Dashboard
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Monitor your NEST staking performance, track your rewards, and view your current staking status.
          </Typography>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          <Grid container spacing={4}>
            {dashboardData.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid item>{item.icon}</Grid>
                      <Grid item xs>
                        <Typography variant="h6" component="div">
                          {item.title}
                        </Typography>
                        <Typography variant="h4" component="div" color="primary">
                          {item.value}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;