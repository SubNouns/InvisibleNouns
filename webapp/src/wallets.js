import Notify from "bnc-notify";
import Onboard from "bnc-onboard";

const WALLETS = {
    METAMASK: 'metamask',
    WALLET_CONNECT: 'walletConnect',
    TREZOR: 'trezor',
    LEDGER: 'ledger',
    TRUST: 'trust',
    FORTMATIC: 'fortmatic',
    PORTIS: 'portis',
    AUTHEREUM: 'authereum',
    TORUS: 'torus',
    COINBASE: 'coinbase',
    WALLET_LINK: 'walletLink',
    OPERA: 'opera',
    OPERA_TOUCH: 'operaTouch',
    LATTICE: 'lattice',
    KEYSTONE: 'keystone'
}

const dappId = process.env.REACT_APP_BLOCKNATIVE_KEY;
const rpcUrl = process.env.REACT_APP_JSONRPC;
const networkId = parseInt(process.env.REACT_APP_CHAIN_ID, 10);
const appUrl = 'invisiblenouns.wtf';
const email = 'mail@subnouns.wtf';
const appName = 'Invisible Nouns';
const wallets = [
    {
        walletName: WALLETS.METAMASK,
        preferred: true,
    },
    {
        walletName: WALLETS.WALLET_CONNECT,
        preferred: true,
        rpc: { [networkId]: rpcUrl },
        networkId,
    },
    {
        walletName: WALLETS.TREZOR,
        appUrl,
        preferred: true,
        email,
        rpcUrl,
    },
    {
        walletName: WALLETS.LEDGER,
        preferred: true,
        rpcUrl,
        LedgerTransport: window.TransportNodeHid,
    },
    {
        walletName: WALLETS.KEYSTONE,
        rpcUrl,
        appName,
    },
    {
        walletName: WALLETS.TRUST,
        preferred: true,
    },
    {
        walletName: WALLETS.LATTICE,
        rpcUrl,
        appName,
    },
    /*{
        walletName: WALLETS.FORTMATIC,
        apiKey: FORTMATIC_KEY,
    },
    {
        walletName: WALLETS.PORTIS,
        apiKey: PORTIS_ID,
        desktop: true,
    },*/
    {
        walletName: WALLETS.AUTHEREUM,
    },
    {
        walletName: WALLETS.TORUS,
    },
    {
        walletName: WALLETS.COINBASE,
    },
    {
        walletName: WALLETS.WALLET_LINK,
        rpcUrl,
    },
    {
        walletName: WALLETS.OPERA,
    },
    {
        walletName: WALLETS.OPERA_TOUCH,
    },
];

export function initNotify() {
    return Notify({
        dappId,
        networkId,
        onerror: error => console.log(`Notify error: ${error.message}`),
        desktopPosition: 'topRight',
    })
}

export function initOnboard(subscriptions) {
    return Onboard({
        dappId,
        networkId,
        // darkMode: true,
        subscriptions,
        walletSelect: {wallets},
        walletCheck: [
            { checkName: 'derivationPath' },
            { checkName: 'connect' },
            { checkName: 'accounts' },
            { checkName: 'network' },
        ]
    })
}