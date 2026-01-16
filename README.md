# Solana NFT with Metaplex Core

Solana上でMetaplex Coreを使用してCore NFTを作成するプロジェクトです。

## Metaplex Core NFTとは

- Metaplexの最新NFT標準
- 従来のToken Metadataより軽量・低コスト
- cNFT（Compressed NFT）とは異なります

## 前提条件

- Node.js (v18以上推奨)
- Solana CLIがインストール・設定済みであること

```bash
# Solana CLIのインストール確認
solana --version

# 設定確認
solana config get
```

## セットアップ

```bash
npm install
```

## 手順

### Step 1: Solana CLIの設定確認

```bash
solana config get
```

出力例：
```
Config File: /Users/xxx/.config/solana/cli/config.yml
RPC URL: https://api.devnet.solana.com
Keypair Path: /Users/xxx/.config/solana/id.json
```

devnetを使用する場合：
```bash
solana config set --url devnet
```

### Step 2: 残高確認・エアドロップ（devnetの場合）

```bash
# 残高確認
solana balance

# SOLが不足している場合はエアドロップ
solana airdrop 2
```

または https://faucet.solana.com/ からエアドロップできます。

### Step 3: Collection NFTを作成

```bash
npm run create-collection
```

出力例：
```
🚀 Creating Collection NFT...
🌐 RPC: https://api.devnet.solana.com

📂 Loading wallet from: /Users/xxx/.config/solana/id.json
👛 Wallet address: xxxx
💰 Balance: 1.5 SOL

📦 Creating Collection...

✅ Collection created successfully!
📍 Collection Address: xxxx
🔗 Transaction: https://explorer.solana.com/tx/xxxx?cluster=devnet

💾 Collection address saved to collection.json
```

### Step 4: Asset NFT（Collectionに紐づいたNFT）を作成

```bash
# 自動番号
npm run create-nft

# 番号を指定
npm run create-nft -- 001
npm run create-nft -- 002
```

出力例：
```
🚀 Creating Asset NFT...
🌐 RPC: https://api.devnet.solana.com

📂 Loading wallet from: /Users/xxx/.config/solana/id.json
👛 Wallet address: xxxx
💰 Balance: 1.4 SOL

📦 Using Collection: xxxx
✅ Collection verified: YukiTest202601Col

🎨 Creating YukiTest20260116Ass#001...

✅ NFT created successfully!
📍 Asset Address: xxxx
📦 Collection: xxxx
🔗 Transaction: https://explorer.solana.com/tx/xxxx?cluster=devnet

💾 NFT data saved to nfts.json
```

### Step 5: 作成したAssetの確認

```bash
# 最後に作成したNFTを確認
npm run fetch-asset

# 特定のアドレスを確認
npm run fetch-asset -- <ASSET_ADDRESS>
```

出力例：
```
🔍 Fetching Asset Info...
🌐 RPC: https://api.devnet.solana.com

📍 Asset Address: xxxx

=== Asset Info ===
Name: YukiTest20260116Ass#001
URI: https://example.com/nft-001-metadata.json
Owner: xxxx
Update Authority: Collection

=== Collection Info ===
Collection Address: xxxx
✅ This asset is VERIFIED as part of the collection!
Collection Name: YukiTest202601Col
Collection URI: https://example.com/collection-metadata.json
```

## Explorerでの確認

| Explorer | URL | Core NFT対応 |
|----------|-----|-------------|
| Metaplex Core Explorer | https://core.metaplex.com/explorer | ✅ 最適（Collection内のAsset一覧も確認可能） |
| SolanaFM | https://solana.fm | ✅ 対応 |
| Solana Explorer | https://explorer.solana.com | △ 基本情報のみ |

**Metaplex Core Explorer**でCollection addressを検索すると、そのCollectionに属するAsset一覧も確認できます。

## ファイル構成

```
solana_nft/
├── src/
│   ├── createCollection.ts  # Collection作成スクリプト
│   ├── createNft.ts         # Asset作成スクリプト
│   └── fetchAsset.ts        # Asset確認スクリプト
├── collection.json          # 作成したCollectionのアドレス（自動生成）
├── nfts.json                # 作成したAssetの一覧（自動生成）
├── package.json
├── tsconfig.json
└── README.md
```

## NFT名について

現在の設定：
- **Collection名**: `YukiTest202601Col`
- **Asset名**: `YukiTest20260116Ass#<番号>`

変更する場合は以下のファイルを編集してください：
- `src/createCollection.ts` - `collectionName`変数
- `src/createNft.ts` - `assetName`変数

## メタデータについて

実際のNFTを作成する場合は、以下のようなJSON形式のメタデータをIPFSやArweaveにアップロードし、そのURIを使用してください：

```json
{
  "name": "YukiTest20260116Ass#001",
  "description": "Description of the NFT",
  "image": "https://your-storage.com/image.png",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    }
  ]
}
```

## コマンド一覧

| コマンド | 説明 |
|----------|------|
| `npm run create-collection` | Collection NFTを作成 |
| `npm run create-nft` | Asset NFTを作成（Collectionに紐づけ） |
| `npm run create-nft -- <番号>` | 番号を指定してAsset NFTを作成 |
| `npm run fetch-asset` | 最後に作成したAssetの情報を確認 |
| `npm run fetch-asset -- <アドレス>` | 指定したAssetの情報を確認 |

---

## メインネット（mainnet-beta）での実行

### ネットワーク切り替え

```bash
# mainnet-betaに設定
solana config set --url mainnet-beta

# 設定確認
solana config get

# 残高確認（実際のSOLが必要）
solana balance
```

**注意**: メインネットでは実際のSOLが必要です。エアドロップはできません。

### 実行結果（2026年1月16日）

#### Collection作成

```
📍 Collection Address: AFRzDncGCk16LFekTzEbd37y2Q1hSBeFEadQVU65pK8H
📛 Collection Name: YukiTest202601Col
```

- Metaplex Core Explorer: https://core.metaplex.com/explorer/AFRzDncGCk16LFekTzEbd37y2Q1hSBeFEadQVU65pK8H
- SolanaFM: https://solana.fm/address/AFRzDncGCk16LFekTzEbd37y2Q1hSBeFEadQVU65pK8H

#### Asset作成

```
📍 Asset Address: 8dn2Tkzr8ciCCteqhX8dQEar6vLXFQKShBrGFtsCw5y7
📛 Asset Name: YukiTest20260116Ass#001
📦 Collection: AFRzDncGCk16LFekTzEbd37y2Q1hSBeFEadQVU65pK8H
```

- Metaplex Core Explorer: https://core.metaplex.com/explorer/8dn2Tkzr8ciCCteqhX8dQEar6vLXFQKShBrGFtsCw5y7
- SolanaFM: https://solana.fm/address/8dn2Tkzr8ciCCteqhX8dQEar6vLXFQKShBrGFtsCw5y7

### devnetに戻す場合

```bash
solana config set --url devnet
```
