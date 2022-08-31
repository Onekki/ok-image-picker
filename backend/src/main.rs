#![windows_subsystem = "windows"]

use actix_web::{web, App, HttpResponse, HttpServer, Responder};
use serde_json::json;
use tao::{
    event::Event,
    event_loop::{ControlFlow, EventLoop},
    menu::{ContextMenu as Menu, MenuItemAttributes},
    system_tray::SystemTrayBuilder,
    window::Icon,
    TrayId,
};

use native_dialog::FileDialog;

use auto_launch::{AutoLaunchBuilder};

use std::{
    collections::HashMap, 
    fs::File, 
    io::Write, 
    thread, 
    process::Command,
    env::current_exe
};

fn abspath(p: &str) -> String {
    shellexpand::full(p).ok().unwrap().to_string()
}

async fn download(query: web::Query<HashMap<String, String>>) -> impl Responder {
    let save_path = query.get("save_path").unwrap();
    let url = query.get("url").unwrap();
    println!(
        "save_path: {} url: {} abspath: {:?}",
        save_path,
        url,
        abspath(save_path)
    );
    let response = reqwest::get(url).await.unwrap();
    let mut file = File::create(abspath(save_path)).unwrap();
    let mut contents = response.bytes().await.unwrap();
    file.write_all(&mut contents).unwrap();
    HttpResponse::Ok().json(json!({
        "save_path": save_path,
        "url": url
    }))
}

async fn change_default_directory() -> impl Responder {
    let directory = FileDialog::new()
        .set_location("~/Desktop")
        .show_open_single_dir()
        .unwrap();
    let directory = abspath(directory.unwrap().to_str().unwrap());
    println!("{}", directory);
    HttpResponse::Ok().json(json!({ "defaultDirectory": directory }))
}

async fn show_default_directory(query: web::Query<HashMap<String, String>>) -> impl Responder {
    let default_directory = query.get("defaultDirectory").unwrap();
    println!("{}", default_directory);
    Command::new("explorer")
        .arg(abspath(default_directory))
        .spawn()
        .unwrap();
    HttpResponse::Ok().json(json!({ "defaultDirectory": default_directory }))
}

#[actix_web::main]
async fn start_server() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/download", web::get().to(download))
            .route("/changeDefaultDirectory", web::get().to(change_default_directory))
            .route("/showDefaultDirectory", web::get().to(show_default_directory))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}

#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
#[cfg(any(feature = "tray", all(target_os = "linux", feature = "ayatana")))]
fn main() {
    thread::spawn(start_server);

    let app_name = "咩咩采集-下载器";

    let current_exe = current_exe();
    let app_path = current_exe.unwrap()
        .canonicalize().unwrap()
        .display().to_string();

    let auto = AutoLaunchBuilder::new()
        .set_app_name(app_name)
        .set_app_path(&app_path)
        .set_use_launch_agent(true)
        .build()
        .unwrap();

    auto.enable().unwrap();
    auto.is_enabled().unwrap();

    let bytes = include_bytes!("..\\assets\\icon.png");
    let (icon_rgba, icon_width, icon_height) = {
        let image = image::load_from_memory(bytes)
            .expect("Failed to open icon path")
            .into_rgba8();
        let (width, height) = image.dimensions();
        let rgba = image.into_raw();
        (rgba, width, height)
    };
    let icon = Icon::from_rgba(icon_rgba, icon_width, icon_height).expect("Failed to open icon");
    let main_tray_id = TrayId::new("main-tray");
    let mut tray_menu = Menu::new();

    let quit = tray_menu.add_item(MenuItemAttributes::new("Quit"));

    let event_loop = EventLoop::new();

    let system_tray = SystemTrayBuilder::new(icon.clone(), Some(tray_menu))
        .with_id(main_tray_id)
        .with_tooltip("咩咩采集-下载器")
        .build(&event_loop)
        .unwrap();

    let mut system_tray = Some(system_tray);

    event_loop.run(move |event, _, control_flow| {
        *control_flow = ControlFlow::Wait;

        match event {
            Event::TrayEvent {
                id,
                bounds,
                event,
                position,
                ..
            } => {
                println!(
                    "tray `{:?}` event: {:?} {:?} {:?}",
                    id, event, bounds, position
                );
            }

            Event::MenuEvent {
                window_id,
                menu_id,
                origin,
                ..
            } => {
                if menu_id == quit.clone().id() {
                    system_tray.take();
                    *control_flow = ControlFlow::Exit;
                } else {
                    println!("{:?}, {:?}, {:?}", window_id, menu_id, origin)
                }
            }

            _ => (),
        }
    });
}

// System tray isn't supported on other's platforms.
#[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
fn main() {
    println!("This platform doesn't support system_tray.");
}

// Tray feature flag disabled but can be available.
#[cfg(any(target_os = "windows", target_os = "linux", target_os = "macos"))]
#[cfg(not(feature = "tray"))]
fn main() {
    println!("This platform doesn't have the `tray` feature enabled.");
}
