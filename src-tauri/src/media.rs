use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::path::PathBuf;
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};
use std::sync::Mutex;
use std::time::SystemTime;
use tauri::{AppHandle, Emitter, Manager, State};
use walkdir::WalkDir;

fn hash<T: Hash>(t: &T) -> u64 {
    let mut s = DefaultHasher::new();
    t.hash(&mut s);
    s.finish()
}

#[derive(Deserialize)]
pub enum SortByOptions {
    Name,
    Date,
    Size,
    Rating,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
    pub path: String,
    pub size: u64,
    pub modified: SystemTime,
    pub rating: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaListResult {
    pub items: Vec<MediaInfo>,
    pub index: Option<usize>,
    //  pub sort_info: Vec<String>,
}

pub struct WatcherState(pub Mutex<Option<RecommendedWatcher>>);

impl Default for WatcherState {
    fn default() -> Self {
        Self(Mutex::new(None))
    }
}

fn get_db_path(app: &AppHandle) -> PathBuf {
    let mut path = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    if !path.exists() {
        let _ = fs::create_dir_all(&path);
    }
    path.push("photos.db");
    path
}

fn get_all_ratings(app: &AppHandle) -> HashMap<String, i32> {
    let path = get_db_path(app);
    let conn = match rusqlite::Connection::open(path) {
        Ok(c) => c,
        Err(_) => return HashMap::new(),
    };

    let _ = conn.execute(
        "CREATE TABLE IF NOT EXISTS ratings (path TEXT PRIMARY KEY, rating INTEGER)",
        [],
    );

    let mut stmt = match conn.prepare("SELECT path, rating FROM ratings") {
        Ok(s) => s,
        Err(_) => return HashMap::new(),
    };

    let rows = stmt.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, i32>(1)?))
    });

    let mut ratings = HashMap::new();
    if let Ok(rows) = rows {
        for row in rows {
            if let Ok((p, r)) = row {
                ratings.insert(p, r);
            }
        }
    }
    ratings
}

#[tauri::command]
pub fn watch_directory(
    app: AppHandle,
    state: State<'_, WatcherState>,
    dir: String,
) -> Result<(), String> {
    let mut watcher_state = state.0.lock().map_err(|e| e.to_string())?;

    let app_handle = app.clone();

    let mut ver = 0;
    // Create a watcher that emits events to the frontend
    let mut watcher =
        notify::recommended_watcher(move |res: Result<notify::Event, notify::Error>| {
            match res {
                Ok(event) => {
                    // We only care about file changes that might affect our list
                    // Create, Remove, Rename, Modify
                    println!("File event: {:?}", event);
                    ver += 1;
                    let _ = app_handle.emit("dir-change", ver);
                }
                Err(e) => println!("watch error: {:?}", e),
            }
        })
        .map_err(|e| e.to_string())?;

    // Watch the directory
    watcher
        .watch(Path::new(&dir), RecursiveMode::NonRecursive)
        .map_err(|e| e.to_string())?;

    // Store the watcher in state
    *watcher_state = Some(watcher);

    Ok(())
}

fn get_allowed_extensions() -> [&'static str; 13] {
    [
        "jpg", "jpeg", "png", "gif", "bmp", "webp", "mp4", "mkv", "mov", "avi", "mp3", "wav",
        "flac",
    ]
}

#[tauri::command]
pub fn list_media_files_recursive(
    app: AppHandle,
    dir: &str,
    sb: SortByOptions,
) -> Result<MediaListResult, String> {
    let ratings = get_all_ratings(&app);
    let allowed_extensions = get_allowed_extensions();
    let mut entries: Vec<MediaInfo> = WalkDir::new(dir)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter_map(|entry| {
            let metadata = entry.metadata().ok()?;
            if !metadata.is_file() {
                return None;
            }

            let path = entry.path();
            let ext = path.extension()?.to_str()?.to_lowercase();

            if !allowed_extensions.contains(&ext.as_str()) {
                return None;
            }

            let path_str = path.to_string_lossy().to_string();
            let rating = *ratings.get(&path_str).unwrap_or(&0);

            Some(MediaInfo {
                path: path_str,
                size: metadata.len(),
                modified: metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH),
                rating,
            })
        })
        .collect();

    // Sort based on enum
    match sb {
        SortByOptions::Size => entries.sort_by_key(|e| e.size),
        SortByOptions::Date => entries.sort_by_key(|e| e.modified),
        SortByOptions::Name => entries.sort_by_key(|e| e.path.clone()),
        SortByOptions::Rating => {
            entries.sort_by(|a, b| {
                b.rating
                    .cmp(&a.rating)
                    .then_with(|| hash(&a.path).cmp(&hash(&b.path)))
            });
        }
    }

    match sb {
        SortByOptions::Size => println!("Sorting by Size"),
        SortByOptions::Date => println!("Sorting by Date"),
        SortByOptions::Name => println!("Sorting by Name"),
        SortByOptions::Rating => println!("Sorting by Rating"),
    }

    /*
    // Collect the corresponding sort info
    let sort_info = match sb {
        SortByOptions::Size => entries.iter().map(|e| e.size.to_string()).collect(),
        SortByOptions::Date => entries
            .iter()
            .filter_map(|e| e.modified.elapsed().ok())
            .map(|elapsed| format!("{:?}", elapsed))
            .collect(),
        SortByOptions::Name => entries.iter().map(|e| e.path.clone()).collect(),
    };
     */

    Ok(MediaListResult {
        items: entries,
        index: None,
    })
}

#[tauri::command]
pub fn list_media_files(
    app: AppHandle,
    dir: &str,
    sb: SortByOptions,
) -> Result<MediaListResult, String> {
    let ratings = get_all_ratings(&app);
    let allowed_extensions = get_allowed_extensions();

    let mut entries: Vec<MediaInfo> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| {
            let entry = entry.ok()?;
            let metadata = entry.metadata().ok()?;
            if !metadata.is_file() {
                return None;
            }

            let path = entry.path();
            let ext = path.extension()?.to_str()?.to_lowercase();

            if !allowed_extensions.contains(&ext.as_str()) {
                return None;
            }

            let path_str = path.to_string_lossy().to_string();
            let rating = *ratings.get(&path_str).unwrap_or(&0);

            Some(MediaInfo {
                path: path_str,
                size: metadata.len(),
                modified: metadata.modified().unwrap_or(SystemTime::UNIX_EPOCH),
                rating,
            })
        })
        .collect();

    // Sort based on enum
    match sb {
        SortByOptions::Size => entries.sort_by_key(|e| e.size),
        SortByOptions::Date => entries.sort_by_key(|e| e.modified),
        SortByOptions::Name => entries.sort_by_key(|e| e.path.clone()),
        SortByOptions::Rating => {
            entries.sort_by(|a, b| {
                b.rating
                    .cmp(&a.rating)
                    .then_with(|| hash(&a.path).cmp(&hash(&b.path)))
            });
        }
    }

    match sb {
        SortByOptions::Size => println!("Sorting by Size"),
        SortByOptions::Date => println!("Sorting by Date"),
        SortByOptions::Name => println!("Sorting by Name"),
        SortByOptions::Rating => println!("Sorting by Rating"),
    }

    /*
    // Collect the corresponding sort info
    let sort_info = match sb {
        SortByOptions::Size => entries.iter().map(|e| e.size.to_string()).collect(),
        SortByOptions::Date => entries
            .iter()
            .filter_map(|e| e.modified.elapsed().ok())
            .map(|elapsed| format!("{:?}", elapsed))
            .collect(),
        SortByOptions::Name => entries.iter().map(|e| e.path.clone()).collect(),
    };
     */

    Ok(MediaListResult {
        items: entries,
        index: None,
    })
}

#[tauri::command]
pub fn list_neighbors_media(
    app: AppHandle,
    dd: &str,
    fp: &str,
    sb: SortByOptions,
) -> Result<MediaListResult, String> {
    // Delegate to list_image_index so callers receive the same items + index
    list_image_index(app, dd, fp, sb, false)
}

#[tauri::command]
pub fn list_image_index(
    app: AppHandle,
    image_path: &str,
    folder_path: &str,
    sb: SortByOptions,
    recursive: bool,
) -> Result<MediaListResult, String> {
    // Get media list for the file's parent directory

    println!("Listing the index for {}", folder_path);
    let parent =  PathBuf::from(folder_path);

    let media_result;
    if recursive {
        println!("Listing media files recursively at {}", parent.to_str().unwrap());
        media_result = list_media_files_recursive(app, parent.to_str().unwrap(), sb)?;
        println!("Found {} media files", media_result.items.len());
    } else {
        media_result = list_media_files(app, parent.to_str().unwrap(), sb)?;
    }

    // Try to canonicalize the target file for robust comparison; if canonicalization
    // fails, we'll fall back to string equality.
    let target_canon = std::fs::canonicalize(image_path).ok();

    let mut found_index: Option<usize> = None;
    for (i, item) in media_result.items.iter().enumerate() {
        let item_path = &item.path;
        let item_canon = std::fs::canonicalize(item_path).ok();

        let is_same = match (&target_canon, &item_canon) {
            (Some(t), Some(it)) => t == it,
            _ => item_path == image_path,
        };

        if is_same {
            found_index = Some(i);
            break;
        }
    }

    Ok(MediaListResult {
        items: media_result.items,
        index: found_index,
    })
}
