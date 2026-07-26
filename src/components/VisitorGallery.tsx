import React, { useState, useMemo } from 'react';
import { UnderwaterCreature, FilterState, CategoryType } from '../types';
import { CreatureCard } from './CreatureCard';
import { 
  Search, SlidersHorizontal, ArrowUpDown, X, Layers, Grid, Waves, 
  Sparkles, Filter, Bookmark, ShieldAlert 
} from 'lucide-react';

interface VisitorGalleryProps {
  creatures: UnderwaterCreature[];
  onSelectCreature: (creature: UnderwaterCreature) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  userLikes: string[];
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
}

const CATEGORIES: CategoryType[] = [
  'All',
  'Coral Reef',
  'Pelagic & Predators',
  'Macro',
  'Nudibranchs & Mollusks',
  'Deep Sea',
  'Crustaceans',
];

export const VisitorGallery: React.FC<VisitorGalleryProps> = ({
  creatures,
  onSelectCreature,
  favorites,
  onToggleFavorite,
  onLike,
  userLikes,
  showFavoritesOnly,
  setShowFavoritesOnly,
}) => {
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    conservationStatus: 'All',
    sortBy: 'newest',
  });

  // Filter and Sort Logic
  const filteredCreatures = useMemo(() => {
    return creatures
      .filter((item) => {
        // Saved/Favorites filter
        if (showFavoritesOnly && !favorites.includes(item.id)) {
          return false;
        }

        // Search Query
        if (filterState.searchQuery.trim()) {
          const q = filterState.searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSci = item.scientificName.toLowerCase().includes(q);
          const matchLocation = item.location.toLowerCase().includes(q);
          const matchPhotographer = item.photographer.toLowerCase().includes(q);
          const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
          const matchDescription = item.description.toLowerCase().includes(q);

          if (!matchTitle && !matchSci && !matchLocation && !matchPhotographer && !matchTags && !matchDescription) {
            return false;
          }
        }

        // Category
        if (filterState.category !== 'All' && item.category !== filterState.category) {
          return false;
        }

        // Conservation Status
        if (filterState.conservationStatus !== 'All' && item.conservationStatus !== filterState.conservationStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filterState.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filterState.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (filterState.sortBy === 'likes') {
          return b.likes - a.likes;
        }
        if (filterState.sortBy === 'name') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [creatures, filterState, favorites, showFavoritesOnly]);

  const hasActiveFilters = 
    filterState.searchQuery !== '' ||
    filterState.category !== 'All' ||
    filterState.conservationStatus !== 'All' ||
    showFavoritesOnly;

  const resetFilters = () => {
    setFilterState({
      searchQuery: '',
      category: 'All',
      conservationStatus: 'All',
      sortBy: 'newest',
    });
    setShowFavoritesOnly(false);
  };

  return (
    <div className="space-y-8">
      
      {/* Search & Filter Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        
        {/* Top Row: Search input + Sort */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="visitor-search-input"
              type="text"
              value={filterState.searchQuery}
              onChange={(e) => setFilterState((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search creature, scientific name, location, photographer..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => setFilterState((prev) => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Controls: Sort selector */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                id="visitor-sort-select"
                value={filterState.sortBy}
                onChange={(e) => setFilterState((prev) => ({ ...prev, sortBy: e.target.value as any }))}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-slate-900">Newest Uploads</option>
                <option value="likes" className="bg-slate-900">Most Liked</option>
                <option value="name" className="bg-slate-900">Name (A - Z)</option>
                <option value="oldest" className="bg-slate-900">Oldest First</option>
              </select>
            </div>
          </div>

        </div>

        {/* Categories Horizontal Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span>Creature Category</span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 subsea-scrollbar">
            {CATEGORIES.map((cat) => {
              const isSelected = filterState.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterState((prev) => ({ ...prev, category: cat }))}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Summary */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
          <div>
            Showing <span className="text-cyan-300 font-bold">{filteredCreatures.length}</span> of {creatures.length} creature photos
            {showFavoritesOnly && <span className="ml-2 text-rose-400 font-semibold">(Saved Favorites Only)</span>}
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      {filteredCreatures.length === 0 ? (
        <div className="text-center py-16 px-4 bg-slate-900/50 border border-slate-800 rounded-3xl">
          <Waves className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">No underwater creatures found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            We couldn't find any photos matching your current search or filter combination.
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreatures.map((creature) => (
            <CreatureCard
              key={creature.id}
              creature={creature}
              onSelect={onSelectCreature}
              isFavorite={favorites.includes(creature.id)}
              onToggleFavorite={onToggleFavorite}
              onLike={onLike}
              hasLiked={userLikes.includes(creature.id)}
            />
          ))}
        </div>
      )}

    </div>
  );
};
