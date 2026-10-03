import { useState } from 'react'
import { StatusPage } from './StatusPage'
import { TodoPage } from './TodoPage'
import './App.css'

type AppView = 'todos' | 'status'

function App() {
  const [view, setView] = useState<AppView>('status')

  return (
    <div className="todo-app">
      <nav className="app-nav" aria-label="Main">
        <button
          type="button"
          className={view === 'todos' ? 'active' : ''}
          onClick={() => setView('todos')}
        >
          Todos
        </button>
        <button
          type="button"
          className={view === 'status' ? 'active' : ''}
          onClick={() => setView('status')}
        >
          System Status
        </button>
      </nav>

      {view === 'todos' ? <TodoPage /> : <StatusPage />}
    </div>
  )
}

export default App
