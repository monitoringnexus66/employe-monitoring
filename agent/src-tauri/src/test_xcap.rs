use xcap::Monitor;
use std::io::Cursor;
use image::ImageFormat;
use base64::{Engine as _, engine::general_purpose};

fn main() {
    println!("Finding monitors...");
    let monitors = Monitor::all().unwrap();
    println!("Found {} monitors", monitors.len());
    
    if let Some(monitor) = monitors.first() {
        println!("Capturing image from {}...", monitor.name());
        let image = monitor.capture_image().unwrap();
        println!("Image captured! Dimensions: {}x{}", image.width(), image.height());
        
        let mut buffer = Cursor::new(Vec::new());
        image.write_to(&mut buffer, ImageFormat::Jpeg).unwrap();
        
        let bytes = buffer.into_inner();
        println!("JPEG size: {} bytes", bytes.len());
        
        let base64_str = general_purpose::STANDARD.encode(&bytes);
        println!("Base64 length: {}", base64_str.len());
    }
}
