import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  Edit2,
  Check,
  X,
  Sliders,
  Sparkles,
  Bot,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { Conversation, Persona } from '../types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSettings: () => void;
  currentPersona: Persona;
  statusOk: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onToggleOpen,
  onOpenSettings,
  currentPersona,
  statusOk,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by timeline
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    Older: [],
  };

  filteredConversations.forEach((conv) => {
    const diff = now - conv.updatedAt;
    if (diff < ONE_DAY) {
      groups['Today'].push(conv);
    } else if (diff < 2 * ONE_DAY) {
      groups['Yesterday'].push(conv);
    } else if (diff < 7 * ONE_DAY) {
      groups['Previous 7 Days'].push(conv);
    } else {
      groups['Older'].push(conv);
    }
  });

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:border-r-0 md:overflow-hidden'
        }`}
      >
        {/* Header with App Logo & Collapse button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-indigo-500/20 overflow-hidden shrink-0">
              <img
                src="/logo.png"
                alt="Esy AI Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight flex items-center gap-1.5 text-base">
                Esy AI
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  Chat
                </span>
              </span>
            </div>
          </div>
          <button
            onClick={onToggleOpen}
            type="button"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Toggle Sidebar"
          >
            <PanelLeftClose className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/20 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/70"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              {searchQuery ? 'No matching conversations' : 'No chats yet. Start a conversation!'}
            </div>
          ) : (
            Object.entries(groups).map(([groupTitle, items]) => {
              if (items.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {groupTitle}
                  </div>
                  {items.map((conv) => {
                    const isActive = conv.id === activeId;
                    const isEditing = conv.id === editingId;

                    return (
                      <div
                        key={conv.id}
                        onClick={() => !isEditing && onSelectConversation(conv.id)}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                          isActive
                            ? 'bg-slate-800 text-white font-semibold border border-indigo-500/40 shadow-xs'
                            : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <MessageSquare
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                            }`}
                          />
                          {isEditing ? (
                            <form
                              onSubmit={(e) => saveRename(conv.id, e)}
                              className="flex items-center gap-1 flex-1 mr-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                autoFocus
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-slate-950 border border-indigo-500 text-white text-xs px-1.5 py-0.5 rounded outline-none"
                              />
                              <button
                                type="submit"
                                className="text-emerald-400 hover:text-emerald-300 p-0.5"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(null);
                                }}
                                className="text-slate-400 hover:text-slate-200 p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          ) : (
                            <span className="truncate">{conv.title || 'Untitled Conversation'}</span>
                          )}
                        </div>

                        {!isEditing && (
                          <div
                            className={`flex items-center gap-1 transition-opacity ${
                              isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(e) => startRename(conv, e)}
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-700/60 transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-700/60 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom User & Persona info */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2">
          {/* Active Persona info */}
          <div
            onClick={onOpenSettings}
            className="flex items-center justify-between p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-800/80 cursor-pointer transition-colors"
            title="Configure Active Persona"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs bg-gradient-to-br ${currentPersona.accentColor} text-white shrink-0`}
              >
                {currentPersona.name.slice(0, 1)}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                  {currentPersona.name}
                  <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                </div>
                <div className="text-[10px] text-slate-400 truncate">{currentPersona.roleTitle}</div>
              </div>
            </div>
            <Sliders className="w-3.5 h-3.5 text-slate-400 hover:text-white shrink-0" />
          </div>

          {/* Engine status */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  statusOk ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              Gemini Engine {statusOk ? 'Online' : 'Initializing'}
            </span>
            <button
              onClick={onOpenSettings}
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Settings
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
