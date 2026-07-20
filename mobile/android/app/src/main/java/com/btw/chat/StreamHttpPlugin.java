package com.btw.chat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okio.BufferedSource;

import java.io.IOException;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * 原生流式 HTTP：用 OkHttp 发请求，绕过 WebView 的 CORS。
 * - request(): 一次性请求，返回 {status, body}（用于嗅探模型列表）。
 * - postStream(): 流式 POST，逐行（按 \n）回流，事件：streamLine / streamEnd / streamError。
 *   非 2xx 响应读完整 body 经 streamError 上报，便于 JS 解析错误。
 * - cancel(): 按 requestId 中断进行中的请求（中断后以 streamEnd 收尾，不报错）。
 */
@CapacitorPlugin(name = "StreamHttp")
public class StreamHttpPlugin extends Plugin {

    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");

    private final OkHttpClient client = new OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(0, TimeUnit.SECONDS)   // 流式输出不设读超时
            .writeTimeout(60, TimeUnit.SECONDS)
            .build();

    private final Map<String, Call> active = new HashMap<>();

    @PluginMethod
    public void request(PluginCall call) {
        String url = call.getString("url");
        if (url == null) { call.reject("url required"); return; }
        String method = call.getString("method", "GET");
        String body = call.getString("body", "");
        JSObject headers = call.getObject("headers", new JSObject());

        try {
            Request.Builder rb = new Request.Builder().url(url);
            applyHeaders(rb, headers);
            if ("GET".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
                rb.get();
            } else {
                rb.method(method.toUpperCase(), RequestBody.create(body, JSON));
            }
            try (Response res = client.newCall(rb.build()).execute()) {
                String responseBody = res.body() != null ? res.body().string() : "";
                JSObject ret = new JSObject();
                ret.put("status", res.code());
                ret.put("body", responseBody);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("request failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void postStream(PluginCall call) {
        String requestId = call.getString("requestId");
        String url = call.getString("url");
        String method = call.getString("method", "POST");
        String body = call.getString("body", "");
        JSObject headers = call.getObject("headers", new JSObject());

        Request.Builder rb = new Request.Builder().url(url);
        applyHeaders(rb, headers);
        rb.method(method.toUpperCase(), RequestBody.create(body, JSON));

        Call okCall = client.newCall(rb.build());
        if (requestId != null) active.put(requestId, okCall);

        okCall.enqueue(new Callback() {
            @Override
            public void onFailure(Call c, IOException e) {
                active.remove(requestId);
                if (c.isCanceled()) {
                    emitEnd(requestId);
                } else {
                    JSObject d = new JSObject();
                    d.put("requestId", requestId);
                    d.put("error", e.getMessage() != null ? e.getMessage() : "network error");
                    notifyListeners("streamError", d);
                }
            }

            @Override
            public void onResponse(Call c, Response res) {
                try {
                    if (!res.isSuccessful() || res.body() == null) {
                        String b = res.body() != null ? res.body().string() : "";
                        JSObject d = new JSObject();
                        d.put("requestId", requestId);
                        d.put("status", res.code());
                        d.put("body", b);
                        notifyListeners("streamError", d);
                        return;
                    }
                    BufferedSource source = res.body().source();
                    while (!source.exhausted()) {
                        String line = source.readUtf8Line(); // 阻塞至遇到换行或 EOF
                        if (line == null) break;
                        JSObject d = new JSObject();
                        d.put("requestId", requestId);
                        d.put("line", line);
                        notifyListeners("streamLine", d);
                    }
                    emitEnd(requestId);
                } catch (IOException e) {
                    if (c.isCanceled()) {
                        emitEnd(requestId);
                    } else {
                        JSObject d = new JSObject();
                        d.put("requestId", requestId);
                        d.put("error", e.getMessage() != null ? e.getMessage() : "io error");
                        notifyListeners("streamError", d);
                    }
                } finally {
                    active.remove(requestId);
                    if (res != null) res.close();
                }
            }
        });

        call.resolve();
    }

    @PluginMethod
    public void cancel(PluginCall call) {
        String requestId = call.getString("requestId");
        Call c = active.remove(requestId);
        if (c != null) c.cancel();
        call.resolve();
    }

    private void applyHeaders(Request.Builder rb, JSObject headers) {
        if (headers == null) return;
        Iterator<String> it = headers.keys();
        while (it.hasNext()) {
            String k = it.next();
            Object v = headers.opt(k);
            if (v != null) rb.addHeader(k, String.valueOf(v));
        }
    }

    private void emitEnd(String requestId) {
        JSObject d = new JSObject();
        d.put("requestId", requestId);
        notifyListeners("streamEnd", d);
    }
}
