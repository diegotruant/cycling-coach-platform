@echo off
REM ============================================
REM Backup rapido su Google Drive
REM Doppio click per eseguire il backup
REM ============================================

powershell -ExecutionPolicy Bypass -File "%~dp0scripts\backup-to-drive.ps1"
pause
