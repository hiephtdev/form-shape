# Form Shape - NFT Minting Tool

A Next.js web application for minting NFTs on the Shape network using a list of private keys.

## Features

- Simple and user-friendly interface
- Batch processing of multiple wallets
- Real-time progress tracking and logging
- Secure client-side processing of private keys

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd form-shape
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env.local` file with your configuration:
   ```
   RPC_URL=https://shape-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   NFT_ADDRESS=0x6b6F66331D99e5691d340EA1924d8EAae151CE6d
   CONTRACT_ADDRESS=0x32953D7ae37B05075b88c34E800aE80C1Cb1B794
   PRICE=0.0009
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Enter your private keys in the text area, one per line.
2. Click "Start Minting" to begin the process.
3. Monitor the progress and results in the logs section.

## Security Notes

- Private keys are processed directly in your browser and are never stored on any server.
- For maximum security, consider running this application locally.
- Never share your private keys with untrusted sources.

## Configuration

You can modify the following settings in the `.env.local` file:

- `RPC_URL`: The RPC endpoint for the Shape network
- `NFT_ADDRESS`: The address of the NFT contract
- `CONTRACT_ADDRESS`: The address of the purchase contract
- `PRICE`: The price to mint each NFT in ETH

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
