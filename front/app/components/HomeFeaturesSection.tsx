import { BarChart, Lock, AttachMoney, People } from '@mui/icons-material';

interface FeatureItems {
    name: string,
    description: string,
    icon: typeof BarChart | typeof Lock | typeof AttachMoney | typeof People
}

const features: FeatureItems[] = [
    {
      name: 'Simplified Staking',
      description:
        'Our platform offers an intuitive and user-friendly interface to facilitate the staking process. Start staking in just a few clicks.',
      icon: Lock,
    },
    {
      name: 'Attractive Rewards',
      description:
        'Benefit from competitive rewards for your participation in staking. Our reward rates are among the best in the market.',
      icon: AttachMoney,
    },
    {
      name: 'Comprehensive Dashboard',
      description:
        'Track your staking performance with our detailed dashboard. Visualize your rewards, balance, and transaction history.',
      icon: BarChart,
    },
    {
      name: 'Engaged Community',
      description:
        'Join our passionate community of stakers. Interact with other participants, share your experiences, and get valuable tips.',
      icon: People,
    },
];

const HomeFeaturesSection = () => {
  return (
    <div className="flex-grow flex items-center justify-center">
        <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold leading-7 text-indigo-600">Staking Made Easy</h2>
                <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-balance">
                Everything You Need to Optimize Your Earnings
                </p>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                Our staking platform provides you with all the tools necessary to participate in network security and generate attractive rewards. Start now and optimize your earnings with ease.
                </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
                <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                    {features.map((feature) => (
                        <div key={feature.name} className="relative pl-16">
                        <dt className="text-base font-semibold leading-7 text-gray-900">
                            <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                            <feature.icon aria-hidden="true" className="h-6 w-6 text-white" />
                            </div>
                            {feature.name}
                        </dt>
                        <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                        </div>
                    ))}
                </dl>
            </div>
        </div>
        </div>
    </div>
  )
}

export default HomeFeaturesSection;