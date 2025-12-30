import { useState, useEffect, useRef } from 'react';
import { Send, Bot, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

// Using a lightweight model for demo purposes. 
// Llama-3 is better but heavier (~5GB). Gemma-2b is ~1.5GB.
const MODEL_ID = "gemma-2-2b-it-q4f32_1-MLC";
const LOCAL_MODEL_FOLDER = "Gemma-2-2b-it-q4f32_1";

export function AIAgent({ data, query, filters, onFilterChange }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showReadyMessage, setShowReadyMessage] = useState(false);
    const [lastProcessedQuery, setLastProcessedQuery] = useState('');

    // LLM State
    const [engine, setEngine] = useState(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const [progress, setProgress] = useState("");
    const scrollRef = useRef(null);

    // Refs for Cleanup
    const engineRef = useRef(null);
    const initializationRef = useRef(false);

    // Initialize Engine
    useEffect(() => {
        if (initializationRef.current) return;
        initializationRef.current = true;

        const initLLM = async () => {
            setIsModelLoading(true);
            try {
                // Configure to use local model path with explicit record
                // because prebuiltAppConfig might not have this exact ID or version.
                // Configure to use local model path but keep other settings (WASM, VRAM) from prebuilt
                const myAppConfig = {
                    ...prebuiltAppConfig,
                    model_list: prebuiltAppConfig.model_list.map(m => {
                        if (m.model_id === MODEL_ID) {
                            return {
                                ...m,
                                model_url: `/models/${LOCAL_MODEL_FOLDER}/`
                            };
                        }
                        return m;
                    })
                };

                // Use simple configuration to avoid WASM binding errors
                const eng = await CreateMLCEngine(MODEL_ID, {
                    appConfig: myAppConfig,
                    initProgressCallback: (report) => {
                        setProgress(report.text);
                    }
                });

                setEngine(eng);
                engineRef.current = eng;

                // Show temporary ready message
                setShowReadyMessage(true);
                setTimeout(() => setShowReadyMessage(false), 3000);

            } catch (err) {
                console.error("LLM Init Failed:", err);
                // Do not show error if it is cancellable or network interrupt expected
                // Showing the actual error message helps debugging
                setMessages(prev => [...prev, { id: 0, sender: 'ai', text: `AIモデルの読み込みに失敗しました。\n詳細: ${err.message}` }]);
                initializationRef.current = false; // Allow retry if failed
            } finally {
                setIsModelLoading(false);
            }
        };

        initLLM();

        // Cleanup
        return () => {
            if (engineRef.current) {
                console.log("Unloading LLM Engine...");
                engineRef.current.unload();
                engineRef.current = null;
            }
            initializationRef.current = false;
        };
    }, []);

    // Initial greeting based on stats (Logic kept for quick initial render, or use LLM?)
    // Using rule-based for immediate greeting is better UX than waiting for LLM.
    useEffect(() => {
        // ... (Keep existing rule-based greeting logic for speed)
        const timer = setTimeout(() => {
            let text = '';
            if (!query && !filters.yearRange && !filters.category) {
                text = `こんにちは！AI検索エージェントです 🤖\n区議会議事録の中から知りたい情報を探すお手伝いをします。\n\n「防災」や「子育て」などのキーワードを入力するか、私に話しかけてください。\n（例: 「2024年の予算について知りたい」）`;
            } else {
                // Simple stats summary
                const count = data.length;
                const years = [...new Set(data.map(d => d.year))].filter(Boolean);
                const minYear = Math.min(...years) || '';
                const maxYear = Math.max(...years) || '';
                text = `データ分析結果: ${count.toLocaleString()}件 (${minYear}〜${maxYear}年)`;
                if (query) text += `\n「${query}」の検索結果を表示しています。`;
            }
            setMessages([{ id: 'init', sender: 'ai', text }]);
        }, 500);
        return () => clearTimeout(timer);
    }, [data.length, query]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping, progress, isExpanded]); // added isExpanded

    // Core AI Logic
    const processMessage = async (text, shouldExpand = true) => {
        if (!text.trim()) return;

        if (shouldExpand) setIsExpanded(true); // Auto-expand on interaction
        setIsTyping(true);

        // Filter / Search Logic Helper
        const applyAction = (type, val) => {
            if (type === 'year') onFilterChange('year', val);
            if (type === 'reset') onFilterChange('reset', null);
            if (type === 'query') onFilterChange('query', val);
        }

        // 1. Simple Regex Checks (Fast path)
        const yearMatch = text.match(/(\d{4})年?/);
        if (text.includes('リセット') || text.includes('クリア')) {
            applyAction('reset');
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: '条件をリセットしました。' }]);
            setIsTyping(false);
            return;
        }
        if (yearMatch) {
            const y = yearMatch[1];
            applyAction('year', y);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `${y}年度に絞り込みました。` }]);
            setIsTyping(false);
            return;
        }

        // 2. LLM RAG
        if (!engine) {
            const statusMsg = progress ? `現在AIモデルを準備中です（${progress}）。初回のみ数分かかりますので、そのままお待ちください。` : '申し訳ありません、AIモデルの準備がまだできていません。少々お待ちください。';
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: statusMsg }]);
            setIsTyping(false);
            return;
        }

        try {
            // resetChat removed due to BindingError (VectorInt) in current web-llm version.
            // The engine should auto-reset if the System Prompt changes (which it does every turn).

            // Prepare Context (Top 20 results to fit in context window)
            const stats = `ヒット数: ${data.length}件 (上位20件を参照)`;
            const context = data.slice(0, 20).map(d =>
                `[${d.date} ${d.committee} ${d.speaker}]: ${d.body.substring(0, 200)}...`
            ).join("\n\n");

            const systemPrompt = `
あなたは中央区議会の議事録検索をサポートする、役に立つAIアシスタントです。
以下の「議事録の抜粋」を参考にして、ユーザーの質問に日本語で答えてください。

現在の検索ワード: ${query || 'なし'}
統計情報: ${stats}
議事録の抜粋:
${context}

指示:
1. 回答は必ず「議事録の抜粋」の内容に基づいて作成してください。
2. 抜粋の中に答えがない場合は、「SEARCH: [キーワード]」という形式で追加の検索コマンドだけを出力してください。
   - 例: SEARCH: 防災 予算
3. **絶対に英語を使わないでください**。常に日本語で回答すること。
4. 「市」ではなく「区」を使用してください（中央区議会のため）。
5. 重要なポイントは **太字** で強調してください。
`;

            const reply = await engine.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    // RAG One-Shot: Do not include history to prevent context mixing and loops
                    { role: "user", content: text }
                ]
            });

            const aiText = reply.choices[0].message.content;

            // Check for function call pattern (SEARCH: keyword)
            if (aiText.includes("SEARCH:")) {
                const kw = aiText.split("SEARCH:")[1].trim();
                applyAction('query', kw);
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `「${kw}」で検索します。` }]);
            } else {
                setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: aiText }]);
            }

        } catch (err) {
            console.error("AI Generation Error:", err);
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', text: `申し訳ありません、エラーが発生しました。\n(${err.name}: ${err.message})` }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Auto-Ask Effect
    useEffect(() => {
        if (query && query !== lastProcessedQuery) {
            const autoQuestion = `「${query}」について、どのような議論が行われていますか？`;
            setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: autoQuestion }]);
            processMessage(autoQuestion, false); // Don't auto-expand
            setLastProcessedQuery(query);
            // setIsExpanded(true); // User requested to keep it closed initially
        }
    }, [query, engine]);

    const handleSend = async () => {
        if (!inputText.trim() || isTyping) return;
        const text = inputText;
        setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
        setInputText('');
        processMessage(text);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            handleSend();
        }
    };

    // Helper to format bold text
    const formatMessage = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window (Popup) */}
            <div className={clsx(
                "bg-white rounded-2xl shadow-xl border border-slate-200 w-80 flex flex-col transition-all duration-300 origin-bottom-right pointer-events-auto",
                isExpanded ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4 pointer-events-none absolute bottom-16 right-0"
            )}
                style={{ maxHeight: '600px' }}>

                {/* Header */}
                <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Bot size={18} className="text-primary-600" />
                        <span className="font-bold text-slate-700 text-sm">AI Agent</span>
                    </div>
                    <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-slate-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200"
                >
                    {messages.map(msg => (
                        <div key={msg.id} className={clsx("flex w-full", msg.sender === 'user' ? "justify-end" : "justify-start")}>
                            <div className={clsx(
                                "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap break-words",
                                msg.sender === 'user' ? "bg-primary-500 text-white rounded-br-none" : "bg-slate-100 text-slate-800 rounded-bl-none"
                            )}>
                                {formatMessage(msg.text)}
                            </div>
                        </div>
                    ))}
                    {(isTyping || isModelLoading || showReadyMessage) && (
                        <div className="flex justify-start">
                            <div className="bg-slate-100 px-3 py-2 rounded-2xl rounded-bl-none flex items-center gap-2 text-xs text-slate-500">
                                {isModelLoading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={14} />
                                        <span>準備中... {progress}</span>
                                    </>
                                ) : showReadyMessage ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span>準備完了</span>
                                    </>
                                ) : (
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-slate-100 bg-white rounded-b-2xl">
                    <div className="relative">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={isModelLoading ? "準備中..." : "AIに質問"}
                            disabled={isModelLoading}
                            className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 disabled:opacity-60"
                            autoComplete="off"
                        />
                        <button
                            onClick={handleSend}
                            disabled={isModelLoading}
                            className="absolute right-1 top-1 p-1.5 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors disabled:bg-slate-300"
                        >
                            <Send size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Toggle Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="pointer-events-auto relative group"
            >
                <div className="w-14 h-14 rounded-full bg-white border-2 border-primary-500 shadow-lg flex items-center justify-center overflow-hidden hover:scale-105 transition-transform">
                    <img
                        src="/ai_avatar.png"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                        alt="AI"
                        className="w-full h-full object-cover"
                    />
                    <Bot size={28} className="text-primary-600 hidden" />
                </div>
                {/* Status Dot */}
                {engine && !isModelLoading && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                )}
            </button>
        </div>
    );
}
