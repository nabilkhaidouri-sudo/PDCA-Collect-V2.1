// Exemple d’intégration dans votre Activity Android qui héberge déjà PDCA Collect.
// Conservez votre Activity existante et adaptez uniquement les lignes indiquées.
package ma.pdca.collect

import android.os.Bundle
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {
    private lateinit var voiceBridge: VoiceBridge
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val webView = findViewById<WebView>(R.id.webView) // WebView de votre projet existant
        webView.settings.javaScriptEnabled = true
        webView.webViewClient = WebViewClient()
        voiceBridge = VoiceBridge(this, webView)
        webView.addJavascriptInterface(voiceBridge, "PDCAAndroidVoice")
        // Charger les fichiers PDCA depuis assets/www/index.html ou votre emplacement actuel.
    }
    @Deprecated("Compatibilité permission microphone")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 7102) voiceBridge.onAudioPermissionResult(grantResults.isNotEmpty() && grantResults[0] == android.content.pm.PackageManager.PERMISSION_GRANTED)
    }
}
