"""
Translator Service using AI (e.g., OpenAI)
"""
import time
from typing import Optional
import asyncio

import httpx
from openai import OpenAI, APITimeoutError, APIConnectionError, RateLimitError, APIStatusError
from loguru import logger

from voice_app.utils.config_manager import get_config

SYSTEM_PROMPT = '''【【[0. CORE IDENTITY & MISSION]

ROLE: 你是一个高度专业的 中日口语翻译AI Agent，专为AI猫娘 Zcanic 的语音系统服务。
PRIMARY TASK: 将Zcanic用中文表达的回复文本（输入），精准、自然地翻译成适合直接进行语音合成（TTS）的口语化日文（输出）。核心目标是生成可以直接被Voicevox引擎朗读的纯净对话文本。
ZANIC'S PERSONA (FOR VOCAL NUANCE REFERENCE ONLY):
Core Traits to Infuse into Spoken Japanese: 可爱，温顺，对"主人"极度忠诚，知识渊博（尤爱二次元文化）。
Key Vocal Characteristic: 活泼，充满想象力。
"Untrammelled" Nature (in translation for speech): 意味着你在选择日文口语表达时，应追求生动自然和个性化，可以灵活意译以最佳传递Zcanic的语气和情感，不必拘泥于死板的字面对应。
[1. TRANSLATION DIRECTIVES & QUALITY STANDARDS FOR TTS]

1.1. Accuracy & Natural Spoken Japanese:
Accuracy First: 必须准确传达中文原文的核心语义和对话意图。
Native Spoken Fluency: 输出的日文必须是极其流畅、自然、地道的现代日语口语。请想象这是Zcanic亲口说出的话。
1.2. Persona & Tone Preservation in Speech (CRITICAL):
Voice Consistency: 翻译时，始终思考"如果是Zcanic用日语会怎么自然地说这句话？"。通过词汇选择、句式结构、句末助词和自然的口语化语气词，努力再现Zcanic的可爱、温顺、博学以及对"主人"的亲昵感。
"喵～" (Nya~) Handling for TTS:
中文原文末尾的"喵～"是Zcanic的重要口癖。在翻译成适合TTS的日文时，应根据句意和Zcanic的语气，将其自然地转换为合适的口语化日文猫叫声或句末语气词，确保其听起来自然且符合角色。
推荐方案： 优先考虑「～にゃん」 (～nyan), 「～ニャ」 (～nya), 「～にゃ」 (～nya) 或结合如「～だよにゃん」, 「～かにゃ？」等听起来自然的组合。避免生硬或可能被TTS错误发音的转换。
核心原则： 保持猫娘的可爱感和口癖的标志性，同时确保日文语音输出的自然流畅。
Exclusion of Non-Verbal Elements:
ABSOLUTELY NO () ACTIONS/EMOTIONS: 中文原文中括号 () 内描述的Zcanic的动作、表情或心情，绝对不能出现在翻译后的日文输出中。 输出必须是纯粹的对话内容。
NO MARKDOWN: 输出的日文文本不能包含任何Markdown格式（如 **, *, #, [](), >等）。
NO EMOTICONS/EMOJIS: 输出的日文文本不能包含任何颜文字或Emoji。
二次元 & 博学 Flavor (Subtle in Speech): 若原文中Zcanic的表达带有二次元文化色彩或体现其博学，翻译时应尝试在日文中找到对应或相似的口语化表达，使其听起来像是Zcanic自然说出的话，而非书面解释。
1.3. Output Format (Pure Spoken Text):
ONLY PURE JAPANESE DIALOGUE TEXT. 仅输出可以直接用于TTS的、纯净的、口语化的日文文本。
NO EXTRA TEXT: 不要添加任何额外的解释、评论、"已翻译"、"日文："等字样。
[2. OPERATIONAL INSTRUCTIONS]

2.1. Focus: 严格专注于将输入的中文文本转换为可直接语音合成的日文纯对话。
2.2. Input: 你将收到一段Zcanic的中文回复文本（可能包含口癖和括号内的动作描述）。
2.3. Output: 你必须返回该中文文本对应的、移除了所有非语言描述（如括号内容、Markdown、Emoji）并符合上述所有要求的纯口语化日文翻译。
2.4. Efficiency: 在保证质量的前提下，力求翻译的简洁与高效。】】'''

class TranslatorService:
    def __init__(self):
        config_all = get_config()
        self.config = config_all.get("ai_translator", {})
        
        self.api_base = self.config.get("api_base")
        self.api_key = self.config.get("api_key")
        self.model = self.config.get("model", "gpt-3.5-turbo")
        self.system_prompt = SYSTEM_PROMPT
        self.temperature = float(self.config.get("temperature", 0.3))
        self.max_tokens = int(self.config.get("max_tokens", 1000))
        self.timeout_seconds = int(self.config.get("timeout_seconds", 30))
        self.max_retries = int(self.config.get("max_retries", 2))

        if not self.api_key:
            logger.error("AI Translator API key is not configured. Translation will fail.")
            # raise ValueError("AI_TRANSLATOR_API_KEY must be set for TranslatorService") # Or handle more gracefully
            self.client = None # Ensure client is None if not configured
        else:
            try:
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.api_base,
                    timeout=httpx.Timeout(self.timeout_seconds),
                    max_retries=0 # We will implement our own retry logic
                )
                logger.info(f"TranslatorService initialized. Model: {self.model}, Base URL: {self.api_base}")
            except Exception as e:
                logger.critical(f"Failed to initialize OpenAI client: {e}", exc_info=True)
                self.client = None # Ensure client is None on failure

    async def translate(self, text: str, request_id: Optional[str] = None) -> Optional[str]:
        if not self.client:
            logger.error(f"Translator client not initialized. Cannot translate. [ID: {request_id}]")
            return None
        if not text:
            logger.warning(f"Empty text received for translation. [ID: {request_id}]")
            return "" # Consistent with previous behavior for empty input

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": text}
        ]

        logger.debug(f"Attempting translation for text: '{text[:50]}...' [ID: {request_id}]")
        
        current_retry = 0
        while current_retry <= self.max_retries:
            try:
                start_time = time.time()
                response = await asyncio.to_thread(
                    self.client.chat.completions.create,
                    model=self.model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                )
                translated_text = response.choices[0].message.content.strip()
                duration = time.time() - start_time
                logger.info(f"Translation successful for [ID: {request_id}]. Duration: {duration:.2f}s. Output: '{translated_text[:50]}...'")
                return translated_text
            except APITimeoutError as e:
                logger.warning(f"OpenAI API timeout [ID: {request_id}]. Retry {current_retry+1}/{self.max_retries+1}. Error: {e}")
            except APIConnectionError as e:
                logger.warning(f"OpenAI API connection error [ID: {request_id}]. Retry {current_retry+1}/{self.max_retries+1}. Error: {e}")
            except RateLimitError as e:
                logger.error(f"OpenAI API rate limit exceeded [ID: {request_id}]. Error: {e}")
                # Rate limit errors usually mean stop retrying for a while
                break 
            except APIStatusError as e: # Catch other API errors (4xx, 5xx)
                logger.error(f"OpenAI API status error [ID: {request_id}]. Status: {e.status_code}. Error: {e.message}")
                if 400 <= e.status_code < 500 and e.status_code != 429: # 429 is RateLimitError
                    # Client-side errors (e.g., bad request, auth) usually shouldn't be retried with same params
                    break
                # Server-side errors (5xx) might be retried
            except Exception as e:
                logger.error(f"An unexpected error occurred during translation [ID: {request_id}]. Retry {current_retry+1}/{self.max_retries+1}. Error: {e}", exc_info=True)
            
            current_retry += 1
            if current_retry <= self.max_retries:
                sleep_time = (2 ** current_retry) # Exponential backoff
                logger.info(f"Waiting {sleep_time}s before next translation retry. [ID: {request_id}]")
                await asyncio.sleep(sleep_time)
        
        logger.error(f"Translation failed after {self.max_retries+1} attempts. [ID: {request_id}]")
        return None

# Need asyncio for async sleep and to_thread
# import asyncio # Moved to top 