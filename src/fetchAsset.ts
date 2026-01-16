import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  fetchAsset,
  fetchCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";
import { publicKey } from "@metaplex-foundation/umi";
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
  const solanaConfig = loadSolanaConfig();
  const endpoint = solanaConfig.json_rpc_url;

  console.log(`🔍 Fetching Asset Info...`);
  console.log(`🌐 RPC: ${endpoint}\n`);

  const umi = createUmi(endpoint).use(mplCore());

  // Get asset address from command line or nfts.json
  let assetAddress: string;

  if (process.argv[2]) {
    assetAddress = process.argv[2];
  } else {
    const nftsPath = path.join(__dirname, "../nfts.json");
    if (!fs.existsSync(nftsPath)) {
      console.log("❌ No NFTs found. Please run 'npm run create-nft' first or provide an address.");
      console.log("   Usage: npm run fetch-asset -- <ASSET_ADDRESS>");
      return;
    }
    const nfts = JSON.parse(fs.readFileSync(nftsPath, "utf-8"));
    assetAddress = nfts[nfts.length - 1].address;
    console.log(`📂 Using latest NFT from nfts.json\n`);
  }

  console.log(`📍 Asset Address: ${assetAddress}\n`);

  try {
    const asset = await fetchAsset(umi, publicKey(assetAddress));

    console.log("=== Asset Info ===");
    console.log(`Name: ${asset.name}`);
    console.log(`URI: ${asset.uri}`);
    console.log(`Owner: ${asset.owner}`);
    console.log(`Update Authority: ${asset.updateAuthority.type}`);

    if (asset.updateAuthority.type === "Collection" && asset.updateAuthority.address) {
      const collectionAddress = asset.updateAuthority.address;
      console.log(`\n=== Collection Info ===`);
      console.log(`Collection Address: ${collectionAddress}`);
      console.log(`✅ This asset is VERIFIED as part of the collection!`);

      // Fetch collection details
      try {
        const collection = await fetchCollection(umi, collectionAddress);
        console.log(`Collection Name: ${collection.name}`);
        console.log(`Collection URI: ${collection.uri}`);
      } catch (e) {
        console.log(`(Could not fetch collection details)`);
      }
    } else if (asset.updateAuthority.type === "Collection") {
      console.log(`\n⚠️  Collection type but no address found.`);
    } else {
      console.log(`\n⚠️  This asset is NOT part of any collection.`);
      console.log(`   Update Authority Type: ${asset.updateAuthority.type}`);
    }

  } catch (error) {
    console.log(`❌ Failed to fetch asset: ${error}`);
  }
}

main().catch(console.error);
