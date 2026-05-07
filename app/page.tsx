export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">メモ拡張</h1>
      <p className="text-gray-500 mb-8">気になるキーワードを入れると、Claudeが深掘りしてくれます。</p>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <input
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none"
          placeholder="キーワードを入力…"
        />
        <button className="w-full text-sm bg-gray-800 text-white rounded-lg py-2">
          深掘りして保存
        </button>
      </div>

      <p className="text-xs text-gray-400">保存したメモがここに表示されます</p>
    </main>
  )
}