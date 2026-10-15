
const todoForm = document.getElementById('todoForm');
const todoInput = document.getElementById('todoInput');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const progressText = document.getElementById('progressText');
const progressBar = document.getElementById('progressBar');
const clearCompleted = document.getElementById('clearCompleted');
const filterButtons = document.querySelectorAll('.filter');

let todos = JSON.parse(localStorage.getItem('taskflow-todos') || '[]');
let currentFilter = 'all';

function saveTodos() {
    localStorage.setItem('taskflow-todos', JSON.stringify(todos));
}

function renderTodos() {
    todoList.replaceChildren();

    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });

    filteredTodos.forEach(todo => {
        const item = document.createElement('li');
        item.className = `todo-item${todo.completed ? ' completed' : ''}`;

        const checkButton = document.createElement('button');
        checkButton.className = 'check-btn';
        checkButton.type = 'button';
        checkButton.setAttribute('aria-label', 'Toggle task completion');
        checkButton.addEventListener('click', () => toggleTodo(todo.id));

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = todo.text;

        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        deleteButton.type = 'button';
        deleteButton.textContent = '×';
        deleteButton.setAttribute('aria-label', 'Delete task');
        deleteButton.addEventListener('click', () => deleteTodo(todo.id));

        item.append(checkButton, text, deleteButton);
        todoList.appendChild(item);
    });

    const remaining = todos.filter(todo => !todo.completed).length;
    const completed = todos.filter(todo => todo.completed).length;
    const percentage = todos.length
        ? Math.round((completed / todos.length) * 100)
        : 0;

    taskCount.textContent =
        `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
    progressText.textContent = `${percentage}% completed`;
    progressBar.style.width = `${percentage}%`;

    emptyState.hidden = filteredTodos.length > 0;

    emptyState.querySelector('h3').textContent =
        todos.length === 0 ? 'A fresh start' :
        currentFilter === 'active' ? 'All caught up!' :
        currentFilter === 'completed' ? 'Nothing completed yet' :
        'No tasks found';

    emptyState.querySelector('p').textContent =
        todos.length === 0
            ? 'Add a task above and make it happen.'
            : 'Try another filter or add a new task.';

    filterButtons.forEach(button => {
        button.classList.toggle(
            'active',
            button.dataset.filter === currentFilter
        );
    });

    clearCompleted.disabled = completed === 0;
    clearCompleted.style.opacity = completed === 0 ? '0.45' : '1';

    saveTodos();
}

function addTodo(text) {
    todos.unshift({
        id: Date.now().toString() + Math.random().toString(16).slice(2),
        text: text,
        completed: false
    });

    renderTodos();
}

function toggleTodo(id) {
    todos = todos.map(todo =>
        todo.id === id
            ? { ...todo, completed: !todo.completed }
            : todo
    );

    renderTodos();
}

function deleteTodo(id) {
    todos = todos.filter(todo => todo.id !== id);
    renderTodos();
}

todoForm.addEventListener('submit', event => {
    event.preventDefault();

    const text = todoInput.value.trim();

    if (!text) {
        todoInput.focus();
        return;
    }

    addTodo(text);
    todoInput.value = '';
    todoInput.focus();
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        renderTodos();
    });
});

clearCompleted.addEventListener('click', () => {
    todos = todos.filter(todo => !todo.completed);
    renderTodos();
});

renderTodos();
