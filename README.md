# Web Aqua合同会社 30秒CM（モーショングラフィックス）

**完成版：[`output/web-aqua-cm-30s.mp4`](output/web-aqua-cm-30s.mp4)**（1920×1080 / 30fps / 30.0秒 / H.264 + AAC）

映像は Canvas 2D でコードからフレームごとに描き、音楽と効果音も `tools/audio.py` で一から合成しています。
外部の写真・イラスト・音源は使っていません。

## 構成（絵コンテ）

| 秒 | シーン | 内容 | 根拠となる公式情報 |
|---|---|---|---|
| 0.0–3.5 | 導入 | 水滴が落ちて波紋が広がる →「あなたのホームページ、AIからおすすめされていますか？」 | AI SEO／AI検索対策（次のシーンへの問いかけ） |
| 3.5–7.5 | AI SEO | 検索バーに「集客できるホームページ」と入力 →「検索にも、AIにも。見つけてもらえるホームページへ。」 | サイトタイトル「集客できるホームページ作成」／「これからのSEO『AI検索対策』セミナー」／AI SEO |
| 7.5–11.5 | 美容・健康 | 薬機法・景表法 × SEO →「売りにくい商品を、売れる仕組みへ。」 | 美容・健康業界向けに AI SEO・薬機法・景表法対策で Web 戦略を立て、売りにくい商品を「売れる仕組み」にする |
| 11.5–15.0 | サービス | 企画・制作／保守・管理／Webコンサルティング／内製化支援／セミナー／AI開発 | 会社概要の事業内容、事業内容ページ、IT支援コンシェルジュ（内製化支援） |
| 15.0–19.0 | 1Day | 「その日に作って、その日に公開。」「編集方法のレクチャー付き」 | 料金ページの 1Day メニュー（当日制作・当日公開、編集方法のレクチャー） |
| 19.0–23.0 | 歩み | 2009 創業 → 2017 Wix 大阪地区アンバサダー → 2020 Wix パートナー最上位「Legend」取得 → 2023 合同会社設立 →「15年以上」 | 会社概要（2009年6月2日 個人事業開始／2023年5月12日 合同会社設立）、代表プロフィール、「15年以上」の支援 |
| 23.0–26.5 | 想い | 「AIが登場しても、最後は、人と人とのつながり。」 | 公式サイトの記載「AIが登場しても最後は人と人とのつながり」 |
| 26.5–30.0 | エンドカード | ロゴカラーの背景に公式ロゴ ／ Webの恩恵をすべての人に。／ Web Aqua合同会社 ／ 大阪市西区西本町 ／ web-aqua.jp | 会社概要（所在地：大阪市西区西本町1-4-1 オリックス本町ビル4階） |

## 出典（すべて Web Aqua 公式サイト）

- トップ https://www.web-aqua.jp/
- 会社概要 https://www.web-aqua.jp/company
- 事業内容 https://www.web-aqua.jp/business
- 料金一覧（1Day） https://www.web-aqua.jp/price
- 代表 日向 凛 プロフィール https://www.web-aqua.jp/rinhyuga
- 合同会社設立のごあいさつ https://www.web-aqua.jp/post/20230512-webaqua-llc
- IT支援コンシェルジュ https://www.web-aqua.jp/post/20230314-it-concierge
- AI検索対策セミナー https://www.web-aqua.jp/event-details/20240809-ai-seo-seminer
- 薬機法対策 https://www.web-aqua.jp/pmd-act

## 注意点

- 制作環境から web-aqua.jp へのアクセスがネットワークポリシーで遮断されていたため、公式ページの内容は検索エンジン経由で取得した公式サイトの記載から確認しました。公開前に原文との最終照合をおすすめします。
- エンドカードには公式ロゴ（`cm/assets/webaqua-logo.png`、ご提供データ）を白抜きにして、ロゴカラー `#3FB5C8` の背景に配置しています。ロゴは筆記体を書くように左から現れます。
- 映像全体のアクセントカラーもロゴカラー `#3FB5C8` に統一しています。
- 「企画から運用まで、ずっと伴走。」「検索にも、AIにも。」などのコピーは、公式の事業内容をもとに書き起こしたものです。

## 再生成

```bash
npm install                      # フォント（Zen Kaku Gothic New / Montserrat）
pip install numpy scipy imageio-ffmpeg
python3 tools/audio.py           # output/web-aqua-cm-audio.wav
node tools/render.cjs            # output/web-aqua-cm-30s.mp4（Playwright + Chromium）
node tools/render.cjs --stills 5,10.5   # 指定秒のスチルを frames/ に書き出し
```

`cm/index.html` をブラウザで開くと、音声付きでプレビュー・シーク再生できます（`npm install` と音声の生成を先に済ませておいてください）。
