import { ConnectButton } from "@rainbow-me/rainbowkit";

const CustomConnectButton: React.FunctionComponent = (): JSX.Element => {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, authenticationStatus, mounted }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected = ready && account && chain && (!authenticationStatus || authenticationStatus === 'authenticated');

        return (
          <div {...(!ready && { 'aria-hidden': true, 'style': { opacity: 0, pointerEvents: 'none', userSelect: 'none' } })}>
            {(() => {
              if (!connected) {
                return (
                  <button onClick={openConnectModal} type="button" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-full">
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button onClick={openChainModal} type="button" className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full">
                    Wrong network
                  </button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                    type="button"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full"
                  >
                    {chain.hasIcon && (
                      <div style={{ background: chain.iconBackground, width: 12, height: 12, marginRight: 4, borderRadius: 999, overflow: 'hidden' }}>
                        {chain.iconUrl && (
                          <img alt={chain.name ?? 'Chain icon'} src={chain.iconUrl} style={{ width: 12, height: 12 }} />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </button>

                  <button onClick={openAccountModal} type="button" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full">
                    {account.displayName}
                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default CustomConnectButton;