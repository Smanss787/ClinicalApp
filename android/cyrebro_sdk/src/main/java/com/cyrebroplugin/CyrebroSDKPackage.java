package com.cyrebroplugin;

import androidx.annotation.UiThread;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class CyrebroSDKPackage implements ReactPackage {

    //    public static VmoInfinityOpticsModule infinityOpticsModule;
    public static CyrebroModule CyrebroModule;

    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        CyrebroSDKPackage.CyrebroModule = new CyrebroModule(reactContext);
        return Arrays.<NativeModule>asList(CyrebroSDKPackage.CyrebroModule);
    }

    @Override
    @UiThread
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
//        return Arrays.<ViewManager>asList(new RNCSTMCameraManager(reactContext));
//        return Arrays.<ViewManager>asList(new MyViewManager(reactContext));
        return Collections.emptyList();
    }
}
