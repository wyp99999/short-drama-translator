@echo off
chcp 65001 > nul
echo.
echo 🚀 快速推送代码到 GitHub
echo ====================================
echo.

echo 📋 两种推送方式：
echo.
echo 1. 使用 HTTPS + 令牌（推荐）
echo 2. 配置 SSH 密钥
echo.
set /p choice="请选择 (1/2): "

if "%choice%"=="1" goto https_method
if "%choice%"=="2" goto ssh_method
echo ❌ 无效选择
pause
exit /b

:https_method
echo.
echo 🔐 HTTPS + 令牌方式
echo.
echo 步骤：
echo 1. 访问 https://github.com/settings/tokens
echo 2. 生成新令牌（选择 repo 权限）
echo 3. 复制令牌
echo.
set /p token="请输入 GitHub 令牌: "

if "%token%"=="" (
    echo ❌ 未输入令牌
    pause
    exit /b
)

cd /d "C:\ai\xm2\xm2\short-drama-translator"

echo.
echo 🔄 配置远程仓库...
git remote set-url origin https://wyp99999:%token%@github.com/wyp99999/short-drama-translator.git

echo 🚀 推送代码...
git push -u origin main

if %errorlevel% equ 0 (
    echo ✅ 推送成功！
    goto success
) else (
    echo ❌ 推送失败
    pause
    exit /b
)

:ssh_method
echo.
echo 🔑 SSH 密钥方式
echo.
echo 步骤：
echo 1. 生成新 SSH 密钥
echo 2. 添加到 GitHub
echo.
set /p email="请输入邮箱地址: "

if "%email%"=="" set "email=wyp99999@github.com"

echo.
echo 🔑 生成 SSH 密钥...
ssh-keygen -t ed25519 -C "%email%" -f "%USERPROFILE%\.ssh\github_ed25519" -N ""

echo.
echo 📋 公钥内容：
type "%USERPROFILE%\.ssh\github_ed25519.pub"

echo.
echo 📝 请将上面的公钥添加到 GitHub：
echo 1. 访问 https://github.com/settings/keys
echo 2. 点击 "New SSH key"
echo 3. 粘贴公钥内容
echo.
pause

echo.
echo 🔄 配置 Git 使用新密钥...
git config --global core.sshCommand "ssh -i %USERPROFILE%\.ssh\github_ed25519 -o IdentitiesOnly=yes"

cd /d "C:\ai\xm2\xm2\short-drama-translator"
git remote set-url origin git@github.com:wyp99999/short-drama-translator.git

echo 🚀 推送代码...
git push -u origin main

if %errorlevel% equ 0 (
    echo ✅ 推送成功！
    goto success
) else (
    echo ❌ 推送失败
    pause
    exit /b
)

:success
echo.
echo 🎉 完成！
echo.
echo 📊 GitHub 仓库：
echo https://github.com/wyp99999/short-drama-translator
echo.
echo 🚀 下一步：部署到 Vercel 和 GitHub Pages
echo.
pause