# SSH 推送脚本
Write-Host "🚀 SSH 方式推送代码到 GitHub" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
Set-Location "C:\ai\xm2\xm2\short-drama-translator"

Write-Host "🔍 检查 SSH 配置..." -ForegroundColor Cyan

# 检查 SSH 密钥
$sshKeyPath = "$env:USERPROFILE\.ssh\id_rsa"
if (Test-Path $sshKeyPath) {
    Write-Host "✅ 找到 SSH 私钥: $sshKeyPath" -ForegroundColor Green
} else {
    Write-Host "❌ 未找到 SSH 私钥" -ForegroundColor Red
    exit
}

# 检查远程配置
Write-Host "🔗 检查远程仓库配置..." -ForegroundColor Cyan
$remote = git remote -v
Write-Host "远程仓库:" -ForegroundColor Yellow
Write-Host $remote -ForegroundColor Gray

# 测试 SSH 连接
Write-Host "🔐 测试 SSH 连接到 GitHub..." -ForegroundColor Cyan
try {
    $sshTest = ssh -T git@github.com 2>&1
    if ($LASTEXITCODE -eq 1 -and $sshTest -like "*successfully authenticated*") {
        Write-Host "✅ SSH 认证成功" -ForegroundColor Green
    } elseif ($sshTest -like "*Permission denied*") {
        Write-Host "⚠️  SSH 密钥权限被拒绝" -ForegroundColor Yellow
        Write-Host "请确保 SSH 公钥已添加到 GitHub" -ForegroundColor Gray
        Write-Host "访问: https://github.com/settings/keys" -ForegroundColor Gray
    } else {
        Write-Host "SSH 测试输出: $sshTest" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ SSH 测试失败: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 开始推送代码..." -ForegroundColor Cyan
Write-Host "这可能需要一些时间..." -ForegroundColor Yellow

# 设置 Git 配置
git config --global core.sshCommand "ssh -o ConnectTimeout=10 -o ServerAliveInterval=30"

# 尝试推送
$pushResult = git push -u origin main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "🎉 推送成功！" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📊 GitHub 仓库：" -ForegroundColor Yellow
    Write-Host "   地址: https://github.com/wyp99999/short-drama-translator" -ForegroundColor White
    Write-Host "   SSH: git@github.com:wyp99999/short-drama-translator.git" -ForegroundColor White
    Write-Host ""
    Write-Host "🚀 下一步：部署到 Vercel 和 GitHub Pages" -ForegroundColor Magenta
} else {
    Write-Host ""
    Write-Host "❌ 推送失败" -ForegroundColor Red
    Write-Host "错误信息:" -ForegroundColor Yellow
    Write-Host $pushResult -ForegroundColor Gray
    
    Write-Host ""
    Write-Host "💡 解决方案：" -ForegroundColor Cyan
    Write-Host "1. 检查网络连接" -ForegroundColor Gray
    Write-Host "2. 验证 SSH 密钥已添加到 GitHub" -ForegroundColor Gray
    Write-Host "3. 尝试使用 HTTPS 方式：" -ForegroundColor Gray
    Write-Host "   git remote set-url origin https://github.com/wyp99999/short-drama-translator.git" -ForegroundColor Gray
    Write-Host "   然后使用令牌推送" -ForegroundColor Gray
}

Write-Host ""
Read-Host "按 Enter 键退出"