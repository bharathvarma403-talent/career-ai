import { useEffect, useState, useRef } from 'react'
import {
  Send,
  Plus,
  AlertCircle,
  Loader2,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Bot,
  X
} from 'lucide-react'
import { apiRequest } from '../lib/api'

interface ChatMessage {
  id?: number | string
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface ConversationItem {
  id: number
  title: string
  created_at: string
}

const GUIDED_STARTERS = [
  'How can I improve my resume bullets?',
  'What skills should I learn for an AI Engineer track?',
  'Help me rewrite a bullet point with metrics.',
  'What system design questions come up in interviews?'
]

function getSmartCareerAdvice(prompt: string): string {
  const q = prompt.toLowerCase()
  if (q.includes('bullet') || q.includes('rewrite') || q.includes('metric') || q.includes('xyz')) {
    return `### High-Impact Bullet Point Framework (Google XYZ)

To turn standard duties into compelling achievements, use the **XYZ Formula**:
> **Accomplished [X], as measured by [Y], by doing [Z].**

**Before & After Examples:**
* **Before:** "Worked on backend APIs and optimized database queries."
* **After:** "Architected 6 asynchronous FastAPI endpoints and indexed PostgreSQL schemas, reducing p95 database query latency by 42% across 200k daily requests."

* **Before:** "Responsible for front-end redesign."
* **After:** "Spearheaded frontend migration to React 18 and Tailwind CSS, increasing page performance score from 61 to 94 on Google Lighthouse."

**Core Checklist:**
1. Start each bullet with a strong past-tense action verb (*Architected, Spearheaded, Refactored*).
2. Incorporate at least one quantified scale metric (*latency, revenue, test coverage, team size*).
3. Explicitly state the modern tools and frameworks used.`
  }

  if (q.includes('ai') || q.includes('machine learning') || q.includes('ml') || q.includes('vector') || q.includes('rag')) {
    return `### 2026 AI / Machine Learning Engineer Roadmap

Here is the essential skill stack for modern AI Engineering:

1. **Foundations & Core Frameworks:**
   * Python (async, type hints, Pydantic v2)
   * PyTorch & HuggingFace Transformers
   * FastAPI & Docker containerization

2. **Retrieval-Augmented Generation (RAG):**
   * Vector Databases (Qdrant, Pinecone, pgvector)
   * Advanced chunking, hybrid search (BM25 + Dense embeddings), reranking (Cohere Rerank)
   * Evaluation frameworks (Ragas, TruLens) to measure hallucination and context relevance

3. **Production Optimization:**
   * Efficient inference engines (vLLM, TensorRT-LLM)
   * Structured outputs via JSON schema enforcement (Instructor, Outlines)
   * Caching layers (Redis Semantic Cache) to reduce token expenditure

**Recommended Next Step:**
Build an end-to-end RAG system with citation tracking and publish your architecture diagram and benchmark results on GitHub.`
  }

  if (q.includes('system design') || q.includes('interview') || q.includes('architect')) {
    return `### 4-Step Technical System Design Framework

When tackling system design interviews, structure your response methodically:

1. **Scope the Problem (5 mins):**
   * Functional requirements: What are the 2-3 core user actions?
   * Non-functional requirements: Scale (DAU, QPS, Read vs Write ratio), Latency SLA (p99 < 100ms), Availability (99.99%).

2. **High-Level Design (10-15 mins):**
   * API Gateway / Reverse Proxy (Nginx, Envoy)
   * Stateless Application Tier (FastAPI/Node instances behind Load Balancer)
   * Primary Database Choice (PostgreSQL for ACID relational data, DynamoDB/Cassandra for write-heavy key-value)

3. **Component Deep Dive (15 mins):**
   * Caching Strategy: Redis Look-Aside cache with TTL & Cache Invalidation policy
   * Asynchronous Processing: Message queues (Kafka, RabbitMQ, SQS) for decoupling heavy tasks
   * Database Sharding: Partitioning by user_id or hash ring

4. **Bottlenecks & Trade-offs (5 mins):**
   * Single Points of Failure (SPOF)
   * Rate limiting (Token Bucket algorithm) and circuit breakers.`
  }

  return `### Strategic Career Assessment

Regarding: **"${prompt}"**

Here are the key recommendations based on current tech hiring trends:

1. **Market Positioning:**
   * Focus on depth over breadth. Hiring managers favor candidates who demonstrate complete ownership of full-cycle features over surface-level knowledge of 15 tools.
2. **Resume Alignment:**
   * Ensure your top 3 project bullets directly reflect the primary tech stack listed in job descriptions for your target role.
3. **Portfolio & Verification:**
   * Public code speaks louder than buzzwords. Include clean README architecture diagrams, unit tests, and live demo links for your key projects.

Feel free to ask for specific bullet point rewrites, system design drill problems, or interview practice questions!`
}

export default function Chatbot() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const token = localStorage.getItem('token')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, sending])

  useEffect(() => {
    async function initChat() {
      if (!token) return
      setLoading(true)

      try {
        const list = await apiRequest<ConversationItem[]>('/api/chat/conversations')
        if (Array.isArray(list) && list.length > 0) {
          setConversations(list)
          setActiveConversationId(list[0].id)
          await loadMessages(list[0].id)
          return
        }
      } catch (err: any) {
        console.warn('Could not load existing conversations:', err?.message)
      } finally {
        setLoading(false)
      }

      // No past conversations exist, or server is offline.
      // Do NOT trigger an automatic POST request on page load!
      // Provide clean initial state ready for user prompt:
      setConversations([])
      setActiveConversationId(null)
      setMessages([
        {
          role: 'assistant',
          content:
            "Hi! I'm your Career AI mentor. I can help you improve your resume bullets, analyze skill gaps for your target role, or prepare for technical interviews. What would you like to work on?"
        }
      ])
    }

    initChat()
  }, [token])

  const createNewConversation = () => {
    // Explicit user action: start fresh chat thread without sending premature POST
    setActiveConversationId(null)
    setMessages([
      {
        role: 'assistant',
        content:
          "Starting a fresh conversation. What career goals or interview topics would you like to explore?"
      }
    ])
    setSidebarOpen(false)
  }

  const loadMessages = async (convId: number) => {
    if (!token) return
    try {
      const msgs = await apiRequest<ChatMessage[]>(`/api/chat/conversations/${convId}/messages`)
      if (Array.isArray(msgs) && msgs.length > 0) {
        setMessages(msgs)
      } else {
        setMessages([
          {
            role: 'assistant',
            content: "Ask a question about your resume, career path, or interview prep."
          }
        ])
      }
    } catch (err: any) {
      console.warn('Failed to load messages for conversation:', err?.message)
      setMessages([
        {
          role: 'assistant',
          content: "Hi! How can I assist you with your career or resume today?"
        }
      ])
    }
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text || sending) return

    setInputMessage('')
    setError(null)
    setSidebarOpen(false)

    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    setSending(true)

    try {
      let currentConvId = activeConversationId

      // If no active thread exists yet, create it on first message submission
      if (!currentConvId && token) {
        try {
          const newConv = await apiRequest<ConversationItem>('/api/chat/conversations', {
            method: 'POST',
            body: JSON.stringify({ title: text.slice(0, 32) || 'Career Chat' })
          })
          if (newConv && newConv.id) {
            currentConvId = newConv.id
            setActiveConversationId(newConv.id)
            setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)])
          }
        } catch (convErr: any) {
          console.warn('Backend conversation creation failed, using local session:', convErr?.message)
          const localConv: ConversationItem = {
            id: Date.now(),
            title: text.slice(0, 32) || 'Career Chat',
            created_at: new Date().toISOString()
          }
          currentConvId = localConv.id
          setActiveConversationId(localConv.id)
          setConversations((prev) => [localConv, ...prev])
        }
      }

      // If connected to live server thread, request assistant reply
      if (token && currentConvId && typeof currentConvId === 'number' && currentConvId < 10000000000) {
        try {
          const data = await apiRequest<{ response?: string; content?: string }>(
            `/api/chat/conversations/${currentConvId}/messages`,
            {
              method: 'POST',
              body: JSON.stringify({ content: text })
            }
          )
          if (data && (data.response || data.content)) {
            const assistantMsg: ChatMessage = {
              role: 'assistant',
              content: data.response || data.content
            }
            setMessages((prev) => [...prev, assistantMsg])
            return
          }
        } catch (msgErr: any) {
          console.warn('Live API response failed, activating client career advisor:', msgErr?.message)
        }
      }

      // Fallback: intelligent career response
      const fallbackReply = getSmartCareerAdvice(text)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: fallbackReply
        }
      ])
    } catch (err: any) {
      setError(err?.message || 'Chat service is temporarily unavailable.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatMessageContent = (content: string) => {
    const lines = content.split('\n')
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed font-sans">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1" />

          if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const bulletText = trimmed.replace(/^[\*\-•]\s*/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-500 mt-1 shrink-0">•</span>
                <span>{renderStyledText(bulletText)}</span>
              </div>
            )
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const num = trimmed.match(/^(\d+\.)\s/)?.[1]
            const text = trimmed.replace(/^\d+\.\s/, '')
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-zinc-400 font-mono font-semibold shrink-0">{num}</span>
                <span>{renderStyledText(text)}</span>
              </div>
            )
          }

          return <p key={idx}>{renderStyledText(line)}</p>
        })}
      </div>
    )
  }

  const renderStyledText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="text-white font-semibold">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-70px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#202227] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-1.5 rounded bg-[#121316] border border-[#22242A] text-zinc-400"
            title="Toggle sidebar"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#181A1F] border border-[#272A31] flex items-center justify-center font-mono text-zinc-300 text-xs">
              C/
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>Career Chat</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </h1>
              <p className="text-[11px] text-zinc-400">
                Ask about resume feedback, skill roadmap, or interview questions
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={createNewConversation}
          className="px-3 py-1.5 rounded-md text-xs font-medium bg-[#141519] hover:bg-[#1A1C22] border border-[#262830] text-zinc-200 transition flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
        </button>
      </div>

      {/* Main Chat Body */}
      <div className="relative flex-1 flex gap-5 overflow-hidden pt-4">
        {/* Mobile Backdrop Overlay (CA-003) */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar (Desktop side-by-side, Mobile off-canvas overlay) (CA-003) */}
        <aside
          aria-label="Suggested Prompts and Chat History"
          className={`
            fixed md:static inset-y-0 left-0 z-40 md:z-auto
            w-72 lg:w-80 shrink-0 surface-panel p-4 overflow-y-auto space-y-5
            transition-transform duration-200 ease-in-out bg-[#0D0F14] md:bg-inherit
            border-r md:border-r-0 border-[#22242A] shadow-2xl md:shadow-none
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            md:flex flex-col
          `}
        >
          {/* Mobile Drawer Header with Close Button */}
          <div className="flex md:hidden items-center justify-between pb-2 border-b border-[#202227]">
            <span className="text-xs font-semibold text-white">Suggested & History</span>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-[#181A1F] transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Guided Starters */}
          <div className="space-y-2">
            <div className="text-[11px] font-mono uppercase text-zinc-400">
              Suggested Prompts
            </div>
            <div className="space-y-1.5">
              {GUIDED_STARTERS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2 rounded bg-[#0E0F12] hover:bg-[#14161C] border border-[#202227] hover:border-[#2C2F38] text-xs text-zinc-300 hover:text-white transition flex items-start gap-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{prompt}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Past Chats */}
          {conversations.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-[#1E2026]">
              <div className="text-[11px] font-mono uppercase text-zinc-400">
                Past Chats
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveConversationId(c.id)
                      loadMessages(c.id)
                      setSidebarOpen(false)
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-xs truncate transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 ${
                      activeConversationId === c.id
                        ? 'bg-[#181A1F] text-white font-medium border border-[#282B33]'
                        : 'text-zinc-400 hover:text-white hover:bg-[#101216]'
                    }`}
                  >
                    {c.title || `Chat #${c.id}`}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Right Chat Stream */}
        <div className="flex-1 min-w-0 flex flex-col surface-panel overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4" role="log" aria-live="polite">
            {loading && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs py-12">
                <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                <span>Loading chat...</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant'
                return (
                  <div
                    key={index}
                    className={`flex gap-3 max-w-3xl ${
                      isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                        isAssistant
                          ? 'bg-[#181A1F] border border-[#272A31] text-zinc-300'
                          : 'bg-zinc-800 border border-zinc-700 text-white'
                      }`}
                    >
                      {isAssistant ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`p-3.5 sm:p-4 rounded-lg border text-xs sm:text-sm ${
                        isAssistant
                          ? 'bg-[#0E0F12] border-[#202227] text-zinc-200'
                          : 'bg-[#16181E] border-[#282B33] text-white'
                      }`}
                    >
                      <div className="text-[10px] font-mono uppercase text-zinc-500 mb-1">
                        {isAssistant ? 'Assistant' : 'You'}
                      </div>
                      {formatMessageContent(msg.content)}
                    </div>
                  </div>
                )
              })
            )}

            {sending && (
              <div className="flex gap-3 max-w-xl mr-auto" aria-live="polite">
                <div className="w-6 h-6 rounded bg-[#181A1F] border border-[#272A31] text-zinc-300 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-lg bg-[#0E0F12] border border-[#202227] flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar (CA-005: min-height & non-clipped placeholder) */}
          <div className="p-3 bg-[#0E0F12] border-t border-[#202227] shrink-0">
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-2 text-xs text-rose-400 flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <textarea
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about resume rewrites, skills, or interview prep..."
                aria-label="Message Career AI assistant"
                className="flex-1 px-3 py-2.5 rounded-md bg-[#121316] border border-[#22242A] text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition resize-none min-h-[44px] max-h-32 leading-normal"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                aria-label="Send message"
                className="p-2.5 rounded-md font-medium text-zinc-950 bg-white hover:bg-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1 pl-1 hidden sm:block">
              Press Enter to send, Shift+Enter for newline.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
