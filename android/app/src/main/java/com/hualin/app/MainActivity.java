package com.hualin.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** 华邻网 Android app: the site full screen, with calls, texts, WeChat sharing and the back button working like a normal app. */
public class MainActivity extends Activity {
    static final String HOME = "https://hualinwang-us.github.io/";
    static final String HOST = "hualinwang-us.github.io";
    WebView web;

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        web.setBackgroundColor(0xFFB8302A); // same red as the launch screen, so there's no white flash
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setTextZoom(100);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " HuaLinApp/1.0");
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);
        web.addJavascriptInterface(new Bridge(), "HuaLinApp");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) { return route(r.getUrl()); }
            @Override public void onPageStarted(WebView v, String url, Bitmap fav) { super.onPageStarted(v, url, fav); }
            @Override public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                if (r.isForMainFrame()) v.loadDataWithBaseURL(HOME, OFFLINE, "text/html", "utf-8", null);
            }
        });
        if (saved != null) web.restoreState(saved);
        else open(getIntent());
    }

    void open(Intent i) {
        Uri u = i != null ? i.getData() : null;
        web.loadUrl(u != null && HOST.equals(u.getHost()) ? u.toString() : HOME);
    }

    @Override protected void onNewIntent(Intent i) { super.onNewIntent(i); open(i); }

    /** Site pages stay in the app; phone, text, email, WeChat and other websites open in their own apps. */
    boolean route(Uri u) {
        String scheme = u.getScheme() == null ? "" : u.getScheme();
        if ((scheme.equals("https") || scheme.equals("http")) && HOST.equals(u.getHost()) && u.getPath() != null && u.getPath().startsWith("/hualin")) return false;
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
        @JavascriptInterface public void share(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("text/plain");
            send.putExtra(Intent.EXTRA_TEXT, text);
            runOnUiThread(() -> startActivity(Intent.createChooser(send, "分享到")));
        }
        @JavascriptInterface public String version() { return BuildConfig.VERSION_NAME; }
    }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    static final String OFFLINE = "<!doctype html><meta name=viewport content='width=device-width,initial-scale=1'>"
        + "<body style='font-family:sans-serif;background:#f3f4f7;color:#121a2b;display:flex;flex-direction:column;align-items:center;justify-content:center;height:90vh;text-align:center;padding:24px'>"
        + "<div style='width:64px;height:64px;border-radius:12px;background:#c2362b;color:#fff;font:900 38px serif;display:grid;place-items:center'>邻</div>"
        + "<h2>网络好像断了</h2><p style='color:#5f687c'>请检查 Wi-Fi 或手机网络，然后再试一次。</p>"
        + "<button onclick=\"location.href='" + HOME + "'\" style='border:0;border-radius:999px;background:#c2362b;color:#fff;font-size:17px;padding:12px 28px'>重新加载</button></body>";
}
