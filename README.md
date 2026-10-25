# 华邻网 HuaLin

在美华人新闻与分类信息网站。纯静态网页，托管在 GitHub Pages，全部免费。

## 新闻怎么更新

`.github/workflows/update-news.yml` 每小时运行一次 `scripts/fetch.mjs`：
从 Google 新闻（中英文）、BBC 中文、法广、德国之声等 RSS 抓标题，写入 `data/news.json`；
同时更新汇率（open.er-api.com）和纽约天气（open-meteo.com），写入 `data/market.json`。
不需要任何 API 密钥，也不使用 Claude。想马上更新：Actions → Update news and deploy → Run workflow。

## 打开发布功能（Supabase 免费版）

1. 在 https://supabase.com 注册，新建一个项目。
2. 打开 SQL Editor，把 `supabase/schema.sql` 全部贴进去，点 Run。
3. 在 Project Settings → API 复制 Project URL 和 publishable（或 anon）key。
4. 填进 `config.js` 的 `supabaseUrl` 和 `supabaseKey`，保存即可。

管理帖子：Supabase → Table Editor → posts。把 `hidden` 改成 true 可隐藏，或直接删除那一行。

## 卖广告位

编辑 `data/ads.json`，例如：

```json
{ "slots": [
  { "position": "top", "name": {"zh": "某某律师事务所", "en": "Example Law Office"},
    "desc": {"zh": "车祸工伤 免费咨询", "en": "Free consultation"},
    "phone": "212-000-0000", "wechat": "", "url": "", "until": "2026-12-31" }
]}
```

`position` 可选 `top`（目录下方三格）或 `rail`（右侧栏）。过了 `until` 日期自动下架。
在 `config.js` 的 `adContact` 填你的电话或微信，空广告位上会显示，方便商家联系你。

## 举报与防骗

`supabase/02-reports.sql` 增加举报功能：同一条信息被 3 个不同访客举报后自动隐藏。
在 Supabase → Table Editor → reports 查看举报，要恢复某条信息就把 posts 里的 `hidden` 改回 false。
信息里出现“定金、先付款、转账、礼品卡、证件号”等字眼时，页面会自动显示防骗提醒（规则在 `assets/common.js` 的 SCAM 列表）。

## 每条信息的独立页面

GitHub Actions 每 30 分钟为每条信息生成 `p/<编号>/` 页面，转发到微信时会显示信息标题和摘要。
刚发布、还没生成页面的信息，由 `404.html` 实时载入，链接一样能打开。
