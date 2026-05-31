// Minimal Tauri entry point. Opens the app window (configured in tauri.conf.json).
// For production distribution, add the Next.js server as a sidecar (see docs/MAC-APP.md).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
