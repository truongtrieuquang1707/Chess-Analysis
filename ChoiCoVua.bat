@echo off
rem Mo game qua may chu cuc bo (dung khi mo thang index.html khong tai duoc engine)
start "" http://localhost:8123/
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0.claude\serve.ps1"
