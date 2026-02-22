@echo off
chcp 65001 > nul
echo.
echo 🔗 GitHub 连接工具
echo ====================================
echo.

echo 📋 请按以下步骤操作：
echo.
echo 第一步：创建 GitHub 仓库
echo 1. 访问 https://github.com
echo 2. 登录您的账号
echo 3. 点击右上角 "+" → "New repository"
echo 4. 填写信息：
echo    名称: short-drama-translator
echo    描述: 短剧多语言智能翻译平台
echo    公开仓库
echo    不初始化 README
echo 5. 点击 "Create repository"
echo.
pause

echo.
echo 第二步：获取仓库地址
echo 创建完成后，复制仓库地址
echo 格式：https://github.com/用户名/short-drama-translator.git
echo.
set /p repo_url="请输入 GitHub 仓库地址: "

echo.
echo 第三步：连接到 GitHub
cd /d "C:\ai\xm2\xm2\short-drama-translator"
git remote add origin %repo_url%
git branch -M main
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ✅ 成功连接到 GitHub！
    echo.
    echo 📊 仓库信息：
    echo 地址：%repo_url%
    echo 分支：main
    echo 文件数：73
    echo.
    echo 🚀 下一步：部署到 Vercel 和 GitHub Pages
) else (
    echo ❌ 连接失败，请检查：
    echo 1. 网络连接
    echo 2. GitHub 账号权限
    echo 3. 仓库地址是否正确
)

echo.
pause