@echo off
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
set "ANDROID_HOME=C:\Android\sdk"
set "PATH=%JAVA_HOME%\bin;%PATH%"

echo === INSTALL PAKET SDK ===
call "C:\Android\sdk\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=C:\Android\sdk "platform-tools" "platforms;android-36" "build-tools;36.0.0"
echo INSTALL_RC=%ERRORLEVEL%

echo === HASIL ===
dir /b C:\Android\sdk
echo DONE
