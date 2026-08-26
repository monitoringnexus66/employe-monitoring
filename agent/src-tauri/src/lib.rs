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
    
    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let mut total_width = 0;
    let mut max_height = 0;

    for monitor in &monitors {
        total_width += monitor.width();
        if monitor.height() > max_height {
            max_height = monitor.height();
        }
    }

    let mut combined_image = image::RgbaImage::new(total_width, max_height);
    let mut current_x = 0;

    for monitor in &monitors {
        if let Ok(rgba_image) = monitor.capture_image() {
            image::imageops::overlay(&mut combined_image, &rgba_image, current_x as i64, 0);
            current_x += monitor.width();
        }
    }
    
    let mut dynamic_image = image::DynamicImage::ImageRgba8(combined_image);
    
    // Resize if width > 1920 to keep payload very small (bypasses Vercel 4.5MB limit)
    if dynamic_image.width() > 1920 {
        dynamic_image = dynamic_image.resize(1920, 1080, image::imageops::FilterType::Triangle);
    }
    
    let mut buffer = std::io::Cursor::new(Vec::new());
    // Use JpegEncoder with quality 65 to ensure high compression
    let mut encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buffer, 65);
    encoder.encode_image(&dynamic_image).map_err(|e| e.to_string())?;
        
    let base64_str = general_purpose::STANDARD.encode(buffer.into_inner());
    
    Ok(ScreenshotResponse {
        base64_image: format!("data:image/jpeg;base64,{}", base64_str),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_active_app, take_screenshot])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
