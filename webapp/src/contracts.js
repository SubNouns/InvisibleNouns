import {ethers} from "ethers";

const provider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_JSONRPC);
const contractSubNouns = new ethers.Contract(process.env.REACT_APP_SUBNOUNS_CONTRACT, [
    'function totalSupply() view returns (uint256)',
    'function price() view returns (uint256)',
    'function ownerOf(uint256) view returns (address)',
], provider);
const contractNouns = new ethers.Contract('0x9C8fF314C9Bc7F6e59A9d9225Fb22946427eDC03', [
    'function seeds(uint256) view returns (tulpe(uint48, uint48, uint48, uint48, uint48))',
    'function totalSupply() view returns (uint256)',
    'function ownerOf(uint256) view returns (address)',
], provider);
const contractNounsDescriptor = new ethers.Contract('0x0Cfdb3Ba1694c2bb2CFACB0339ad7b1Ae5932B63', ['function generateSVGImage(tulpe(uint48, uint48, uint48, uint48, uint48)) view returns (string)'], provider);
const contractNounsAuction = new ethers.Contract('0x830BD73E4184ceF73443C15111a1DF14e495C706', ['function auction() view returns (tulpe(uint256, uint256, uint256, uint256, address payable, bool))'], provider);
const contractSubNounsMint = (web3Provider) => {
    const provider = new ethers.providers.Web3Provider(web3Provider);
    const contract = new ethers.Contract(process.env.REACT_APP_SUBNOUNS_CONTRACT, ['function mint() payable'], provider.getUncheckedSigner());
    return contract.mint;
}

export {contractSubNouns, contractNouns, contractNounsDescriptor, contractNounsAuction, contractSubNounsMint}
