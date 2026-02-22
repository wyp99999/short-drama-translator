@echo off
chcp 65001 > nul
echo.
echo 🔗 手动连接 GitHub 仓库
echo ====================================
echo.

echo 📋 您的 GitHub 用户名: wyp99999
echo.

echo 📝 请按以下步骤操作：
echo.
echo 第一步：创建 GitHub 仓库
echo 1. 打开浏览器访问：https://github.com/new
echo 2. 确保已登录账号 wyp99999
echo 3. 填写仓库信息：
echo    仓库名：short-drama-translator
echo    描述：短剧多语言智能翻译平台
echo    公开仓库
echo    不初始化 README
echo 4. 点击 "Create repository"
echo.
pause

echo.
echo 第二步：获取仓库地址
echo 创建完成后，页面会显示仓库地址
echo 格式：https://github.com/wyp99999/short-drama-translator.git
echo 请复制这个地址
echo.
set /p repo_url="请输入仓库地址: "

if "%repo_url%"=="" (
    echo ❌ 未输入地址
    pause
    exit /b
)

echo.
echo 第三步：连接到本地仓库
cd /d "C:\ai\xm2\xm2\short-drama-translator"

echo 🔄 添加远程仓库...
git remote add origin %repo_url%

echo 🔄 重命名分支...
git branch -M main

echo 🚀 推送代码到 GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ✅ 连接成功！
    echo.
    echo 📊 GitHub 仓库信息：
    echo 地址：%repo_url%
    echo 网页：https://github.com/wyp99999/short-drama-translator
    echo 分支：main
    echo 提交：73个文件
    echo.
    echo 🎉 现在可以访问您的仓库了！
) else (
    echo.
    echo ❌ 连接失败，可能的原因：
    echo 1. 网络问题
    echo 2. 仓库地址错误
    echo 3. 权限问题
    echo.
    echo 💡 尝试以下命令手动修复：
    echo git remote remove origin
    echo git remote add origin %repo_url%
    echo git push -u origin main
)

echo.
pause