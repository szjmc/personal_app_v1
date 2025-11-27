import os
import time
import json
import base64
from PIL import Image
from io import BytesIO
from django.conf import settings
from .models import OCRImage

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import requests
except ImportError:
    pass

try:
    import requests
except ImportError:
    pass

class OCRService:
    """OCR服务类"""
    
    def __init__(self):
        self.supported_languages = ['chi_sim', 'eng', 'chi_sim+eng']
        self.default_language = 'chi_sim+eng'
        
    def process_image(self, ocr_image):
        """处理图片OCR识别"""
        start_time = time.time()
        
        try:
            # 更新状态为处理中
            ocr_image.status = 'processing'
            ocr_image.save()
            
            if not TESSERACT_AVAILABLE:
                # 模拟OCR结果（当pytesseract不可用时）
                return {
                    'success': True,
                    'text': 'OCR功能需要安装pytesseract依赖',
                    'confidence': 0,
                    'processing_time': time.time() - start_time,
                    'metadata': {
                        'message': 'OCR功能未启用，请安装pytesseract',
                        'status': 'simulated'
                    }
                }
            
            # 获取图片路径
            image_path = ocr_image.image.path
            
            # 预处理图片
            processed_image = self._preprocess_image(image_path)
            
            # 执行OCR识别
            text = pytesseract.image_to_string(
                processed_image,
                lang=self.default_language,
                config='--psm 6 --oem 3'
            )
            
            # 获取置信度
            data = pytesseract.image_to_data(
                processed_image,
                lang=self.default_language,
                output_type=pytesseract.Output.DICT,
                config='--psm 6 --oem 3'
            )
            
            confidence_scores = [int(conf) for conf in data['conf'] if int(conf) > 0]
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
            
            return {
                'success': True,
                'text': text.strip(),
                'confidence': avg_confidence,
                'processing_time': time.time() - start_time,
                'metadata': {
                    'language': self.default_language,
                    'status': 'completed'
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'processing_time': time.time() - start_time,
                'metadata': {
                    'status': 'failed'
                }
            }
    
    def _preprocess_image(self, image_path):
        """图片预处理"""
        try:
            # 打开图片
            image = Image.open(image_path)
            
            # 转换为灰度图
            if image.mode != 'L':
                image = image.convert('L')
            
            # 调整大小（如果图片太大）
            max_size = (2000, 2000)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            return image
            
        except Exception as e:
            raise Exception(f"图片预处理失败: {str(e)}")
    
    def get_supported_languages(self):
        """获取支持的OCR语言"""
        return self.supported_languages
    
    def set_language(self, language):
        """设置OCR语言"""
        if language in self.supported_languages:
            self.default_language = language
            return True
        return False
    
    def is_available(self):
        """检查OCR服务是否可用"""
        return TESSERACT_AVAILABLE