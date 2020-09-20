#![feature(proc_macro_hygiene, decl_macro)]

#[macro_use]
extern crate rocket;
#[macro_use]
extern crate serde_derive;

mod run;

fn main() {
    rocket::ignite()
        .manage(run::RunState::new())
        .mount("/", routes![run::handler])
        .launch();
}
