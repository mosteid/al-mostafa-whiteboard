// يمنع ظهور نافذة الأوامر في ويندوز
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::{ipc::Response, Emitter, Manager};

/// مسار ملف PDF الذي فُتح به التطبيق (Open with / نقر مزدوج)
struct LaunchFile(Mutex<Option<String>>);

fn pdf_arg(args: &[String]) -> Option<String> {
    args.iter().skip(1).find(|a| a.to_lowercase().ends_with(".pdf")).cloned()
}

#[tauri::command]
fn launch_file(state: tauri::State<LaunchFile>) -> Option<String> {
    state.0.lock().unwrap().take()
}

/// يعيد بايتات الملف كما هي (بدون تحويل إلى JSON) لتبقى الملفات الكبيرة سريعة
#[tauri::command]
fn read_file_bytes(path: String) -> Result<Response, String> {
    std::fs::read(&path).map(Response::new).map_err(|e| e.to_string())
}

fn main() {
    let args: Vec<String> = std::env::args().collect();
    tauri::Builder::default()
        // نسخة واحدة فقط: فتح PDF ثانٍ يظهر في النافذة المفتوحة
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(p) = pdf_arg(&argv) {
                let _ = app.emit("open-file", p);
            }
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.set_focus();
            }
        }))
        .manage(LaunchFile(Mutex::new(pdf_arg(&args))))
        .invoke_handler(tauri::generate_handler![launch_file, read_file_bytes])
        .run(tauri::generate_context!())
        .expect("خطأ أثناء تشغيل التطبيق");
}
