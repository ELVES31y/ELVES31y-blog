-- ============================================================
--  ELVES31y的小屋 — D1 数据库建表语句 + 初始数据
--  用法：在 Cloudflare 后台 D1 控制台的 Console 里整段粘贴执行，
--        或命令行 `wrangler d1 execute <数据库名> --file=./schema.sql`
-- ============================================================

-- 1) 文章表
CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  description   TEXT DEFAULT '',
  cover         TEXT DEFAULT '',
  category      TEXT DEFAULT '未分类',
  content       TEXT NOT NULL,            -- Markdown 正文
  status        TEXT DEFAULT 'published', -- published / draft
  is_pinned     INTEGER DEFAULT 0,        -- 1 表示置顶
  views         INTEGER DEFAULT 0,
  likes         INTEGER DEFAULT 0,
  word_count    INTEGER DEFAULT 0,
  reading_time  INTEGER DEFAULT 0,
  published_at  TEXT,
  created_at    TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at    TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 2) 说说表（时间线）
CREATE TABLE IF NOT EXISTS moments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  content     TEXT NOT NULL,
  images      TEXT DEFAULT '[]',          -- JSON 数组，例如 ["https://...jpg"]
  mood        TEXT DEFAULT '',
  status      TEXT DEFAULT 'published',   -- published / draft
  likes       INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 3) 评论表（访客填昵称 + 内容即可发）
CREATE TABLE IF NOT EXISTS comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL,
  nickname    TEXT DEFAULT '匿名',
  content     TEXT NOT NULL,
  status      TEXT DEFAULT 'approved',    -- approved 显示 / pending 待审 / hidden 隐藏
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);

-- 4) 标签表
CREATE TABLE IF NOT EXISTS tags (
  id    INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL UNIQUE,
  slug  TEXT NOT NULL UNIQUE
);

-- 5) 文章-标签 关联表（多对多）
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (post_id, tag_id)
);

-- 6) 照片表（照片墙 / R2 上传）
CREATE TABLE IF NOT EXISTS photos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  url         TEXT NOT NULL,
  caption     TEXT DEFAULT '',
  orientation TEXT DEFAULT 'landscape',   -- landscape 横 / portrait 竖
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 7) 音乐表（APlayer 播放列表）
CREATE TABLE IF NOT EXISTS music_tracks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  artist      TEXT DEFAULT '',
  url         TEXT NOT NULL,              -- 歌曲直链（mp3/flac 等）
  cover       TEXT DEFAULT '',            -- 封面图 URL
  lrc         TEXT DEFAULT '',            -- 歌词文本
  sort        INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 8) 站点设置表（这里只放后台密码的盐和哈希）
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ============================================================
--  初始数据
--  后台默认密码是：elves31y-admin  （上线后请尽快修改，方法见 README）
--  密码哈希 = sha256( "kirameku-blog" + 密码 )
-- ============================================================

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('admin_salt', 'kirameku-blog'),
  ('admin_hash', 'd527da12364a4d1d8fdb55818ca560726116a847c52b3c08489d040c604473fb');

INSERT OR IGNORE INTO tags (name, slug) VALUES
  ('生活', 'life'),
  ('技术', 'tech'),
  ('随笔', 'essay');

INSERT OR IGNORE INTO posts
  (title, slug, description, cover, category, content, status, is_pinned, word_count, reading_time, published_at)
VALUES
  ('欢迎来到 ELVES31y的小屋', 'welcome',
   '这是我的第一篇博客，简单介绍一下这个站点。',
   '', '生活',
   '# 你好呀 👋

这里是 **ELVES31y的小屋**，一个属于我的小角落。

## 这里有什么

- 📝 文章：记录技术和生活
- 💬 说说：随手写的小心情
- 📷 照片：生活碎片
- 🎵 音乐：我喜欢听的歌

```js
console.log("Hello, world!");
```

> 愿这个小屋，能装下所有温柔的时光。',
   'published', 1, 86, 1,
   '2025-06-01T10:00:00.000Z'),
  ('用 Cloudflare 搭建个人博客', 'cloudflare-blog',
   '从零开始，用 Pages + D1 + R2 搭一个属于你自己的博客。',
   '', '技术',
   '# 为什么选 Cloudflare

- 免费额度够用
- 部署简单
- 全球 CDN 加速

## 核心组成

| 部分 | 用途 |
| --- | --- |
| Pages | 托管网页和接口 |
| D1 | 存数据 |
| R2 | 存图片 |

## 小结

```sql
SELECT * FROM posts LIMIT 5;
```
',
   'published', 0, 120, 1,
   '2025-06-02T10:00:00.000Z');

INSERT OR IGNORE INTO post_tags (post_id, tag_id)
  SELECT p.id, t.id FROM posts p, tags t
  WHERE p.slug = 'welcome'   AND t.slug IN ('生活','随笔');

INSERT OR IGNORE INTO post_tags (post_id, tag_id)
  SELECT p.id, t.id FROM posts p, tags t
  WHERE p.slug = 'cloudflare-blog' AND t.slug = '技术';

INSERT OR IGNORE INTO moments (content, mood, status, created_at) VALUES
  ('今天把博客搭起来了，好开心！🌸', '开心', 'published', '2025-06-01T12:00:00.000Z'),
  ('写代码到凌晨，泡了一杯热牛奶。', '平淡', 'published', '2025-06-02T01:30:00.000Z');

INSERT OR IGNORE INTO music_tracks (title, artist, url, cover, sort) VALUES
  ('SoundHelix Song 1', 'SoundHelix', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', '', 1),
  ('SoundHelix Song 2', 'SoundHelix', 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', '', 2);
