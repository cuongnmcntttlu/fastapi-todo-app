// Quản lý trạng thái Todo phía client
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoInitialStatus = document.getElementById('todoInitialStatus');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const todoStats = document.getElementById('todoStats');
const formMessage = document.getElementById('formMessage');
const filterBtns = document.querySelectorAll('.filter-btn');

// Hiển thị thông báo trạng thái
function showMessage(text, isError = false) {
    formMessage.textContent = text;
    formMessage.className = `message ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        formMessage.textContent = '';
        formMessage.className = 'message';
    }, 3000);
}

// -------------------------------------------------------------
// API Calls sử dụng fetch()
// -------------------------------------------------------------

// 1. GET /api/todos
async function loadTodos() {
    try {
        const response = await fetch('/api/todos');
        if (!response.ok) {
            throw new Error(`Lỗi tải danh sách: ${response.status}`);
        }
        todos = await response.json();
        render();
    } catch (err) {
        console.error(err);
        showMessage('Không thể tải danh sách công việc từ server!', true);
    }
}

// 2. POST /api/todos (Kỳ vọng HTTP 201)
async function addTodo(title, initialStatus = 'todo') {
    try {
        const response = await fetch('/api/todos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                title: title,
                status: initialStatus
            })
        });

        if (response.status === 201) {
            const newTodo = await response.json();
            todos.push(newTodo);
            todoInput.value = '';
            showMessage('Đã thêm công việc mới thành công!');
            render();
        } else {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || `Lỗi tạo mới: ${response.status}`);
        }
    } catch (err) {
        console.error(err);
        showMessage(err.message, true);
    }
}

// 3. PATCH /api/todos/{id} - Cập nhật trạng thái
async function updateTodoStatus(id, newStatus) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.status === 404) {
            showMessage(`Công việc id=${id} không tồn tại trên hệ thống!`, true);
            todos = todos.filter(t => t.id !== id);
            render();
            return;
        }

        if (!response.ok) {
            throw new Error(`Lỗi cập nhật: ${response.status}`);
        }

        const updatedTodo = await response.json();
        const index = todos.findIndex(t => t.id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
            render();
        }
    } catch (err) {
        console.error(err);
        showMessage('Không thể cập nhật trạng thái công việc!', true);
    }
}

// 4. DELETE /api/todos/{id}
async function deleteTodo(id) {
    try {
        const response = await fetch(`/api/todos/${id}`, {
            method: 'DELETE'
        });

        if (response.status === 404) {
            showMessage(`Công việc id=${id} không tồn tại (404)!`, true);
        } else if (!response.ok) {
            throw new Error(`Lỗi xóa: ${response.status}`);
        } else {
            showMessage('Đã xóa công việc!');
        }

        todos = todos.filter(t => t.id !== id);
        render();
    } catch (err) {
        console.error(err);
        showMessage('Không thể xóa công việc!', true);
    }
}

// -------------------------------------------------------------
// Render UI & Trạng thái
// -------------------------------------------------------------

function render() {
    // Lọc danh sách theo filter hiện tại
    let filtered = todos;
    if (currentFilter === 'todo') {
        filtered = todos.filter(t => t.status === 'todo');
    } else if (currentFilter === 'in_progress') {
        filtered = todos.filter(t => t.status === 'in_progress');
    } else if (currentFilter === 'completed') {
        filtered = todos.filter(t => t.status === 'completed');
    }

    // Render danh sách Todo
    todoList.innerHTML = '';
    if (filtered.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        filtered.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.status === 'in_progress' ? 'in-progress' : ''} ${todo.status === 'completed' ? 'completed' : ''}`;
            
            // Xây dựng badge trạng thái
            let statusBadgeHtml = '';
            if (todo.status === 'in_progress') {
                statusBadgeHtml = '<span class="status-pill status-in-progress">⚡ Đang làm</span>';
            } else if (todo.status === 'completed') {
                statusBadgeHtml = '<span class="status-pill status-completed">✓ Hoàn thành</span>';
            } else {
                statusBadgeHtml = '<span class="status-pill status-todo">📋 Chờ làm</span>';
            }

            // Xây dựng các nút hành động theo trạng thái
            let actionButtonsHtml = '';
            if (todo.status === 'todo') {
                actionButtonsHtml = `
                    <button class="btn-action btn-start" title="Chuyển sang Đang làm">⚡ Bắt đầu</button>
                    <button class="btn-action btn-finish" title="Đánh dấu Hoàn thành">✓ Xong</button>
                `;
            } else if (todo.status === 'in_progress') {
                actionButtonsHtml = `
                    <button class="btn-action btn-finish" title="Đánh dấu Hoàn thành">✓ Hoàn thành</button>
                    <button class="btn-action btn-restart" title="Chuyển về Chờ làm">⏸ Tạm dừng</button>
                `;
            } else if (todo.status === 'completed') {
                actionButtonsHtml = `
                    <button class="btn-action btn-restart" title="Chuyển lại về Đang làm">↺ Làm lại</button>
                `;
            }

            li.innerHTML = `
                <input 
                    type="checkbox" 
                    class="todo-checkbox" 
                    ${todo.completed ? 'checked' : ''} 
                    title="${todo.completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}"
                />
                <span class="todo-title">${escapeHtml(todo.title)}</span>
                ${statusBadgeHtml}
                <div class="item-actions">
                    ${actionButtonsHtml}
                    <button class="delete-btn" title="Xóa công việc" aria-label="Xóa">✕</button>
                </div>
            `;

            // Event Checkbox: Toggle nhanh Hoàn thành
            const checkbox = li.querySelector('.todo-checkbox');
            checkbox.addEventListener('change', () => {
                const newStatus = checkbox.checked ? 'completed' : 'in_progress';
                updateTodoStatus(todo.id, newStatus);
            });

            // Event nút bắt đầu làm
            const startBtn = li.querySelector('.btn-start');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    updateTodoStatus(todo.id, 'in_progress');
                });
            }

            // Event nút hoàn thành
            const finishBtn = li.querySelector('.btn-finish');
            if (finishBtn) {
                finishBtn.addEventListener('click', () => {
                    updateTodoStatus(todo.id, 'completed');
                });
            }

            // Event nút tạm dừng / làm lại
            const restartBtn = li.querySelector('.btn-restart');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                    const targetStatus = todo.status === 'completed' ? 'in_progress' : 'todo';
                    updateTodoStatus(todo.id, targetStatus);
                });
            }

            // Event delete
            const delBtn = li.querySelector('.delete-btn');
            delBtn.addEventListener('click', () => {
                deleteTodo(todo.id);
            });

            todoList.appendChild(li);
        });
    }

    // Cập nhật thống kê
    const total = todos.length;
    const todoCount = todos.filter(t => t.status === 'todo').length;
    const inProgressCount = todos.filter(t => t.status === 'in_progress').length;
    const completedCount = todos.filter(t => t.status === 'completed').length;
    todoStats.textContent = `Tổng: ${total} | Chờ làm: ${todoCount} | ⚡ Đang làm: ${inProgressCount} | ✓ Đã xong: ${completedCount}`;
}

// Tránh XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Sự kiện submit form
todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = todoInput.value.trim();
    const initialStatus = todoInitialStatus.value;
    if (title) {
        addTodo(title, initialStatus);
    }
});

// Sự kiện đổi bộ lọc
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });
});

// Tải dữ liệu ban đầu
document.addEventListener('DOMContentLoaded', loadTodos);
