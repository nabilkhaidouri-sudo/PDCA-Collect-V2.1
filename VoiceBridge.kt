package ma.pdca.collect

import android.Manifest
import android.app.Activity
import android.app.DownloadManager
import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Environment
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject
import org.vosk.Model
import org.vosk.Recognizer
import org.vosk.android.RecognitionListener
import org.vosk.android.SpeechService
import java.io.File
import java.util.zip.ZipInputStream

/** Pont WebView -> Vosk. Les modèles sont téléchargés une fois, puis utilisés localement. */
class VoiceBridge(private val activity: Activity, private val webView: WebView) {
    private val modelRoot = File(activity.filesDir, "pdca-vosk-models")
    private var model: Model? = null
    private var recognizer: Recognizer? = null
    private var speech: SpeechService? = null
    private var currentField = ""
    private var pendingLang: String? = null
    private val urls = mapOf(
        "fr" to "https://alphacephei.com/vosk/models/vosk-model-small-fr-0.22.zip",
        "ar" to "https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip"
    )
    private val dirs = mapOf("fr" to "vosk-model-small-fr-0.22", "ar" to "vosk-model-ar-mgb2-0.4")

    @JavascriptInterface fun isModelReady(lang: String): Boolean = modelDir(lang)?.let { File(it, "am/final.mdl").exists() } == true

    @JavascriptInterface fun downloadModel(lang: String) {
        val code = lang.lowercase(); val url = urls[code] ?: return jsError("Langue inconnue")
        if (isModelReady(code)) return jsStatus("Modèle ${if(code=="fr") "français" else "arabe"} déjà installé.")
        val request = DownloadManager.Request(Uri.parse(url))
            .setTitle("PDCA Collect – modèle vocal ${code.uppercase()}")
            .setDescription("Téléchargement initial du modèle. Après installation, la reconnaissance fonctionne hors connexion.")
            .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            .setDestinationInExternalFilesDir(activity, Environment.DIRECTORY_DOWNLOADS, "pdca-vosk-$code.zip")
        val manager = activity.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
        val id = manager.enqueue(request)
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) {
                if (intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L) != id) return
                try {
                    val file = File(activity.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS), "pdca-vosk-$code.zip")
                    val dest = File(modelRoot, code); dest.mkdirs()
                    unzipModel(file, dest)
                    file.delete()
                    if (isModelReady(code)) jsStatus("Modèle ${code.uppercase()} installé. Vous pouvez maintenant travailler hors connexion.")
                    else jsError("Archive téléchargée, mais le modèle n’a pas été reconnu. Vérifiez l’archive.")
                } catch (e: Exception) { jsError("Installation du modèle impossible : ${e.message}") }
                try { activity.unregisterReceiver(this) } catch (_: Exception) {}
            }
        }
        registerDownloadReceiver(receiver)
        jsStatus("Téléchargement lancé. Gardez une connexion Internet jusqu’à la fin de l’installation.")
    }

    @Suppress("DEPRECATION")
    private fun registerDownloadReceiver(receiver: BroadcastReceiver) {
        if (android.os.Build.VERSION.SDK_INT >= 33) activity.registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE), Context.RECEIVER_NOT_EXPORTED)
        else activity.registerReceiver(receiver, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))
    }

    @JavascriptInterface fun startListening(lang: String, fieldId: String) {
        val code = lang.lowercase()
        if (!isModelReady(code)) return jsError("Modèle ${code.uppercase()} absent. Installez-le d’abord.")
        currentField = fieldId
        if (ContextCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingLang = code
            activity.runOnUiThread { ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.RECORD_AUDIO), 7102) }
            return
        }
        startVosk(code)
    }

    fun onAudioPermissionResult(granted: Boolean) {
        val lang = pendingLang; pendingLang = null
        if (!granted) { jsError("Autorisation du microphone refusée."); return }
        if (lang != null) startVosk(lang)
    }

    private fun startVosk(lang: String) {
        activity.runOnUiThread {
            try {
                stopInternal()
                val dir = modelDir(lang) ?: throw IllegalStateException("Modèle introuvable")
                model = Model(dir.absolutePath)
                recognizer = Recognizer(model, 16000.0f)
                speech = SpeechService(recognizer, 16000.0f)
                speech?.startListening(object : RecognitionListener {
                    override fun onPartialResult(hypothesis: String) { /* pas d’injection partielle pour éviter les sauts du curseur */ }
                    override fun onResult(hypothesis: String) { sendResult(hypothesis, false) }
                    override fun onFinalResult(hypothesis: String) { sendResult(hypothesis, true); stopInternal() }
                    override fun onError(exception: Exception) { jsError(exception.message ?: "Erreur microphone"); stopInternal() }
                    override fun onTimeout() { jsStatus("Fin de l’écoute."); stopInternal() }
                })
                jsStatus("Écoute hors connexion en cours…")
            } catch (e: Exception) { jsError("Démarrage Vosk impossible : ${e.message}") }
        }
    }

    @JavascriptInterface fun stopListening() { activity.runOnUiThread { stopInternal() } }
    private fun stopInternal() { try { speech?.stop() } catch (_: Exception) {}; try { speech?.shutdown() } catch (_: Exception) {}; speech=null; try { recognizer?.close() } catch (_: Exception) {}; recognizer=null; try { model?.close() } catch (_: Exception) {}; model=null }
    private fun sendResult(json: String, final: Boolean) {
        try { val text = JSONObject(json).optString("text", ""); if (text.isNotBlank()) js("window.onPdcaVoiceResult(${JSONObject.quote(currentField)},${JSONObject.quote(text)},$final);") } catch (_: Exception) {}
    }
    private fun modelDir(lang: String): File? {
        val expected = dirs[lang] ?: return null
        val root = File(modelRoot, lang)
        val direct = File(root, expected)
        return if (File(direct, "am/final.mdl").exists()) direct else if (File(root, "am/final.mdl").exists()) root else null
    }
    private fun unzipModel(zip: File, destination: File) {
        ZipInputStream(zip.inputStream().buffered()).use { zis ->
            var entry = zis.nextEntry
            while (entry != null) {
                val out = File(destination, entry.name).canonicalFile
                require(out.path.startsWith(destination.canonicalPath + File.separator) || out == destination) { "Entrée ZIP invalide" }
                if (entry.isDirectory) out.mkdirs() else { out.parentFile?.mkdirs(); out.outputStream().buffered().use { zis.copyTo(it) } }
                zis.closeEntry(); entry = zis.nextEntry
            }
        }
    }
    private fun js(script: String) { webView.post { webView.evaluateJavascript(script, null) } }
    private fun jsStatus(message: String) = js("window.onPdcaVoiceStatus(${JSONObject.quote(message)});")
    private fun jsError(message: String) = js("window.onPdcaVoiceError(${JSONObject.quote(message)});")
}
