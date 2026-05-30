use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use axum_extra::{headers::Range, TypedHeader};
use axum_range::{KnownSize, Ranged};
use dashmap::DashMap;
use mime_guess::from_path;
use std::{collections::HashMap, net::SocketAddr, path::{Path, PathBuf}, sync::Arc};
use tokio::{
    fs::{File},
};
use tracing::error;
use std::io::Cursor;
use windows::core::{Interface, PCWSTR};
use windows::Win32::Foundation::*;
use windows::Win32::Graphics::Gdi::*;
use windows::Win32::System::Com::*;
use windows::Win32::UI::Shell::*;


/// Shared application state
#[derive(Clone)]
struct AppState {
    // simple cache: path -> (file_size, mime_string)
    meta_cache: Arc<DashMap<PathBuf, (u64, String)>>,
}

pub async fn start_server() {
    // configure media root relative to executable or absolute path as needed

    let state = AppState {
        meta_cache: Arc::new(DashMap::new()),
    };

    let app = Router::new()
        .route("/media", get(stream_media))
        .with_state(Arc::new(state));

    let addr: SocketAddr = "127.0.0.1:3001".parse().unwrap();
    println!("Server running at http://{}", addr);

    // Standard Axum + Hyper serve pattern
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app)
        .await
        .unwrap();
}

async fn stream_media(
    State(state): State<Arc<AppState>>,
    range: Option<TypedHeader<Range>>,
    Query(params): Query<HashMap<String, String>>,
) -> Response {
    // get path param
    let filename = match params.get("path") {
        Some(p) => p.as_str(),
        None => return (StatusCode::BAD_REQUEST, "No `path` query").into_response(),
    };

    // validate and canonicalize path
    let full_path = match validate_path(filename).await {
        Ok(p) => p,
        Err(resp) => return resp,
    };

    // Check if thumbnail is requested
    let size = params.get("size").and_then(|s| s.parse::<i32>().ok());

    if let Some(s) = size {
        // 1. Try Windows thumbnail first
        if let Some(thumb_bytes) = get_windows_thumbnail(full_path.to_string_lossy().to_string(), s) {
            return (
                StatusCode::OK,
                [("Content-Type", "image/png")],
                thumb_bytes,
            ).into_response();
        }

        // 2. Fallback if Windows thumbnail fails
        let mime = from_path(&full_path).first_or_octet_stream();
        if mime.type_() == "image" {
            if let Ok(thumb_bytes) = resize_image(&full_path, s).await {
                return (
                    StatusCode::OK,
                    [("Content-Type", "image/png")],
                    thumb_bytes,
                ).into_response();
            }
        } else if mime.type_() == "video" {
            if let Ok(thumb_bytes) = create_video_thumbnail(&full_path, s).await {
                return (
                    StatusCode::OK,
                    [("Content-Type", "image/png")],
                    thumb_bytes,
                ).into_response();
            }
        }
    }

    // No size or Fallback failed -> Stream original file
    let file = match File::open(&full_path).await {
        Ok(f) => f,
        Err(e) => {
            error!("failed to open file {}: {}", full_path.display(), e);
            return (StatusCode::NOT_FOUND, "File not found").into_response();
        }
    };

    // fetch metadata from cache or fs
    let (_file_size, mime_str) = if let Some(entry) = state.meta_cache.get(&full_path) {
        entry.value().clone()
    } else {
        // stat file
        let sz = match file.metadata().await {
            Ok(m) => m.len(),
            Err(_) => 0,
        };
        // mime guess by extension - cheap
        let mime = from_path(&full_path).first_or_octet_stream().to_string();
        state
            .meta_cache
            .insert(full_path.clone(), (sz, mime.clone()));
        (sz, mime)
    };

    match KnownSize::file(file).await {
        Ok(body) => {
            let mut response = Ranged::new(range.map(|r| r.0), body).into_response();
            if let Ok(value) = mime_str.parse() {
                response.headers_mut().insert(axum::http::header::CONTENT_TYPE, value);
            }
            response.headers_mut().insert(axum::http::header::ACCEPT_RANGES, "bytes".parse().unwrap());
            response
        }
        Err(e) => {
            error!("failed to create range body for {}: {}", full_path.display(), e);
            (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
        }
    }
}

pub fn get_windows_thumbnail(path: String, size: i32) -> Option<Vec<u8>> {
    unsafe {
        // 1. Initialize COM (Required for Shell APIs)
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        // 2. Create a Shell Item from the file path
        let wide_path: Vec<u16> = path.encode_utf16().chain(Some(0)).collect();
        
        let shell_item: IShellItem = match SHCreateItemFromParsingName(
            PCWSTR(wide_path.as_ptr()),
            None,
        ) {
            Ok(item) => item,
            Err(_) => return None,
        };
        
        // 3. Cast the IShellItem to IShellItemImageFactory
        let factory: IShellItemImageFactory = match shell_item.cast() {
            Ok(f) => f,
            Err(_) => return None,
        };
        
        // 4. Request the image (thumbnail)
        let hbitmap = match factory.GetImage(
            SIZE { cx: size, cy: size },
            SIIGBF_THUMBNAILONLY | SIIGBF_RESIZETOFIT, // Flags for thumbnail behavior
        ) {
            Ok(hb) => hb,
            Err(_) => return None,
        };
        
        if hbitmap.is_invalid() {
            println!("hbitmap: invalid");
            return None;
        }

        // 5. Convert HBITMAP to bytes
        let result = hbitmap_to_png_bytes(hbitmap);
        
        // Clean up
        let _ = DeleteObject(HGDIOBJ(hbitmap.0));
        
        result
    }
}

unsafe fn hbitmap_to_png_bytes(hbitmap: HBITMAP) -> Option<Vec<u8>> {
    let screen_dc = GetDC(None);
    let hdc = CreateCompatibleDC(Some(screen_dc));
    ReleaseDC(None, screen_dc);

    if hdc.is_invalid() {
        return None;
    }

    let mut bitmap = BITMAP::default();
    if GetObjectW(
        HGDIOBJ(hbitmap.0),
        std::mem::size_of::<BITMAP>() as i32,
        Some(&mut bitmap as *mut _ as *mut _),
    ) == 0
    {
        let _ = DeleteDC(hdc);
        return None;
    }

    let width = bitmap.bmWidth;
    let height = bitmap.bmHeight;

    let mut bmi = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height, // Top-down
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0 as u32,
            ..Default::default()
        },
        ..Default::default()
    };

    let mut buffer = vec![0u8; (width * height * 4) as usize];

    if GetDIBits(
        hdc,
        hbitmap,
        0,
        height as u32,
        Some(buffer.as_mut_ptr() as *mut _),
        &mut bmi,
        DIB_RGB_COLORS,
    ) == 0
    {
        let _ = DeleteDC(hdc);
        return None;
    }

    let _ = DeleteDC(hdc);

    // Use image crate to encode to PNG
    let img = image::ImageBuffer::<image::Rgba<u8>, _>::from_raw(width as u32, height as u32, buffer)?;
    
    // BGRA to RGBA conversion
    let mut rgba_img = img;
    for pixel in rgba_img.pixels_mut() {
        let [b, g, r, a] = pixel.0;
        *pixel = image::Rgba([r, g, b, a]);
    }

    let mut cursor = Cursor::new(Vec::new());
    if rgba_img.write_to(&mut cursor, image::ImageFormat::Png).is_err() {
        return None;
    }

    Some(cursor.into_inner())
}

async fn validate_path(path: &str) -> std::result::Result<PathBuf, axum::response::Response> {
    let p = PathBuf::from(path);
    if p.exists() {
        Ok(p)
    } else {
        Err((StatusCode::NOT_FOUND, "Invalid path").into_response())
    }
}

async fn resize_image(path: &PathBuf, size: i32) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let path = path.clone();
    tokio::task::spawn_blocking(move || {
        let img = image::open(path)?;
        let thumb = img.thumbnail(size as u32, size as u32);
        let mut cursor = Cursor::new(Vec::new());
        thumb.write_to(&mut cursor, image::ImageFormat::Png)?;
        Ok(cursor.into_inner())
    }).await?
}

async fn create_video_thumbnail(path: &PathBuf, size: i32) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let path_str = path.to_string_lossy().to_string();
    let output = tokio::process::Command::new("ffmpeg")
        .args(&[
            "-i", &path_str,
            "-ss", "00:00:01",
            "-vframes", "1",
            "-vf", &format!("scale={}:-1", size),
            "-f", "image2pipe",
            "-vcodec", "png",
            "-"
        ])
        .output()
        .await?;

    if output.status.success() {
        Ok(output.stdout)
    } else {
        Err("ffmpeg failed".into())
    }
}
