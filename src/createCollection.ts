import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import {
  generateSigner,
  keypairIdentity,
  createSignerFromKeypair,
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

  console.log(`🚀 Creating Collection NFT...`);
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
    console.log(`   solana airdrop 2 ${signer.publicKey} --url devnet`);
    console.log("\n   Or visit: https://faucet.solana.com/");
    return;
  }

  // Generate collection signer
  const collectionSigner = generateSigner(umi);

  console.log("📦 Creating Collection...");

  // Create collection
  const collectionName = "YukiTest202601Col";
  const tx = await createCollection(umi, {
    collection: collectionSigner,
    name: collectionName,
    uri: "https://example.com/collection-metadata.json",
  }).sendAndConfirm(umi);

  // Determine cluster for explorer URL
  const cluster = endpoint.includes("devnet") ? "devnet" : endpoint.includes("mainnet") ? "mainnet" : "custom";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;

  console.log("\n✅ Collection created successfully!");
  console.log(`📍 Collection Address: ${collectionSigner.publicKey}`);
  console.log(`🔗 Transaction: https://explorer.solana.com/tx/${Buffer.from(tx.signature).toString("base64")}${clusterParam}`);

  // Save collection address for later use
  const collectionData = {
    address: collectionSigner.publicKey.toString(),
    name: collectionName,
    createdAt: new Date().toISOString(),
  };
  fs.writeFileSync(
    path.join(__dirname, "../collection.json"),
    JSON.stringify(collectionData, null, 2)
  );
  console.log("\n💾 Collection address saved to collection.json");
}

main().catch(console.error);
