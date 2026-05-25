import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { Client } from '@notionhq/client'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
})

const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID!

function detectCategory(tags: string[]): string {
  const tagStr = tags.join(',').toLowerCase()
  if (tagStr.match(/デザイン|建築|家具|インテリア|アート|グラフィック/)) return 'デザイン'
  if (tagStr.match(/ux|ui|インタラクション|ユーザー|アプリ/)) return 'UX・UI'
  if (tagStr.match(/自然|植物|ガーデン|環境|エコ/)) return '自然・環境'
  if (tagStr.match(/技術|ai|プログラム|デジタル|テック/)) return 'テクノロジー'
  if (tagStr.match(/教育|学習|授業|研究|大学/)) return '教育・研究'
  if (tagStr.match(/ビジネス|経営|マーケ|ブランド/)) return 'ビジネス'
  return 'その他'
}

export async function POST(request: NextRequest) {
  const { keyword, hint1, hint2, mode, existing } = await request.json()

  // 補助情報を組み立てる
  const hints = [hint1, hint2].filter(Boolean)
  const hintText = hints.length > 0
    ? `\n補助情報（精度向上のための文脈）：${hints.join('、')}\n上記の補助情報を参考にしてキーワードを正しく解釈し、深掘りしてください。`
    : ''

  const prompt = mode === 'more'
    ? `以下のキーワードについて、すでにある情報とは異なる新しい観点で深掘りしてください。

キーワード：「${keyword}」
すでにある情報：${existing}

重要：上記の「すでにある情報」と重複しない、全く新しい内容を生成してください。
以下の観点から1つ以上選んで深掘りしてください：
- 歴史的背景・時代的文脈
- 関連する人物・組織
- 批判的な見方・課題
- 最新の動向・トレンド
- 日本での事例・受容

必ずJSON形式のみで返してください。

{"summary":"新しい観点での深掘り内容を3〜5文で","examples":["新しい事例1","新しい事例2","新しい事例3"],"links":["参考1","参考2"],"tags":["タグ1","タグ2","タグ3"]}`
    : `以下のキーワードについて日本語で答えてください。

キーワード：「${keyword}」${hintText}

必ずJSON形式のみで返してください。説明文や\`\`\`は不要です。

{"summary":"概要を2〜3文で","examples":["事例1","事例2","事例3"],"links":["参考1","参考2"],"tags":["タグ1","タグ2","タグ3"]}`

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}'

  let result
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    result = JSON.parse(jsonMatch ? jsonMatch[0] : '{}')
  } catch {
    result = { summary: text, examples: [], links: [], tags: [] }
  }

  // Notionにはキーワードのみ保存（補助情報は含めない）
  if (mode !== 'more') {
    const category = detectCategory(result.tags || [])
    await notion.pages.create({
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        名前: {
          title: [{ text: { content: keyword } }],
        },
        概要: {
          rich_text: [{ text: { content: result.summary || '' } }],
        },
        カテゴリ: {
          select: { name: category },
        },
        タグ: {
          multi_select: (result.tags || []).map((tag: string) => ({ name: tag })),
        },
        事例: {
          rich_text: [{ text: { content: (result.examples || []).join('\n') } }],
        },
        参考リンク: {
          rich_text: [{ text: { content: (result.links || []).join('\n') } }],
        },
      },
    })
  }

  return NextResponse.json(result)
}
