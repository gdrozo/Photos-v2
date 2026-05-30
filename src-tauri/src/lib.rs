// File: lib.rs
pub mod file_helpers;
pub mod media;
pub mod server;

use base64::Engine;
use std::fs;
use std::sync::Mutex;
use tauri::command;
use tauri::{Manager, State};

use opener::reveal;

#[command]
fn save_base64_image(base64_str: &str, path: &str) -> Result<(), String> {
    // Strip the annoying "data:image/png;base64," prefix if present
    let b64_data = base64_str.split(',').last().unwrap_or(base64_str);

    // Print the first 30 characters of the base64 string for debugging
    println!(
        "Base64 data (first 30 chars): {}",
        &b64_data.chars().take(30).collect::<String>()
    );

    let decoded = base64::engine::general_purpose::STANDARD
        .decode(b64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    println!("Decoded");
    println!("{}", path);
    fs::write(path, decoded).map_err(|e| format!("Failed to write file: {}", e))?;

    Ok(())
}

struct StartupFile(Mutex<Option<String>>);

#[tauri::command]
fn get_startup_file(state: State<StartupFile>) -> Option<String> {
    state.0.lock().unwrap().clone()
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle) {
    println!("Showing main window");
    if let Some(window) = app.get_webview_window("main") {
        window.show().unwrap();
    }
}

#[tauri::command]
fn reveal_in_explorer(path: String) {
    println!("Revealing in explorer: {}", path);
    let _ = reveal(std::path::Path::new(&path))
        .map_err(|err| format!("Failed to reveal file: {}", err));
}

//lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            tauri::async_runtime::spawn(async {
                server::start_server().await; // or your warp server future
            });

            let args: Vec<String> = std::env::args().collect();
            let mut startup_path: Option<String> = None;

            if args.len() > 1 {
                startup_path = Some(args[1].clone());
                println!("App opened with file: {}", args[1]);
            }

            // store it in app state
            // store it in app state
            app.manage(StartupFile(Mutex::new(startup_path)));
            app.manage(media::WatcherState::default());

            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            media::watch_directory,
            media::list_neighbors_media,
            media::list_media_files,
            media::list_media_files_recursive,
            media::list_image_index,
            file_helpers::delete_file,
            save_base64_image,
            get_startup_file,
            file_helpers::move_file_command,
            file_helpers::copy_file_command,
            show_main_window,
            reveal_in_explorer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
