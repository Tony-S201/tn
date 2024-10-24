import { Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface FaqItems {
  question: string,
  answer: string
}

const faqData: FaqItems[] = [
  {
    question: 'What is staking?',
    answer: 'Staking is the process of holding funds in a cryptocurrency wallet to support the operations of a blockchain network. It is similar to locking funds in a bank account and earning interest on that amount.',
  },
  {
    question: 'How do I start staking?',
    answer: 'To start staking, you need to have a cryptocurrency wallet that supports staking. Then, you can choose the amount you want to stake and lock it in your wallet. The staking process will automatically begin, and you will start earning rewards.',
  },
  {
    question: 'What are the benefits of staking?',
    answer: 'Staking offers several benefits, including earning passive income on your cryptocurrency holdings, supporting the security and stability of the blockchain network, and potentially having a say in governance decisions.',
  },
  {
    question: 'Is staking safe?',
    answer: 'Staking is generally considered safe, as your funds remain in your wallet and you maintain control over your private keys. However, it is essential to choose a reputable staking platform and follow best practices for securing your wallet.',
  },
];

const SupportPage: React.FunctionComponent = (): JSX.Element => {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <Typography variant="h2" component="h2" className="text-base font-semibold leading-7 text-indigo-600">
            FAQ
          </Typography>
          <Typography variant="h1" component="p" className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" component="p" className="mt-6 text-lg leading-8 text-gray-600">
            Here are some of the most frequently asked questions about our staking platform. If you have any other questions, feel free to reach out to our support team.
          </Typography>
        </div>
        <div className="mx-auto mt-16 max-w-2xl">
          {faqData.map((item, index) => (
            <Accordion key={index}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" component="h3">
                  {item.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="p">
                  {item.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SupportPage;