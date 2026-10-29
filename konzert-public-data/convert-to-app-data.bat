@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "CONVERTER=%SCRIPT_DIR%scripts\convert-xlsx-to-csv.mjs"
set "APP_ROOT=%SCRIPT_DIR%.."
set "OUTPUT_DIR=%APP_ROOT%\data\catalogues"
set "LOCAL_XLSX=%SCRIPT_DIR%node_modules\xlsx"
set "APP_XLSX=%APP_ROOT%\node_modules\xlsx"

if not exist "%LOCAL_XLSX%" if not exist "%APP_XLSX%" (
  echo Missing XLSX converter dependency.
  echo Install it with: npm install xlsx@0.18.5 --no-save --package-lock=false
  echo Run that command from this folder or the app project root.
  pause
  exit /b 1
)

node "%CONVERTER%" --output-dir "%OUTPUT_DIR%" --changed-only %*
if errorlevel 1 goto :failed

git -C "%APP_ROOT%" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto :not_git_repo

set "HAS_CSV_CHANGES="
for /f "delims=" %%A in ('git -C "%APP_ROOT%" status --porcelain -- data/catalogues') do set "HAS_CSV_CHANGES=1"
if not defined HAS_CSV_CHANGES goto :no_changes

git -C "%APP_ROOT%" rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" >nul 2>&1
if errorlevel 1 goto :no_upstream

git -C "%APP_ROOT%" add -- "data/catalogues/*.csv"
if errorlevel 1 goto :failed

set /a WORKLIST_COUNT=0
set "WORKLIST_NAMES="
set "COMPOSERS_CHANGED="
for /f "tokens=2" %%A in ('git -C "%APP_ROOT%" status --porcelain -- "data/catalogues/*.csv"') do (
  for %%B in ("%%~nxA") do (
    set "CSV_NAME=%%~nB"
    if /i "!CSV_NAME!"=="composers" (
      set "COMPOSERS_CHANGED=1"
    ) else (
      set /a WORKLIST_COUNT+=1
      if !WORKLIST_COUNT! LEQ 4 (
        if defined WORKLIST_NAMES (
          set "WORKLIST_NAMES=!WORKLIST_NAMES!, !CSV_NAME!"
        ) else (
          set "WORKLIST_NAMES=!CSV_NAME!"
        )
      )
    )
  )
)

if !WORKLIST_COUNT! GTR 4 (
  set "COMMIT_MESSAGE=update !WORKLIST_COUNT! worklists"
) else if !WORKLIST_COUNT! EQU 0 (
  set "COMMIT_MESSAGE=update composer list"
) else (
  set "COMMIT_MESSAGE=update !WORKLIST_NAMES!'s worklist"
)
if defined COMPOSERS_CHANGED if not "!COMMIT_MESSAGE!"=="update composer list" set "COMMIT_MESSAGE=!COMMIT_MESSAGE! and composer list"

git -C "%APP_ROOT%" commit --only -m "!COMMIT_MESSAGE!" -- "data/catalogues/*.csv"
if errorlevel 1 goto :failed

git -C "%APP_ROOT%" push
if errorlevel 1 goto :push_failed

echo.
echo Catalogue CSV changes committed and pushed.
pause
endlocal
exit /b 0

:no_changes
echo.
echo No CSV changes to commit or push.
pause
endlocal
exit /b 0

:not_git_repo
echo.
echo CSV conversion finished, but "%APP_ROOT%" is not a Git repository.
pause
endlocal
exit /b 1

:no_upstream
echo.
echo CSV files changed, but the current branch has no upstream to push to.
echo The CSV files are left uncommitted.
pause
endlocal
exit /b 1

:push_failed
echo.
echo The CSV update was committed, but pushing failed. Run git push from "%APP_ROOT%" to retry.
pause
endlocal
exit /b 1

:failed
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo CSV conversion failed with exit code %EXIT_CODE%.
pause
endlocal & exit /b %EXIT_CODE%
