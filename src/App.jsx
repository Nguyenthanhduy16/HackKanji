import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import KanjiDetail from './pages/KanjiDetail.jsx'
import Alphabet from './pages/Alphabet.jsx'
import Flashcard from './pages/Flashcard.jsx'
import Practice from './pages/Practice.jsx'
import MyKanji from './pages/MyKanji.jsx'
import Section from './pages/Section.jsx'
import Settings from './pages/Settings.jsx'

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
        <Route path="/bunpo" element={<Section key="bunpo" title="Ngữ pháp" subtitle="Mẫu ngữ pháp N5→N1 với giải thích và ví dụ." unit="mẫu" />} />
        <Route path="/jlpt" element={<Section key="jlpt" title="Đề JLPT" subtitle="Luyện đề theo cấu trúc kỳ thi Năng lực Nhật ngữ." unit="đề" />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<div className="card mx-auto max-w-xl p-10 text-center">Không tìm thấy trang.</div>} />
      </Routes>
    </Layout>
  )
}
