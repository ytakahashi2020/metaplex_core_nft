import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  create,
  mplCore,
  fetchCollection,
} from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  createSignerFromKeypair,
  publicKey,
} from "@metaplex-foundation/umi";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as yaml from "yaml";

// Load Solana CLI config
function loadSolanaConfig() {
  const configPath = path.join(os.homedir(), ".config/solana/cli/config.yml");
  const configFile = fs.readFileSync(configPath, "utf-8");
  return yaml.parse(configFile);
}

async function main() {
  // Load config from Solana CLI
  const solanaConfig = loadSolanaConfig();
  const endpoint = solanaConfig.json_rpc_url;
  const keypairPath = solanaConfig.keypair_path;

  console.log(`🚀 Creating Asset NFT...`);
  console.log(`🌐 RPC: ${endpoint}\n`);

  // Initialize Umi
  const umi = createUmi(endpoint).use(mplCore());

  // Load wallet from Solana CLI config
  console.log(`📂 Loading wallet from: ${keypairPath}`);
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));
  const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(secretKey));
  const signer = createSignerFromKeypair(umi, keypair);
  umi.use(keypairIdentity(signer));

  console.log(`👛 Wallet address: ${signer.publicKey}`);

  // Check balance
  const balance = await umi.rpc.getBalance(signer.publicKey);
  console.log(`💰 Balance: ${Number(balance.basisPoints) / 1e9} SOL\n`);

  if (Number(balance.basisPoints) < 0.01 * 1e9) {
    console.log("⚠️  Insufficient balance! Please airdrop some SOL:");
    console.log(`   solana airdrop 2 ${signer.publicKey}`);
    return;
  }

  // Load collection address
  const collectionPath = path.join(__dirname, "../collection.json");
  if (!fs.existsSync(collectionPath)) {
    console.log("❌ Collection not found! Please run 'npm run create-collection' first.");
    return;
  }

  const collectionData = JSON.parse(fs.readFileSync(collectionPath, "utf-8"));
  const collectionAddress = publicKey(collectionData.address);

  console.log(`📦 Using Collection: ${collectionAddress}`);

  // Fetch collection to verify it exists and use it for linking
  let collection;
  try {
    collection = await fetchCollection(umi, collectionAddress);
    console.log(`✅ Collection verified: ${collection.name}\n`);
  } catch (error) {
    console.log("❌ Failed to fetch collection. Make sure the collection exists on the current network.");
    return;
  }

  // Generate asset signer
  const assetSigner = generateSigner(umi);

  // Get NFT number from command line or use timestamp
  const nftNumber = process.argv[2] || Date.now().toString().slice(-4);

  const assetName = `YukiTest20260116Ass#${nftNumber}`;
  console.log(`🎨 Creating ${assetName}...`);

  // Create NFT asset linked to collection
  // Pass the fetched collection object to properly link and verify
  const tx = await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: assetName,
    uri: `https://example.com/nft-${nftNumber}-metadata.json`,
  }).sendAndConfirm(umi);

  // Determine cluster for explorer URL
  const cluster = endpoint.includes("devnet") ? "devnet" : endpoint.includes("mainnet") ? "mainnet" : "custom";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;

  console.log("\n✅ NFT created successfully!");
  console.log(`📍 Asset Address: ${assetSigner.publicKey}`);
  console.log(`📦 Collection: ${collectionAddress}`);
  console.log(`🔗 Transaction: https://explorer.solana.com/tx/${Buffer.from(tx.signature).toString("base64")}${clusterParam}`);

  // Save NFT data
  const nftsPath = path.join(__dirname, "../nfts.json");
  let nfts: any[] = [];
  if (fs.existsSync(nftsPath)) {
    nfts = JSON.parse(fs.readFileSync(nftsPath, "utf-8"));
  }

  nfts.push({
    address: assetSigner.publicKey.toString(),
    name: assetName,
    collection: collectionAddress.toString(),
    createdAt: new Date().toISOString(),
  });

  fs.writeFileSync(nftsPath, JSON.stringify(nfts, null, 2));
  console.log("\n💾 NFT data saved to nfts.json");
}

main().catch(console.error);
