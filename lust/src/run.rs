use rocket::State;
use rocket_contrib::json::Json;
use std::fs::{create_dir_all, OpenOptions};
use std::io::{Read, Write};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tempfile::{tempdir, TempDir};

#[derive(Debug)]
pub struct RunState {
    temp_dir: Arc<Mutex<TempDir>>,
}

impl RunState {
    pub fn new() -> RunState {
        RunState {
            temp_dir: Arc::new(Mutex::new(tempdir().unwrap())),
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct RunRequest {
    clear_cache: bool,
    code: String,
    toml: String,
}

#[derive(Debug, Serialize)]
pub struct RunResponse {
    stdout: String,
    stderr: String,
    code: Option<i32>,
}

#[post("/run", data = "<input>")]
pub fn handler(input: Json<RunRequest>, state: State<RunState>) -> Json<RunResponse> {
    let dir_path = {
        let mut temp_dir = state.temp_dir.lock().unwrap();
        if input.clear_cache {
            *temp_dir = tempdir().unwrap();
        }

        temp_dir.path().to_path_buf()
    };

    let manifest = dir_path.join("Cargo.toml");
    OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(manifest)
        .unwrap()
        .write_all(input.toml.as_bytes())
        .unwrap();

    create_dir_all(dir_path.join("src")).unwrap();
    let main = dir_path.join("src").join("main.rs");
    OpenOptions::new()
        .create(true)
        .truncate(true)
        .write(true)
        .open(main)
        .unwrap()
        .write_all(input.code.as_bytes())
        .unwrap();

    let mut child = match Command::new("cargo")
        .current_dir(dir_path)
        .stderr(Stdio::piped())
        .stdout(Stdio::piped())
        .arg("--color=always")
        .arg("run")
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            panic!(e);
        }
    };

    match child.wait() {
        Ok(exit_status) => {
            let mut stdout_str = String::new();
            let mut stderr_str = String::new();

            child
                .stdout
                .take()
                .unwrap()
                .read_to_string(&mut stdout_str)
                .unwrap();
            child
                .stderr
                .take()
                .unwrap()
                .read_to_string(&mut stderr_str)
                .unwrap();

            Json(RunResponse {
                stdout: stdout_str,
                stderr: stderr_str,
                code: exit_status.code(),
            })
        }
        Err(err) => panic!(err),
    }
}
