@echo off
chcp 65001 > nul
setlocal

REM 配置
set VENV_DIR=.venv
set PYTHON_EXE=python
set REQUIREMENTS_FILE=requirements.txt
set SCRIPT_DIR=%~dp0
set PARENT_DIR=%SCRIPT_DIR%..\
set APP_MODULE=main:app

echo =================================================
echo   Zcanic 语音服务 - 一键部署脚本
echo =================================================
echo.
echo 脚本目录: %SCRIPT_DIR%
echo 父目录 (用于 PYTHONPATH): %PARENT_DIR%
echo 虚拟环境目录: %VENV_DIR%
echo.

REM 检查 Python
echo 正在检查 Python 安装情况...
%PYTHON_EXE% --version > nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到 Python 或 Python 未在 PATH 中。
    echo 请安装 Python 3 并确保已将其添加到系统 PATH。
    echo 参考: https://www.python.org/downloads/
    pause
    goto :eof
)
echo Python 已找到。
echo.

REM 检查虚拟环境是否存在，如果不存在则创建并安装依赖
if not exist "%VENV_DIR%\Scripts\activate.bat" (
    echo 未找到虚拟环境。正在 "%VENV_DIR%" 中创建...
    %PYTHON_EXE% -m venv "%VENV_DIR%"
    if %errorlevel% neq 0 (
        echo 错误：创建虚拟环境失败。请检查您的 Python 安装。
        pause
        goto :eof
    )
    echo 虚拟环境创建成功。
    echo.
    echo 正在激活虚拟环境并从 %REQUIREMENTS_FILE% 安装依赖...
    call "%VENV_DIR%\Scripts\activate.bat"
    if %errorlevel% neq 0 (
        echo 错误：激活虚拟环境失败。
        pause
        goto :eof
    )
    pip install -r "%REQUIREMENTS_FILE%"
    if %errorlevel% neq 0 (
        echo 错误：从 %REQUIREMENTS_FILE% 安装依赖失败。
        echo 请检查文件内容和您的网络连接。
        pause
        goto :eof
    )
    echo 依赖安装成功。
) else (
    echo 找到已存在的虚拟环境。正在激活...
    call "%VENV_DIR%\Scripts\activate.bat"
    if %errorlevel% neq 0 (
        echo 错误：激活虚拟环境失败。
        pause
        goto :eof
    )
    echo 虚拟环境已激活。
    echo.
    echo 正在验证/更新 %REQUIREMENTS_FILE% 中的依赖...
    pip install -r "%REQUIREMENTS_FILE%"
    if %errorlevel% neq 0 (
        echo 警告：验证/更新依赖失败。如果依赖已满足，应用程序可能仍能运行。
        echo 继续启动...
    ) else (
        echo 依赖已验证/更新。
    )
)
echo.

REM 设置 PYTHONPATH 以包含 voice_app 的父目录
echo 正在设置 PYTHONPATH 为 %PARENT_DIR%
set PYTHONPATH=%PARENT_DIR%;%PYTHONPATH%
echo PYTHONPATH 当前为: %PYTHONPATH%
echo.

echo 正在为 %APP_MODULE% 启动 Uvicorn 服务器...
echo 主机: 0.0.0.0, 端口: 8000
echo.
uvicorn %APP_MODULE% --host 0.0.0.0 --port 8000 --workers 1

echo.
echo 服务器已停止。
pause
endlocal 