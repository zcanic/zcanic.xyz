"""
Configuration Manager for Zcanic Voice App

Loads configurations from YAML files and environment variables.
Priority: Environment Variables > config_local.yaml > default_config.yaml
"""
import os
import pathlib
from typing import Dict, Any, Optional
import yaml
from dotenv import load_dotenv
from loguru import logger # Will be configured by logger_setup.py later

# Define base directory for the voice_app package
# Assumes this file is in voice_app/utils/
BASE_DIR = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_FILE = BASE_DIR / "config" / "default_config.yaml"
LOCAL_CONFIG_FILE = BASE_DIR / "config" / "config_local.yaml"

_settings: Optional[Dict[str, Any]] = None


def _load_yaml_file(file_path: pathlib.Path) -> Dict[str, Any]:
    """Loads a single YAML file.
    Returns empty dict if file not found or parsing error.
    """
    if not file_path.exists():
        logger.warning(f"Configuration file not found: {file_path}")
        return {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f) or {} # Ensure empty file returns dict
    except yaml.YAMLError as e:
        logger.error(f"Error parsing YAML file {file_path}: {e}")
        return {}
    except Exception as e:
        logger.error(f"Error loading YAML file {file_path}: {e}")
        return {}


def _deep_update(source: Dict[str, Any], overrides: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively updates a dictionary.
    Modifies 'source' in place.
    """
    for key, value in overrides.items():
        if isinstance(value, dict) and isinstance(source.get(key), dict):
            source[key] = _deep_update(source[key], value)
        else:
            source[key] = value
    return source


def _load_settings_from_env(config: Dict[str, Any]) -> None:
    """Overrides configuration with environment variables.
    Environment variable names are expected to be like: VOICEAPP_SECTION_KEY
    Example: VOICEAPP_SERVER_PORT or VOICEAPP_AI_TRANSLATOR_API_KEY
    """
    prefix = "VOICEAPP_"
    for section, settings in config.items():
        if isinstance(settings, dict):
            for key, current_value in settings.items():
                env_var_name = f"{prefix}{section.upper()}_{key.upper()}"
                env_value = os.getenv(env_var_name)
                if env_value is not None:
                    try:
                        # Attempt to cast to original type
                        if isinstance(current_value, bool):
                            config[section][key] = env_value.lower() == 'true'
                        elif isinstance(current_value, int):
                            config[section][key] = int(env_value)
                        elif isinstance(current_value, float):
                            config[section][key] = float(env_value)
                        else:
                            config[section][key] = env_value # String by default
                        logger.debug(f"Overriding '{section}.{key}' with env var '{env_var_name}'")
                    except ValueError:
                        logger.warning(
                            f"Env var '{env_var_name}' (value: '{env_value}') could not be cast to type {type(current_value)}. Using string."
                        )
                        config[section][key] = env_value # Fallback to string


def load_app_config() -> Dict[str, Any]:
    """Loads application configuration.
    Raises FileNotFoundError if default_config.yaml is missing.
    """
    if not DEFAULT_CONFIG_FILE.exists():
        # Loguru might not be set up yet if this is called before logger_setup
        # So, using print for this critical bootstrap error.
        critical_error_msg = f"CRITICAL: Default configuration file {DEFAULT_CONFIG_FILE} not found. Application cannot start."
        print(critical_error_msg)
        # logger.critical(critical_error_msg) # Would be ideal, but logger might not be ready
        raise FileNotFoundError(critical_error_msg)

    # 1. Load .env file (for local development, overrides system env vars if names clash)
    # Assuming .env file is in the parent directory of the voice_app package (project root)
    dotenv_path = BASE_DIR.parent / ".env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path=dotenv_path, override=True)
        logger.info(f"Loaded environment variables from {dotenv_path}")
    else:
        load_dotenv() # Load from system environment if no .env file

    # 2. Load default configuration
    config = _load_yaml_file(DEFAULT_CONFIG_FILE)
    if not config: # If default config failed to load or is empty
        critical_error_msg = f"CRITICAL: Default configuration {DEFAULT_CONFIG_FILE} is empty or failed to load. Application cannot proceed."
        print(critical_error_msg)
        # logger.critical(critical_error_msg)
        raise ValueError(critical_error_msg)

    # 3. Override with local configuration
    local_config = _load_yaml_file(LOCAL_CONFIG_FILE)
    if local_config:
        config = _deep_update(config, local_config)
        logger.info(f"Overridden configuration with {LOCAL_CONFIG_FILE}")

    # 4. Override with environment variables (VOICEAPP_SECTION_KEY format)
    _load_settings_from_env(config)
    
    # Ensure critical nested dictionaries exist if not defined by any source
    config.setdefault("server", {})
    config.setdefault("logging", {})
    config.setdefault("ai_translator", {})
    config.setdefault("voicevox", {})

    return config


def get_config() -> Dict[str, Any]:
    """Returns the global application configuration dictionary.
    Loads it if not already loaded.
    """
    global _settings
    if _settings is None:
        _settings = load_app_config()
    return _settings


def reload_app_config() -> Dict[str, Any]:
    """Forces a reload of the application configuration.
    Useful for testing or if settings can change at runtime (rarely needed).
    """
    global _settings
    _settings = load_app_config()
    logger.info("Application configuration reloaded.")
    return _settings

if __name__ == '__main__':
    # Example usage and test
    # This requires a logger to be available or will use print for critical errors
    try:
        from voice_app.utils.logger_setup import setup_logging # Assuming logger_setup.py will exist
        setup_logging(config_override={'logging': {'level': 'DEBUG'}}) # Use DEBUG for testing this script
        logger.info("Testing config_manager...")
    except ImportError:
        print("INFO: logger_setup not available for direct config_manager test, using basic logging.")

    test_config = get_config()
    logger.info(f"Loaded host: {test_config.get('server', {}).get('host')}")
    logger.info(f"Loaded AI API Key (should be a real key or from env): {test_config.get('ai_translator', {}).get('api_key')}")
    logger.info(f"Voicevox engine: {test_config.get('voicevox', {}).get('engine_url')}")
    
    # Example of how environment variables would override:
    # Set these in your shell before running `python config_manager.py` to test:
    # export VOICEAPP_SERVER_PORT=9999
    # export VOICEAPP_AI_TRANSLATOR_API_KEY="env_test_key"
    # export VOICEAPP_LOGGING_LEVEL="DEBUG"
    logger.info(f"Server Port (after potential env override): {test_config.get('server',{}).get('port')}")
    logger.info(f"To test environment variable overrides, set them and re-run this script.") 