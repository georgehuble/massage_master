@echo off
chcp 65001 >nul
title Запуск Massage Master

echo 🚀 Запуск проекта Massage Master...
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

echo 🐧 Запуск через Git Bash...
bash.exe start_project.sh

pause 