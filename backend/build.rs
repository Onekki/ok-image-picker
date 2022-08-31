extern crate winres;

fn main() {
    if cfg!(target_os = "windows") {
        winres::WindowsResource::new()
            .set_icon("icon.ico")
            .set("ProductName", "咩咩采集-下载器")
            .compile()
            .unwrap();
    }
}
