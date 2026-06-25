# 🚀 NuExtract Pro v6.1

ระบบ Extract ข้อมูลจากเอกสาร (PDF/Image) แบบอัจฉริยะด้วย AI Model **NuExtract3**  
รองรับทั้ง Structured JSON, Markdown และ Thinking Mode พร้อม Human-in-the-Loop (HITL) Editor

---

## ✨ Features

### 🎯 Core Features
- **🤖 AI-Powered Extraction** - ใช้โมเดล NuExtract3 จาก Numind
- **📄 Multi-format Support** - รองรับ PDF (Multi-page), PNG, JPG, JPEG
- **🎨 3 Extraction Modes**:
  - **Structured** - Extract เป็น JSON ตาม Template
  - **Markdown** - Extract เป็นข้อความ Markdown (OCR)
  - **Thinking** - เปิด Reasoning Mode สำหรับงานซับซ้อน
- **📦 Batch Processing** - Extract ได้สูงสุด 5 ไฟล์พร้อมกัน
- **💾 In-Context Learning (ICL)** - เพิ่มตัวอย่างให้ AI เรียนรู้จาก Template

### 🎨 UI/UX
- **🌓 Dark/Light Theme** - สลับได้ พร้อมจำค่าข้ามหน้า
- **📱 Multi-Page Application (MPA)** - แยกหน้าชัดเจน:
  - Dashboard - ภาพรวมระบบ
  - Extractor - หน้า Extract เอกสาร
  - Documents - จัดการเอกสารที่ Extract แล้ว
  - Templates - จัดการ JSON Schema
- **📊 Real-time Status Indicator** - แสดงสถานะ Backend (🟢 Online / 🟡 Busy / 🔴 Offline)
- **📝 Live Log Viewer** - ดู Log แบบ Real-time บนหน้าเว็บ
- **🔍 Pagination + Search** - จัดการเอกสารจำนวนมากได้ง่าย

### 🛠️ Data Management
- **✏️ HITL Editor** - แก้ไข JSON หลัง Extract ได้ (Human-in-the-Loop)
- **📥 Multi-format Export**:
  - JSON - ข้อมูลดิบ
  - CSV - รองรับภาษาไทย (UTF-8 BOM)
  - Excel (.xlsx) - พร้อม Header Styling
  - Markdown (.md) - สำหรับ Markdown mode
- **🤖 AI Template Generator** - สร้าง Schema จากคำอธิบายภาษาไทย

---

## 🖥️ System Requirements

### Hardware (แนะนำ)
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **GPU** | RTX 3060 12GB | RTX 4070 Super 12GB |
| **VRAM** | 12GB | 12GB+ |
| **RAM** | 16GB | 32GB |
| **Storage** | 10GB (SSD) | 20GB+ (NVMe SSD) |

> ⚠️ **หมายเหตุ**: โมเดล NuExtract3 ใช้ VRAM ประมาณ 8-11GB ขณะทำงาน

### Software
- **OS**: Windows 10/11, Linux, macOS
- **Python**: 3.10 หรือสูงกว่า
- **CUDA**: 11.8 หรือ 12.x (สำหรับ GPU acceleration)
- **Browser**: Chrome, Edge, Firefox (ล่าสุด)

---

## 📦 Installation

### 1. Clone / Download โปรเจค
```bash
git clone <your-repo-url>
cd nuextract-pro
```

### 2. สร้าง Virtual Environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 3. ติดตั้ง Dependencies
```bash
cd backend
pip install -r requirements.txt
```

**Dependencies หลัก:**
```txt
fastapi
uvicorn[standard]
torch
transformers
accelerate
bitsandbytes>=0.46.1
PyMuPDF
openpyxl
filelock
pydantic
```

### 4. ดาวน์โหลดโมเดล (ครั้งแรก)
โมเดลจะดาวน์โหลดอัตโนมัติตอนรันครั้งแรก (~14GB)  
หรือดาวน์โหลดล่วงหน้า:
```bash
huggingface-cli download numind/NuExtract3
```

---

## 🚀 การรันระบบ

### ⚡ Quick Start

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
python -m http.server 5500
```

**เปิด Browser:**
```
http://localhost:5500
```

---

## ⚠️ ข้อควรระวังสำคัญ

### ❌ อย่าใช้ VS Code Live Server
**Live Server มี auto-reload ที่จะทำให้ Batch Extraction พัง!**

**เหตุผล:**
- ทุกครั้งที่ extract สำเร็จ → Backend เขียนไฟล์ลง `data/uploads/`
- Live Server ตรวจจับการเปลี่ยนแปลง → Reload หน้าเว็บ
- การ reload ระหว่าง extraction → Loop ใน JS ถูก kill → Gen ได้แค่ไฟล์แรก

### ✅ ใช้ Static Server แทน
```bash
# วิธีที่ 1: Python (แนะนำ)
python -m http.server 5500

# วิธีที่ 2: Node.js
npx serve frontend -p 5500

# วิธีที่ 3: ถ้าจะใช้ Live Server จริงๆ
# ให้ตั้งค่า ignore โฟลเดอร์ data/ ใน .live-server.json
```

---

## 📁 โครงสร้างโปรเจค

```
nuextract-pro/
├── backend/
│   ├── main.py                 # FastAPI endpoints
│   ├── nuextract_service.py    # AI Service (Lazy Loading)
│   ├── requirements.txt
│   └── data/
│       ├── db.json             # Database (auto-created)
│       ├── uploads/            # ไฟล์ที่อัปโหลด
│       └── icl/                # ICL examples
│
├── frontend/
│   ├── index.html              # Dashboard
│   ├── extractor.html          # Extractor
│   ├── documents.html          # Documents
│   ├── templates.html          # Templates
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js              # API Client
│       ├── theme.js            # Theme Manager
│       ├── dashboard.js
│       ├── extractor.js
│       ├── documents.js
│       └── templates.js
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check + GPU info |
| `GET` | `/api/documents` | รายการเอกสาร (Pagination) |
| `GET` | `/api/documents/{id}/export/{format}` | Export (json/csv/xlsx/md) |
| `PUT` | `/api/documents/{id}` | อัปเดตเอกสาร (HITL) |
| `DELETE` | `/api/documents/{id}` | ลบเอกสาร |
| `GET` | `/api/templates` | รายการ Templates |
| `POST` | `/api/templates` | สร้าง Template |
| `DELETE` | `/api/templates/{id}` | ลบ Template |
| `POST` | `/api/templates/{id}/icl` | เพิ่ม ICL Example |
| `POST` | `/api/extract` | Extract เอกสาร |
| `POST` | `/api/generate-template` | AI สร้าง Schema |

---

## 🎯 การใช้งาน

### 1. สร้าง Template
1. ไปหน้า **Templates**
2. กด **+ New Template**
3. ใส่ชื่อและ JSON Schema เช่น:
   ```json
   {
     "store_name": "string",
     "date": "string",
     "total": "string",
     "items": [{"name": "string", "qty": "string", "price": "string"}]
   }
   ```
4. กด Save

### 2. Extract เอกสาร
1. ไปหน้า **Extractor**
2. เลือก Template
3. ลากไฟล์ 1-5 ไฟล์ลง Dropzone
4. กด **Extract**
5. รอจนเสร็จ (ดู Progress Bar)

### 3. ตรวจสอบและแก้ไข (HITL)
1. ไปหน้า **Documents**
2. กดปุ่ม **👁 View** หรือ **✏️ Edit**
3. แก้ไข JSON ใน Editor
4. กด **Save** → สถานะเปลี่ยนเป็น `verified`

### 4. Export
1. ในหน้า Documents หรือกด View
2. เลือก Export Format:
   - **JSON** - ข้อมูลดิบ
   - **CSV** - เปิดใน Excel (รองรับภาษาไทย)
   - **Excel** - พร้อม Header Styling
   - **Markdown** - สำหรับ Markdown mode

---

## 🐛 Troubleshooting

### ปัญหา: Batch Extraction ได้แค่ 1 ไฟล์
**สาเหตุ:** ใช้ VS Code Live Server  
**วิธีแก้:** ใช้ `python -m http.server` แทน

### ปัญหา: Status Indicator เป็นสีแดง
**สาเหตุ:** Backend ไม่ได้รัน  
**วิธีแก้:** รัน `uvicorn main:app --port 8000`

### ปัญหา: CSV เปิดใน Excel แล้วสระลอย
**สาเหตุ:** Excel ไม่รู้จัก UTF-8  
**วิธีแก้:** ระบบใส่ BOM อัตโนมัติแล้ว ถ้ายังมีปัญหา ให้ใช้ **Data → From Text/CSV** ใน Excel

### ปัญหา: GPU OOM (Out of Memory)
**สาเหตุ:** VRAM ไม่พอ  
**วิธีแก้:**
- ลด Batch Size (จาก 5 เป็น 3)
- ปิด Thinking Mode
- ลด DPI ของ PDF (แก้ใน `main.py` บรรทัด `pix = page.get_pixmap(dpi=150)`)

---

## 📊 Performance

| สถานการณ์ | เวลาโดยประมาณ |
|-----------|----------------|
| Extract 1 ไฟล์ (Image) | 5-15 วินาที |
| Extract 1 ไฟล์ (PDF 1 หน้า) | 10-20 วินาที |
| Extract 5 ไฟล์ (Batch) | 1-3 นาที |
| First Load (โหลดโมเดล) | 30-60 วินาที |

---

## 🛠️ Development

### เพิ่ม Feature ใหม่
1. **Backend**: แก้ `backend/main.py` เพิ่ม endpoint
2. **Frontend**: แก้ `frontend/js/*.js` เพิ่ม UI
3. **Test**: รันระบบแล้วทดสอบ

### Debug
- เปิด DevTools (F12) → Console
- ดู Log ใน Live Log Viewer (มุมขวาล่าง)
- ดู Network Tab สำหรับ API Calls

---

## 📝 License

MIT License - ใช้งานได้อย่างอิสระ

---

## 🙏 Credits

- **Model**: [NuExtract3](https://huggingface.co/numind/NuExtract3) by Numind
- **Framework**: FastAPI, Tailwind CSS
- **Icons**: Font Awesome
- **Avatars**: DiceBear

---

## 📞 Support

หากพบปัญหาหรือมีคำถาม:
1. ตรวจสอบ Troubleshooting ด้านบน
2. ดู Console Log ใน Browser
3. ดู Backend Terminal สำหรับ error

---

**Made with ❤️ by Ton Like IT**  
**Version**: 6.1  
**Last Updated**: June 2026