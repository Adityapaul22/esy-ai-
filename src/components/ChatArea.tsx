import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Globe,
  Sliders,
  Share2,
  Trash2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  PanelLeft,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  X,
  Bot,
  User,
  Mic,
  MicOff,
  ArrowDown,
} from 'lucide-react';
import { Conversation, Message, AttachedImage, Persona } from '../types/chat';
import { PERSONAS } from '../data/personas';
import { MarkdownRenderer } from './MarkdownRenderer';
import { speechManager } from '../utils/speech';

interface ChatAreaProps {
  conversation: Conversation | null;
  onSendMessage: (content: string, images?: AttachedImage[]) => void;
  onStopStreaming: () => void;
  isStreaming: boolean;
  onRegenerate: () => void;
  onClearConversation: () => void;
  onExportConversation: () => void;
  onToggleSearch: (enabled: boolean) => void;
  onSwitchPersona: (persona: Persona) => void;
  onOpenSettings: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  onRegenerate,
  onClearConversation,
  onExportConversation,
  onToggleSearch,
  onSwitchPersona,
  onOpenSettings,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const [input, setInput] = useState('');
  const [attachedImages, setAttachedImages] = useState<AttachedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentPersona =
    PERSONAS.find((p) => p.id === conversation?.personaId || (p.id === 'esy' && conversation?.personaId === 'nova')) || PERSONAS[0];

  // Speech synthesizer listener
  useEffect(() => {
    speechManager.setListener((playingId) => {
      setSpeakingId(playingId);
    });
    return () => {
      speechManager.stop();
    };
  }, []);

  // Auto-scroll when messages update or streaming
  useEffect(() => {
    if (!showScrollBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation?.messages, isStreaming, showScrollBottom]);

  // Track scroll position to show/hide "scroll to bottom" button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 150);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [input]);

  // Handle Voice Dictation (SpeechRecognition)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Image Upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setAttachedImages((prev) => [
            ...prev,
            {
              data: result,
              mimeType: file.type,
              name: file.name,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Paste image from clipboard
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
              setAttachedImages((prev) => [
                ...prev,
                {
                  data: result,
                  mimeType: file.type,
                  name: 'Pasted Image',
                },
              ]);
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = () => {
    if ((!input.trim() && attachedImages.length === 0) || isStreaming) return;
    const textToSend = input.trim();
    const imgsToSend = [...attachedImages];

    setInput('');
    setAttachedImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    onSendMessage(textToSend, imgsToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const toggleSpeak = (id: string, text: string) => {
    speechManager.speak(id, text);
  };

  const messages = conversation?.messages || [];
  const enableSearch = conversation?.enableSearch ?? false;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 relative overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              type="button"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Open Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
          )}

          {/* Conversation title & Persona badge */}
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {conversation?.title || 'New Conversation'}
            </h1>

            {/* Persona Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-700 bg-slate-800/70 text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <span
                  className={`w-2 h-2 rounded-full bg-gradient-to-r ${currentPersona.accentColor}`}
                />
                <span className="truncate max-w-[100px]">{currentPersona.name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {personaMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setPersonaMenuOpen(false)}
                  />
                  <div className="absolute left-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-xl py-1.5 z-40 text-xs">
                    <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Switch Persona
                    </div>
                    {PERSONAS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          onSwitchPersona(p);
                          setPersonaMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-800 transition-colors ${
                          p.id === currentPersona.id ? 'bg-slate-800/70 text-indigo-400 font-medium' : 'text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold bg-gradient-to-br ${p.accentColor} text-white shrink-0`}
                        >
                          {p.name[0]}
                        </div>
                        <div className="flex-1 truncate">
                          <span className="block truncate text-white">{p.name}</span>
                          <span className="text-[10px] text-slate-400 truncate">{p.roleTitle}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Web Search Grounding toggle */}
          <button
            type="button"
            onClick={() => onToggleSearch(!enableSearch)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              enableSearch
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-xs'
                : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title={enableSearch ? 'Google Search Grounding Active' : 'Enable Google Search Grounding'}
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Web Search</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                enableSearch ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
          </button>

          {/* Export button */}
          <button
            type="button"
            onClick={onExportConversation}
            disabled={messages.length === 0}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Export Conversation"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Clear chat */}
          <button
            type="button"
            onClick={onClearConversation}
            disabled={messages.length === 0}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Clear Messages"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Settings modal */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6"
      >
        {messages.length === 0 ? (
          // Empty State with Persona intro and starter cards
          <div className="max-w-2xl mx-auto py-8 text-center space-y-8 animate-fade-in">
            <div className="space-y-3">
              {currentPersona.id === 'esy' ? (
                <div className="relative mx-auto w-20 h-20 group">
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-3xl blur-md opacity-60 group-hover:opacity-100 transition duration-500" />
                  <div className="relative w-20 h-20 rounded-2xl bg-white p-2 shadow-2xl flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Esy AI Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr ${currentPersona.accentColor} flex items-center justify-center text-white shadow-xl shadow-indigo-500/10 ring-4 ring-slate-800/50`}
                >
                  <Bot className="w-8 h-8" />
                </div>
              )}
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Meet {currentPersona.name}
              </h2>
              <p className="text-sm text-indigo-300 font-medium">{currentPersona.roleTitle}</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                {currentPersona.description}
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="space-y-3 text-left">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 text-center">
                Suggested questions & starters
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentPersona.starterPrompts.map((starter, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSendMessage(starter.prompt)}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-indigo-500/40 text-left transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-200 group-hover:text-white mb-1">
                      <span>{starter.title}</span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                        {starter.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed group-hover:text-slate-300">
                      {starter.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature tips pill */}
            <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-2 rounded-xl bg-slate-900/50 border border-slate-800/60 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-emerald-400" /> Live Web Search
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" /> Vision & Image Analysis
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-violet-400" /> Audio Read Aloud
              </span>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isUser = message.role === 'user';
            const isSpeakingThis = speakingId === message.id;
            const isCopied = copiedId === message.id;

            return (
              <div
                key={message.id}
                className={`flex gap-3 max-w-3xl mx-auto ${
                  isUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-md overflow-hidden ${
                    isUser
                      ? 'bg-slate-700 text-slate-200'
                      : currentPersona.id === 'esy'
                      ? 'bg-white p-1'
                      : `bg-gradient-to-tr ${currentPersona.accentColor} text-white`
                  }`}
                >
                  {isUser ? (
                    <User className="w-4 h-4" />
                  ) : currentPersona.id === 'esy' ? (
                    <img
                      src="/logo.png"
                      alt="Esy AI"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                {/* Message Bubble & Content */}
                <div
                  className={`flex-1 min-w-0 space-y-2 ${
                    isUser ? 'items-end flex flex-col' : ''
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3.5 text-sm transition-all shadow-xs ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs max-w-[85%]'
                        : 'bg-slate-900/90 border border-slate-800/90 text-slate-100 rounded-tl-xs w-full'
                    }`}
                  >
                    {/* User attached images preview */}
                    {message.images && message.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.images.map((img, idx) => (
                          <div
                            key={idx}
                            className="relative rounded-lg overflow-hidden border border-slate-700/60 max-w-[200px] max-h-[160px] bg-slate-950"
                          >
                            <img
                              src={img.data}
                              alt={img.name || 'Attachment'}
                              className="object-cover w-full h-full max-h-[160px]"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Text Content */}
                    {isUser ? (
                      <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                        {message.content}
                      </div>
                    ) : (
                      <div>
                        {message.status === 'streaming' && !message.content ? (
                          <div className="flex items-center gap-2 py-1 text-slate-400 text-xs">
                            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                            <span>Thinking...</span>
                          </div>
                        ) : !message.content && !message.error ? (
                          <div className="py-1 text-slate-400 text-xs italic flex items-center justify-between">
                            <span>No response generated.</span>
                            <button
                              type="button"
                              onClick={onRegenerate}
                              className="px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600 text-white font-medium text-xs not-italic transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        ) : (
                          <MarkdownRenderer
                            content={message.content}
                            isStreaming={message.status === 'streaming'}
                          />
                        )}

                        {/* Search Grounding Sources Accordion */}
                        {message.webChunks && message.webChunks.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                              <Globe className="w-3.5 h-3.5" />
                              <span>Web Sources & Grounding</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {message.webChunks.map((chunk, cIdx) => (
                                <a
                                  key={cIdx}
                                  href={chunk.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-white text-xs transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                                  <span className="truncate max-w-[200px]">
                                    {chunk.title || chunk.uri}
                                  </span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error display */}
                    {message.error && (
                      <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                        <span className="flex-1">{message.error}</span>
                        <button
                          type="button"
                          onClick={onRegenerate}
                          className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-medium"
                        >
                          Retry
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar for assistant message */}
                  {!isUser && message.content && (
                    <div className="flex items-center gap-1 px-1 text-slate-400 text-xs">
                      {/* Copy message */}
                      <button
                        type="button"
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
                        title="Copy message"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">{isCopied ? 'Copied' : 'Copy'}</span>
                      </button>

                      {/* Text-to-speech Audio playback */}
                      <button
                        type="button"
                        onClick={() => toggleSpeak(message.id, message.content)}
                        className={`p-1 rounded hover:bg-slate-800 transition-colors flex items-center gap-1 ${
                          isSpeakingThis ? 'text-indigo-400 font-medium' : 'hover:text-white'
                        }`}
                        title={isSpeakingThis ? 'Stop speaking' : 'Read aloud'}
                      >
                        {isSpeakingThis ? (
                          <VolumeX className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px]">
                          {isSpeakingThis ? 'Stop' : 'Read'}
                        </span>
                      </button>

                      {/* Regenerate if this is the latest assistant message */}
                      {message.id === messages[messages.length - 1].id && !isStreaming && (
                        <button
                          type="button"
                          onClick={onRegenerate}
                          className="p-1 hover:text-white rounded hover:bg-slate-800 transition-colors flex items-center gap-1"
                          title="Regenerate response"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Retry</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-6 bottom-28 z-20 p-2 rounded-full bg-slate-800 text-white border border-slate-700 shadow-lg hover:bg-slate-700 transition-all animate-bounce"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Bar Area */}
      <div className="p-3 sm:p-4 bg-slate-900/80 border-t border-slate-800/80 backdrop-blur-md z-20 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Image attachments preview pill */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 pb-1">
              {attachedImages.map((img, index) => (
                <div
                  key={index}
                  className="relative group flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                >
                  <img
                    src={img.data}
                    alt={img.name || 'Attachment'}
                    className="w-8 h-8 rounded object-cover"
                  />
                  <span className="truncate max-w-[120px] text-[11px]">{img.name || 'Image'}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-0.5 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Main Input Box */}
          <div className="relative flex items-end gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-2 focus-within:border-indigo-500/80 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all shadow-inner">
            {/* Attachment Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Attach image"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2 rounded-xl transition-colors shrink-0 ${
                isListening
                  ? 'text-rose-400 bg-rose-500/10 animate-pulse'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={isListening ? 'Stop listening' : 'Dictate with voice'}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Auto-growing Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={`Ask ${currentPersona.name} anything, or paste an image...`}
              className="flex-1 bg-transparent border-0 text-white placeholder-slate-500 text-sm focus:outline-none resize-none py-1.5 px-1 max-h-[180px] leading-relaxed"
            />

            {/* Send or Stop button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="p-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20 shrink-0 cursor-pointer"
                title="Stop response"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() && attachedImages.length === 0}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 shrink-0 cursor-pointer"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Subtext info */}
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-500">
            <span>
              Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Shift + Enter</kbd> for new line
            </span>
            <span className="flex items-center gap-1">
              Powered by <span className="text-slate-400 font-medium">Gemini Intelligence</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
