@echo off
cd /d D:\working\ihu-reconnect\ClinicalApp\android
call gradlew assemble
adb install D:\working\ihu-reconnect\ClinicalApp\android\app\build\outputs\apk\release\app-release.apk
call adb shell am start -n "com.clinicalapp/com.clinicalapp.MainActivity" -a android.intent.action.MAIN -c android.intent.category.LAUNCHER