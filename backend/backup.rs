use actix_web::{get, post, web, App, HttpResponse, HttpServer, Responder};

use std::{fs::File, io::Write};

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

async fn download(url: String, filename: String) -> impl Responder {
    let response = reqwest::get(url).await.unwrap();
    let mut file = File::create(filename).unwrap();
    let mut contents = response.bytes().await.unwrap();
    let response = reqwest::get(url).await.unwrap();
    file.write_all(& mut contents).unwrap();
    HttpResponse::Ok().body("Download started!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(echo)
            .route("/download", web::get().to(download))
            .route("/hey", web::get().to(manual_hello))
    })
    .bind(("127.0.0.1", 8080))?
    .run()
    .await
}
