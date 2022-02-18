import {useCallback, useEffect, useState, useRef} from "react";
import {useKey, useLocalStorage} from "react-use";
import {ethers} from "ethers";
import {useNavigate} from "react-router-dom";
import {useId} from "./hooks";
import {contractSubNouns, contractNouns,contractNounsDescriptor, contractNounsAuction, contractSubNounsMint } from "./contracts";
import { initOnboard, initNotify } from "./wallets";

const BACKGROUNDS = ['d5d7e1', 'e1d7d5'];

export default function App() {
  const navigate = useNavigate();
  const [localWallet, setLocalWallet, removeLocalWallet] = useLocalStorage('wallet');
  const [nounsTotalSupply, setNounsTotalSupply] = useState(-1);
  const [subNounsTotalSupply, setSubNounsTotalSupply] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [nounImage, setNounImage] = useState('');
  const [nounOwner, setNounOwner] = useState('');
  const [subNounOwner, setSubNounOwner] = useState('');
  const [background, setBackground] = useState(BACKGROUNDS[0]);
  const [nounAuctionEnd, setNounAuctionEnd] = useState(0);
  const [price, setPrice] = useState(null);
  const [address, setAddress] = useState(undefined);
  const [ens, setEns] = useState(undefined);
  const [network, setNetwork] = useState(null);
  const [wallet, setWallet] = useState({});
  const [onboard, setOnboard] = useState(null);
  const [notify, setNotify] = useState(null);
  const cache = useRef({});
  const id = useId();
  const onNext = useCallback(() => { if (loading || id === subNounsTotalSupply) return; navigate('?id=' + (id + 1)); }, [navigate, id, subNounsTotalSupply, loading]);
  const onPrev = useCallback(() => { if (loading || id === 0) return; navigate('?id=' + (id - 1)); }, [navigate, id, loading]);
  useKey('ArrowRight', onNext, {}, [id]);
  useKey('ArrowLeft', onPrev, {}, [id]);
  useEffect(() => {
    const onboard = initOnboard({
      address: setAddress,
      ens: setEns,
      network: setNetwork,
      wallet: wallet => {
        if (wallet.provider) {
          setWallet(wallet);
          setLocalWallet(wallet.name);
        } else {
          setWallet({})
        }
      }
    })
    setOnboard(onboard);
    setNotify(initNotify());
  }, []);
  useEffect(() => {
    if (localWallet && onboard) onboard.walletSelect(localWallet);
  }, [localWallet, onboard]);
  useEffect(() => {
    contractNouns.totalSupply().then(value => setNounsTotalSupply(Number(value)));
    contractSubNouns.totalSupply().then(value => setSubNounsTotalSupply(Number(value)));
    contractSubNouns.price().then(value => setPrice(value));
  }, []);
  useEffect(() => {
    if (subNounsTotalSupply !== -1 && (id === -1 || id > subNounsTotalSupply)) navigate('?id=' + subNounsTotalSupply);
  }, [navigate, id, subNounsTotalSupply]);
  useEffect(() => {
    (async () => {
      try {
        if (id === nounsTotalSupply - 1) setNounAuctionEnd(Number((await contractNounsAuction.auction())[3]));
      } catch(e) {}
    })();
  }, [id, nounsTotalSupply]);
  useEffect(() => {
    (async () => {
      if (id === -1) return;
      if (id in cache.current) {
        setNounOwner(cache.current[id].owner);
        setSubNounOwner(cache.current[id].subOwner);
        setBackground(cache.current[id].background);
        setNounImage(cache.current[id].image);
        return;
      }
      setLoading(true);
      cache.current[id] = {};
      contractNouns.ownerOf(id).then(owner => {
        setNounOwner(owner);
        cache.current[id].owner = owner;
      }).catch(console.log);
      contractSubNouns.ownerOf(id).then(owner => {
        setSubNounOwner(owner);
        cache.current[id].subOwner = owner;
      }).catch(console.log);
      try {
        const seed = await contractNouns.seeds(id);
        setBackground(BACKGROUNDS[seed[0]]);
        cache.current[id].background = BACKGROUNDS[seed[0]];
        const svg = await contractNounsDescriptor.generateSVGImage([seed[0], seed[1], seed[2], 198, seed[4]]);
        const image = 'data:image/svg+xml;base64,' + btoa(atob(svg).replace('<rect width="130" height="10" x="110" y="80" fill="#f3322c" /><rect width="180" height="10" x="80" y="90" fill="#f3322c" /><rect width="220" height="10" x="60" y="100" fill="#f3322c" /><rect width="230" height="10" x="50" y="110" fill="#f3322c" /><rect width="230" height="10" x="50" y="120" fill="#f3322c" /><rect width="230" height="10" x="50" y="130" fill="#f3322c" /><rect width="230" height="10" x="50" y="140" fill="#f3322c" /><rect width="50" height="10" x="40" y="150" fill="#d22209" /><rect width="180" height="10" x="90" y="150" fill="#abaaa8" /><rect width="60" height="10" x="40" y="160" fill="#d22209" /><rect width="170" height="10" x="100" y="160" fill="#abaaa8" /><rect width="40" height="10" x="40" y="170" fill="#d22209" /><rect width="10" height="10" x="80" y="170" fill="#f3322c" /><rect width="20" height="10" x="90" y="170" fill="#d22209" /><rect width="50" height="10" x="40" y="180" fill="#d22209" /><rect width="180" height="10" x="90" y="180" fill="#f3322c" /><rect width="240" height="10" x="40" y="190" fill="#d22209" /><rect width="240" height="10" x="40" y="200" fill="#d22209" />', ''));
        setNounImage(image);
        cache.current[id].image = image;
        setLoading(false);
      } catch(e) { console.log(e); }
    })();
  }, [id]);
  const onConnect = useCallback(() => {
    (async () => {
      if (await onboard.walletSelect()) {
        await onboard.walletCheck();
      }
    })();
  }, [onboard]);
  const onDisconnect = useCallback(() => {
    onboard.walletReset();
    removeLocalWallet();
  }, [onboard]);
  const onMint = useCallback(() => {
    (async () => {
      try {
        if (!await onboard.walletCheck()) return;
        const {hash} = await contractSubNounsMint(wallet.provider)({value: price});
        const {emitter} = notify.hash(hash);
        emitter.on('txPool', tx => {
          return {onclick: () => window.open(`https://etherscan.io/tx/${tx.hash}`)};
        });
        emitter.on('txConfirmed', tx => {
          cache.current[id].subNounOwner = tx.from;
          contractSubNouns.totalSupply().then(value => {
            setSubNounsTotalSupply(Number(value));
          });
        });
      } catch(e) { console.log(e); }
    })();
  }, [wallet, price, id]);
  return (<>
    <div className="w-full" style={{backgroundColor: '#' + background}}>
      <div className="w-full max-w-screen-lg mx-auto pt-6 px-8 lg:flex lg:justify-between">
        <a href="/"><img src="/images/logo.svg" alt="Invisible" className={"h-8"} /></a>
        {address && <button onClick={onDisconnect} className="w-full lg:w-auto mt-4 lg:mt-0 px-4 py-1 bg-gray-100 hover:bg-white cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">Disconnect</button>}
      </div>
      <div className="w-full max-w-screen-lg mx-auto grid lg:grid-cols-2 lg:gap-8 pt-16 px-8">
        <div>
          {loading ? <img src="images/loading.gif" alt="Loading..." width="100%"/> : <img src={nounImage} width="100%" alt="Invisible Noun"/>}
        </div>
        {id !== -1 && nounsTotalSupply !== -1 && subNounsTotalSupply !== -1 && price !== null && <div className="pb-4">
          <div className="flex">
            <button onClick={onPrev} className={`${id === 0 ? 'opacity-50' : 'hover:bg-white cursor-pointer'} w-8 h-8 bg-gray-100 rounded-full text-gl font-bold leading-8 text-center select-none`}>←</button>
            <button onClick={onNext} className={`${id === subNounsTotalSupply ? 'opacity-50' : 'hover:bg-white cursor-pointer'} ml-2 w-8 h-8 bg-gray-100 rounded-full text-gl font-bold leading-8 text-center select-none`}>→</button>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 py-8 lg:whitespace-nowrap" style={{fontFamily: 'Londrina Solid'}}>Invisible Noun {id}</h1>
          <Info {...{id, nounsTotalSupply, subNounsTotalSupply, nounAuctionEnd, price, onConnect, onMint, address, ens, nounOwner, subNounOwner}}/>
          <div className="mt-4 flex space-x-4">
            {id !== subNounsTotalSupply && <a href={'https://opensea.io/assets/' + process.env.REACT_APP_SUBNOUNS_CONTRACT + '/' + id} target="_blank" rel="noreferrer" className="px-4 py-1 bg-gray-100 hover:bg-white cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">OpenSea</a>}
            {id !== nounsTotalSupply - 1 && <a href={'https://nouns.wtf/noun/' + id} target="_blank" rel="noreferrer" className="px-4 py-1 bg-gray-100 hover:bg-white cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">Noun {id}</a>}
          </div>
        </div>}
      </div>
    </div>
    <div className="w-full max-w-screen-lg mx-auto grid lg:grid-cols-2 gap-8 pt-16 px-8">
      <div>
        <h1 className="text-8xl text-gray-900 lg:whitespace-pre uppercase" style={{fontFamily: 'Londrina Solid'}}>{"An invisible\nnoun for\neach Noun"}</h1>
      </div>
      <div>
        <img src="/images/example.svg" alt="Example Invisible Noun" width="100%" />
      </div>
    </div>
    <div className="w-full max-w-screen-lg mx-auto pt-16 px-8">
      <div className="w-full max-w-screen-lg">
        <h1 className="text-6xl font-bold text-gray-900 py-8" style={{fontFamily: 'Londrina Solid'}}>WTF?</h1>
        <p className="text-xl">Invisible Nouns is a completely on-chain derivative of Nouns. Part of <a href="https://twitter.com/SubNouns" target="_blank" rel="noreferrer">SubNouns project</a>. 50% of the mint price goes to the holder of the Noun by contract. For every 10th Noun 100% of the mint price goes to the Nouns DAO. The first 11 Invisible Nouns were airdropped to the holders of the first 69 Nouns.
          Mint Invisible Nouns to support my work. Two more interesting derivatives are in development.</p>
      </div>
      <div className="w-full max-w-screen-lg py-16 flex space-x-8 justify-center">
        <a href="https://opensea.io/collection/invisible-nouns">OpenSea</a> <a href="https://twitter.com/SubNouns">Twitter</a> <a href={'https://etherscan.io/address/' + process.env.REACT_APP_SUBNOUNS_CONTRACT}>Etherscan</a> <a href="https://github.com/SubNouns">GitHub</a>
      </div>
    </div>
  </>);
}

function Info({id, nounsTotalSupply, subNounsTotalSupply, nounAuctionEnd, price, onConnect, onMint, address, ens, nounOwner, subNounOwner}) {
  if (id < 11) return (<>
    <div className="font-semibold text-gray-500 mt-2">Airdroped to the holder of the Noun {id}</div>
    <div className="font-semibold text-gray-500 mt-2">Held by <a href={"https://etherscan.io/address/" + subNounOwner} target="_blank" rel="noreferrer">{subNounOwner && (address && subNounOwner.toLowerCase() === address.toLowerCase() ? 'you!' : subNounOwner.slice(0, 5) + '...' + subNounOwner.slice(-4))}</a></div>
  </>);
  if (id === nounsTotalSupply - 1) {
    if (nounAuctionEnd !== 0) return (<>
      <div className="font-semibold text-gray-500 mt-2">Auction ends on {new Date(nounAuctionEnd * 1000).toLocaleDateString('en', {day: 'numeric', month: 'short', hour: 'numeric', minute: 'numeric'})}</div>
      <a href={'https://nouns.wtf/noun/' + id} target="_blank" rel="noreferrer" className="block mt-4 p-2 bg-gray-100 hover:bg-white cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">Open Nouns Auction</a>
    </>);
    return null;
  }
  if (id < subNounsTotalSupply) return (<div className="font-semibold text-gray-500 mt-2">Held by <a href={"https://etherscan.io/address/" + subNounOwner} target="_blank" rel="noreferrer">{subNounOwner && (address && subNounOwner.toLowerCase() === address.toLowerCase() ? 'you!' : subNounOwner.slice(0, 5) + '...' + subNounOwner.slice(-4))}</a></div>);
  return (<>
    <div className="font-semibold text-gray-500 mt-2">Mint Price</div>
    <div className="text-3xl font-semibold mt-2">Ξ {ethers.utils.formatEther(price)}</div>
    {!address && <button onClick={onConnect} className="w-full mt-4 p-2 bg-gray-100 hover:bg-white cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">Connect Wallet</button>}
    {address && <button onClick={onMint} className="w-full mt-4 p-2 text-white bg-gray-900 hover:bg-gray-800 cursor-pointer rounded-lg text-gl font-bold leading-8 text-center select-none">Mint to {ens && ens.name ? ens.name : address.slice(0, 5) + '...' + address.slice(-4)}</button>}
    <div className="mt-2 flex items-center space-x-2">
      <span className="font-semibold text-gray-500">{id % 10 === 0 ? '100' : '50'}% goes to <a href={"https://etherscan.io/address/" + (id % 10 === 0 ? "0x0BC3807Ec262cB779b38D65b38158acC3bfedE10" : nounOwner)} target="_blank" rel="noreferrer">{id % 10 === 0 ? 'the Nouns DAO' : ('the owner of the Noun ' + id)}</a> by contract</span>
      <button className="bg-gray-500 text-white text-xs rounded-full w-4 h-4" title="50% of the mint price goes to the holder of the Noun by contract. For every 10th Noun 100% of the mint price goes to the Nouns DAO.">?</button>
    </div>
  </>);
}