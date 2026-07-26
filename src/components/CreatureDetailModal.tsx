import React, { useState } from 'react';
import { UnderwaterCreature } from '../types';
import { 
  X, Heart, Bookmark, MapPin, Camera, Sparkles, MessageSquare, 
  Bot, Send, ShieldAlert, Waves, Info, Layers, RefreshCw, Check 
} from 'lucide-react';

interface CreatureDetailModalProps {
  creature: UnderwaterCreature | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  hasLiked: boolean;
}

export const CreatureDetailModal: React.FC<CreatureDetailModalProps> = ({
  creature,
  onClose,
  isFavorite,
  onToggleFavorite,
  onLike,
  hasLiked,
}) => {
  if (!creature) return null;

  const [activeTab, setActiveTab] = useState<'overview' | 'camera' | 'ai-biologist'>('overview');
  
  // AI Chat state
  const [userQuestion, setUserQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'biologist'; text: string }>>([
    {
      role: 'biologist',
      text: `Hello ocean explorer! I am Dr. Nautilus, your AI Marine Biologist guide. Feel free to ask me anything about the **${creature.title}** (*${creature.scientificName}*)!`
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleSendQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userQuestion.trim() || isAiLoading) return;

    const questionText = userQuestion.trim();
    setUserQuestion('');
    setAiError(null);

    // Append user question
    setChatMessages((prev) => [...prev, { role: 'user', text: questionText }]);
    setIsAiLoading(true);

    try {
      const res = await fetch('/api/gemini/ask-biologist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creature,
          userQuestion: questionText,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to receive answer from Marine Biologist AI');
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'biologist', text: data.answer },
      ]);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error connecting to Marine Biologist AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setUserQuestion(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800 text-slate-200">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/80 uppercase tracking-wider">
              {creature.category}
            </span>
            <span className="text-xs text-slate-400 border-l border-slate-800 pl-3">
              Added {new Date(creature.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => onToggleFavorite(creature.id, e)}
              className={`p-2 rounded-xl transition-all border ${
                isFavorite
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Save to bookmarks"
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={(e) => onLike(creature.id, e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                hasLiked
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current text-rose-400' : ''}`} />
              <span>{creature.likes}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content Body: Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          
          {/* Left Column: Photo Showcase */}
          <div className="lg:col-span-7 bg-slate-950 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 group shadow-xl">
              <img
                src={creature.imageUrl}
                alt={creature.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[480px] object-cover"
              />
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{creature.location}</span>
              </div>
            </div>

            {/* Photographer Credit & Quick Info */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-teal-400" />
                <div>
                  <p className="font-semibold text-slate-200">Captured by {creature.photographer}</p>
                  <p className="text-slate-400 text-[11px]">Date: {creature.dateTaken}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-cyan-300">{creature.depthRange}</p>
                <p className="text-slate-400 text-[11px]">{creature.depthZone} Zone</p>
              </div>
            </div>
          </div>

          {/* Right Column: Metadata & AI Assistant Tabs */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900">
            
            {/* Nav Tabs */}
            <div className="flex border-b border-slate-800 px-6 pt-4 gap-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'overview'
                    ? 'border-cyan-400 text-cyan-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>Biology</span>
              </button>

              <button
                onClick={() => setActiveTab('camera')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'camera'
                    ? 'border-cyan-400 text-cyan-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Camera Specs</span>
              </button>

              <button
                onClick={() => setActiveTab('ai-biologist')}
                className={`pb-3 border-b-2 transition-all flex items-center gap-1.5 ${
                  activeTab === 'ai-biologist'
                    ? 'border-teal-400 text-teal-300 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4 text-teal-400 animate-pulse" />
                <span>AI Biologist</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 flex-1 overflow-y-auto">
              
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-5 text-sm text-slate-300">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-100">{creature.title}</h2>
                    <p className="text-sm italic font-serif text-cyan-400">{creature.scientificName}</p>
                  </div>

                  {/* Conservation Status Card */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 uppercase font-semibold">Conservation Status</p>
                      <p className="text-sm font-bold text-amber-300">{creature.conservationStatus}</p>
                    </div>
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Description</h4>
                    <p className="leading-relaxed text-slate-300 text-xs sm:text-sm">{creature.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium mb-1">Habitat</p>
                      <p className="text-xs text-slate-200 font-semibold">{creature.habitat}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <p className="text-xs text-slate-400 font-medium mb-1">Primary Diet</p>
                      <p className="text-xs text-slate-200 font-semibold">{creature.diet}</p>
                    </div>
                  </div>

                  {creature.behaviorNotes && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Behavior Notes</h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                        {creature.behaviorNotes}
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {creature.tags && creature.tags.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {creature.tags.map((tag, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. CAMERA SPECS TAB */}
              {activeTab === 'camera' && (
                <div className="space-y-4 text-xs text-slate-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Camera className="w-5 h-5 text-cyan-400" />
                    <h3 className="text-base font-bold text-slate-100">Photography Equipment & EXIF Data</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Camera Body:</span>
                      <span className="font-semibold text-slate-100">{creature.cameraEquipment.camera || 'N/A'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Lens & Optics:</span>
                      <span className="font-semibold text-slate-100">{creature.cameraEquipment.lens || 'N/A'}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between">
                      <span className="text-slate-400">Strobe / Lighting:</span>
                      <span className="font-semibold text-slate-100">{creature.cameraEquipment.lighting || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2">
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Aperture</p>
                        <p className="font-bold text-cyan-300">{creature.cameraEquipment.aperture || 'N/A'}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase">Shutter</p>
                        <p className="font-bold text-cyan-300">{creature.cameraEquipment.shutterSpeed || 'N/A'}</p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                        <p className="text-[10px] text-slate-400 uppercase">ISO</p>
                        <p className="font-bold text-cyan-300">{creature.cameraEquipment.iso || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. AI BIOLOGIST TAB */}
              {activeTab === 'ai-biologist' && (
                <div className="flex flex-col h-[400px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-100">Dr. Nautilus (AI Marine Biologist)</p>
                        <p className="text-[10px] text-teal-400">Powered by Gemini 3.6 Flash</p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                            msg.role === 'user'
                              ? 'bg-cyan-600 text-white rounded-br-none'
                              : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}

                    {isAiLoading && (
                      <div className="flex items-center gap-2 text-teal-400 text-xs p-3 bg-slate-950 rounded-xl border border-slate-800 animate-pulse">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Dr. Nautilus is consulting research archives...</span>
                      </div>
                    )}

                    {aiError && (
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs">
                        {aiError}
                      </div>
                    )}
                  </div>

                  {/* Suggested Prompts */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion(`What makes the ${creature.title} unique?`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      💡 Why is it unique?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion(`How does ${creature.title} protect itself from predators?`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      🛡️ Defense mechanisms?
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickQuestion(`Where are the best scuba diving spots to see the ${creature.title}?`)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      🥽 Best dive spots?
                    </button>
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendQuestion} className="flex gap-2">
                    <input
                      type="text"
                      value={userQuestion}
                      onChange={(e) => setUserQuestion(e.target.value)}
                      placeholder={`Ask Dr. Nautilus about ${creature.title}...`}
                      className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="submit"
                      disabled={isAiLoading || !userQuestion.trim()}
                      className="px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
