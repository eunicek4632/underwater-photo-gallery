import React, { useState, useEffect } from 'react';
import { UnderwaterCreature, ActiveViewMode } from './types';
import { INITIAL_CREATURES } from './data/initialCreatures';
import { Header } from './components/Header';
import { VisitorGallery } from './components/VisitorGallery';
import { AdminDashboard } from './components/AdminDashboard';
import { CreatureDetailModal } from './components/CreatureDetailModal';

const LOCAL_STORAGE_CREATURES_KEY = 'subsea_gallery_creatures_v1';
const LOCAL_STORAGE_FAVORITES_KEY = 'subsea_gallery_favorites_v1';
const LOCAL_STORAGE_LIKES_KEY = 'subsea_gallery_user_likes_v1';

export default function App() {
  // Load initial creatures from localStorage or default
  const [creatures, setCreatures] = useState<UnderwaterCreature[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CREATURES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse creatures from localStorage', e);
    }
    return INITIAL_CREATURES;
  });

  // Load saved favorites
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse favorites from localStorage', e);
    }
    return ['creature-1', 'creature-4'];
  });

  // Track liked IDs
  const [userLikes, setUserLikes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse likes from localStorage', e);
    }
    return [];
  });

  const [activeView, setActiveView] = useState<ActiveViewMode>('visitor');
  const [selectedCreature, setSelectedCreature] = useState<UnderwaterCreature | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_CREATURES_KEY, JSON.stringify(creatures));
    } catch (e) {
      console.error(e);
    }
  }, [creatures]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error(e);
    }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(userLikes));
    } catch (e) {
      console.error(e);
    }
  }, [userLikes]);

  // Handlers
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleLike = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const hasLiked = userLikes.includes(id);

    if (hasLiked) {
      setUserLikes((prev) => prev.filter((item) => item !== id));
      setCreatures((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likes: Math.max(0, c.likes - 1) } : c))
      );
    } else {
      setUserLikes((prev) => [...prev, id]);
      setCreatures((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c))
      );
    }
  };

  const handleAddCreature = (newCreature: UnderwaterCreature) => {
    setCreatures((prev) => [newCreature, ...prev]);
  };

  const handleUpdateCreature = (updated: UnderwaterCreature) => {
    setCreatures((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    if (selectedCreature?.id === updated.id) {
      setSelectedCreature(updated);
    }
  };

  const handleDeleteCreature = (id: string) => {
    setCreatures((prev) => prev.filter((c) => c.id !== id));
    setFavorites((prev) => prev.filter((item) => item !== id));
    if (selectedCreature?.id === id) {
      setSelectedCreature(null);
    }
  };

  const handleResetToDefault = () => {
    if (confirm('Are you sure you want to reset the gallery to the initial 10 default creature photos?')) {
      setCreatures(INITIAL_CREATURES);
      localStorage.removeItem(LOCAL_STORAGE_CREATURES_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Header Bar */}
      <Header
        activeView={activeView}
        setActiveView={setActiveView}
        totalCreatures={creatures.length}
        favoritesCount={favorites.length}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'visitor' ? (
          <VisitorGallery
            creatures={creatures}
            onSelectCreature={setSelectedCreature}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onLike={handleLike}
            userLikes={userLikes}
            showFavoritesOnly={showFavoritesOnly}
            setShowFavoritesOnly={setShowFavoritesOnly}
          />
        ) : (
          <AdminDashboard
            creatures={creatures}
            onAddCreature={handleAddCreature}
            onUpdateCreature={handleUpdateCreature}
            onDeleteCreature={handleDeleteCreature}
            onResetToDefault={handleResetToDefault}
          />
        )}
      </main>

      {/* Creature Detail Lightbox Modal */}
      <CreatureDetailModal
        creature={selectedCreature}
        onClose={() => setSelectedCreature(null)}
        isFavorite={selectedCreature ? favorites.includes(selectedCreature.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onLike={handleLike}
        hasLiked={selectedCreature ? userLikes.includes(selectedCreature.id) : false}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Subsea Gallery • Underwater Marine Photography</p>
          <p className="text-slate-600">Built for marine life enthusiasts, researchers, and underwater photographers</p>
        </div>
      </footer>

    </div>
  );
}
