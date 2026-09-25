@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
set "ANDROID_HOME=C:\Android\sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo === INSTALL NDK ===
call "C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=C:\Android\sdk "ndk;27.1.12297006"
echo NDK_RC=%ERRORLEVEL%

echo === CEK ===
dir /b C:\Android\sdk\ndk\27.1.12297006
echo DONE
