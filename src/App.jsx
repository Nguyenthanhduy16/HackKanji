import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import KanjiDetail from './pages/KanjiDetail.jsx'
import Alphabet from './pages/Alphabet.jsx'
import Flashcard from './pages/Flashcard.jsx'
import Practice from './pages/Practice.jsx'
import MyKanji from './pages/MyKanji.jsx'
import Section from './pages/Section.jsx'
import Settings from './pages/Settings.jsx'
import Particles from './pages/Particles.jsx'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/kanji/:char" element={<KanjiDetail />} />
        <Route path="/alphabet" element={<Alphabet />} />
        <Route path="/flashcard" element={<Flashcard />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/my-kanji" element={<MyKanji />} />
        <Route path="/tango" element={<Section key="tango" title="Từ vựng" subtitle="Học từ vựng theo cấp độ, kèm Kanji, âm Hán Việt và câu ví dụ." unit="từ" />} />
        <Route
          path="/bunpo"
          element={
            <Section key="bunpo" title="Ngữ pháp" subtitle="Mẫu ngữ pháp N5→N1 với giải thích và ví dụ." unit="mẫu">
              <Link to="/bunpo/particles" className="card flex items-center gap-4 p-5 hover:border-brand-500">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 font-jp text-lg font-bold text-white">助</span>
                <div>
                  <p className="font-semibold">Trợ từ</p>
                  <p className="text-sm text-slate-500">15 nhóm trợ từ · ví dụ có furigana · bài luyện điền trợ từ</p>
                </div>
                <span className="ml-auto text-brand-600">→</span>
              </Link>
            </Section>
          }
        />
        <Route path="/bunpo/particles" element={<Particles />} />
        <Route path="/jlpt" element={<Section key="jlpt" title="Đề JLPT" subtitle="Luyện đề theo cấu trúc kỳ thi Năng lực Nhật ngữ." unit="đề" />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div className="card mx-auto max-w-xl p-10 text-center">Không tìm thấy trang.</div>} />
      </Routes>
    </Layout>
  )
}
