# nodejs-frontend-starter

このプロジェクトは、Node.jsとフロントエンド開発のための基本的なスターターテンプレートです。パッケージマネージャーとしてpnpmを使用しています。

## 始め方

1. リポジトリをクローンする：
   ```
   git clone https://github.com/yourusername/nodejs-frontend-starter.git
   ```

2. pnpmをインストールする（まだインストールしていない場合）：
   ```
   npm install -g pnpm
   ```

3. 依存関係をインストールする：
   ```
   cd nodejs-frontend-starter
   pnpm install
   ```

4. 開発サーバーを起動する：
   ```
   pnpm start
   ```

5. ブラウザで `http://localhost:8282` を開く

## スクリプト

- `pnpm start`: サーバーを起動
- `pnpm build`: プロダクション用にビルド
- `pnpm lint`: ESLintでコードをチェック
