import { Typography, Card, CardContent, Grid2 } from '@mui/material';
import { AttachMoney, ShowChart, Receipt, AccountBalance } from '@mui/icons-material';

interface DashboardItems {
    title: string;
    value: string;
    icon: JSX.Element;
}
  
const dashboardData: DashboardItems[] = [
    {
      title: 'Total Staked',
      value: '1,000,000 TOKENS',
      icon: <AttachMoney fontSize="large" />,
    },
    {
      title: 'Total Rewards Earned',
      value: '50,000 TOKENS',
      icon: <ShowChart fontSize="large" />,
    },
    {
      title: 'Current Staking Period',
      value: '90 Days',
      icon: <Receipt fontSize="large" />,
    },
    {
      title: 'Estimated Annual Returns',
      value: '12%',
      icon: <AccountBalance fontSize="large" />,
    },
];

const DashboardPage: React.FunctionComponent = (): JSX.Element => {
  return (
    <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
                Dashboard
                </Typography>
                <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                Your Staking Overview
                </Typography>
                <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
                Keep track of your staking performance and rewards with our comprehensive dashboard. Monitor your staked tokens, earned rewards, and estimated returns.
                </Typography>
            </div>
            <div className="mx-auto mt-16 max-w-2xl">
                <Grid2 container spacing={4}>
                {dashboardData.map((item, index) => (
                    <Grid2 item xs={12} sm={6} key={index}>
                    <Card>
                        <CardContent>
                        <Grid2 container alignItems="center" spacing={2}>
                            <Grid2 item>{item.icon}</Grid2>
                            <Grid2 item>
                                <Typography variant="h6" component="div">
                                    {item.title}
                                </Typography>
                                <Typography variant="h4" component="div" color="primary">
                                    {item.value}
                                </Typography>
                            </Grid2>
                        </Grid2>
                        </CardContent>
                    </Card>
                    </Grid2>
                ))}
                </Grid2>
            </div>
        </div>
    </div>
  )
}

export default DashboardPage;