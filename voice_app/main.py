"""
Main Application File for Zcanic Voice App (Rebuilt)
"""
import os
import sys # For direct uvicorn run exception handling
import uvicorn
from pathlib import Path
import time # Added for timestamping in raw middleware
import uuid # Added for UUID generation in raw middleware

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger # Loguru instance will be configured by setup_logging

# --- Early Imports for Setup ---
# Attempt to load config and setup logging as early as possible.
# config_manager will use print for critical errors if logger isn't ready.
try:
    from voice_app.utils.config_manager import get_config, BASE_DIR as APP_BASE_DIR
    APP_CONFIG = get_config() # Load configuration globally for easy access if needed
except FileNotFoundError as e:
    # This is a critical failure if default_config.yaml is missing.
    # config_manager.py already prints a CRITICAL message.
    sys.stderr.write(f"TERMINATING: {e}\n")
    sys.exit(1)
except ValueError as e:
    # This occurs if default_config.yaml is empty or unparseable.
    # config_manager.py already prints a CRITICAL message.
    sys.stderr.write(f"TERMINATING: {e}\n")
    sys.exit(1)
except Exception as e:
    # Catch any other unexpected error during initial config load
    sys.stderr.write(f"CRITICAL UNEXPECTED ERROR during initial config load: {e}\n")
    sys.exit(1)

try:
    from voice_app.utils.logger_setup import setup_logging
    setup_logging() # Initialize Loguru logger with loaded config
except Exception as e:
    # If logger setup itself fails, print to stderr and exit
    sys.stderr.write(f"CRITICAL: Failed to setup logging: {e}\nStack trace: {e.__traceback__}\n")
    # Loguru might not be working, so direct print
    logger.critical(f"Failed to setup logging: {e}", exc_info=True) # Try Loguru one last time
    sys.exit(1)

# --- App-Specific Imports (after logger and config are ready) ---
from voice_app.api.routes import router # Main API router
from voice_app.version import __version__

# --- Global Service Instances (Initialized in api.routes, can be accessed if needed) ---
# from voice_app.api.routes import _translator_service, _voicevox_service, _tts_orchestrator

# A very simple raw request logging middleware
async def raw_request_logging_middleware(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())) # Assuming uuid is imported somewhere or use time
    # Crude way to get a timestamp if uuid isn't readily available here without more imports
    # For production, ensure uuid is imported if used, or use a simpler request identifier.
    # We'll use a simple print to bypass Loguru in case Loguru itself has issues or isn't configured yet for this very early log.
    print(f"[RAW_REQUEST_LOG] {time.time()} ID: {request_id} Method: {request.method}, Path: {request.url.path}, Client: {request.client.host if request.client else 'Unknown'}")
    print(f"[RAW_REQUEST_LOG] {time.time()} ID: {request_id} Headers: {dict(request.headers)}")
    
    # Be careful with request body, reading it here might consume it for later handlers
    # For POST/PUT, let's try to peek at the first few bytes without consuming if possible, or just log its presence
    # This is tricky with FastAPI's async request body handling. 
    # A safer bet is to just log that a body is expected.
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        print(f"[RAW_REQUEST_LOG] {time.time()} ID: {request_id} Expecting body. Content-Length: {content_length}")
        # To actually read and log body (and then reset stream if possible) is more complex and risky here.
        # We'll rely on later logs if the request reaches FastAPI properly.

    response = await call_next(request)
    print(f"[RAW_REQUEST_LOG] {time.time()} ID: {request_id} Response Status: {response.status_code}")
    return response

def create_application() -> FastAPI:
    logger.info(f"Starting Zcanic Voice App v{__version__} creation...")

    server_cfg = APP_CONFIG.get("server", {})
    
    # Initialize FastAPI app
    application = FastAPI(
        title="Zcanic Voice Service (Rebuilt)",
        description="Rebuilt Chinese text to Japanese speech service with OpenAI and Voicevox.",
        version=__version__,
        docs_url="/api/docs", # Prefixed with /api
        redoc_url="/api/redoc" # Prefixed with /api
    )

    # Add the raw request logging middleware FIRST
    application.middleware("http")(raw_request_logging_middleware)
    logger.info("Raw request logging middleware added.")

    # --- Middleware Setup ---
    logger.debug("Setting up CORS middleware...")
    cors_origins = server_cfg.get("cors_origins")
    if cors_origins is None: # Default if not specified or empty in config
        cors_origins = ["*"] # Allow all origins by default if not specified
        logger.info("CORS origins not specified, defaulting to '*'.")
    else:
        logger.info(f"Configured CORS origins: {cors_origins}")
        
    application.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info("CORS middleware configured.")

    # --- Request Logging Middleware (Optional, Loguru already logs requests via HTTP middleware in routes if used) ---
    # This is an example of a custom middleware if you need more control here.
    # @application.middleware("http")
    # async def http_request_logging_middleware(request: Request, call_next):
    #     request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    #     logger.info(f"Incoming request [ID: {request_id}]: {request.method} {request.url.path}")
    #     start_time = time.time()
    #     response = await call_next(request)
    #     process_time = (time.time() - start_time) * 1000
    #     logger.info(f"Request finished [ID: {request_id}]: Status {response.status_code}, Took {process_time:.2f}ms")
    #     response.headers["X-Request-ID"] = request_id
    #     return response

    # --- API Routers ---
    logger.debug("Including API router...")
    application.include_router(router, prefix="/api") # All routes under /api/v1 (prefix in routes.py)
    logger.info("API router included under /api prefix.")

    # --- Static Files for Audio ---
    logger.debug("Setting up static files for audio storage...")
    audio_storage_path_str = server_cfg.get("audio_storage_path", "./audio_storage")
    audio_storage_dir = Path(audio_storage_path_str)
    if not audio_storage_dir.is_absolute():
        audio_storage_dir = APP_BASE_DIR / audio_storage_path_str
    
    try:
        audio_storage_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"Ensured audio storage directory exists: {audio_storage_dir}")
        # Mount point should match how URLs are constructed in VoicevoxService.get_audio_file_url
        # If get_audio_file_url returns "/audio_storage/filename.wav", then mount path should be "/audio_storage"
        application.mount("/audio_storage", StaticFiles(directory=audio_storage_dir), name="audio_files_static")
        logger.info(f"Mounted static files from '{audio_storage_dir}' to '/audio_storage'.")
    except OSError as e:
        logger.error(f"Failed to create or mount audio storage directory {audio_storage_dir}: {e}", exc_info=True)
        # This might be non-fatal if no audio is ever generated or served.

    # --- Event Handlers ---
    @application.on_event("startup")
    async def on_startup():
        logger.info("********************************************************")
        logger.info(f"🚀 Zcanic Voice Service v{__version__} is starting up! 🚀")
        logger.info("********************************************************")
        # Any additional async startup tasks can go here (e.g., DB connections)
        # Services are already initialized at module import time in api.routes.py
        # Check health of dependent services if desired:
        # health_status = await _tts_orchestrator._voicevox_service.get_speakers() # Example

    @application.on_event("shutdown")
    async def on_shutdown():
        logger.info("********************************************************")
        logger.info(f"👋 Zcanic Voice Service v{__version__} is shutting down! 👋")
        logger.info("********************************************************")
        # Any cleanup tasks (e.g., closing DB connections)

    logger.info("FastAPI application creation complete.")
    return application

# Create the main app instance
app = create_application()

# --- Direct Run with Uvicorn (for development/testing) ---
if __name__ == "__main__":
    server_cfg = APP_CONFIG.get("server", {})
    uvicorn_host = server_cfg.get("host", "0.0.0.0")
    uvicorn_port = int(server_cfg.get("port", 8000))
    # debug_mode = server_cfg.get("debug", False) # Handled by log level mostly
    
    logger.info(f"Attempting to run Uvicorn directly on {uvicorn_host}:{uvicorn_port}")
    try:
        uvicorn.run(
            "main:app", # refers to this file (main.py) and the app instance
            host=uvicorn_host,
            port=uvicorn_port,
            log_level=APP_CONFIG.get("logging", {}).get("level", "info").lower(),
            reload=False # Reloading should be handled by external tools like the .bat script if needed
            # reload_dirs=["voice_app"] if debug_mode else None
        )
    except Exception as e:
        logger.critical(f"Failed to start Uvicorn directly: {e}", exc_info=True)
        sys.exit(1) 