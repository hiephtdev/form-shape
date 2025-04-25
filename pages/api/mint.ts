import { ethers } from 'ethers';
import type { NextApiRequest, NextApiResponse } from 'next';

// Configuration from environment variables
const RPC_URL = process.env.RPC_URL || 'https://shape-mainnet.g.alchemy.com/v2/D3_DfztuA6EjmDawQ4PoZup0EPq5PQ30';
const NFT_ADDRESS = process.env.NFT_ADDRESS || '0x6b6F66331D99e5691d340EA1924d8EAae151CE6d';
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x32953D7ae37B05075b88c34E800aE80C1Cb1B794";
const CONTRACT_ABI = [
  'function purchase(address nftAddress, uint256 tokenId, address recipient, uint256 numberToMint, uint256 presaleNumberCanMint, bytes32[] proof)'
];
const NUMBER_TO_MINT = 1;
const PRESALE_NUMBER_CAN_MINT = 0;
const PROOF: string[] = [];
const PRICE = ethers.parseEther(process.env.PRICE || "0.0009");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Set up streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const privateKeys: string[] = req.body.privateKeys || [];
  if (!privateKeys.length) {
    res.status(400).json({ message: 'No private keys provided' });
    return;
  }
  
  // Helper function to send log message
  const sendLog = (message: string) => {
    res.write(JSON.stringify({ type: 'log', message }) + '\n');
  };
  
  // Helper function to update progress
  const updateProgress = (current: number, success: number, failed: number) => {
    res.write(JSON.stringify({ type: 'progress', current, success, failed }) + '\n');
  };

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    let totalProcessed = 0;
    let successCount = 0;
    let failedCount = 0;

    sendLog("📡 Starting minting process...");
    
    // Process each wallet
    for (let i = 0; i < privateKeys.length; i++) {
      const privateKey = privateKeys[i];
      
      try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
        const address = await wallet.getAddress();
        
        sendLog(`🔑 Processing wallet ${i+1}/${privateKeys.length}: ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
        
        // Process each token ID (1-4) for this wallet
        for (let tokenId = 1; tokenId <= 4; tokenId++) {
          try {
            sendLog(`🔄 Minting tokenId ${tokenId} for ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
            
            const tx = await contract.purchase(
              NFT_ADDRESS,
              tokenId,
              address,
              NUMBER_TO_MINT,
              PRESALE_NUMBER_CAN_MINT,
              PROOF,
              { value: PRICE }
            );
            
            sendLog(`📤 Transaction sent: ${tx.hash}`);
            
            await tx.wait();
            
            sendLog(`✅ Successfully minted tokenId ${tokenId} for ${address.substring(0, 6)}...${address.substring(address.length - 4)}`);
            successCount++;
          } catch (error: any) {
            sendLog(`❌ Failed to mint tokenId ${tokenId} for ${address.substring(0, 6)}...${address.substring(address.length - 4)}: ${error.message}`);
            failedCount++;
          }
          
          totalProcessed++;
          updateProgress(totalProcessed, successCount, failedCount);
        }
      } catch (error: any) {
        sendLog(`❌ Error processing wallet ${privateKey.substring(0, 6)}...: ${error.message}`);
        
        // Count the remaining token IDs as failed
        failedCount += 4;
        totalProcessed += 4;
        updateProgress(totalProcessed, successCount, failedCount);
      }
    }
    
    sendLog(`🏁 Minting process completed. Success: ${successCount}, Failed: ${failedCount}`);
    res.end();
  } catch (error: any) {
    sendLog(`❌ Error: ${error.message}`);
    res.end();
  }
} 