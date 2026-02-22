@echo off
chcp 65001 > nul
echo.
echo 🚀 短剧翻译平台免费部署工具
echo ====================================
echo.

echo 📋 请选择部署方式：
echo.
echo 1. 自动部署（需要 GitHub 和 Vercel 账号）
echo 2. 手动部署（查看详细步骤）
echo 3. 本地运行 Demo
echo.
set /p choice="请输入选择 (1/2/3): "

if "%choice%"=="1" goto auto_deploy
if "%choice%"=="2" goto manual_deploy
if "%choice%"=="3" goto local_demo
echo ❌ 无效选择
pause
exit /b

:auto_deploy
echo.
echo 🚀 开始自动部署...
echo.
echo 第一步：准备 GitHub 仓库
echo 请确保您已经：
echo 1. 在 GitHub 创建新仓库
echo 2. 将项目代码推送到仓库
echo.
set /p repo="请输入 GitHub 仓库地址 (如: https://github.com/用户名/仓库名): "

echo.
echo 第二步：部署后端到 Vercel
echo 请按以下步骤操作：
echo 1. 访问 https://vercel.com
echo 2. 使用 GitHub 登录
echo 3. 点击 "New Project"
echo 4. 导入仓库 %repo%
echo 5. 选择 "vercel-serverless" 目录
echo 6. 点击 "Deploy"
echo.
set /p vercel_url="部署完成后，请输入 Vercel 应用地址 (如: https://xxx.vercel.app): "

echo.
echo 第三步：配置前端
echo 正在更新前端 API 地址...
powershell -Command "(Get-Content 'frontend\.env.production') -replace 'VITE_API_URL=.*', 'VITE_API_URL=%vercel_url%/api' | Set-Content 'frontend\.env.production'"

echo.
echo 第四步：构建前端
cd frontend
call npm install
call npm run build
cd ..

echo.
echo 第五步：部署前端到 GitHub Pages
echo 请按以下步骤操作：
echo 1. 进入 GitHub 仓库设置
echo 2. 选择 "Pages" 选项
echo 3. 分支选择 "main"
echo 4. 目录选择 "/frontend/dist"
echo 5. 点击 "Save"
echo.
set /p github_pages="部署完成后，请输入 GitHub Pages 地址: "

echo.
echo 🎉 部署完成！
echo.
echo 📊 访问地址：
echo 前端：%github_pages%
echo 后端：%vercel_url%
echo API：%vercel_url%/api
echo 健康检查：%vercel_url%/health
echo.
pause
exit /b

:manual_deploy
echo.
echo 📖 详细部署步骤：
echo.
echo 请打开 FREE_DEPLOY_GUIDE.md 查看完整指南
echo.
echo 或者访问：
echo 1. 前端部署：https://docs.github.com/pages
echo 2. 后端部署：https://vercel.com/docs
echo.
pause
exit /b

:local_demo
echo.
echo 🖥️ 本地运行 Demo
echo.
echo 第一步：启动后端
cd vercel-serverless
call npm install
echo 后端运行在：http://localhost:3000
echo 按 Ctrl+C 停止
node api/index.js
cd ..

echo.
echo 第二步：启动前端（新终端）
echo 打开新的命令行窗口，执行：
echo cd frontend
echo npm install
echo npm run dev
echo.
echo 前端运行在：http://localhost:3002
echo.
pause
exit /b