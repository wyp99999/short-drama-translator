@echo off
chcp 65001 > nul
echo.
echo 🔐 使用 GitHub 令牌推送
echo ====================================
echo.

echo 📋 步骤：
echo 1. 访问 https://github.com/settings/tokens
echo 2. 点击 "Generate new token (classic)"
echo 3. 权限选择：repo (全选)
echo 4. 生成并复制令牌
echo.
set /p token="请输入 GitHub 个人访问令牌: "

if "%token%"=="" (
    echo ❌ 未输入令牌
    pause
    exit /b
)

echo.
echo 🔄 使用令牌推送...
cd /d "C:\ai\xm2\xm2\short-drama-translator"

REM 使用令牌更新远程 URL
git remote set-url origin https://wyp99999:%token%@github.com/wyp99999/short-drama-translator.git

echo 🚀 推送代码...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 推送成功！
    echo.
    echo 📊 仓库地址：
    echo https://github.com/wyp99999/short-drama-translator
    echo.
    echo 🎉 现在可以访问您的 GitHub 仓库了！
) else (
    echo.
    echo ❌ 推送失败
    echo 请检查网络连接和令牌权限
)

echo.
pause