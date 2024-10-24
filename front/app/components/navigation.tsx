'use client';

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import CustomConnectButton from "./shared/CustomConnectButton";
import { Dialog, DialogContent, IconButton } from "@mui/material";
import { Menu, Close } from "@mui/icons-material";

interface NavigationItems {
  name: string,
  href: string
}

const navigation: NavigationItems[] = [
  { name: 'Home', href: '/' },
  { name: 'Staking', href: '/staking' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Support', href: '/support' }
];

const Navigation: React.FunctionComponent = (): JSX.Element => {

  const path = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex lg:flex-1">
          <a href="#" className="-m-1.5 p-1.5">
            <span className="sr-only">Your Company</span>
            <img
              alt=""
              src="#"
              className="h-8 w-auto"
            />
          </a>
        </div>
        <div className="flex lg:hidden">
          <IconButton
            onClick={() => setMobileMenuOpen(true)}
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
          >
            <span className="sr-only">Open main menu</span>
            <Menu fontSize="large" aria-hidden="true" />
          </IconButton>
        </div>
        <div className="hidden lg:flex lg:gap-x-12">
          {navigation.map((item) => (
            <Link key={item.name} href={item.href} className="text-sm font-semibold leading-6 text-gray-900">
              {item.name}
            </Link>
          ))}
        </div>
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:justify-items-center lg:items-center text-sm font-semibold leading-6">
          <CustomConnectButton />
        </div>
      </nav>
      <Dialog open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} className="lg:hidden">
        <DialogContent className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
          <div className="flex items-center justify-between">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="sr-only">Your Company</span>
              <img
                alt=""
                src="#"
                className="h-8 w-auto"
              />
            </a>
            <IconButton
              onClick={() => setMobileMenuOpen(false)}
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
            >
              <span className="sr-only">Close menu</span>
              <Close fontSize="large" aria-hidden="true" />
            </IconButton>
          </div>
          <div className="mt-6 flow-root">
            <div className="-my-6 divide-y divide-gray-500/10">
              <div className="space-y-2 py-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href} className="-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50">
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="py-6 leading-7 text-base font-semibold">
                <CustomConnectButton />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}

export default Navigation;