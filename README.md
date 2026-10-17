# ELVES31y的小屋

一个部署在 **Cloudflare Pages** 生态上的全栈个人博客。

- 前端：原生 HTML + CSS + JS（无框架）
- 后端：Cloudflare Pages Functions（`/functions` 目录）
- 数据库：Cloudflare D1（SQLite）
- 图片存储：Cloudflare R2
- 音乐播放：APlayer（CDN 引入）

视觉设计参考开源项目 [Kirameku](https://github.com/Xinghongia/Kirameku)（MIT License），用原生代码重写：淡蓝紫柔和色系、毛玻璃卡片、大圆角、柔和阴影、深浅双主题。

---

## 一、目录结构

```
kirameku-blog/
├── wrangler.toml          # Cloudflare 配置（D1/R2 绑定、密钥、静态目录）
├── schema.sql             # 建表语句 + 初始数据
├── functions/             # 后端接口（Pages Functions）
│   ├── _lib.js            # 公共工具（JSON/登录校验/标签等）
│   └── api/
│       ├── posts.js               # 文章列表（搜索/分类/标签/分页）
│       ├── posts/[slug].js        # 文章详情 + 点赞
│       ├── posts/[slug]/comments.js  # 评论列表 + 发评论
│       ├── moments.js             # 说说列表
│       ├── photos.js              # 照片列表
│       ├── music.js               # 歌单
│       ├── tags.js                # 标签
│       ├── categories.js          # 分类
│       └── admin/                 # 后台接口（需登录）
│           ├── login.js           # 密码登录
│           ├── posts.js / posts/[id].js
│           ├── moments.js / moments/[id].js
│           ├── comments.js / comments/[id].js
│           ├── upload.js          # 图片上传到 R2
│           ├── photos.js / photos/[id].js
│           └── music.js / music/[id].js
└── public/                # 前端页面
    ├── index.html         # 首页
    ├── posts.html         # 文章列表
    ├── post.html          # 文章详情
    ├── moments.html       # 说说时间线
    ├── photos.html        # 照片墙
    ├── music.html         # 音乐播放器
    ├── about.html         # 关于页
    ├── 404.html
    ├── admin.html         # 后台入口（登录 + 管理）
    ├── admin/index.html   # /admin/ 跳转到后台
    ├── css/style.css
    └── js/*.js
```

---

## 二、零基础部署教程（手把手）

> 全程大约需要 20~30 分钟。每一步都写清楚了「输入什么、看到什么算成功、失败怎么办」。

### 第 0 步：安装两个软件

1. **Node.js**（运行 wrangler 命令行工具）
   - 打开 https://nodejs.org ，下载 **LTS** 版本，一路「下一步」安装。
   - 装完后，打开一个终端（Windows 按 `Win` 键，输入 `powershell` 回车）。
   - 输入下面这行，回车：
     ```bash
     node -v
     ```
   - **成功标志**：屏幕显示类似 `v20.x.x` 或 `v22.x.x` 的版本号。
   - **失败排查**：如果提示「不是内部或外部命令」，说明没装好或没重启终端。重装后**关掉终端再重新打开**。

2. **Wrangler**（Cloudflare 官方命令行工具）
   - 在同一个终端里输入：
     ```bash
     npm install -g wrangler
     ```
   - 装完后验证：
     ```bash
     wrangler --version
     ```
   - **成功标志**：显示类似 `4.x.x` 的版本号。

### 第 1 步：注册并登录 Cloudflare

1. 打开 https://dash.cloudflare.com/sign-up ，用邮箱注册一个账号（免费即可，**不需要绑信用卡**）。
2. 注册后回到终端，输入：
   ```bash
   wrangler login
   ```
3. 浏览器会自动弹出一个 Cloudflare 授权页面，点 **Allow / 允许**。
4. **成功标志**：终端显示 `Successfully logged in.`

### 第 2 步：创建 D1 数据库，并写入表结构

1. 在项目根目录（`kirameku-blog/`）打开终端，输入：
   ```bash
   wrangler d1 create elves31y-blog-db
   ```
2. **成功标志**：终端打印出一段 JSON，里面有一行 `"database_id": "一串很长的字符"`。
3. 复制那串 `database_id`，打开项目里的 `wrangler.toml`，把这一行：
   ```toml
   database_id = "<替换为你的D1数据库ID>"
   ```
   替换成你复制到的 ID（**保留两边的引号**）。
4. 执行建表语句（把 `schema.sql` 写入云端数据库）：
   ```bash
   wrangler d1 execute elves31y-blog-db --file=./schema.sql --remote
   ```
5. **成功标志**：终端显示每个表都 `OK`（或没有报错信息，最后回到命令提示符）。
6. **失败排查**：如果提示「database not found」，回到第 1 步确认 `database_id` 填对了；如果提示网络问题，重试一次。

### 第 3 步：创建 R2 桶，开启公开访问

1. 在终端输入：
   ```bash
   wrangler r2 bucket create elves31y-blog-images
   ```
   **成功标志**：终端显示 `Created bucket ...`（如果提示已存在也没关系）。
2. 打开浏览器进入 Cloudflare 后台：左侧菜单 **R2 Object Storage** → 点击你刚创建的桶 **elves31y-blog-images** → 顶部切到 **Settings** 标签。
3. 找到 **Public access / 公开访问** 区域，点击 **Allow Access**（或类似开关），打开 **R2.dev subdomain**。
4. 打开后会显示一个形如 `https://pub-xxxxxxxxxxxxxxxx.r2.dev` 的域名，**复制它**。
5. 回到 `wrangler.toml`，把这一行：
   ```toml
   R2_PUBLIC_BASE = "https://你的桶.r2.dev"
   ```
   替换成你复制到的完整域名（注意：**只到 `.r2.dev` 为止，后面不要带斜杠**）。

### 第 4 步：设置登录密钥和后台密码

**密钥 ADMIN_SECRET**（用来给登录令牌签名）：
1. 生成一串随机字符串，在终端输入：
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   会打印出一串 64 位的乱码，复制它。
2. 打开 `wrangler.toml`，把这行：
   ```toml
   ADMIN_SECRET = "<替换为一串至少32位的随机字符串>"
   ```
   替换成你复制的那串乱码。

**后台默认密码**：`schema.sql` 里已经内置了默认密码 `elves31y-admin`。上线后请务必改成你自己的（方法见第 6 步）。

### 第 5 步：部署上线

下面提供两种方式，**新手推荐方式 A**。

#### 方式 A：用 GitHub + Cloudflare Pages 面板（推荐，可自动更新）

1. 把整个 `kirameku-blog/` 文件夹上传到 GitHub：
   - 打开 https://github.com ，登录后点右上角 **+** → **New repository**，起个名字（如 `elves31y-blog`），**Public** 即可，点 **Create repository**。
   - 用 Git 上传（或直接在网页上「uploading an existing file」把文件拖进去）。
   - 用命令行上传的方法（在项目根目录执行）：
     ```bash
     git init
     git add .
     git commit -m "init"
     git branch -M main
     git remote add origin https://github.com/你的用户名/elves31y-blog.git
     git push -u origin main
     ```
2. 打开 Cloudflare 后台 → 左侧 **Workers & Pages** → 点 **Create application** → 选 **Pages** → 点 **Connect to Git**，选择你刚上传的仓库。
3. 配置页面：
   - **Build command**：留空（本项目没有构建步骤）。
   - **Build output directory**：填 `public`。
4. 点 **Save and Deploy**，等待 1~2 分钟，**成功标志**：页面出现一个 `https://你的项目.pages.dev` 的网址，点开能看到博客首页。
5. **绑定 D1 和 R2**（关键，否则接口会报错）：
   - 在项目页面点 **Settings** → 左侧 **Functions**。
   - 找到 **D1 database bindings**：变量名填 `DB`，选择你的数据库，点 Add。
   - 找到 **R2 bucket bindings**：变量名填 `R2`，选择你的桶，点 Add。
6. **设置环境变量**：
   - 点 **Settings** → **Environment variables** → **Add variable**，添加两个：
     - `ADMIN_SECRET` = 你第 4 步生成的那串乱码
     - `R2_PUBLIC_BASE` = 你的 r2.dev 域名
   - 保存后，点 **Deployments** → 最近一次部署 → **Retry deployment**（重新部署让变量生效）。
7. 以后每次 `git push` 都会自动重新部署。

#### 方式 B：纯命令行部署

在项目根目录执行：
```bash
wrangler pages deploy public
```
**成功标志**：终端打印 `✨ Deployment complete!` 和一个线上网址。

> 注意：方式 B 需要 `wrangler.toml` 里的 `database_id`、桶名、`ADMIN_SECRET`、`R2_PUBLIC_BASE` 都填对，命令会自动应用这些绑定。

### 第 6 步：修改后台默认密码

1. 生成新密码的哈希，在终端输入（把 `你的新密码` 换成实际密码）：
   ```bash
   node -e "const c=require('crypto');console.log(c.createHash('sha256').update('kirameku-blog'+process.argv[1]).digest('hex'))" "你的新密码"
   ```
   复制打印出的那串哈希。
2. 写入云端数据库（替换 `<你的哈希>`）：
   ```bash
   wrangler d1 execute elves31y-blog-db --remote --command "UPDATE settings SET value='<你的哈希>' WHERE key='admin_hash'"
   ```
3. 之后登录后台就用你的新密码。

### 第 7 步：登录后台使用

- 打开 `https://你的站点/admin.html`（或 `/admin/`）。
- 输入管理员密码，登录后可以：
  - 写文章（Markdown）、发说说、审核评论、传照片、添加音乐。

---

## 三、常见问题排查

| 现象 | 原因 | 解决办法 |
| --- | --- | --- |
| 页面能打开，但文章/说说显示「请求失败」 | 接口报错，多半是 D1 绑定没配 | 检查第 5 步 A-5 的 D1 绑定变量名必须是 `DB`，且数据库选对；改完要 Retry deployment |
| 后台登录一直提示「密码错误」 | 密码不对，或数据库没执行 schema | 确认默认密码是 `elves31y-admin`；确认第 2 步执行 schema 成功 |
| 上传图片成功，但图片显示不出来 | R2 公开访问没开，或 R2_PUBLIC_BASE 填错 | 回第 3 步确认 r2.dev 域名填对、公开访问已开 |
| 后台保存文章提示「未登录」 | 令牌过期或 ADMIN_SECRET 变了 | 退出后台重新登录；确认环境变量 ADMIN_SECRET 与生成令牌时一致 |
| `wrangler login` 弹不出浏览器 | 浏览器被拦截 | 终端会打印一个网址，手动复制到浏览器打开，登录后回终端 |
| 部署成功但 404 | 输出目录填错 | Build output directory 必须是 `public` |
| 想改站点名/头像/社交链接 | 写死在代码里 | 见下方「自定义站点信息」 |

## 四、自定义站点信息

- **站点名、作者**：改 `public/js/common.js` 顶部的 `SITE` 对象。
- **头像**：把一张图片放到 `public/` 下（比如 `public/avatar.png`），然后把 `common.js` 里 `SITE.avatar` 改成 `"avatar.png"`；同时把 `index.html` 和 `about.html` 里 `<div class="avatar-inner">E</div>` 换成 `<img src="avatar.png" alt="">`。
- **社交链接**：改 `public/index.html` 里 `.social-row` 的各个 `<a href="...">`。
- **配色 / 圆角 / 阴影**：都在 `public/css/style.css` 顶部 `:root` 变量里，改一处全局生效。

---

## 五、本地预览（可选，方便调试）

```bash
# 1. 先在本地 D1 建表
wrangler d1 execute elves31y-blog-db --file=./schema.sql --local

# 2. 启动本地开发服务器（会同时跑静态页和 Functions）
wrangler pages dev public
```

打开终端提示的地址（默认 `http://localhost:8788`）即可预览。注意：本地环境变量会从 `wrangler.toml` 读取，R2 在本地是模拟的，图片上传在本地不可用，请到线上测试上传。
提交
