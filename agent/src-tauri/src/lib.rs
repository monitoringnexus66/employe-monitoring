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
    let monitors = xcap::Monitor::all().map_err(|e| e.to_string())?;
    
    if let Some(monitor) = monitors.first() {
        let image = monitor.capture_image().map_err(|e| e.to_string())?;
        
        let mut buffer = std::io::Cursor::new(Vec::new());
        image.write_to(&mut buffer, image::ImageFormat::Jpeg)
            .map_err(|e| e.to_string())?;
            
        let base64_str = general_purpose::STANDARD.encode(buffer.into_inner());
        
        return Ok(ScreenshotResponse {
            base64_image: format!("data:image/jpeg;base64,{}", base64_str),
        });
    }
    
    Err("No monitors found".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_active_app, take_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
