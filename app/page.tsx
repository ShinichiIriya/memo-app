'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [memos, setMemos] = useState<any[]>([])

  async function loadMemos() {
    const { data } = await supabase
      .from('memos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setMemos(data)
  }

  useEffect(() => {
    loadMemos()
  }, [])

  async function saveMemo() {
    if (!keyword) return
    setLoading(true)
    setMessage('Claudeが深掘り中...')

    const res = await fetch('/api/deepen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword }),
    })
    const result = await res.json()

    await supabase.from('memos').insert({
      keyword: keyword,
      summary: result.summary,
      tags: result.tags.join(','),
      examples: result.examples.join('||'),
      links: result.links.join('||'),
    })

    setMessage('保存しました！')
    setKeyword('')
    setLoading(false)
    loadMemos()
  }

  async function deleteMemo(id: number) {
    await supabase.from('memos').delete().eq('id', id)
    loadMemos()
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">メモ拡張</h1>
      <p className="text-gray-500 mb-8">気になるキーワードを入れると、Claudeが深掘りしてくれます。</p>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <input
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 mb-3 outline-none"
          placeholder="キーワードを入力…"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button
          className="w-full text-sm bg-gray-800 text-white rounded-lg py-2 disabled:opacity-50"
          onClick={saveMemo}
          disabled={loading}
        >
          {loading ? 'Claudeが考え中...' : '深掘りして保存'}
        </button>
      </div>

      {message && <p className="text-sm text-green-600 mb-4">{message}</p>}

      <div className="flex flex-col gap-4">
        {memos.map((memo) => (
          <div key={memo.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-medium text-gray-800">{memo.keyword}</p>
              <button
                onClick={() => {
                  if (confirm(`「${memo.keyword}」を削除しますか？`)) {
                    deleteMemo(memo.id)
                  }
                }}
                className="text-xs text-gray-400 hover:text-red-500 ml-4"
              >
                削除
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-3">{memo.summary}</p>

            {memo.examples && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400 mb-1">具体的な事例</p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {memo.examples.split('||').map((ex: string) => (
                    <li key={ex}>{ex}</li>
                  ))}
                </ul>
              </div>
            )}

            {memo.links && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-400 mb-1">参考リンク</p>
                <ul className="text-sm text-blue-500 list-disc list-inside">
                  {memo.links.split('||').map((link: string) => (
                    <li key={link}>{link}</li>
                  ))}
                </ul>
              </div>
            )}

            {memo.tags && (
              <div className="flex gap-2 flex-wrap mt-2">
                {memo.tags.split(',').map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 mt-3">{new Date(memo.created_at).toLocaleDateString('ja-JP')}</p>
          </div>
        ))}
      </div>
    </main>
  )
}