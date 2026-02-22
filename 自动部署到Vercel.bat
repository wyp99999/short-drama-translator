@echo off
chcp 65001 > nul
echo.
echo 🚀 自动部署到 Vercel + GitHub Pages
echo ====================================
echo.

echo 📋 部署方案：Vercel (后端) + GitHub Pages (前端)
echo.

echo 第一步：部署后端到 Vercel
echo.
echo 请按以下步骤操作：
echo 1. 访问 https://vercel.com
echo 2. 使用 GitHub 登录
echo 3. 点击 "New Project"
echo 4. 导入仓库：wyp99999/short-drama-translator
echo 5. 选择目录：vercel-serverless
echo 6. 点击 "Deploy"
echo.
set /p vercel_url="部署完成后，请输入 Vercel 应用地址 (如: https://xxx.vercel.app): "

if "%vercel_url%"=="" (
    echo ❌ 未输入地址
    pause
    exit /b
)

echo.
echo 第二步：配置前端 API 地址
echo.
echo 正在更新前端配置...
cd /d "C:\ai\xm2\xm2\short-drama-translator\frontend"

REM 备份原文件
copy .env.production .env.production.backup >nul

REM 更新 API 地址
echo VITE_API_URL=%vercel_url%/api > .env.production
echo VITE_APP_NAME=短剧翻译平台 >> .env.production
echo VITE_APP_VERSION=1.0.0 >> .env.production

echo ✅ 前端配置已更新
echo.

echo 第三步：构建前端
echo.
echo 正在安装依赖并构建...
call npm install
if %errorlevel% neq 0 (
    echo ❌ 依赖安装失败
    pause
    exit /b
)

call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    pause
    exit /b
)

echo ✅ 前端构建完成
echo.

echo 第四步：部署前端到 GitHub Pages
echo.
echo 请按以下步骤操作：
echo 1. 访问 https://github.com/wyp99999/short-drama-translator
echo 2. 点击 Settings → Pages
echo 3. 配置：
echo    源: Deploy from a branch
echo    分支: main
echo    文件夹: /frontend/dist
echo 4. 点击 Save
echo.
set /p github_pages="部署完成后，请输入 GitHub Pages 地址 (如: https://wyp99999.github.io/short-drama-translator): "

if "%github_pages%"=="" (
    echo ⚠️  未输入地址，使用默认地址
    set "github_pages=https://wyp99999.github.io/short-drama-translator"
)

echo.
echo 🎉 部署完成！
echo ====================================
echo.
echo 📊 访问地址：
echo.
echo 🔗 前端界面：
echo    %github_pages%
echo.
echo 🔧 后端 API：
echo    %vercel_url%/api
echo.
echo 🩺 健康检查：
echo    %vercel_url%/health
echo.
echo 📋 API 接口：
echo    %vercel_url%/api/projects      (项目列表)
echo    %vercel_url%/api/tasks/poll    (任务轮询)
echo.
echo 💡 功能测试：
echo 1. 访问前端地址
echo 2. 创建新项目
echo 3. 选择目标语言
echo 4. 查看模拟翻译进度
echo.
echo 🔄 更新部署：
echo 修改代码后推送到 GitHub 即可自动更新
echo.
pause