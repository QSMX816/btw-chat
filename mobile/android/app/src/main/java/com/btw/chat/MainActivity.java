package com.btw.chat;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 注册原生流式 HTTP 插件（必须在 super.onCreate 之前）
        registerPlugin(StreamHttpPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
