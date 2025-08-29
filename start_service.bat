@echo off
setlocal

REM --- Configuration ---
set PYTHON_EXE=python
REM If python is not in PATH or you need a specific venv, set PYTHON_EXE to full path:
REM set PYTHON_EXE=C:\path\to\your\venv\Scripts\python.exe

set APP_PACKAGE_NAME=voice_app
set APP_MAIN_MODULE=main:app

REM --- Script Start ---
echo Activating UTF-8 codepage for better character display...
chcp 65001 > nul

title Zcanic Voice Service Launcher

echo Starting Zcanic Voice Service (%APP_PACKAGE_NAME%)...

REM Determine script's own directory
REM This batch script should be placed in the PARENT directory of the voice_app package.
SET SCRIPT_PARENT_DIR=%~dp0

REM Clean up trailing backslash from SCRIPT_PARENT_DIR if it exists
IF "%SCRIPT_PARENT_DIR:~-1%"=="\" SET "SCRIPT_PARENT_DIR=%SCRIPT_PARENT_DIR:~0,-1%"

REM The SCRIPT_PARENT_DIR is now the directory that should be on PYTHONPATH
REM so that 'import voice_app' works.
SET "PYTHONPATH=%SCRIPT_PARENT_DIR%;%PYTHONPATH%"

echo Script Location (Parent of %APP_PACKAGE_NAME%): %SCRIPT_PARENT_DIR%
echo PYTHONPATH set to: %PYTHONPATH%

REM Check if the voice_app package directory exists
IF NOT EXIST "%SCRIPT_PARENT_DIR%\%APP_PACKAGE_NAME%\__init__.py" (
    echo ERROR: Package directory "%SCRIPT_PARENT_DIR%\%APP_PACKAGE_NAME%" or its __init__.py not found!
    echo Please ensure this script is in the parent directory of the '%APP_PACKAGE_NAME%' package.
    goto :eof
)

REM Check for requirements.txt and suggest installation
IF EXIST "%SCRIPT_PARENT_DIR%\%APP_PACKAGE_NAME%\requirements.txt" (
    echo Found requirements.txt. Consider running: 
    echo %PYTHON_EXE% -m pip install -r "%SCRIPT_PARENT_DIR%\%APP_PACKAGE_NAME%\requirements.txt"
    echo if you haven't installed dependencies yet.
)

echo.
echo Launching Uvicorn server for %APP_PACKAGE_NAME%...
%PYTHON_EXE% -m uvicorn %APP_PACKAGE_NAME%.%APP_MAIN_MODULE% --host 0.0.0.0 --port 8000

if errorlevel 1 (
    echo.
    echo ERROR: Uvicorn server failed to start or exited with an error.
    echo Please check the console output above for details.
) else (
    echo.
    echo Uvicorn server exited normally.
)

echo.
pause
endlocal 