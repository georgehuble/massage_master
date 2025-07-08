@echo off
chcp 65001 >nul
title Остановка Massage Master

echo 🛑 Остановка проекта Massage Master...
echo.

REM Проверка Git Bash
where bash.exe >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git Bash не найден! Установите Git for Windows.
    pause
    exit /b 1
)

echo 📂 Переход в директорию проекта...
cd /d "%~dp0"

echo 🐧 Остановка через Git Bash...
bash.exe stop_project.sh

echo.
echo ✅ Проект остановлен!
pause 