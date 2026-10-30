import { NavLink, Link } from 'react-router-dom'
import LanguageModal from './LanguageModal.jsx'

const NAV = [
  { to: '/', label: 'Kanji', icon: '漢', end: true },
  { to: '/alphabet', label: 'Bảng chữ', icon: 'あ' },
  { to: '/tango', label: 'Từ vựng', icon: '語' },
  { to: '/bunpo', label: 'Ngữ pháp', icon: '文' },
  { to: '/jlpt', label: 'JLPT', icon: '試' },
  { to: '/flashcard', label: 'Ôn tập', icon: '🗂' },
  { to: '/my-kanji', label: 'Cá nhân', icon: '★' },
  { to: '/settings', label: 'Cài đặt', icon: '⚙' },
]

function SideItem({ item, mobile }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition ${
          mobile ? 'min-w-[64px] px-1' : 'w-full'
        } ${isActive ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`
      }
    >
      <span className="font-jp text-xl leading-none">{item.icon}</span>
      {item.label}
    </NavLink>
  )
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="rounded-lg bg-brand-600 px-2 py-1 font-jp text-lg font-bold text-white">漢</span>
          <span className="text-lg font-bold tracking-tight">Kanji Học</span>
        </Link>
        <Link to="/settings" className="btn-ghost py-1.5 text-sm">Đăng nhập</Link>
      </header>

      <aside className="fixed bottom-0 left-0 top-14 z-20 hidden w-[88px] flex-col gap-1 overflow-y-auto border-r border-slate-200 bg-white p-2 md:flex">
        {NAV.map((i) => <SideItem key={i.to} item={i} />)}
      </aside>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white p-1 md:hidden">
        {NAV.map((i) => <SideItem key={i.to} item={i} mobile />)}
      </nav>

      <main className="px-4 pb-24 pt-6 md:ml-[88px] md:px-8 md:pb-10">{children}</main>
      <LanguageModal />
    </div>
  )
}
