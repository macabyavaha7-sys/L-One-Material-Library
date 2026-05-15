# L-One素材库

用于浏览、预览、搜索、分类管理本地视频/GIF 素材的极简本地网页工具。

## 运行

```bash
npm install
npm run dev
```

访问：

```text
http://127.0.0.1:5173/
```

如果 PowerShell 禁用了 `npm.ps1`，可以使用：

```powershell
npm.cmd install
npm.cmd run dev
```

## 重新扫描素材

默认扫描目录：

```text
D:\动画素材库
```

重新扫描：

```bash
npm run rescan
```

## 同步到 Cloudflare R2

线上 GitHub Pages 不能读取本机 `D:\动画素材库`。如果要让公开网址显示真实素材，需要把素材同步到 Cloudflare R2：

1. 在 Cloudflare 控制台启用 R2。
2. 创建或使用 bucket：`l-one-material-library`。
3. 开启 bucket 的公开 `r2.dev` 访问。
4. 创建 R2 API Token，并保存 `Access Key ID` 和 `Secret Access Key`。
5. 复制 `.env.example` 为 `.env.local`，填入 Cloudflare/R2 配置。
6. 运行：

```bash
npm run sync:r2
```

这个命令会扫描本地素材、上传到 R2，并生成线上用的 `data/assets.json` 与本地开发用的 `public/data/assets.json`。

扫描完成后会生成：

```text
public/data/assets.json
```

也可以临时指定素材根目录：

```powershell
$env:L_ONE_ASSET_ROOT="D:\动画素材库"
npm.cmd run rescan
```

## 本地素材访问方案

第一阶段采用 Vite 本地开发服务映射方案：

- 扫描脚本只生成清单，不复制素材文件。
- `assets.json` 中的素材路径会写成 `/media/...`。
- `vite.config.ts` 中的轻量 middleware 会把 `/media/...` 安全映射到 `D:\动画素材库`。
- 支持视频 Range 请求，便于浏览器预览和播放。

## 已完成功能

- React + TypeScript + Vite 项目结构
- Node.js 扫描 `D:\动画素材库`
- 自动识别 `.gif`、`.mp4`、`.mov`、`.webm`、`.mkv`、`.jpg`、`.jpeg`、`.png`、`.webp`
- 同名 GIF / 视频 / 图片自动配对
- 根据一级文件夹自动生成分类，根目录素材归为“未分类”
- 首页读取 `public/data/assets.json`
- 顶部固定导航、悬停分类菜单、展开式搜索框
- 素材 1:1 网格预览
- GIF 默认预览，视频素材悬停后静音播放
- 自定义播放、暂停、静音、音量、收藏、详情、下载控制栏
- 分类筛选、搜索筛选
- 点击素材打开白色磨砂详情弹层
- 无素材时显示空状态和重新扫描提示

## 第二阶段可继续完善

- 收藏状态持久化
- 标签编辑与本地元数据文件
- 视频时长自动读取
- 详情页更完整的播放控制
- 批量分类、批量下载、批量重命名
- 生成视频第一帧缩略图缓存
- 生产环境的静态导出或本地桌面封装
