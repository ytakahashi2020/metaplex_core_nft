import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  create,
  createCollection,
  mplCore,
  fetchAsset,
  fetchCollection,
  addPlugin,
  freezeAsset,
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

  console.log(`🚀 Creating Freezable NFT (Collection + Asset + Freeze)...`);
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

  if (Number(balance.basisPoints) < 0.02 * 1e9) {
    console.log("⚠️  Insufficient balance! Please airdrop some SOL:");
    console.log(`   solana airdrop 2 ${signer.publicKey} --url devnet`);
    console.log("\n   Or visit: https://faucet.solana.com/");
    return;
  }

  // Determine cluster for explorer URL
  const cluster = endpoint.includes("devnet") ? "devnet" : endpoint.includes("mainnet") ? "mainnet" : "custom";
  const clusterParam = cluster === "mainnet" ? "" : `?cluster=${cluster}`;

  // ============================================
  // Step 1: Create Collection
  // ============================================
  console.log("=".repeat(50));
  console.log("📦 Step 1: Creating Collection...");
  console.log("=".repeat(50));

  const collectionSigner = generateSigner(umi);
  const collectionName = "FreezableCollection";

  const collectionTx = await createCollection(umi, {
    collection: collectionSigner,
    name: collectionName,
    uri: "https://example.com/freezable-collection-metadata.json",
  }).sendAndConfirm(umi);

  console.log(`✅ Collection created!`);
  console.log(`📍 Collection Address: ${collectionSigner.publicKey}`);
  console.log(`🔗 TX: https://explorer.solana.com/tx/${Buffer.from(collectionTx.signature).toString("base64")}${clusterParam}\n`);

  // Fetch the collection object for subsequent operations
  const collection = await fetchCollection(umi, collectionSigner.publicKey);
  console.log(`✅ Collection verified: ${collection.name}\n`);

  // ============================================
  // Step 2: Create Asset
  // ============================================
  console.log("=".repeat(50));
  console.log("🎨 Step 2: Creating Asset...");
  console.log("=".repeat(50));

  const assetSigner = generateSigner(umi);
  const assetName = "FreezableAsset#1";

  // Create asset with collection object
  const assetTx = await create(umi, {
    asset: assetSigner,
    collection: collection,
    name: assetName,
    uri: "https://example.com/freezable-asset-metadata.json",
  }).sendAndConfirm(umi);

  console.log(`✅ Asset created!`);
  console.log(`📍 Asset Address: ${assetSigner.publicKey}`);
  console.log(`🔗 TX: https://explorer.solana.com/tx/${Buffer.from(assetTx.signature).toString("base64")}${clusterParam}\n`);

  // ============================================
  // Step 2.5: Add FreezeDelegate plugin
  // ============================================
  console.log("=".repeat(50));
  console.log("🔌 Step 2.5: Adding FreezeDelegate plugin...");
  console.log("=".repeat(50));

  const addPluginTx = await addPlugin(umi, {
    asset: assetSigner.publicKey,
    collection: collectionSigner.publicKey,
    plugin: {
      type: "FreezeDelegate",
      frozen: false,
    },
    authority: signer,
  }).sendAndConfirm(umi);

  console.log(`✅ FreezeDelegate plugin added!`);
  console.log(`🔗 TX: https://explorer.solana.com/tx/${Buffer.from(addPluginTx.signature).toString("base64")}${clusterParam}\n`);

  // Verify asset state before freeze
  let asset = await fetchAsset(umi, assetSigner.publicKey);
  console.log(`📊 Asset state BEFORE freeze:`);
  console.log(`   - Name: ${asset.name}`);
  console.log(`   - Owner: ${asset.owner}`);
  console.log(`   - FreezeDelegate frozen: ${asset.freezeDelegate?.frozen}\n`);

  // ============================================
  // Step 3: Freeze the Asset
  // ============================================
  console.log("=".repeat(50));
  console.log("🥶 Step 3: Freezing the Asset...");
  console.log("=".repeat(50));

  // Refetch the asset to get the latest state with FreezeDelegate
  asset = await fetchAsset(umi, assetSigner.publicKey);

  const freezeTx = await freezeAsset(umi, {
    asset: asset,
    collection: collection,
    delegate: signer,
  }).sendAndConfirm(umi);

  console.log(`✅ Asset frozen!`);
  console.log(`🔗 TX: https://explorer.solana.com/tx/${Buffer.from(freezeTx.signature).toString("base64")}${clusterParam}\n`);

  // Verify asset state after freeze
  asset = await fetchAsset(umi, assetSigner.publicKey);
  console.log(`📊 Asset state AFTER freeze:`);
  console.log(`   - Name: ${asset.name}`);
  console.log(`   - Owner: ${asset.owner}`);
  console.log(`   - FreezeDelegate frozen: ${asset.freezeDelegate?.frozen}`);

  // ============================================
  // Summary
  // ============================================
  console.log("\n" + "=".repeat(50));
  console.log("📋 Summary");
  console.log("=".repeat(50));
  console.log(`📦 Collection: ${collectionSigner.publicKey}`);
  console.log(`🎨 Asset: ${assetSigner.publicKey}`);
  console.log(`🥶 Frozen: ${asset.freezeDelegate?.frozen}`);
  console.log(`\n⚠️  This asset cannot be transferred while frozen!`);
  console.log(`   Use thawAsset() to unfreeze and allow transfers.`);

  // Save data
  const freezableData = {
    collection: {
      address: collectionSigner.publicKey.toString(),
      name: collectionName,
    },
    asset: {
      address: assetSigner.publicKey.toString(),
      name: assetName,
      frozen: true,
    },
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(__dirname, "../freezable-nft.json"),
    JSON.stringify(freezableData, null, 2)
  );
  console.log("\n💾 Data saved to freezable-nft.json");
}

main().catch(console.error);
