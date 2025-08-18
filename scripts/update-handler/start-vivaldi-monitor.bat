:: Filename: scripts/update-handler/start-vivaldi-monitor.bat - v2

:: Function: Starts a process to automatically detect and handle Vivaldi updates

:: Flag Options: 
::  - Option 1: Use the /min flag to run the process in a window that minimizes
::    to a tab on the taskbar.
::      - To terminate the process: 
::          - close the window 
::      - Best for development and testing
:: - Option 2: Use the /b flag to run completely in background without any window
::      - To terminate the process:
::          - Open Task Manager (ctrl + shift + esc)
::          - Search for "node.exe"
::          - Right-click > "End task"
::      - Best for production

@echo off
echo Starting Vivaldi Update Monitor...
cd /d "C:\Users\johnj\OneDrive\SEE_VIVALDI\see-vivaldi"

:: Option 1: Run in window
@REM start /min node scripts/update-handler/vivaldi-monitor.js
@REM echo Monitor started

:: Option 2: Run in background (no window)
start /b node scripts/update-handler/vivaldi-monitor.js
echo Monitor started in background (no window)