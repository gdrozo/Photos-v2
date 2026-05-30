use std::path::Path;
use windows::{
    core::*,
    Win32::Graphics::Gdi::HBITMAP,
    Win32::System::Com::*,
    Win32::UI::Shell::*,
};

fn get_thumbnail(path: &Path, size: i32) -> Result<HBITMAP> {
    unsafe {
        // 1. Initialize COM (Required for Shell APIs)
        // CoInitializeEx must be called before using most COM interfaces.
        CoInitializeEx(None, COINIT_APARTMENTTHREADED).ok()?;

        // 2. Create a Shell Item from the file path
        // SHCreateItemFromParsingName creates an IShellItem object from a parsing name.
        let path_str = path.to_string_lossy().to_string();
        let wide_path: Vec<u16> = path_str.encode_utf16().chain(Some(0)).collect();
        
        let shell_item: IShellItem = SHCreateItemFromParsingName(
            PCWSTR(wide_path.as_ptr()),
            None,
        )?;

        // 3. Cast the IShellItem to IShellItemImageFactory
        // This interface is specifically for retrieving images (thumbnails, icons).
        let factory: IShellItemImageFactory = shell_item.cast()?;

        // 4. Request the image (thumbnail)
        let hbitmap = factory.GetImage(
            windows::Win32::Foundation::SIZE { cx: size, cy: size },
            SIIGBF_THUMBNAILONLY | SIIGBF_RESIZETOFIT,     
        )?;
        // Flags for thumbnail behavior

        Ok(hbitmap)
    }
}

fn main() {
    // Example usage: Replace with a valid path on your system
    let path = Path::new(r"D:\ProgramDatax86\ttW2z\Ref\130777-baeb2e730db22e40883af6528b59d7ec.mp4"); 
    match get_thumbnail(path, 256) {
        Ok(hbitmap) => println!("Successfully got HBITMAP: {:?}", hbitmap),
        Err(e) => eprintln!("Error getting thumbnail: {}", e),
    }
}