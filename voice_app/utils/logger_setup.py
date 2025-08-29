"""
Logger Setup for Zcanic Voice App
"""
import os
import sys
from pathlib import Path
from typing import Optional, Dict, Any
from loguru import logger

# Assuming config_manager.py is in the same directory or accessible
# We need get_config to be callable without circular dependency issues if this is imported early.
# So, this module should ideally only be imported by main.py after config is loaded, 
# or config_override must be provided if used standalone.

_logger_initialized = False

def setup_logging(config_override: Optional[Dict[str, Any]] = None) -> None:
    """
    Configures the Loguru logger for the application.
    Can be called multiple times, but will only initialize once.

    Args:
        config_override: Optional dictionary to override parts of the logging config.
                         Useful for specific tests or utilities that need different logging.
    """
    global _logger_initialized
    if _logger_initialized and not config_override: # Allow re-init if specifically overriding
        return

    try:
        # This import is deferred to avoid issues if logger_setup is imported before config is ready
        from voice_app.utils.config_manager import get_config 
        app_config = get_config() # Get fully loaded config
    except ImportError:
        # Fallback if get_config isn't available (e.g. testing config_manager.py itself)
        app_config = {}
        logger.warning("Could not import get_config from config_manager. Using minimal config for logger.")

    log_cfg_base = app_config.get("logging", {})
    
    if config_override and "logging" in config_override:
        log_cfg_base.update(config_override["logging"])

    log_level = log_cfg_base.get("level", "INFO").upper()
    log_path_str = log_cfg_base.get("save_path", "./logs") # Ensure it's a string
    max_file_size = log_cfg_base.get("max_file_size_mb", 10)
    backup_count = log_cfg_base.get("backup_count", 5)

    # Ensure log_path is absolute or relative to the project base directory
    # BASE_DIR should be voice_app parent if this is in voice_app/utils/logger_setup.py
    try:
        from voice_app.utils.config_manager import BASE_DIR as APP_BASE_DIR
        log_path = Path(log_path_str)
        if not log_path.is_absolute():
            log_path = APP_BASE_DIR / log_path_str
    except ImportError:
        # Fallback if APP_BASE_DIR is not available
        log_path = Path(log_path_str).resolve()
        logger.warning(f"Could not import APP_BASE_DIR. Log path resolved to: {log_path}")

    try:
        log_path.mkdir(parents=True, exist_ok=True)
    except OSError as e:
        # If logger isn't set up, print to stderr
        sys.stderr.write(f"CRITICAL: Failed to create log directory {log_path}: {e}\n")
        # We might want to fall back to only console logging or raise an error
        # For now, let Loguru try and handle it (it might fail to write files).

    logger.remove() # Remove any existing handlers, including the default

    # Console Handler
    logger.add(
        sys.stderr,
        level=log_level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}:{function}:{line}</cyan> - <level>{message}</level>",
        colorize=True,
        backtrace=True,  # Show full stacktrace for exceptions
        diagnose=True    # Show variable values in stacktrace
    )

    # File Handler (All logs)
    main_log_file = log_path / "voice_app.log"
    try:
        logger.add(
            main_log_file,
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function}:{line} - {message}",
            rotation=f"{max_file_size} MB",
            retention=backup_count,
            encoding='utf-8',
            backtrace=True,
            diagnose=True,
            enqueue=True # For async safety
        )
    except Exception as e:
        sys.stderr.write(f"WARNING: Failed to add main file log handler for {main_log_file}: {e}\n")

    # File Handler (Errors only)
    error_log_file = log_path / "voice_app_error.log"
    try:
        logger.add(
            error_log_file,
            level="ERROR",
            format="{time:YYYY-MM-DD HH:mm:ss} | {level:<8} | {name}:{function}:{line} - {message}",
            rotation=f"{max_file_size} MB",
            retention=backup_count,
            encoding='utf-8',
            backtrace=True,
            diagnose=True,
            enqueue=True # For async safety
        )
    except Exception as e:
        sys.stderr.write(f"WARNING: Failed to add error file log handler for {error_log_file}: {e}\n")

    # Custom Unhandled Exception Hook
    def custom_excepthook(exc_type, exc_value, exc_traceback):
        logger.critical("Unhandled exception caught by sys.excepthook:", exc_info=(exc_type, exc_value, exc_traceback))
    
    sys.excepthook = custom_excepthook

    if not _logger_initialized:
        logger.info(f"Logger initialized. Level: {log_level}. Log path: {log_path.resolve()}")
    else:
        logger.info(f"Logger re-initialized with override. Level: {log_level}. Log path: {log_path.resolve()}")
    
    _logger_initialized = True


# Expose logger instance for direct import if needed, though setup_logging should be primary entry point
log = logger 