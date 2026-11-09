# Ứng dụng Todo với FastAPI

Ứng dụng quản lý công việc (Todo List) hoàn chỉnh với:
- **Backend**: FastAPI trong [main.py](file:///d:/cuongnm_100790/main.py), lưu trữ in-memory bằng `dict`, kiểm thực dữ liệu qua Pydantic.
- **Quản lý trạng thái công việc (Task Workflow)**:
  - `todo`: Chờ làm (mặc định khi tạo mới).
  - `in_progress`: Đang làm (⚡).
  - `completed`: Đã hoàn thành (✓).
- **RESTful Endpoints**:
  - `GET /api/todos`: Lấy danh sách công việc (hỗ trợ lọc: `?status_filter=todo|in_progress|completed`).
  - `POST /api/todos`: Tạo công việc mới (HTTP 201 Created).
  - `PATCH /api/todos/{id}`: Cập nhật tiêu đề hoặc trạng thái công việc (HTTP 404 nếu id không tồn tại).
  - `DELETE /api/todos/{id}`: Xóa công việc (HTTP 404 nếu id không tồn tại).
- **Frontend**: Giao diện tĩnh trong thư mục [static/](file:///d:/cuongnm_100790/static/) ([index.html](file:///d:/cuongnm_100790/static/index.html)), dùng `fetch` API và phục vụ tại root `/` bằng `StaticFiles`.

---

## Cấu trúc thư mục

```text
.
├── main.py              # Backend FastAPI & API endpoints
├── requirements.txt     # Danh sách thư viện (fastapi, uvicorn)
├── README.md            # Hướng dẫn chi tiết
└── static/              # Thư mục Frontend (StaticFiles)
    ├── index.html       # Giao diện chính (HTML)
    ├── style.css        # Giao diện hiện đại & badge trạng thái
    └── script.js        # Logic tương tác bằng fetch API
```

---

## Hướng dẫn cài đặt và chạy ứng dụng

### 1. Cài đặt thư viện
```bash
pip install -r requirements.txt
```

### 2. Khởi chạy Server
```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*(hoặc chạy trực tiếp `python main.py`)*

### 3. Truy cập
- **Giao diện Todo App (Frontend)**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Tài liệu Swagger UI API**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## Tính năng trạng thái công việc

1. **Khởi tạo trạng thái**: Khi thêm công việc, có thể chọn bắt đầu ngay ở dạng **📋 Chờ làm** hoặc **⚡ Đang làm**.
2. **Chuyển đổi trạng thái linh hoạt**:
   - Nhấn **⚡ Bắt đầu** để chuyển từ *Chờ làm* sang *Đang làm*.
   - Nhấn **✓ Hoàn thành** (hoặc tích chọn Checkbox) để đánh dấu đã xong.
   - Nhấn **⏸ Tạm dừng** hoặc **↺ Làm lại** để đảo lại trạng thái khi cần.
3. **Bộ lọc thông minh**: Lọc nhanh danh sách theo **Tất cả**, **Chờ làm**, **Đang làm**, hoặc **Đã xong**.
