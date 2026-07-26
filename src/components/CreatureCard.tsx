import React from 'react';
import { UnderwaterCreature } from '../types';
import { MapPin, Heart, Bookmark, Eye, Camera, ShieldAlert, Sparkles, Waves } from 'lucide-react';

interface CreatureCardProps {
  creature: UnderwaterCreature;
  onSelect: (creature: UnderwaterCreature) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  hasLiked: boolean;
}

export const CreatureCard: React.FC<CreatureCardProps> = ({
  creature,
  onSelect,
  isFavorite,
  onToggleFavorite,
  onLike,
  hasLiked,
}) => {
  // Conservation status colors
  const getConservationColor = (status: string) => {
    switch (status) {
      case 'Critically Endangered':
      case 'Endangered':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'Vulnerable':
      case 'Near Threatened':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
    }
  };

  return (
    <div
      id={`creature-card-${creature.id}`}
      onClick={() => onSelect(creature)}
      className="group relative bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-cyan-950/40 transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Photo Banner with Depth Overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        <img
          src={creature.imageUrl}
          alt={creature.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border border-cyan-500/30 bg-slate-950/70 text-cyan-300 backdrop-blur-md shadow-sm">
            {creature.depthRange}
          </span>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Featured Badge */}
            {creature.featured && (
              <span className="p-1.5 rounded-full bg-amber-500/80 text-amber-950 shadow-md backdrop-blur-md" title="Featured Photo">
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              </span>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => onToggleFavorite(creature.id, e)}
              className={`p-1.5 rounded-full transition-all border backdrop-blur-md ${
                isFavorite
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                  : 'bg-slate-900/70 text-slate-300 border-slate-700/60 hover:text-rose-400 hover:bg-slate-900'
              }`}
              title={isFavorite ? 'Remove from saved' : 'Save to collection'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {/* Hover View overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Bottom Location & Category */}
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-xs text-slate-200">
          <div className="flex items-center gap-1 text-slate-300 bg-slate-950/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800/60 truncate max-w-[70%]">
            <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="truncate">{creature.location}</span>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 text-[10px] font-semibold tracking-wide border border-cyan-800/50 uppercase">
            {creature.category}
          </span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Title & Scientific Name */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
              {creature.title}
            </h3>
            <p className="text-xs italic text-cyan-400/80 font-serif line-clamp-1">
              {creature.scientificName}
            </p>
          </div>

          {/* Description snippet */}
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {creature.description}
          </p>
        </div>

        {/* Footer Meta Details */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          
          {/* Conservation pill */}
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getConservationColor(
              creature.conservationStatus
            )}`}
          >
            {creature.conservationStatus}
          </span>

          {/* Like Counter & View Prompt */}
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => onLike(creature.id, e)}
              className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                hasLiked ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
              <span>{creature.likes}</span>
            </button>

            <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
              <Eye className="w-3.5 h-3.5" />
              <span className="text-[11px]">View</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
