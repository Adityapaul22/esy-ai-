import React from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Globe,
  Trash2,
  Download,
  Upload,
  Cpu,
  Brain,
  CheckCircle2,
} from 'lucide-react';
import { PERSONAS } from '../data/personas';
import { Persona } from '../types/chat';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersona: Persona;
  onSelectPersona: (persona: Persona) => void;
  systemInstruction: string;
  onUpdateSystemInstruction: (val: string) => void;
  temperature: number;
  onUpdateTemperature: (val: number) => void;
  model: string;
  onUpdateModel: (val: string) => void;
  enableSearch: boolean;
  onToggleSearch: (val: boolean) => void;
  onClearAllChats: () => void;
  onExportAllChats: () => void;
  onImportChats: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onReplaySplash?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  selectedPersona,
  onSelectPersona,
  systemInstruction,
  onUpdateSystemInstruction,
  temperature,
  onUpdateTemperature,
  model,
  onUpdateModel,
  enableSearch,
  onToggleSearch,
  onClearAllChats,
  onExportAllChats,
  onImportChats,
  onReplaySplash,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Bot Settings & Personas</h2>
              <p className="text-xs text-slate-400">Configure AI behavior, engine parameters, and data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Persona Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Persona Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONAS.map((p) => {
                const isSelected = p.id === selectedPersona.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onSelectPersona(p);
                      onUpdateSystemInstruction(p.systemInstruction);
                    }}
                    className={`flex items-start gap-3 p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500/80 bg-indigo-500/10 text-white shadow-sm ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow overflow-hidden ${
                        p.id === 'esy'
                          ? 'bg-white p-1'
                          : `bg-gradient-to-br ${p.accentColor} text-white`
                      }`}
                    >
                      {p.id === 'esy' ? (
                        <img src="/logo.png" alt="Esy AI" className="w-full h-full object-contain" />
                      ) : (
                        p.name.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-sm">{p.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <span className="text-xs text-indigo-300/90 block mb-1">{p.roleTitle}</span>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Instruction */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                System Instruction (Persona Prompt)
              </label>
              <button
                type="button"
                onClick={() => onUpdateSystemInstruction(selectedPersona.systemInstruction)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Reset to default
              </button>
            </div>
            <textarea
              rows={4}
              value={systemInstruction}
              onChange={(e) => onUpdateSystemInstruction(e.target.value)}
              placeholder="Provide custom instructions to steer the AI's tone, formatting, and behavior..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-slate-500 text-xs font-mono resize-y"
            />
          </div>

          {/* Model selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Gemini Model
              </label>
              <select
                value={model}
                onChange={(e) => onUpdateModel(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
              >
                <option value="gemini-3.6-flash">gemini-3.6-flash (Recommended & Active)</option>
                <option value="gemini-3.5-flash">gemini-3.5-flash (High Availability)</option>
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Instant & Fast)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Lightweight)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Flash delivers the optimal balance of intelligence, speed, and real-time grounding.
              </p>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Creativity (Temp): {temperature.toFixed(2)}
                </label>
                <span className="text-[11px] text-indigo-300">
                  {temperature < 0.4 ? 'Precise' : temperature < 0.9 ? 'Balanced' : 'Creative'}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={temperature}
                onChange={(e) => onUpdateTemperature(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.0 (Precise)</span>
                <span>0.7 (Default)</span>
                <span>1.5 (Inventive)</span>
              </div>
            </div>
          </div>

          {/* Google Search Grounding toggle */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <span className="font-medium text-white block">Google Search Grounding</span>
                <p className="text-xs text-slate-400">
                  Enables live web search for current events, latest facts, and provides clickable source citations.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSearch}
                onChange={(e) => onToggleSearch(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Backup & Data Management */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
              Data & Conversations Backup
            </label>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={onExportAllChats}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                Export All (JSON)
              </button>

              <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportChats}
                  className="hidden"
                />
              </label>

              {onReplaySplash && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onReplaySplash();
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  View Splash Screen
                </button>
              )}

              <button
                type="button"
                onClick={onClearAllChats}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-medium transition-colors ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All History
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-lg shadow-indigo-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
