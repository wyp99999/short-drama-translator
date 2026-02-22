@echo off
chcp 65001 > nul
echo.
echo 🚀 自动创建 GitHub 仓库
echo ====================================
echo.

echo 📋 GitHub 用户名: wyp99999
echo.

echo ⚠️  注意：需要 GitHub 个人访问令牌 (PAT)
echo.
echo 如何获取 PAT：
echo 1. 访问 https://github.com/settings/tokens
echo 2. 点击 "Generate new token"
echo 3. 选择 "classic" 令牌
echo 4. 权限选择：repo (全选)
echo 5. 生成并复制令牌
echo.
set /p github_token="请输入 GitHub 个人访问令牌: "

if "%github_token%"=="" (
    echo ❌ 未输入令牌，使用手动方式
    goto manual_mode
)

echo.
echo 🚀 正在创建 GitHub 仓库...
echo.

REM 使用 curl 创建仓库
curl -X POST ^
  -H "Authorization: token %github_token%" ^
  -H "Accept: application/vnd.github.v3+json" ^
  https://api.github.com/user/repos ^
  -d "{\"name\":\"short-drama-translator\",\"description\":\"短剧多语言智能翻译平台\",\"private\":false}" > create_repo_response.json 2>nul

REM 检查是否成功
type create_repo_response.json | findstr "clone_url" >nul
if %errorlevel% equ 0 (
    echo ✅ GitHub 仓库创建成功！
    
    REM 提取仓库地址
    for /f "tokens=2 delims=:" %%a in ('type create_repo_response.json ^| findstr "clone_url"') do (
        set "repo_url=%%a"
    )
    
    REM 清理 JSON 格式
    set "repo_url=%repo_url:"=%"
    set "repo_url=%repo_url:,=%"
    set "repo_url=%repo_url: =%"
    
    echo 📦 仓库地址: %repo_url%
    
    REM 连接到本地仓库
    cd /d "C:\ai\xm2\xm2\short-drama-translator"
    git remote add origin %repo_url%
    git branch -M main
    git push -u origin main
    
    if %errorlevel% equ 0 (
        echo ✅ 代码推送成功！
        echo.
        echo 🎉 完成！访问仓库：
        echo https://github.com/wyp99999/short-drama-translator
    ) else (
        echo ❌ 代码推送失败
        goto manual_mode
    )
    
    del create_repo_response.json
) else (
    echo ❌ 仓库创建失败
    type create_repo_response.json
    del create_repo_response.json
    goto manual_mode
)

goto end

:manual_mode
echo.
echo 📋 手动创建步骤：
echo.
echo 1. 访问 https://github.com/new
echo 2. 填写信息：
echo    所有者: wyp99999
echo    仓库名: short-drama-translator
echo    描述: 短剧多语言智能翻译平台
echo    公开仓库
echo    不初始化 README
echo 3. 点击 "Create repository"
echo.
echo 4. 复制仓库地址：
echo    https://github.com/wyp99999/short-drama-translator.git
echo.
echo 5. 运行以下命令：
echo    cd C:\ai\xm2\xm2\short-drama-translator
echo    git remote add origin https://github.com/wyp99999/short-drama-translator.git
echo    git branch -M main
echo    git push -u origin main
echo.

:end
echo.
pause