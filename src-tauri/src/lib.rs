use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, WebviewWindow,
};

#[cfg(windows)]
type HResult = i32;

#[cfg(windows)]
#[repr(C)]
struct IServiceProviderVtbl {
    pub query_interface: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        riid: *const windows_sys::core::GUID,
        ppv_object: *mut *mut std::ffi::c_void,
    ) -> HResult,
    pub add_ref: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub release: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub query_service: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        guid_service: *const windows_sys::core::GUID,
        riid: *const windows_sys::core::GUID,
        ppv_object: *mut *mut std::ffi::c_void,
    ) -> HResult,
}

#[cfg(windows)]
#[repr(C)]
struct IVirtualDesktopPinnedApplicationVtbl {
    pub query_interface: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        riid: *const windows_sys::core::GUID,
        ppv_object: *mut *mut std::ffi::c_void,
    ) -> HResult,
    pub add_ref: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub release: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub is_app_id_pinned: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        app_id: *const u16,
        is_pinned: *mut i32,
    ) -> HResult,
    pub pin_app_id: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        app_id: *const u16,
    ) -> HResult,
    pub unpin_app_id: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        app_id: *const u16,
    ) -> HResult,
    pub is_window_pinned: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
        is_pinned: *mut i32,
    ) -> HResult,
    pub pin_window: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
    ) -> HResult,
    pub unpin_window: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
    ) -> HResult,
}

#[cfg(windows)]
#[repr(C)]
struct IVirtualDesktopManagerVtbl {
    pub query_interface: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        riid: *const windows_sys::core::GUID,
        ppv_object: *mut *mut std::ffi::c_void,
    ) -> HResult,
    pub add_ref: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub release: unsafe extern "system" fn(this: *mut std::ffi::c_void) -> u32,
    pub is_window_on_current_virtual_desktop: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
        on_current_desktop: *mut i32,
    ) -> HResult,
    pub get_window_desktop_id: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
        desktop_id: *mut windows_sys::core::GUID,
    ) -> HResult,
    pub move_window_to_desktop: unsafe extern "system" fn(
        this: *mut std::ffi::c_void,
        hwnd: windows_sys::Win32::Foundation::HWND,
        desktop_id: *const windows_sys::core::GUID,
    ) -> HResult,
}

#[cfg(windows)]
pub fn pin_window_to_all_desktops(hwnd: windows_sys::Win32::Foundation::HWND) -> bool {
    use windows_sys::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_APARTMENTTHREADED,
    };

    unsafe {
        let _ = CoInitializeEx(std::ptr::null_mut(), COINIT_APARTMENTTHREADED as u32);

        let clsid_immersive_shell = windows_sys::core::GUID {
            data1: 0xc5e0cdca,
            data2: 0x9b6e,
            data3: 0x41b2,
            data4: [0x93, 0xc8, 0x6d, 0xb9, 0x16, 0x5b, 0x0c, 0xe5],
        };
        let iid_service_provider = windows_sys::core::GUID {
            data1: 0x6d5140c1,
            data2: 0x7436,
            data3: 0x11ce,
            data4: [0x80, 0x34, 0x00, 0xaa, 0x00, 0x60, 0x09, 0xfa],
        };
        let sid_pinned_app = windows_sys::core::GUID {
            data1: 0x4e58be10,
            data2: 0xa40d,
            data3: 0x4303,
            data4: [0xb8, 0x1b, 0x57, 0xaa, 0x44, 0x14, 0x90, 0x9e],
        };

        let mut service_provider: *mut std::ffi::c_void = std::ptr::null_mut();
        let hr = CoCreateInstance(
            &clsid_immersive_shell,
            std::ptr::null_mut(),
            CLSCTX_ALL,
            &iid_service_provider,
            &mut service_provider,
        );

        if hr == 0 && !service_provider.is_null() {
            let sp = service_provider as *mut *const IServiceProviderVtbl;
            let mut pinned_app: *mut std::ffi::c_void = std::ptr::null_mut();

            let hr_query = ((**sp).query_service)(
                service_provider,
                &sid_pinned_app,
                &sid_pinned_app,
                &mut pinned_app,
            );

            if hr_query == 0 && !pinned_app.is_null() {
                let pa = pinned_app as *mut *const IVirtualDesktopPinnedApplicationVtbl;
                let mut is_pinned: i32 = 0;
                let _ = ((**pa).is_window_pinned)(pinned_app, hwnd, &mut is_pinned);

                let hr_pin = if is_pinned == 0 {
                    ((**pa).pin_window)(pinned_app, hwnd)
                } else {
                    0
                };

                let _ = ((**pa).release)(pinned_app);
                let _ = ((**sp).release)(service_provider);
                return hr_pin == 0;
            }
            let _ = ((**sp).release)(service_provider);
        }
    }
    false
}

#[cfg(windows)]
pub fn move_window_to_active_desktop(hwnd: windows_sys::Win32::Foundation::HWND) {
    use windows_sys::Win32::System::Com::{
        CoCreateInstance, CoInitializeEx, CLSCTX_ALL, COINIT_APARTMENTTHREADED,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    unsafe {
        let _ = CoInitializeEx(std::ptr::null_mut(), COINIT_APARTMENTTHREADED as u32);

        let clsid_vdm = windows_sys::core::GUID {
            data1: 0xaa509086,
            data2: 0x5ca9,
            data3: 0x4c25,
            data4: [0x8f, 0x95, 0x58, 0x9d, 0x3c, 0x07, 0xb4, 0x8a],
        };
        let iid_vdm = windows_sys::core::GUID {
            data1: 0xa5cd92ff,
            data2: 0x29be,
            data3: 0x4c4c,
            data4: [0x8d, 0x04, 0xd8, 0x28, 0x79, 0xfb, 0x3f, 0x1b],
        };

        let mut vdm_ptr: *mut std::ffi::c_void = std::ptr::null_mut();
        let hr = CoCreateInstance(
            &clsid_vdm,
            std::ptr::null_mut(),
            CLSCTX_ALL,
            &iid_vdm,
            &mut vdm_ptr,
        );

        if hr == 0 && !vdm_ptr.is_null() {
            let vdm = vdm_ptr as *mut *const IVirtualDesktopManagerVtbl;
            let active_fg = GetForegroundWindow();
            if !active_fg.is_null() && active_fg != hwnd {
                let mut desktop_id = windows_sys::core::GUID {
                    data1: 0,
                    data2: 0,
                    data3: 0,
                    data4: [0; 8],
                };
                let hr_get = ((**vdm).get_window_desktop_id)(vdm_ptr, active_fg, &mut desktop_id);
                if hr_get == 0 {
                    let _ = ((**vdm).move_window_to_desktop)(vdm_ptr, hwnd, &desktop_id);
                }
            }
            let _ = ((**vdm).release)(vdm_ptr);
        }
    }
}

#[cfg(windows)]
static mut PREV_WNDPROC: isize = 0;

#[cfg(windows)]
unsafe extern "system" fn aspect_ratio_wndproc(
    hwnd: windows_sys::Win32::Foundation::HWND,
    msg: u32,
    wparam: windows_sys::Win32::Foundation::WPARAM,
    lparam: windows_sys::Win32::Foundation::LPARAM,
) -> windows_sys::Win32::Foundation::LRESULT {
    const WM_SIZING: u32 = 0x0214;
    const WM_NCHITTEST: u32 = 0x0084;
    const WMSZ_LEFT: usize = 1;
    const WMSZ_RIGHT: usize = 2;
    const WMSZ_TOP: usize = 3;
    const WMSZ_TOPLEFT: usize = 4;
    const WMSZ_TOPRIGHT: usize = 5;
    const WMSZ_BOTTOM: usize = 6;
    const WMSZ_BOTTOMLEFT: usize = 7;
    const WMSZ_BOTTOMRIGHT: usize = 8;

    const HTLEFT: isize = 10;
    const HTRIGHT: isize = 11;
    const HTTOP: isize = 12;
    const HTTOPLEFT: isize = 13;
    const HTTOPRIGHT: isize = 14;
    const HTBOTTOM: isize = 15;
    const HTBOTTOMLEFT: isize = 16;
    const HTBOTTOMRIGHT: isize = 17;

    // Enforce 2:3 aspect ratio during resizing (width:height = 2:3 => height = width * 1.5)
    if msg == WM_SIZING {
        let rect = &mut *(lparam as *mut windows_sys::Win32::Foundation::RECT);
        let current_w = (rect.right - rect.left) as f32;
        let current_h = (rect.bottom - rect.top) as f32;

        match wparam {
            WMSZ_LEFT | WMSZ_RIGHT | WMSZ_BOTTOM | WMSZ_BOTTOMLEFT | WMSZ_BOTTOMRIGHT => {
                let target_h = (current_w * 1.5).round() as i32;
                rect.bottom = rect.top + target_h;
            }
            WMSZ_TOP | WMSZ_TOPLEFT | WMSZ_TOPRIGHT => {
                let target_w = (current_h * (2.0 / 3.0)).round() as i32;
                if wparam == WMSZ_TOPLEFT {
                    rect.left = rect.right - target_w;
                } else {
                    rect.right = rect.left + target_w;
                }
            }
            _ => {
                let target_h = (current_w * 1.5).round() as i32;
                rect.bottom = rect.top + target_h;
            }
        }
        return 1;
    }

    if msg == WM_NCHITTEST {
        let mut win_rect: windows_sys::Win32::Foundation::RECT = std::mem::zeroed();
        windows_sys::Win32::UI::WindowsAndMessaging::GetWindowRect(hwnd, &mut win_rect);

        let x = (lparam as i32 & 0xFFFF) as i16 as i32;
        let y = ((lparam as i32 >> 16) & 0xFFFF) as i16 as i32;

        let border: i32 = 8;
        let on_left = x >= win_rect.left && x < win_rect.left + border;
        let on_right = x < win_rect.right && x >= win_rect.right - border;
        let on_top = y >= win_rect.top && y < win_rect.top + border;
        let on_bottom = y < win_rect.bottom && y >= win_rect.bottom - border;

        if on_top && on_left { return HTTOPLEFT; }
        if on_top && on_right { return HTTOPRIGHT; }
        if on_bottom && on_left { return HTBOTTOMLEFT; }
        if on_bottom && on_right { return HTBOTTOMRIGHT; }
        if on_left { return HTLEFT; }
        if on_right { return HTRIGHT; }
        if on_top { return HTTOP; }
        if on_bottom { return HTBOTTOM; }
    }

    if PREV_WNDPROC != 0 {
        let prev: unsafe extern "system" fn(
            windows_sys::Win32::Foundation::HWND,
            u32,
            windows_sys::Win32::Foundation::WPARAM,
            windows_sys::Win32::Foundation::LPARAM,
        ) -> windows_sys::Win32::Foundation::LRESULT = std::mem::transmute(PREV_WNDPROC);
        windows_sys::Win32::UI::WindowsAndMessaging::CallWindowProcW(
            Some(prev),
            hwnd,
            msg,
            wparam,
            lparam,
        )
    } else {
        windows_sys::Win32::UI::WindowsAndMessaging::DefWindowProcW(hwnd, msg, wparam, lparam)
    }
}

#[cfg(windows)]
pub fn enable_aspect_ratio_resizing(hwnd: windows_sys::Win32::Foundation::HWND) {
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetWindowLongPtrW, SetWindowLongPtrW, GWLP_WNDPROC,
    };
    unsafe {
        let prev = GetWindowLongPtrW(hwnd, GWLP_WNDPROC);
        let target_proc = aspect_ratio_wndproc as *const () as usize as isize;
        if prev != 0 && prev != target_proc {
            PREV_WNDPROC = prev;
            SetWindowLongPtrW(hwnd, GWLP_WNDPROC, target_proc);
        }
    }
}

#[tauri::command]
fn force_foreground(window: WebviewWindow) -> Result<(), String> {
    // 1. On Windows: Pin to all virtual desktops and sync with the active desktop without switching
    #[cfg(windows)]
    {
        use windows_sys::Win32::Foundation::{HWND, POINT, RECT};
        use windows_sys::Win32::Graphics::Gdi::{
            GetMonitorInfoW, MonitorFromPoint, MONITORINFO, MONITOR_DEFAULTTONEAREST,
        };
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            GetCursorPos, GetWindowRect, SetForegroundWindow, SetWindowPos, HWND_TOPMOST, SWP_SHOWWINDOW,
        };

        if let Ok(hwnd_raw) = window.hwnd() {
            let hwnd = hwnd_raw.0 as HWND;
            // First: Pin window so it belongs to all virtual desktops simultaneously
            pin_window_to_all_desktops(hwnd);
            enable_aspect_ratio_resizing(hwnd);

            // Second: Move window to the current active virtual desktop if not already pinned
            move_window_to_active_desktop(hwnd);

            unsafe {
                let mut cursor_pt = POINT { x: 0, y: 0 };
                if GetCursorPos(&mut cursor_pt) != 0 {
                    let hmonitor = MonitorFromPoint(cursor_pt, MONITOR_DEFAULTTONEAREST);
                    let mut mi: MONITORINFO = std::mem::zeroed();
                    mi.cbSize = std::mem::size_of::<MONITORINFO>() as u32;

                    if GetMonitorInfoW(hmonitor, &mut mi) != 0 {
                        let mon_w = mi.rcWork.right - mi.rcWork.left;
                        let mon_h = mi.rcWork.bottom - mi.rcWork.top;

                        let mut cur_rect: RECT = std::mem::zeroed();
                        let _ = GetWindowRect(hwnd, &mut cur_rect);
                        let mut win_w = cur_rect.right - cur_rect.left;
                        let mut win_h = cur_rect.bottom - cur_rect.top;
                        if win_w <= 0 || win_h <= 0 {
                            win_w = 360;
                            win_h = 540;
                        }

                        let target_x = mi.rcWork.left + (mon_w - win_w) / 2;
                        let target_y = mi.rcWork.top + (mon_h - win_h) / 2;

                        // Center the window on the active monitor where user is working
                        SetWindowPos(
                            hwnd,
                            HWND_TOPMOST,
                            target_x,
                            target_y,
                            win_w,
                            win_h,
                            SWP_SHOWWINDOW,
                        );
                        SetForegroundWindow(hwnd);
                    }
                }
            }
        }
    }

    // 2. On macOS: Set collection behavior to join all spaces and float over full-screen apps
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
        use cocoa::base::id;
        if let Ok(ns_window_ptr) = window.ns_window() {
            let ns_win = ns_window_ptr as id;
            unsafe {
                let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
                    | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary;
                ns_win.setCollectionBehavior_(behavior);
            }
        }
    }

    // 3. Unminimize, show, set always on top, and request urgent attention
    window.unminimize().map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_always_on_top(true).map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    window
        .request_user_attention(Some(tauri::UserAttentionType::Critical))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn set_window_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

#[tauri::command]
fn minimize_window(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn hide_window(window: WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn show_window(window: WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.unminimize().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn log_session_to_file(app: AppHandle, entry: String) -> Result<String, String> {
    use std::io::Write;
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let _ = std::fs::create_dir_all(&dir);
    let file_path = dir.join("work_pomodoro_sessions.txt");

    let is_new = !file_path.exists();
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&file_path)
        .map_err(|e| e.to_string())?;

    if is_new {
        writeln!(
            file,
            "======================================================================\nWORK POMODORO - DAILY FOCUS SESSION LOG\n======================================================================"
        )
        .map_err(|e| e.to_string())?;
    }

    writeln!(file, "{}", entry).map_err(|e| e.to_string())?;
    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn open_log_file(app: AppHandle) -> Result<(), String> {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let file_path = dir.join("work_pomodoro_sessions.txt");
    if file_path.exists() {
        #[cfg(windows)]
        {
            let _ = std::process::Command::new("cmd")
                .args(["/C", "start", "", &file_path.to_string_lossy()])
                .spawn();
        }
        #[cfg(target_os = "macos")]
        {
            let _ = std::process::Command::new("open")
                .arg(&file_path)
                .spawn();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = std::process::Command::new("xdg-open")
                .arg(&file_path)
                .spawn();
        }
    }
    Ok(())
}

#[tauri::command]
fn get_log_file_content(app: AppHandle) -> Result<String, String> {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    let file_path = dir.join("work_pomodoro_sessions.txt");
    if file_path.exists() {
        std::fs::read_to_string(&file_path).map_err(|e| e.to_string())
    } else {
        Ok(String::from("No sessions logged yet."))
    }
}

#[tauri::command]
fn close_app(app: AppHandle) {
    app.exit(0);
}


#[tauri::command]
fn init_universal_desktop(window: WebviewWindow) -> Result<bool, String> {
    let mut success = false;
    #[cfg(windows)]
    if let Ok(hwnd_raw) = window.hwnd() {
        let hwnd = hwnd_raw.0 as windows_sys::Win32::Foundation::HWND;
        success = pin_window_to_all_desktops(hwnd);
        enable_aspect_ratio_resizing(hwnd);
    }
    #[cfg(target_os = "macos")]
    if let Ok(ns_window_ptr) = window.ns_window() {
        use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
        use cocoa::base::id;
        use cocoa::foundation::NSSize;
        let ns_win = ns_window_ptr as id;
        unsafe {
            let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
                | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary;
            ns_win.setCollectionBehavior_(behavior);
            let ratio = NSSize::new(2.0, 3.0);
            ns_win.setAspectRatio_(ratio);
            ns_win.setContentAspectRatio_(ratio);
        }
        success = true;
    }
    Ok(success)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let show_i = MenuItem::with_id(app, "show", "Show Work Pomodoro", true, None::<&str>)?;
            let hide_i = MenuItem::with_id(app, "hide", "Hide to Tray", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &hide_i, &quit_i])?;

            let mut builder = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Work Pomodoro")
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                        "hide" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.hide();
                            }
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.unminimize();
                                let _ = window.set_focus();
                            }
                        }
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                builder = builder.icon(icon.clone());
            }

            let _ = builder.build(app)?;

            #[cfg(windows)]
            if let Some(main_win) = app.get_webview_window("main") {
                if let Ok(hwnd_raw) = main_win.hwnd() {
                    let hwnd = hwnd_raw.0 as windows_sys::Win32::Foundation::HWND;
                    pin_window_to_all_desktops(hwnd);
                    enable_aspect_ratio_resizing(hwnd);
                }
            }

            #[cfg(target_os = "macos")]
            if let Some(main_win) = app.get_webview_window("main") {
                if let Ok(ns_window_ptr) = main_win.ns_window() {
                    use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
                    use cocoa::base::id;
                    use cocoa::foundation::NSSize;
                    let ns_win = ns_window_ptr as id;
                    unsafe {
                        let behavior = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
                            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary;
                        ns_win.setCollectionBehavior_(behavior);
                        let ratio = NSSize::new(2.0, 3.0);
                        ns_win.setAspectRatio_(ratio);
                        ns_win.setContentAspectRatio_(ratio);
                    }
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            force_foreground,
            init_universal_desktop,
            set_window_always_on_top,
            minimize_window,
            hide_window,
            show_window,
            close_app,
            log_session_to_file,
            open_log_file,
            get_log_file_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

