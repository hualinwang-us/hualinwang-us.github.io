package com.hualin.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.content.ContentValues;
import android.provider.MediaStore;
import android.util.Base64;
import android.widget.Toast;
import android.speech.tts.TextToSpeech;
import java.util.Locale;
import java.io.OutputStream;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.GeolocationPermissions;
import android.content.pm.PackageManager;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** 华脉 Android app: the site full screen, with calls, texts, WeChat sharing and the back button working like a normal app. */
public class MainActivity extends Activity {
    static final String HOME = "https://huamai88.com/";
    static final String HOST = "huamai88.com";
    WebView web;
    String geoOrigin; GeolocationPermissions.Callback geoCb;
    @Override public void onRequestPermissionsResult(int code, String[] perms, int[] res) {
        if (code == 7 && geoCb != null) { boolean ok = res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED; geoCb.invoke(geoOrigin, ok, false); geoCb = null; }
    }
    // Secret handed only to our own top-level page; embedded third-party frames can't read it.
    final String token = java.util.UUID.randomUUID().toString();
    boolean ourPage(String url) { try { Uri u = Uri.parse(url); return "https".equals(u.getScheme()) && (HOST.equals(u.getHost()) || ("www." + HOST).equals(u.getHost())); } catch (Exception e) { return false; } }

    TextToSpeech tts; boolean ttsReady = false;
    @Override protected void onDestroy() { if (tts != null) tts.shutdown(); super.onDestroy(); }
    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        tts = new TextToSpeech(this, st -> { if (st == TextToSpeech.SUCCESS) { tts.setLanguage(Locale.US); tts.setSpeechRate(0.85f); ttsReady = true; } });
        web = new WebView(this);
        web.setBackgroundColor(0xFFFFFFFF); // same white as the launch screen, so there is no flash
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setGeolocationEnabled(true);
        s.setUserAgentString(s.getUserAgentString() + " HuaLinApp/1.0");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.addJavascriptInterface(new Bridge(), "HuaLinApp");
        // "Locate me" on our own pages only: ask Android for approximate location, then answer the page.
        web.setWebChromeClient(new WebChromeClient() {
            @Override public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                boolean ours = ourPage(origin);
                if (!ours) { cb.invoke(origin, false, false); return; }
                if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    geoOrigin = origin; geoCb = cb;
                    requestPermissions(new String[]{ android.Manifest.permission.ACCESS_COARSE_LOCATION }, 7);
                    return;
                }
                cb.invoke(origin, true, false);
            }
        });
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return route(r.getUrl()); }
            @Override public void onPageStarted(WebView v, String url, Bitmap fav) { super.onPageStarted(v, url, fav); }
            @Override public void onPageFinished(WebView v, String url) { if (ourPage(url)) v.evaluateJavascript("window.__hlt='" + token + "';", null); }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadDataWithBaseURL(HOME, OFFLINE, "text/html", "utf-8", null);
            }
        });
        if (saved != null) web.restoreState(saved);
        else open(getIntent());
    }

    void open(Intent i) {
        Uri u = i != null ? i.getData() : null;
        boolean ours = u != null && "https".equals(u.getScheme()) && (HOST.equals(u.getHost()) || ("www." + HOST).equals(u.getHost()));
        web.loadUrl(ours ? u.toString() : HOME);
    }

    @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); open(i); }

    /** Site pages stay in the app; phone, text, email, WeChat and other websites open in their own apps. */
    boolean route(Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme();
        if ((scheme.equals("https") || scheme.equals("http")) && (HOST.equals(u.getHost()) || ("www." + HOST).equals(u.getHost()) || "hualinwang-us.github.io".equals(u.getHost()) || "hualin88.com".equals(u.getHost()) || "www.hualin88.com".equals(u.getHost()))) return false;
        try {
            if (scheme.equals("intent")) {
                Intent it = Intent.parseUri(u.toString(), Intent.URI_INTENT_SCHEME);
                it.addCategory(Intent.CATEGORY_BROWSABLE); it.setComponent(null); it.setSelector(null);
                startActivity(it);
            } else {
                startActivity(new Intent(Intent.ACTION_VIEW, u));
            }
        } catch (Exception e) { /* no app can open it */ }
        return true;
    }

    class Bridge {
        /** Opens Android's share sheet (WeChat, WhatsApp, SMS...). */
        @JavascriptInterface public void share(String text, String tok) {
            if (!token.equals(tok) || text == null || text.length() > 2000) return;
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            runOnUiThread(() -> startActivity(Intent.createChooser(send, "分享到")));
        }
        @JavascriptInterface public String version() { return BuildConfig.VERSION_NAME; }
        /** Reads English text aloud with the phone's own voice (WebView has no speech of its own). */
        @JavascriptInterface public boolean speak(String text) {
            if (text == null || text.length() > 500 || tts == null) return false;
            if (!ttsReady) { runOnUiThread(() -> Toast.makeText(MainActivity.this, "朗读功能正在准备，请再按一次", Toast.LENGTH_SHORT).show()); return false; }
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "hm");
            return true;
        }
        /** Saves a picture (data: URL) to the phone's Photos, in a 华脉 album. */
        @JavascriptInterface public void saveImage(String dataUrl, String name, String tok) { if (!token.equals(tok)) return; Uri u = store(dataUrl, name); runOnUiThread(() -> Toast.makeText(MainActivity.this, u != null ? "已保存到相册" : "保存失败", Toast.LENGTH_SHORT).show()); }
        /** Saves the picture, then opens the share sheet with it (WeChat, WhatsApp...). */
        @JavascriptInterface public void shareImage(String dataUrl, String name, String text, String tok) {
            if (!token.equals(tok)) return;
            Uri u = store(dataUrl, name); if (u == null) return;
            Intent send = new Intent(Intent.ACTION_SEND); send.setType("image/jpeg");
            send.putExtra(Intent.EXTRA_STREAM, u); send.putExtra(Intent.EXTRA_TEXT, text); send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            runOnUiThread(() -> startActivity(Intent.createChooser(send, "分享到")));
        }
    }

    Uri store(String dataUrl, String name) {
        try {
            if (dataUrl == null || !dataUrl.startsWith("data:image/jpeg;base64,") || dataUrl.length() > 8_000_000) return null;
            name = "hualin-" + System.currentTimeMillis() + ".jpg";
            byte[] bytes = Base64.decode(dataUrl.substring(dataUrl.indexOf(',') + 1), Base64.DEFAULT);
            ContentValues v = new ContentValues();
            v.put(MediaStore.Images.Media.DISPLAY_NAME, name);
            v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            if (Build.VERSION.SDK_INT >= 29) v.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/华脉");
            Uri u = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
            if (u == null) return null;
            try (OutputStream o = getContentResolver().openOutputStream(u)) { o.write(bytes); }
            return u;
        } catch (Exception e) { return null; }
    }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    static final String OFFLINE = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
        + "<body style='font-family:sans-serif;background:#f3f4f7;color:#121a2b;display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;text-align:center;padding:24px'>"
        + "<div style='width:64px;height:64px;border-radius:12px;background:#c2362b;color:#fff;font:900 38px serif;display:grid;place-items:center'>邻</div>"
        + "<h2>网络好像断了</h2><p style='color:#5f687c'>请检查 Wi-Fi 或手机网络，然后再试一次。</p>"
        + "<button onclick=\"location.href='" + HOME + "'\" style='border:0;border-radius:999px;background:#c2362b;color:#fff;font-size:17px;padding:12px 28px'>重新加载</button></body>";
}
