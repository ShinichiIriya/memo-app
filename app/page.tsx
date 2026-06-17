'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function Home() {
  const [keyword, setKeyword] = useState('')
  const [hint1, setHint1] = useState('')
  const [hint2, setHint2] = useState('')
  const [loading, setLoading] = useState(false)
  const [deepeningId, setDeepeningId] = useState<number | null>(null)
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

    const res = await fetch('/api/deepen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, hint1, hint2, mode: 'normal' }),
    })
    const result = await res.json()

    await supabase.from('memos').insert({
      keyword: keyword,
      summary: result.summary,
      tags: result.tags.join(','),
      examples: result.examples.join('||'),
      links: result.links.join('||'),
    })

    setKeyword('')
    setHint1('')
    setHint2('')
    setLoading(false)
    loadMemos()
  }

  async function deepenMore(memo: any) {
    setDeepeningId(memo.id)

    const res = await fetch('/api/deepen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: memo.keyword,
        mode: 'more',
        existing: memo.summary,
      }),
    })
    const result = await res.json()

    const newSummary = memo.summary + '\n\n— もっと深く\n' + result.summary
    const newExamples = memo.examples
      ? memo.examples + '||' + result.examples.join('||')
      : result.examples.join('||')
    const newLinks = memo.links
      ? memo.links + '||' + result.links.join('||')
      : result.links.join('||')
    const newTags = memo.tags
      ? memo.tags + ',' + result.tags.join(',')
      : result.tags.join(',')

    await supabase.from('memos').update({
      summary: newSummary,
      examples: newExamples,
      links: newLinks,
      tags: newTags,
    }).eq('id', memo.id)

    setDeepeningId(null)
    await loadMemos()
  }

  async function deleteMemo(id: number) {
    await supabase.from('memos').delete().eq('id', id)
    loadMemos()
  }

  return (
    <main style={{ minHeight: '100vh', background: '#fafafa', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>

        <h1 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '0.01em', color: '#111', marginBottom: '48px' }}>
          altmemo
        </h1>
        

        <div style={{ marginBottom: '64px' }}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="気になるキーワード"
            style={{
              width: '100%',
              border: 'none',
              borderBottom: '1px solid #e5e5e5',
              padding: '8px 0',
              fontSize: '17px',
              color: '#111',
              outline: 'none',
              background: 'transparent',
              marginBottom: '12px',
            }}
          />
          <input
            value={hint1}
            onChange={(e) => setHint1(e.target.value)}
            placeholder="補助情報1（例：音楽ジャンル）"
            style={{
              width: '100%',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              padding: '6px 0',
              fontSize: '13px',
              color: '#999',
              outline: 'none',
              background: 'transparent',
              marginBottom: '8px',
            }}
          />
          <input
            value={hint2}
            onChange={(e) => setHint2(e.target.value)}
            placeholder="補助情報2（例：1970年代 ブライアン・イーノ）"
            style={{
              width: '100%',
              border: 'none',
              borderBottom: '1px solid #f0f0f0',
              padding: '6px 0',
              fontSize: '13px',
              color: '#999',
              outline: 'none',
              background: 'transparent',
              marginBottom: '16px',
            }}
          />
          <button
            onClick={saveMemo}
            disabled={loading || !keyword}
            style={{
              fontSize: '13px',
              color: loading || !keyword ? '#ccc' : '#111',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: loading || !keyword ? 'default' : 'pointer',
            }}
          >
            {loading ? '考えています…' : '深める →'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {memos.map((memo) => (
            <div
              key={memo.id}
              style={{
                background: '#fff',
                border: '1px solid #eee',
                borderRadius: '16px',
                padding: '28px 28px 20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '17px', fontWeight: 500, color: '#111', margin: 0 }}>
                  {memo.keyword}
                </h2>
                <button
                  onClick={() => {
                    if (confirm(`「${memo.keyword}」を削除しますか？`)) deleteMemo(memo.id)
                  }}
                  style={{ fontSize: '12px', color: '#ccc', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  削除
                </button>
              </div>

              <p style={{ fontSize: '14px', lineHeight: 1.8, color: '#444', whiteSpace: 'pre-line', marginBottom: '20px' }}>
                {memo.summary}
              </p>

              {memo.examples && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#bbb', marginBottom: '6px', letterSpacing: '0.05em' }}>事例</p>
                  <ul style={{ fontSize: '13px', color: '#555', paddingLeft: '16px', margin: 0, lineHeight: 1.8 }}>
                    {memo.examples.split('||').map((ex: string, i: number) => (
                      <li key={i}>{ex}</li>
                    ))}
                  </ul>
                </div>
              )}

              {memo.links && (
                <div style={{ marginBottom: '16px' }}>
                  <p style={{ fontSize: '11px', color: '#bbb', marginBottom: '6px', letterSpacing: '0.05em' }}>参考</p>
                  <ul style={{ fontSize: '13px', paddingLeft: '16px', margin: 0, lineHeight: 1.8 }}>
                    {memo.links.split('||').map((link: string, i: number) => (
                      <li key={i}><a
                        
                          href={"https://www.google.com/search?q=" + encodeURIComponent(link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#888', textDecoration: 'underline' }}
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {memo.tags && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
                  {memo.tags.split(',').map((tag: string, i: number) => (
                    <span
                      key={i}
                      style={{ fontSize: '11px', color: '#999', background: '#f5f5f5', padding: '4px 10px', borderRadius: '20px' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f3f3f3' }}>
                <p style={{ fontSize: '11px', color: '#ccc', margin: 0 }}>
                  {new Date(memo.created_at).toLocaleDateString('ja-JP')}
                </p>
                <button
                  onClick={() => deepenMore(memo)}
                  disabled={deepeningId === memo.id}
                  style={{ fontSize: '12px', color: deepeningId === memo.id ? '#ccc' : '#111', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {deepeningId === memo.id ? '深めています…' : 'もっと深める →'}
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </main>
  )
}