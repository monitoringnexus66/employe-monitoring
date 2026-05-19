use std::process::Command;
use serde::Serialize;
use std::fs;
use base64::{Engine as _, engine::general_purpose};

#[derive(Serialize)]
struct ActiveAppResponse {
    app_name: String,
    window_title: String,
}

#[derive(Serialize)]
struct ScreenshotResponse {
    base64_image: String,
}

#[tauri::command]
fn get_active_app() -> Result<ActiveAppResponse, String> {
    match x_win::get_active_window() {
        Ok(window) => {
            Ok(ActiveAppResponse {
                app_name: window.info.name,
                window_title: window.title,
            })
        },
        Err(_) => {
            Ok(ActiveAppResponse {
                app_name: String::from("Unknown"),
                window_title: String::from("Unknown"),
            })
        }
    }
}

#[tauri::command]
fn take_screenshot() -> Result<ScreenshotResponse, String> {
    let temp_path = "/tmp/nexustrack_screenshot.jpg";
    
    // macOS built-in screenshot tool
    let output = Command::new("screencapture")
        .arg("-x") // silent
        .arg("-m") // only main monitor
        .arg("-t").arg("jpg") // compress as jpg to avoid 413 payload too large
        .arg(temp_path)
        .output();

    if let Ok(cmd) = output {
        if cmd.status.success() {
            if let Ok(bytes) = fs::read(temp_path) {
                let base64_str = general_purpose::STANDARD.encode(&bytes);
                // Clean up
                let _ = fs::remove_file(temp_path);
                
                return Ok(ScreenshotResponse {
                    base64_image: format!("data:image/jpeg;base64,{}", base64_str),
                });
            }
        }
    }
    
    Err("Failed to capture screen".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_active_app, take_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
