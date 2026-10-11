# ELVES31y的小屋 — NIGHT Blog

这是一个可直接部署到 Cloudflare Pages 的静态博客初始模板。

## 当前已实现
- NIGHT 星空二次元视觉风格、响应式布局
- 文章分类筛选（技术文章、AI 与电脑、生活随笔、游戏与二创）
- 即时搜索与 `/` 快捷键
- 深色/浅色模式切换（本地记忆）
- 独立文章页面与返回文章列表
- 图片占位图，可替换为你之后上传的素材
- 移动端导航与自定义 favicon

## 尚需接入的动态功能
**文章评论与后台发布不是纯静态 HTML 能安全实现的功能。** 当前评论区域是说明占位；`admin/` 目录用于后续接入后台，不包含伪装成安全后台的前端密码。
正式启用时建议使用 Cloudflare Pages Functions（或 Workers）+ D1 数据库：
- 后台登录使用服务端验证与安全会话；不要把密码/API 密钥写进前端 JS。
- 文章存入 D1，文章详情由 API 获取或通过构建流程生成独立页面。
- 评论通过 API 写入 D1，并加速率限制、输入校验和垃圾评论防护。
- 如果希望尽快上线评论，也可以选用第三方评论服务；配置前先检查其隐私政策和可用性。

## 部署到 Cloudflare Pages（GitHub 方式）
1. 解压 ZIP。
2. 在 GitHub 新建一个空仓库，例如 `elves31y-blog`。
3. 将 ZIP 内的所有文件和文件夹上传到仓库根目录，确认 `index.html` 在根目录。
4. 打开 Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git。
5. 选择刚才的 GitHub 仓库。
6. 设置：
   - Production branch: `main`
   - Build command: `exit 0`
   - Build output directory: `/`（仓库根目录）
7. 点击部署，完成后会得到一个 `*.pages.dev` 地址。

## 绑定 blog.zakoyu.dpdns.org
1. 在 Cloudflare Dashboard 打开项目 → Custom domains → Set up a domain。
2. 输入 `blog.zakoyu.dpdns.org` 并按界面提示继续。
3. 如果 DNS 由其他服务商管理，在 DNS 管理页添加 CNAME：
   - Type: `CNAME`
   - Name/Host: `blog`
   - Target/Value: Cloudflare Pages 给你的项目域名（例如 `your-project.pages.dev`，请用真实值替换）
4. 不要只手动添加 CNAME 而跳过 Pages 的 Custom domains 绑定步骤。
5. 等待 DNS 和 HTTPS 证书生效后测试网站。

## 替换图片
将图片放进 `assets/`，然后在 `index.html` 的相应 `.post-cover` / `.space-scene` 区域用 CSS `background-image: url('assets/你的图片文件名')`，并设置 `background-size: cover; background-position: center;`。图片文件名建议使用英文、数字和连字符。

## 本地预览
直接用浏览器打开 `index.html` 即可查看大部分静态交互；也可以用 VS Code 的 Live Server。
