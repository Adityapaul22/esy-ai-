import React, { useState, useEffect, useRef } from 'react';
import { Conversation, Message, AttachedImage, Persona } from './types/chat';
import { PERSONAS } from './data/personas';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { SplashScreen } from './components/SplashScreen';

const STORAGE_KEY = 'esy_conversations_v1';
const SETTINGS_KEY = 'esy_settings_v1';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('nova_conversations_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => ({
            ...c,
            model: 'gemini-3.5-flash',
            messages: (c.messages || []).filter(
              (m: any) => (m.content && m.content.trim()) || (m.images && m.images.length > 0)
            ),
          }));
        }
      }
    } catch (e) {
      console.error('Failed to parse saved conversations', e);
    }
    return [];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [statusOk, setStatusOk] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // App-level settings defaults
  const [selectedPersona, setSelectedPersona] = useState<Persona>(PERSONAS[0]);
  const [systemInstruction, setSystemInstruction] = useState<string>(PERSONAS[0].systemInstruction);
  const [temperature, setTemperature] = useState<number>(0.7);
  const [model, setModel] = useState<string>('gemini-3.5-flash');
  const [defaultEnableSearch, setDefaultEnableSearch] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load saved settings
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.personaId) {
          const found = PERSONAS.find((p) => p.id === parsed.personaId || (p.id === 'esy' && parsed.personaId === 'nova'));
          if (found) setSelectedPersona(found);
        }
        if (parsed.systemInstruction) setSystemInstruction(parsed.systemInstruction);
        if (typeof parsed.temperature === 'number') setTemperature(parsed.temperature);
        if (parsed.model && parsed.model !== 'gemini-3.8-flash') setModel(parsed.model);
        else setModel('gemini-3.6-flash');
        if (typeof parsed.enableSearch === 'boolean') setDefaultEnableSearch(parsed.enableSearch);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save settings on update
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          personaId: selectedPersona.id,
          systemInstruction,
          temperature,
          model,
          enableSearch: defaultEnableSearch,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedPersona, systemInstruction, temperature, model, defaultEnableSearch]);

  // Save conversations to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Failed to store conversations', e);
    }
  }, [conversations]);

  // Check backend server status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setStatusOk(true);
        }
      })
      .catch(() => {
        setStatusOk(false);
      });
  }, []);

  // Ensure an active conversation exists
  useEffect(() => {
    if (conversations.length === 0) {
      const initialConv: Conversation = {
        id: 'conv_' + Date.now(),
        title: 'New Chat',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        personaId: selectedPersona.id,
        systemInstruction,
        enableSearch: defaultEnableSearch,
        temperature,
        model,
        messages: [],
      };
      setConversations([initialConv]);
      setActiveId(initialConv.id);
    } else if (!activeId || !conversations.find((c) => c.id === activeId)) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const activeConversation = conversations.find((c) => c.id === activeId) || null;

  // New Chat handler
  const handleNewChat = () => {
    if (isStreaming) {
      handleStopStreaming();
    }
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      personaId: selectedPersona.id,
      systemInstruction,
      enableSearch: defaultEnableSearch,
      temperature,
      model,
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newConv.id);
  };

  // Delete conversation
  const handleDeleteConversation = (id: string) => {
    if (isStreaming && id === activeId) {
      handleStopStreaming();
    }
    setConversations((prev) => {
      const filtered = prev.filter((c) => c.id !== id);
      if (filtered.length > 0 && id === activeId) {
        setActiveId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveId(null);
      }
      return filtered;
    });
  };

  // Rename conversation
  const handleRenameConversation = (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle, updatedAt: Date.now() } : c))
    );
  };

  // Switch persona for active conversation
  const handleSwitchPersona = (persona: Persona) => {
    setSelectedPersona(persona);
    setSystemInstruction(persona.systemInstruction);
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? {
                ...c,
                personaId: persona.id,
                systemInstruction: persona.systemInstruction,
                updatedAt: Date.now(),
              }
            : c
        )
      );
    }
  };

  // Toggle search for active conversation
  const handleToggleSearch = (enabled: boolean) => {
    setDefaultEnableSearch(enabled);
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, enableSearch: enabled } : c))
      );
    }
  };

  // Clear current conversation messages
  const handleClearConversation = () => {
    if (!activeId) return;
    if (window.confirm('Are you sure you want to clear all messages in this conversation?')) {
      setConversations((prev) =>
        prev.map((c) => (c.id === activeId ? { ...c, messages: [], updatedAt: Date.now() } : c))
      );
    }
  };

  // Stop Streaming
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);

    // Set streaming message status to complete
    if (activeId) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeId) return c;
          const updated = c.messages.map((m) =>
            m.status === 'streaming' ? { ...m, status: 'complete' as const } : m
          );
          return { ...c, messages: updated };
        })
      );
    }
  };

  // Send message & stream response
  const handleSendMessage = async (content: string, images?: AttachedImage[]) => {
    if (!activeConversation) return;

    const userMessageId = 'msg_' + Date.now();
    const botMessageId = 'msg_' + (Date.now() + 1);

    const userMessage: Message = {
      id: userMessageId,
      role: 'user',
      content,
      images,
      timestamp: Date.now(),
      status: 'complete',
    };

    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'streaming',
    };

    const currentMessages = activeConversation.messages || [];
    // Filter out previous failed/empty messages
    const sanitizedPastMessages = currentMessages.filter(
      (m: Message) => (m.content && m.content.trim().length > 0) || (m.images && m.images.length > 0)
    );
    const isFirstMessage = sanitizedPastMessages.length === 0;

    // Update conversation with user message and empty bot message
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...sanitizedPastMessages, userMessage, initialBotMessage],
            }
          : c
      )
    );

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // If first message, auto-generate conversation title
    if (isFirstMessage && content) {
      fetch('/api/chat/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.title) {
            handleRenameConversation(activeConversation.id, data.title);
          }
        })
        .catch(() => {
          // ignore
        });
    }

    try {
      // Prepare message history for backend
      const historyPayload = [
        ...sanitizedPastMessages.map((m: Message) => ({
          role: m.role,
          content: m.content,
          images: m.images?.map((img: AttachedImage) => ({
            data: img.data,
            mimeType: img.mimeType,
          })),
        })),
        {
          role: 'user',
          content,
          images: images?.map((img: AttachedImage) => ({
            data: img.data,
            mimeType: img.mimeType,
          })),
        },
      ];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          systemInstruction:
            activeConversation.systemInstruction || selectedPersona.systemInstruction,
          temperature: activeConversation.temperature ?? temperature,
          enableSearch: activeConversation.enableSearch ?? defaultEnableSearch,
          model: activeConversation.model || 'gemini-3.5-flash',
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const fullText = data.text || '';
      const webChunks = data.webChunks;
      const searchQueries = data.searchQueries;

      // Typewriter streaming animation
      const words = fullText.split(/(\s+)/);
      let revealed = '';

      for (let i = 0; i < words.length; i++) {
        if (abortControllerRef.current?.signal.aborted) {
          revealed = fullText;
          break;
        }
        revealed += words[i];

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversation.id) return c;
            const updated = c.messages.map((m) =>
              m.id === botMessageId
                ? {
                    ...m,
                    content: revealed,
                    webChunks: webChunks && webChunks.length > 0 ? webChunks : undefined,
                    searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : undefined,
                  }
                : m
            );
            return { ...c, messages: updated };
          })
        );

        if (words.length > 1 && i % 2 === 0) {
          await new Promise((r) => setTimeout(r, 12));
        }
      }

      // Mark complete
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== activeConversation.id) return c;
          const updated = c.messages.map((m) =>
            m.id === botMessageId
              ? {
                  ...m,
                  content: fullText,
                  webChunks: webChunks && webChunks.length > 0 ? webChunks : undefined,
                  searchQueries: searchQueries && searchQueries.length > 0 ? searchQueries : undefined,
                  status: 'complete' as const,
                }
              : m
          );
          return { ...c, messages: updated };
        })
      );
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Error generating chat response:', err);
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== activeConversation.id) return c;
            const updated = c.messages.map((m) =>
              m.id === botMessageId
                ? {
                    ...m,
                    status: 'error' as const,
                    error: err.message || 'Failed to complete response. Please try again.',
                  }
                : m
            );
            return { ...c, messages: updated };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  // Regenerate last response
  const handleRegenerate = () => {
    if (!activeConversation || activeConversation.messages.length === 0 || isStreaming) return;

    // Find the last user message
    const messages = activeConversation.messages;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserIdx;
    const lastUserMsg = messages[actualIdx];

    // Remove all messages after that user message
    const trimmed = messages.slice(0, actualIdx);

    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: trimmed } : c))
    );

    // Re-send that user message
    setTimeout(() => {
      handleSendMessage(lastUserMsg.content, lastUserMsg.images);
    }, 50);
  };

  // Export current conversation as Markdown
  const handleExportConversation = () => {
    if (!activeConversation) return;

    let md = `# ${activeConversation.title}\n`;
    md += `*Exported from Esy AI Chatbot on ${new Date().toLocaleString()}*\n\n`;

    activeConversation.messages.forEach((msg) => {
      const roleLabel = msg.role === 'user' ? '👤 User' : `🤖 ${selectedPersona.name}`;
      md += `### ${roleLabel} (${new Date(msg.timestamp).toLocaleTimeString()})\n\n`;
      if (msg.images && msg.images.length > 0) {
        md += `*[Attached ${msg.images.length} image(s)]*\n\n`;
      }
      md += `${msg.content}\n\n`;
      if (msg.webChunks && msg.webChunks.length > 0) {
        md += `**Sources:**\n`;
        msg.webChunks.forEach((c) => {
          md += `- [${c.title || c.uri}](${c.uri})\n`;
        });
        md += '\n';
      }
      md += '---\n\n';
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'chat'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export all conversations as JSON
  const handleExportAllChats = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esy_ai_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import conversations from JSON
  const handleImportChats = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setConversations(imported);
          if (imported.length > 0) {
            setActiveId(imported[0].id);
          }
          alert('Conversations imported successfully!');
        } else {
          alert('Invalid backup file format.');
        }
      } catch {
        alert('Failed to parse the backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Clear all chats
  const handleClearAllChats = () => {
    if (window.confirm('Are you sure you want to delete ALL chats? This cannot be undone.')) {
      setConversations([]);
      localStorage.removeItem(STORAGE_KEY);
      handleNewChat();
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelectConversation={(id) => {
          if (isStreaming) handleStopStreaming();
          setActiveId(id);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        isOpen={isSidebarOpen}
        onToggleOpen={() => setIsSidebarOpen(!isSidebarOpen)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentPersona={selectedPersona}
        statusOk={statusOk}
      />

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col h-full min-w-0">
        <ChatArea
          conversation={activeConversation}
          onSendMessage={handleSendMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          onRegenerate={handleRegenerate}
          onClearConversation={handleClearConversation}
          onExportConversation={handleExportConversation}
          onToggleSearch={handleToggleSearch}
          onSwitchPersona={handleSwitchPersona}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedPersona={selectedPersona}
        onSelectPersona={setSelectedPersona}
        systemInstruction={systemInstruction}
        onUpdateSystemInstruction={setSystemInstruction}
        temperature={temperature}
        onUpdateTemperature={setTemperature}
        model={model}
        onUpdateModel={setModel}
        enableSearch={defaultEnableSearch}
        onToggleSearch={setDefaultEnableSearch}
        onClearAllChats={handleClearAllChats}
        onExportAllChats={handleExportAllChats}
        onImportChats={handleImportChats}
        onReplaySplash={() => setShowSplash(true)}
      />
      {/* Splash Screen */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </div>
  );
}
