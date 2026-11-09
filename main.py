from typing import Literal
from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(
    title="Ứng dụng Todo FastAPI",
    description="Backend Todo với in-memory dict, Pydantic, hỗ trợ trạng thái Đang làm & Hoàn thành",
    version="1.1.0"
)

# Kiểu dữ liệu cho trạng thái công việc
TaskStatus = Literal["todo", "in_progress", "completed"]

# -------------------------------------------------------------
# Pydantic Models
# -------------------------------------------------------------
class TodoCreate(BaseModel):
    title: str = Field(..., min_length=1, description="Tiêu đề công việc")
    description: str | None = Field(default=None, description="Mô tả chi tiết")
    status: TaskStatus = Field(default="todo", description="Trạng thái: todo, in_progress, completed")

class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, description="Tiêu đề mới")
    description: str | None = Field(default=None, description="Mô tả mới")
    completed: bool | None = Field(default=None, description="Trạng thái hoàn thành (True/False)")
    status: TaskStatus | None = Field(default=None, description="Trạng thái: todo (Chờ làm), in_progress (Đang làm), completed (Hoàn thành)")

class TodoResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    completed: bool
    status: TaskStatus

# -------------------------------------------------------------
# In-memory storage bằng Python dict
# -------------------------------------------------------------
todos_db: dict[int, dict] = {}
next_id: int = 1

# -------------------------------------------------------------
# API Endpoints
# -------------------------------------------------------------
@app.get("/api/todos", response_model=list[TodoResponse], tags=["Todos"])
def get_todos(status_filter: TaskStatus | None = None):
    """
    Lấy danh sách tất cả các công việc.
    Hỗ trợ lọc theo trạng thái qua query param ?status_filter=todo|in_progress|completed
    """
    items = list(todos_db.values())
    if status_filter:
        items = [item for item in items if item["status"] == status_filter]
    return items

@app.post("/api/todos", response_model=TodoResponse, status_code=status.HTTP_201_CREATED, tags=["Todos"])
def create_todo(todo_in: TodoCreate):
    """Tạo mới một công việc (Trả về HTTP 201). Mặc định ở trạng thái 'todo' hoặc theo yêu cầu."""
    global next_id
    is_completed = (todo_in.status == "completed")
    new_todo = {
        "id": next_id,
        "title": todo_in.title.strip(),
        "description": todo_in.description,
        "status": todo_in.status,
        "completed": is_completed
    }
    todos_db[next_id] = new_todo
    next_id += 1
    return new_todo

@app.patch("/api/todos/{id}", response_model=TodoResponse, tags=["Todos"])
def update_todo(id: int, todo_in: TodoUpdate):
    """
    Cập nhật một phần công việc (Trả về 404 nếu không tìm thấy id).
    Cho phép cập nhật status ('todo', 'in_progress', 'completed') hoặc completed (True/False).
    """
    if id not in todos_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy công việc với id={id}"
        )
    
    todo = todos_db[id]
    update_data = todo_in.model_dump(exclude_unset=True)
    
    if "title" in update_data and update_data["title"] is not None:
        update_data["title"] = update_data["title"].strip()
    
    # Đồng bộ 2 chiều giữa 'status' và 'completed'
    if "status" in update_data and update_data["status"] is not None:
        update_data["completed"] = (update_data["status"] == "completed")
    elif "completed" in update_data and update_data["completed"] is not None:
        update_data["status"] = "completed" if update_data["completed"] else "todo"

    todo.update(update_data)
    return todo

@app.delete("/api/todos/{id}", tags=["Todos"])
def delete_todo(id: int):
    """Xóa công việc theo id (Trả về 404 nếu không tìm thấy id)."""
    if id not in todos_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Không tìm thấy công việc với id={id}"
        )
    
    deleted_item = todos_db.pop(id)
    return {"message": "Đã xóa công việc thành công", "deleted": deleted_item}

# -------------------------------------------------------------
# Phục vụ Frontend tĩnh tại "/" bằng StaticFiles
# -------------------------------------------------------------
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
