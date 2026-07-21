import { NavLink, Route, Routes } from 'react-router'

function Placeholder({ title }: { title: string }) {
  return <h2 className="text-lg font-medium text-slate-700">{title}</h2>
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <h1 className="text-base font-semibold">API Key Manager</h1>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                isActive ? 'font-medium text-slate-900' : 'text-slate-500 hover:text-slate-900'
              }
            >
              Applications
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Routes>
          <Route path="/" element={<Placeholder title="API Key Manager" />} />
          <Route path="/applications" element={<Placeholder title="Applications" />} />
        </Routes>
      </main>
    </div>
  )
}
