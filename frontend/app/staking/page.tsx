import { Typography, Button, Card, CardContent, CardActions, TextField, InputAdornment } from '@mui/material';
import { AttachMoney, Lock, ShowChart } from '@mui/icons-material';

const StakingPage: React.FunctionComponent = (): JSX.Element => {
  return (
    <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
            <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            Staking
            </Typography>
            <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Stake Your Tokens and Earn Rewards
            </Typography>
            <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Participate in securing the network and earn attractive rewards by staking your tokens. Our staking platform offers a seamless and user-friendly experience.
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
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <AttachMoney />
                    </InputAdornment>
                    ),
                }}
                />
                <TextField
                label="Staking Period (Days)"
                fullWidth
                margin="normal"
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <Lock />
                    </InputAdornment>
                    ),
                }}
                />
                <TextField
                label="Estimated Rewards"
                fullWidth
                margin="normal"
                InputProps={{
                    startAdornment: (
                    <InputAdornment position="start">
                        <ShowChart />
                    </InputAdornment>
                    ),
                }}
                disabled
                />
            </CardContent>
            <CardActions>
                <Button variant="contained" className="bg-indigo-600" size="large" fullWidth>
                    Stake Now
                </Button>
            </CardActions>
            </Card>
        </div>
        </div>
    </div>
  )
}

export default StakingPage;