@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SCRIPT_DIR=%~dp0"
set "CONVERTER=%SCRIPT_DIR%scripts\convert-xlsx-to-csv.mjs"
set "APP_ROOT=%SCRIPT_DIR%.."
set "OUTPUT_DIR=%APP_ROOT%\data\catalogues"
set "META_OUTPUT_DIR=%APP_ROOT%\data\meta"
set "LOCAL_XLSX=%SCRIPT_DIR%node_modules\xlsx"
set "APP_XLSX=%APP_ROOT%\node_modules\xlsx"

if not exist "%LOCAL_XLSX%" if not exist "%APP_XLSX%" (
  echo Missing XLSX converter dependency.
  echo Install it with: npm install xlsx@0.18.5 --no-save --package-lock=false
  echo Run that command from this folder or the app project root.
  pause
  exit /b 1
)

node "%CONVERTER%" --output-dir "%OUTPUT_DIR%" --meta-output-dir "%META_OUTPUT_DIR%" --changed-only %*
if errorlevel 1 goto :failed

git -C "%APP_ROOT%" rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto :not_git_repo

set "HAS_CSV_CHANGES="
for /f "delims=" %%A in ('git -C "%APP_ROOT%" status --porcelain -- data/catalogues data/meta') do set "HAS_CSV_CHANGES=1"
if not defined HAS_CSV_CHANGES goto :no_changes

git -C "%APP_ROOT%" rev-parse --abbrev-ref --symbolic-full-name "@{upstream}" >nul 2>&1
if errorlevel 1 goto :no_upstream

git -C "%APP_ROOT%" add -- "data/catalogues/*.csv" "data/meta/*.csv"
if errorlevel 1 goto :failed

set /a WORKLIST_COUNT=0
set "COMPOSERS_CHANGED="
set "META_CHANGED="
for /f "tokens=2" %%A in ('git -C "%APP_ROOT%" status --porcelain -- "data/catalogues/*.csv" "data/meta/*.csv"') do (
  if /i "%%~nA"=="composers" (
    set "COMPOSERS_CHANGED=1"
  ) else if /i "%%~nA"=="instruments" (
    set "META_CHANGED=1"
  ) else if /i "%%~nA"=="genres" (
    set "META_CHANGED=1"
  ) else (
    set /a WORKLIST_COUNT+=1
  )
)

if !WORKLIST_COUNT! GTR 1 (
  set "COMMIT_MESSAGE=update !WORKLIST_COUNT! worklists"
) else if !WORKLIST_COUNT! EQU 1 (
  set "COMMIT_MESSAGE=update worklist"
) else (
  if defined COMPOSERS_CHANGED if defined META_CHANGED (
    set "COMMIT_MESSAGE=update composer and metadata"
  ) else if defined COMPOSERS_CHANGED (
    set "COMMIT_MESSAGE=update composer list"
  ) else (
    set "COMMIT_MESSAGE=update metadata"
  )
)
if defined COMPOSERS_CHANGED if not "!COMMIT_MESSAGE!"=="update composer list" set "COMMIT_MESSAGE=!COMMIT_MESSAGE! and composer list"
if defined META_CHANGED if not "!COMMIT_MESSAGE!"=="update metadata" if not "!COMMIT_MESSAGE!"=="update composer and metadata" set "COMMIT_MESSAGE=!COMMIT_MESSAGE! and metadata"

git -C "%APP_ROOT%" commit --only -m "!COMMIT_MESSAGE!" -- "data/catalogues/*.csv" "data/meta/*.csv"
if errorlevel 1 goto :failed

git -C "%APP_ROOT%" fetch
if errorlevel 1 goto :fetch_failed

git -C "%APP_ROOT%" rebase --autostash "@{upstream}"
if errorlevel 1 goto :rebase_failed

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

:fetch_failed
echo.
echo The CSV update was committed, but fetching the remote failed.
echo The commit is still local. Check your connection, then run git fetch and git push from "%APP_ROOT%".
pause
endlocal
exit /b 1

:rebase_failed
echo.
echo The CSV update was committed, but rebasing onto the latest remote failed.
echo Check git status and resolve the rebase before pushing from "%APP_ROOT%".
echo If a rebase is in progress, use git rebase --continue or git rebase --abort.
pause
endlocal
exit /b 1

:failed
set "EXIT_CODE=%ERRORLEVEL%"
echo.
echo CSV conversion failed with exit code %EXIT_CODE%.
pause
endlocal & exit /b %EXIT_CODE%
