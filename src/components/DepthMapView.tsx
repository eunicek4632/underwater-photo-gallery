import React from 'react';
import { UnderwaterCreature, DepthZone } from '../types';
import { CreatureCard } from './CreatureCard';
import { Sun, Sunset, Moon, Anchor } from 'lucide-react';

interface DepthMapViewProps {
  creatures: UnderwaterCreature[];
  onSelectCreature: (creature: UnderwaterCreature) => void;
  favorites: string[];
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onLike: (id: string, e: React.MouseEvent) => void;
  userLikes: string[];
}

export const DepthMapView: React.FC<DepthMapViewProps> = ({
  creatures,
  onSelectCreature,
  favorites,
  onToggleFavorite,
  onLike,
  userLikes,
}) => {
  const sunlightCreatures = creatures.filter((c) => c.depthZone === 'Sunlight');
  const twilightCreatures = creatures.filter((c) => c.depthZone === 'Twilight');
  const midnightCreatures = creatures.filter((c) => c.depthZone === 'Midnight');

  return (
    <div className="space-y-12">
      
      {/* 1. Sunlight Zone */}
      <section className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-800/40 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-cyan-800/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Sunlight Zone (Epipelagic)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                  0m - 20m
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Shallow waters warmed by sunlight where corals, sea turtles, and vibrant reef life thrive.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {sunlightCreatures.length} Photos
          </span>
        </div>

        {sunlightCreatures.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No creatures in the Sunlight Zone match current filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sunlightCreatures.map((creature) => (
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
      </section>

      {/* 2. Twilight Zone */}
      <section className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-950 border border-indigo-900/40 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-indigo-900/40 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Sunset className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Twilight Zone (Mesopelagic)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono">
                  20m - 200m
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Dimly lit realm of steep drop-offs, pelagic hunters, and deep gorgonian fans.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {twilightCreatures.length} Photos
          </span>
        </div>

        {twilightCreatures.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No creatures in the Twilight Zone match current filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {twilightCreatures.map((creature) => (
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
      </section>

      {/* 3. Midnight Zone */}
      <section className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-b from-purple-950/80 via-slate-950 to-slate-950 border border-purple-900/50 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-purple-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <Moon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Midnight Zone (Bathypelagic)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono">
                  200m+ Depth
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pitch-black deep ocean waters populated by bioluminescent species and rare expedition finds.
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {midnightCreatures.length} Photos
          </span>
        </div>

        {midnightCreatures.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No creatures in the Midnight Zone match current filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {midnightCreatures.map((creature) => (
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
      </section>

    </div>
  );
};
