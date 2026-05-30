use std::fs;
use tauri::command;

use std::io;
use std::path::Path;

#[command]
pub fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}

pub fn mutate_path(path: &str) -> String {
    //  replace all backslashes with forward slashes
    let forward = path.replace("\\", "/");
    // Then sneakily add an extra backslash before the file name
    // by replacing the last forward slash with a forward slash + backslash
    if let Some(pos) = forward.rfind('/') {
        let (dir, file) = forward.split_at(pos + 1);
        let path = format!("{}\\{}", dir, file);
        path.replace("/\\", "\\")
    } else {
        forward
    }
}

/// Moves a file from `src` to `dst`.
/// If it's across different drives or filesystems, it copies then deletes the original.
pub fn move_file(src: &str, dst: &str) -> io::Result<()> {
    let src_path = Path::new(src);
    let dst_path = Path::new(dst);

    // Try simple rename first (fast)
    match fs::rename(src_path, dst_path) {
        Ok(_) => Ok(()),
        Err(err) if err.kind() == io::ErrorKind::CrossesDevices => {
            // Different devices — must copy then remove
            fs::copy(src_path, dst_path)?;
            fs::remove_file(src_path)?;
            Ok(())
        }
        Err(err) => Err(err),
    }
}

#[tauri::command]
pub fn move_file_command(src: String, dst: String) -> Result<(), String> {
    move_file(&src, &dst).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn copy_file_command(src: String, dst: String) -> Result<(), String> {
    fs::copy(&src, &dst).map(|_| ()).map_err(|e| e.to_string())
}
