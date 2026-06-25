import json
import os
import base64
from typing import List, Optional, Dict, Any
import torch
from io import BytesIO
from PIL import Image

# Description: Lazy import เพื่อป้องกัน error ตอน startup ถ้ายังไม่ได้ติดตั้ง
try:
    from transformers import AutoProcessor, AutoModelForImageTextToText
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False

MODEL_ID = "numind/NuExtract3"

class NuExtractService:
    """
    Description: Service สำหรับเรียก NuExtract3 ผ่าน Transformers
    รองรับการโหลดโมเดลแบบ Lazy (โหลดเมื่อเรียกใช้ครั้งแรก) เพื่อไม่ให้ FastAPI block ตอน startup
    """
    def __init__(self):
        self.model = None
        self.processor = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.dtype = torch.bfloat16 if self.device == "cuda" else torch.float32
        print(f"[NuExtractService] Initialized. Device: {self.device}, Dtype: {self.dtype}")
    
    def _load_model(self):
        """Description: โหลดโมเดลและ processor เข้า VRAM (เรียกครั้งเดียว)"""
        if not TRANSFORMERS_AVAILABLE:
            raise RuntimeError("Transformers library not installed. Run: pip install transformers accelerate")
        
        if self.model is None:
            print(f"[NuExtractService] Loading model {MODEL_ID}... (อาจใช้เวลา 1-3 นาทีครั้งแรก)")
            self.processor = AutoProcessor.from_pretrained(
                MODEL_ID, 
                trust_remote_code=True
            )
            self.model = AutoModelForImageTextToText.from_pretrained(
                MODEL_ID,
                torch_dtype=self.dtype,
                device_map="auto",  # กระจาย model ลง GPU อัตโนมัติ
                trust_remote_code=True,
            ).eval()
            print(f"[NuExtractService] Model loaded successfully on {self.device}!")
    
    def _decode_base64_to_image(self, b64_str: str) -> Image.Image:
        """Description: แปลง base64 string เป็น PIL Image"""
        # ลบ prefix ถ้ามี (เช่น "data:image/png;base64,")
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        img_bytes = base64.b64decode(b64_str)
        return Image.open(BytesIO(img_bytes)).convert("RGB")
    
    def extract(
        self,
        images_b64: List[str],
        template: Optional[dict] = None,
        mode: str = "structured",
        enable_thinking: bool = False,
        instructions: Optional[str] = None,
        icl_examples: Optional[List[Dict[str, Any]]] = None,
    ) -> dict:
        """
        Description: ฟังก์ชันหลักสำหรับ Extract ข้อมูล
        - images_b64: List ของ base64 encoded images
        - template: JSON template สำหรับ structured mode
        - mode: "structured", "markdown", "content", "template-generation"
        - enable_thinking: เปิด reasoning mode (ใช้ VRAM เพิ่ม)
        - instructions: คำสั่งพิเศษเพิ่มเติม
        - icl_examples: ตัวอย่างสำหรับ in-context learning
        """
        try:
            # โหลดโมเดลถ้ายังไม่ได้โหลด (Lazy Loading)
            self._load_model()
            
            # สร้าง messages ตามรูปแบบของ NuExtract3
            messages = []
            
            # 1. เพิ่ม ICL Examples (Developer Role)
            if icl_examples:
                for ex in icl_examples:
                    content = []
                    # เพิ่มภาพจาก ICL
                    for img_b64 in ex.get("images", []):
                        pil_img = self._decode_base64_to_image(img_b64)
                        content.append({"type": "image", "image": pil_img})
                    # เพิ่ม expected output
                    content.append({"type": "text", "text": json.dumps(ex["output"])})
                    messages.append({"role": "developer", "content": content})
            
            # 2. เพิ่ม User Prompt (ภาพที่ต้องการ extract)
            user_content = []
            for b64 in images_b64:
                pil_img = self._decode_base64_to_image(b64)
                user_content.append({"type": "image", "image": pil_img})
            messages.append({"role": "user", "content": user_content})
            
            # 3. เตรียม chat_template_kwargs
            chat_kwargs = {"enable_thinking": enable_thinking}
            if mode in ["markdown", "content"]:
                chat_kwargs["mode"] = mode
            elif mode == "template-generation":
                chat_kwargs["mode"] = "template-generation"
            else:
                chat_kwargs["template"] = json.dumps(template, indent=4)
            
            if instructions:
                chat_kwargs["instructions"] = instructions
            
            # 4. Apply chat template
            inputs = self.processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
                **chat_kwargs,
            ).to(self.model.device)
            
            # 5. Generate
            temperature = 0.6 if enable_thinking else 0.2
            max_new_tokens = 4096 if not enable_thinking else 8192  # Reasoning mode ใช้ tokens มากกว่า
            
            with torch.inference_mode():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=max_new_tokens,
                    do_sample=True,
                    temperature=temperature,
                    top_p=0.95,
                )
            
            # ตัด prompt tokens ออก เอาเฉพาะ generated
            generated_ids = generated_ids[:, inputs.input_ids.shape[1]:]
            raw_content = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )[0].strip()
            
            # 6. แยก thinking tag ถ้ามี
            thinking_step = None
            if enable_thinking and "" in raw_content:
                parts = raw_content.split("", 1)
                thinking_step = parts[0].strip()
                raw_content = parts[1].strip()
            
            # 7. Parse JSON ถ้าเป็น structured mode
            if mode in ["structured", "template-generation"]:
                try:
                    return {"success": True, "data": json.loads(raw_content), "thinking": thinking_step}
                except json.JSONDecodeError:
                    # ลองหา JSON block ในกรณีที่ model ใส่ ```json ... ``` มา
                    if "```json" in raw_content:
                        json_part = raw_content.split("```json")[1].split("```")[0].strip()
                        return {"success": True, "data": json.loads(json_part), "thinking": thinking_step}
                    return {"success": False, "error": "Failed to parse JSON", "raw": raw_content}
            
            return {"success": True, "data": raw_content, "thinking": thinking_step}
        
        except Exception as e:
            return {"success": False, "error": f"{type(e).__name__}: {str(e)}"}
    
    def generate_template_from_text(self, description: str) -> dict:
        """Description: สร้าง JSON Template จากคำอธิบายภาษาธรรมชาติ"""
        try:
            self._load_model()
            
            messages = [
                {"role": "user", "content": [{"type": "text", "text": description}]}
            ]
            
            inputs = self.processor.apply_chat_template(
                messages,
                add_generation_prompt=True,
                tokenize=True,
                return_dict=True,
                return_tensors="pt",
                mode="template-generation",
            ).to(self.model.device)
            
            with torch.inference_mode():
                generated_ids = self.model.generate(
                    **inputs,
                    max_new_tokens=2048,
                    do_sample=False,
                )
            
            generated_ids = generated_ids[:, inputs.input_ids.shape[1]:]
            raw_content = self.processor.batch_decode(
                generated_ids,
                skip_special_tokens=True,
            )[0].strip()
            
            return {"success": True, "data": json.loads(raw_content)}
        
        except Exception as e:
            return {"success": False, "error": f"{type(e).__name__}: {str(e)}"}

# Description: สร้าง instance เดียวใช้ทั้ง app (Singleton)
nuextract_service = NuExtractService()