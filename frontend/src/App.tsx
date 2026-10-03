import { useCallback, useEffect, useState } from 'react'
import { todoApi } from './api/todos'
import type { CreateTodoInput, Todo, TodoStatus, UpdateTodoInput } from './types/todo'
import './App.css'

const STATUS_LABELS: Record<TodoStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
}

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadTodos = useCallback(async () => {
    setError(null)
    try {
      const data = await todoApi.list()
      setTodos(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTodos()
  }, [loadTodos])

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!newTitle.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const input: CreateTodoInput = {
        title: newTitle.trim(),
        description: newDescription.trim(),
      }
      const created = await todoApi.create(input)
      setTodos((current) => [created, ...current])
      setNewTitle('')
      setNewDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: TodoStatus) => {
    setError(null)
    try {
      const updated = await todoApi.update(id, { status })
      setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    }
  }

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id)
    setEditTitle(todo.title)
    setEditDescription(todo.description)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditTitle('')
    setEditDescription('')
  }

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const input: UpdateTodoInput = {
        title: editTitle.trim(),
        description: editDescription.trim(),
      }
      const updated = await todoApi.update(id, input)
      setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
      cancelEditing()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await todoApi.remove(id)
      setTodos((current) => current.filter((todo) => todo.id !== id))
      if (editingId === id) {
        cancelEditing()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
    }
  }

  return (
    <div className="todo-app">
      <header className="todo-header">
        <h1>Todo App</h1>
        <p>Manage your tasks with full CRUD operations</p>
      </header>

      {error && (
        <div className="todo-error" role="alert">
          {error}
        </div>
      )}

      <section className="todo-create">
        <h2>Create Todo</h2>
        <form onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Title"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            maxLength={200}
            required
          />
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(event) => setNewDescription(event.target.value)}
            maxLength={2000}
            rows={3}
          />
          <button type="submit" disabled={submitting || !newTitle.trim()}>
            {submitting ? 'Adding...' : 'Add Todo'}
          </button>
        </form>
      </section>

      <section className="todo-list-section">
        <h2>Your Todos</h2>
        {loading ? (
          <p className="todo-muted">Loading todos...</p>
        ) : todos.length === 0 ? (
          <p className="todo-muted">No todos yet. Create one above.</p>
        ) : (
          <ul className="todo-list">
            {todos.map((todo) => (
              <li key={todo.id} className={`todo-item status-${todo.status}`}>
                {editingId === todo.id ? (
                  <div className="todo-edit">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      maxLength={200}
                    />
                    <textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      maxLength={2000}
                      rows={3}
                    />
                    <div className="todo-actions">
                      <button
                        type="button"
                        onClick={() => handleUpdate(todo.id)}
                        disabled={submitting || !editTitle.trim()}
                      >
                        Save
                      </button>
                      <button type="button" className="secondary" onClick={cancelEditing}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="todo-content">
                      <h3>{todo.title}</h3>
                      {todo.description && <p>{todo.description}</p>}
                      <span className="todo-meta">
                        Updated {new Date(todo.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="todo-controls">
                      <select
                        value={todo.status}
                        onChange={(event) =>
                          void handleStatusChange(todo.id, event.target.value as TodoStatus)
                        }
                        aria-label={`Status for ${todo.title}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="todo-actions">
                        <button type="button" onClick={() => startEditing(todo)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => void handleDelete(todo.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
