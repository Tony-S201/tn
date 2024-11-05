import { stakingAddress } from "@/app/constants/tokens";

const Footer: React.FunctionComponent = (): JSX.Element => {
  
  const a = stakingAddress;
  
  return (
    <div>{a}</div>
  )
}

export default Footer;