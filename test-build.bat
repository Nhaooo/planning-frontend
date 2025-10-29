@echo off
echo Testing TypeScript build...
npx tsc --noEmit
if errorlevel 1 (
    echo ❌ TypeScript errors found
    pause
    exit /b 1
) else (
    echo ✅ TypeScript compilation successful
    echo Testing Vite build...
    npx vite build
    if errorlevel 1 (
        echo ❌ Vite build failed
        pause
        exit /b 1
    ) else (
        echo ✅ Build successful!
        pause
    )
)