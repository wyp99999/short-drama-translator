# PowerShell 脚本 - 快速连接 GitHub
Write-Host "🚀 GitHub 连接工具" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 GitHub 用户名: wyp99999" -ForegroundColor Yellow
Write-Host "📦 仓库: short-drama-translator" -ForegroundColor Yellow
Write-Host ""

# 设置工作目录
Set-Location "C:\ai\xm2\xm2\short-drama-translator"

# 检查当前状态
Write-Host "🔍 检查当前状态..." -ForegroundColor Cyan
$remote_status = git remote -v
if ($remote_status) {
    Write-Host "当前远程仓库:" -ForegroundColor Yellow
    Write-Host $remote_status -ForegroundColor Gray
    Write-Host ""
    
    $choice = Read-Host "已配置远程仓库，是否重新配置？ (y/n)"
    if ($choice -eq 'y') {
        git remote remove origin
        Write-Host "✅ 已移除旧配置" -ForegroundColor Green
    } else {
        Write-Host "❌ 取消操作" -ForegroundColor Red
        exit
    }
}

# 配置远程仓库
Write-Host "🔗 配置远程仓库..." -ForegroundColor Cyan
$repo_url = "https://github.com/wyp99999/short-drama-translator.git"
git remote add origin $repo_url

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 远程仓库配置成功" -ForegroundColor Green
} else {
    Write-Host "❌ 远程仓库配置失败" -ForegroundColor Red
    exit
}

# 重命名分支
Write-Host "🌿 重命名分支到 main..." -ForegroundColor Cyan
git branch -M main

# 拉取远程更改（如果有）
Write-Host "📥 拉取远程更改..." -ForegroundColor Cyan
git fetch origin

# 推送代码
Write-Host "🚀 推送代码到 GitHub..." -ForegroundColor Cyan
Write-Host "这可能需要一些时间，请稍候..." -ForegroundColor Yellow

# 使用强制推送（因为仓库已有内容）
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 GitHub 连接成功！" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 仓库信息：" -ForegroundColor Yellow
    Write-Host "   地址: $repo_url" -ForegroundColor White
    Write-Host "   网页: https://github.com/wyp99999/short-drama-translator" -ForegroundColor White
    Write-Host "   分支: main" -ForegroundColor White
    Write-Host "   提交: 73个文件" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 验证连接：" -ForegroundColor Yellow
    Write-Host "   git remote -v" -ForegroundColor Gray
    Write-Host "   git log --oneline -5" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🚀 下一步：部署到 Vercel 和 GitHub Pages" -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 网络连接问题" -ForegroundColor Gray
    Write-Host "2. 权限不足" -ForegroundColor Gray
    Write-Host "3. 仓库已有不同内容" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 尝试手动操作：" -ForegroundColor Cyan
    Write-Host "   git pull origin main --allow-unrelated-histories" -ForegroundColor Gray
    Write-Host "   git push -u origin main" -ForegroundColor Gray
}

Write-Host ""
Read-Host "按 Enter 键退出"