# タイピング練習アプリ

Next.js + TypeScript + Tailwind CSSで作成された日本語ローマ字入力タイピング練習アプリケーションです。

## 機能

- ✅ 日本語ローマ字入力タイピング練習
- ✅ 10秒タイマー機能
- ✅ ランダム問題生成（450語以上の単語データベースから）
- ✅ 無限モード（時間内に何問でも挑戦可能）
- ✅ スコア計測（正しくタイプした文字数）
- ✅ ミスタイプ回数の表示
- ✅ ミスタイプ時の視覚・音声フィードバック（背景の赤い点滅＋エラー音）
- ✅ キーボードショートカット対応（s/スペースでスタート、Escでリセット）
- ✅ 最近の成績記録（ローカルストレージに最大10件保存）
- ✅ オンラインランキング機能（Supabase）
- ✅ TOP3の金・銀・銅メダル表示
- ✅ レスポンシブデザイン（スマホ・タブレット対応）

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Hooks
- **データ保存**: LocalStorage（個人成績）、Supabase（オンラインランキング）

## 起動方法

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

プロジェクトのルートディレクトリに`.env.local`ファイルを作成し、Supabaseの接続情報を設定します。

#### 手順

1. `.env.example`ファイルをコピーして`.env.local`を作成：

```bash
cp .env.example .env.local
```

2. `.env.local`ファイルを開いて、以下の値を入力：

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Supabaseダッシュボードから必要な情報を取得：
   - [Supabase](https://supabase.com/)にログイン
   - プロジェクトを選択
   - **Settings** > **API** を開く
   - **Project URL**を`NEXT_PUBLIC_SUPABASE_URL`にコピー
   - **Project API keys**の**anon public**を`NEXT_PUBLIC_SUPABASE_ANON_KEY`にコピー

### 3. Supabaseの設定

Supabaseのダッシュボードで以下のSQLを実行してテーブルを作成します：

```sql
CREATE TABLE rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  score INTEGER NOT NULL,
  completed_count INTEGER NOT NULL,
  mistypes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Row Level Security（RLS）の設定
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが読み取り可能
CREATE POLICY "Anyone can read rankings" ON rankings
  FOR SELECT USING (true);

-- 全ユーザーが登録可能
CREATE POLICY "Anyone can insert rankings" ON rankings
  FOR INSERT WITH CHECK (true);
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

### 5. ブラウザでアクセス

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリを使用できます。

## ビルド

本番環境用にビルドする場合：

```bash
npm run build
npm start
```

## プロジェクト構成

```
typing-app/
├── app/
│   ├── page.tsx          # メインページ（タイピングゲームUI）
│   ├── layout.tsx        # レイアウトコンポーネント
│   └── globals.css       # グローバルスタイル
├── lib/
│   ├── supabase.ts       # Supabaseクライアント初期化
│   └── ranking.ts        # ランキングAPI関数
├── types/
│   └── typing.ts         # タイピング関連の型定義
├── utils/
│   ├── romajiConverter.ts   # ひらがな→ローマ字変換ユーティリティ
│   ├── problemGenerator.ts  # ランダム問題生成ユーティリティ
│   └── sound.ts             # エラー音再生ユーティリティ
├── data/
│   ├── problems.ts       # タイピング問題データ（旧）
│   └── wordList.ts       # 日本語単語データベース（450語以上）
├── hooks/
│   └── useLocalStorage.ts # ローカルストレージ用カスタムフック
└── public/               # 静的ファイル
```

## 使い方

### 準備画面
1. 「スタート」ボタンをクリック、または **sキー / スペースキー** を押してゲーム開始
2. 問題は450語以上の単語データベースからランダムに生成されます

### プレイ画面
1. 画面に表示される日本語の単語をローマ字で入力
2. 正しく入力すると次の問題が自動生成されます
3. 10秒のタイマーが終了するまで何問でも挑戦可能
4. **Escキー** を押すといつでもリセットできます

### 結果画面
- **スコア**: 正しくタイプした文字数の合計
- **完了した問題数**: 10秒間に完了した問題の数
- **ミスタイプ**: 間違えてタイプした回数
- **ランキング登録**: ユーザー名を入力してスコアをオンラインランキングに登録
- **TOP10ランキング**: 他のユーザーのスコアを確認可能
- 「もう一度挑戦」ボタン、または **Escキー** で再スタート

### 成績記録（タブ切り替え）
準備画面で「最近の成績」と「ランキング」をタブで切り替えて表示できます。

#### 最近の成績タブ
- 過去10回分のスコアが自動的に保存されます（ローカルストレージ）
- 日時、スコア、単語数、ミス数が表示されます

#### ランキングタブ
- オンラインでTOP10のスコアを表示
- TOP3は金・銀・銅のカード形式で表示
- 4位以下はシンプルな一覧形式で表示

### キーボードショートカット
- **sキー** または **スペースキー**: ゲームを開始
- **Escキー**: ゲームをリセット（プレイ中・結果画面で使用可能）

## ローマ字入力対応表

- し: `si` または `shi`
- ち: `ti` または `chi`
- つ: `tu` または `tsu`
- ふ: `hu` または `fu`
- じ: `zi` または `ji`
- しゃ: `sya` または `sha`
- ちゃ: `tya` または `cha`
- じゃ: `zya` または `ja`
- ん: `nn` または `n`（次の文字が母音の場合は`nn`必須）

その他、一般的なローマ字入力ルールに対応しています。
