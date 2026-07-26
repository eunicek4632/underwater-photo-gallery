import React, { useState } from 'react';
import { UnderwaterCreature, CategoryType, ConservationStatus } from '../types';
import { X, Check, Camera, Image as ImageIcon, MapPin, Layers, ShieldAlert, Tag, Save } from 'lucide-react';

interface CreatureEditModalProps {
  creature: UnderwaterCreature;
  onClose: () => void;
  onSave: (updated: UnderwaterCreature) => void;
}

const CATEGORIES: Exclude<CategoryType, 'All'>[] = [
  'Coral Reef',
  'Pelagic & Predators',
  'Macro',
  'Nudibranchs & Mollusks',
  'Deep Sea',
  'Crustaceans',
];

const CONSERVATION_STATUSES: ConservationStatus[] = [
  'Least Concern',
  'Near Threatened',
  'Vulnerable',
  'Endangered',
  'Critically Endangered',
  'Data Deficient',
];

export const CreatureEditModal: React.FC<CreatureEditModalProps> = ({
  creature,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<UnderwaterCreature>({ ...creature });
  const [tagInput, setTagInput] = useState(creature.tags.join(', '));

  const handleChange = (field: keyof UnderwaterCreature, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCameraChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      cameraEquipment: {
        ...prev.cameraEquipment,
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedTags = tagInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    onSave({
      ...formData,
      tags: updatedTags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 text-slate-100">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span>Edit Creature Details</span>
            <span className="text-xs font-mono text-cyan-400">#{creature.id}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          
          {/* Main Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Common Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Scientific Name *</label>
              <input
                type="text"
                required
                value={formData.scientificName}
                onChange={(e) => handleChange('scientificName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 italic focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Conservation Status</label>
              <select
                value={formData.conservationStatus}
                onChange={(e) => handleChange('conservationStatus', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {CONSERVATION_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Depth Range (e.g. 5-30m)</label>
              <input
                type="text"
                value={formData.depthRange}
                onChange={(e) => handleChange('depthRange', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Location / Dive Site</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Image URL</label>
            <input
              type="text"
              required
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Biological Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Camera specs */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Camera Specs</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 mb-1">Camera</label>
                <input
                  type="text"
                  value={formData.cameraEquipment.camera || ''}
                  onChange={(e) => handleCameraChange('camera', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Lens</label>
                <input
                  type="text"
                  value={formData.cameraEquipment.lens || ''}
                  onChange={(e) => handleCameraChange('lens', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Strobe / Light</label>
                <input
                  type="text"
                  value={formData.cameraEquipment.lighting || ''}
                  onChange={(e) => handleCameraChange('lighting', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/50"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
