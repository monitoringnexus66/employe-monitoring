use serde::Serialize;
use base64::{Engine as _, engine::general_purpose};

#[cfg(target_os = "macos")]
#[link(name = "CoreGraphics", kind = "framework")]
extern "C" {
    fn CGRequestScreenCaptureAccess() -> bool;
    fn CGPreflightScreenCaptureAccess() -> bool;
}

#[derive(Serialize)]
struct ActiveAppResponse {
    app_name: String,
    window_title: String,
}

#[tauri::command]
fn check_screen_permission() -> bool {
    #[cfg(target_os = "macos")]
    unsafe {
        CGPreflightScreenCaptureAccess()
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
}

#[tauri::command]
fn request_screen_permission() -> bool {
    #[cfg(target_os = "macos")]
    {
        unsafe {
            CGRequestScreenCaptureAccess();
        }
        let _ = std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .spawn();
        true
    }
    #[cfg(not(target_os = "macos"))]
    {
        true
    }
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
        total_width += monitor.width().unwrap_or(0);
        if monitor.height().unwrap_or(0) > max_height {
            max_height = monitor.height().unwrap_or(0);
        }
    }

    let mut combined_image = image::RgbaImage::new(total_width, max_height);
    let mut current_x = 0;

    for monitor in &monitors {
        if let Ok(rgba_image) = monitor.capture_image() {
            image::imageops::overlay(&mut combined_image, &rgba_image, current_x as i64, 0);
            current_x += monitor.width().unwrap_or(0);
        }
    }
    
    let mut dynamic_image = image::DynamicImage::ImageRgba8(combined_image);
    
    // Proportional resize if width > 1920 to maintain exact native display aspect ratio (16:10, 16:9, etc)
    if dynamic_image.width() > 1920 {
        let new_height = ((dynamic_image.height() as f32) * (1920.0 / (dynamic_image.width() as f32))) as u32;
        dynamic_image = dynamic_image.resize_exact(1920, new_height, image::imageops::FilterType::Triangle);
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
        .invoke_handler(tauri::generate_handler![
            get_active_app, 
            take_screenshot, 
            check_screen_permission, 
            request_screen_permission
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
