import type { Template } from '../types';

export const MIN_TEXT_LENGTH = 100;
export const MIN_SPLIT_LENGTH = 50;
export const MAX_SPLIT_LENGTH = 100;
export const COVER_MIN_LENGTH = 30;
export const COVER_MAX_LENGTH = 50;

// API模型配置
export const AI_MODEL = 'doubao-seed-1-6-flash-250828'; // 默认豆包Chat模型
export const AI_TIMEOUT = 30000; // AI处理超时时间(毫秒)

// AI模型列表
export const AI_MODELS = [
  { 
    id: 'doubao-seed-1-6-flash-250828', 
    name: '豆包Flash（快速）', 
    description: '响应速度快，适合常规文本',
    provider: 'doubao' 
  },
  { 
    id: 'doubao-seed-1-6-thinking-250715', 
    name: '豆包Thinking（深度思考）', 
    description: '深度思考模式，适合复杂文本',
    provider: 'doubao' 
  },
  { 
    id: 'kimi-k2-250711', 
    name: 'Kimi K2（高质量）', 
    description: '高质量输出，文采优秀',
    provider: 'kimi' 
  }
];

// 默认AI拆分提示词
export const DEFAULT_SPLIT_PROMPT = `你是一个小红书内容专家，擅长将长文本拆分成吸引人的小红书笔记格式。

请将以下文本智能拆分为小红书笔记：

要求：
1. 提取一个吸引眼球的封面标题（20-50字），要有号召力和吸引力
2. 将剩余内容拆分为3-8个内容段落，每段50-200字
3. 每个段落要有明确的主题，内容连贯有重点
4. 适合小红书的风格，轻松活泼，容易阅读
5. 注意：请确保JSON字符串中的特殊字符已正确转义，避免使用未转义的引号、换行符等

请严格按照以下JSON格式返回（只返回JSON对象，不要包含任何其他内容、解释或markdown标记）：
{
  "cover": "封面标题文字",
  "contents": [
    "第一段内容",
    "第二段内容",
    "第三段内容"
  ]
}

待拆分的文本：
{text}`;

// 图片生成相关常量
export const IMAGE_MODEL = 'doubao-seedream-4-0-250828'; // 豆包文生图模型（v4.0增强版）
export const IMAGE_TIMEOUT = 60000; // 生成超时时间(毫秒)

// 代理路径配置（解决CORS问题）
export const PROXY_CHAT_PATH = '/api/chat'; // Chat API代理路径
export const PROXY_IMAGES_PATH = '/api/images'; // 图片生成API代理路径

export const PRESET_TEMPLATES: Template[] = [
  {
    id: 'preset_huangshu_blue',
    name: '黄叔淡蓝商务风',
    coverPrompt: 'IMG_2094.CR2 帮我生成小红书封面，大字突出标题，商务科技风, 2.5D插画, 蓝色渐变：{content}',
    contentPrompt: 'IMG_2094.CR2 帮我生成图片，创作一个信息图 Infographic 静态图片，商务科技风, 2.5D插画, 蓝色渐变：{content}',
    isPreset: true
  }
];

export const STORAGE_KEYS = {
  API_KEY: 'xiaohongshu_api_key',
  CUSTOM_TEMPLATES: 'xiaohongshu_custom_templates',
  IMAGE_SIZE: 'xiaohongshu_image_size',
  WATERMARK_ENABLED: 'xiaohongshu_watermark_enabled',
  RECENT_PROJECTS: 'xiaohongshu_recent_projects',
  SELECTED_AI_MODEL: 'xiaohongshu_selected_ai_model',
  CUSTOM_PROMPT: 'xiaohongshu_custom_prompt',
  USE_CUSTOM_PROMPT: 'xiaohongshu_use_custom_prompt',
  SELECTED_TEMPLATE_ID: 'xiaohongshu_selected_template_id',
};

// 默认图片尺寸
export const DEFAULT_IMAGE_SIZE = '1024x1024';

// 预设尺寸选项（Seedream 4.0 - 4K超高清）
export const PRESET_SIZES = [
  { label: '1:1 正方形', value: '4096x4096' },
  { label: '3:4 竖版', value: '3072x4096' },
  { label: '4:3 横版', value: '4096x3072' },
  { label: '9:16 长图', value: '2304x4096' },
];