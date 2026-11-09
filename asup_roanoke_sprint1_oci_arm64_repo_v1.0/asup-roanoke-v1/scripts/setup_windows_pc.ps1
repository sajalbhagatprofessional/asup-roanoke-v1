# Windows 10/11 Setup Script for Acquisition Sourcing & Underwriting Platform (v1.0)
# Installs Google Antigravity CLI (agy) + Optional Legacy Gemini CLI on Windows PC
$ErrorActionPreference = "Stop"

Write-Host "[1/3] Enabling CurrentUser PowerShell Script Execution Policy..." -ForegroundColor Cyan
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

Write-Host "[2/3] Installing Google Antigravity CLI (agy) Official Windows Binary..." -ForegroundColor Cyan
irm https://antigravity.google/cli/install.ps1 | iex

Write-Host "[3/3] Adding agy to current session PATH and verifying..." -ForegroundColor Cyan
$agyPath = "$env:LOCALAPPDATA\agy\bin"
if (Test-Path $agyPath) {
    $env:Path += ";$agyPath"
}
agy --version
Write-Host "Setup complete! Run 'agy' in this folder to launch the agent." -ForegroundColor Green
