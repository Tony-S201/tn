'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";

import CustomConnectButton from "./shared/CustomConnectButton";

const Navigation: React.FunctionComponent = (): JSX.Element => {

  const path = usePathname();

  return (
    <nav className="navigation fixed top-0 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-80 backdrop-blur-md rounded-full shadow-md p-4 z-50">
      <ul className="flex items-center justify-center space-x-8">
          <li><Link href="/" className={path === "/" ? "active" : ""}>Home</Link></li>
          <li><Link href="/support" className={path === "/support" ? "active" : ""}>FAQ</Link></li>
          <li><CustomConnectButton /></li>
      </ul>
    </nav>
  )
}

export default Navigation;