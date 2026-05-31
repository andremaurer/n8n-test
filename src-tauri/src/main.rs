// Tauri entry point. On launch, starts the local Next.js server (which serves the
// app + runs Prisma/SQLite), waits for it, then the window loads http://127.0.0.1:3777.
// The server is killed when the app exits. Requires Node on the user's machine.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

fn start_server(app_dir: &std::path::Path) -> Option<Child> {
    // Runs `npm run start:packaged` from the bundled app resources.
    Command::new("npm")
        .args(["run", "start:packaged"])
        .current_dir(app_dir)
        .spawn()
        .ok()
}

fn main() {
    tauri::Builder::default()
        .manage(ServerProcess(Mutex::new(None)))
        .setup(|app| {
            // Resource dir holds the app (next build output + node_modules).
            if let Ok(dir) = app.path().resource_dir() {
                if let Some(child) = start_server(&dir) {
                    let state = app.state::<ServerProcess>();
                    *state.0.lock().unwrap() = Some(child);
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::Destroyed = event {
                let state = window.state::<ServerProcess>();
                if let Some(mut child) = state.0.lock().unwrap().take() {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
