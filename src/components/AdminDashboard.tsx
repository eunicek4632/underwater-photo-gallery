import React, { useState, useEffect } from 'react';
import { UnderwaterCreature, AdminTab, CategoryType, ConservationStatus } from '../types';
import { CreatureEditModal } from './CreatureEditModal';
import { 
  Upload, Plus, Sparkles, Image as ImageIcon, Trash2, Edit3, 
  RefreshCw, Check, AlertCircle, Camera, Layers, ShieldCheck, 
  BarChart2, Star, Eye, Filter, Search, Waves, Save, CheckCircle2,
  KeyRound, Fingerprint, Smartphone, Lock, ShieldAlert, UserCheck
} from 'lucide-react';
import {
  getAdminSecurityConfig,
  saveAdminSecurityConfig,
  hashSHA256,
  derivePBKDF2Hash,
  generateRandomSalt,
  registerPasskey,
  isWebAuthnSupported,
  verifyTOTPCode,
} from '../utils/auth';

interface AdminDashboardProps {
  creatures: UnderwaterCreature[];
  onAddCreature: (newCreature: UnderwaterCreature) => void;
  onUpdateCreature: (updated: UnderwaterCreature) => void;
  onDeleteCreature: (id: string) => void;
  onResetToDefault: () => void;
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

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  creatures,
  onAddCreature,
  onUpdateCreature,
  onDeleteCreature,
  onResetToDefault,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('upload');
  const [editingCreature, setEditingCreature] = useState<UnderwaterCreature | null>(null);
  const [searchManageQuery, setSearchManageQuery] = useState('');
  
  // Form State
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80');
  const [title, setTitle] = useState('');
  const [scientificName, setScientificName] = useState('');
  const [category, setCategory] = useState<Exclude<CategoryType, 'All'>>('Coral Reef');
  const [depthRange, setDepthRange] = useState('5 - 25 meters');
  const [location, setLocation] = useState('Raja Ampat, Indonesia');
  const [conservationStatus, setConservationStatus] = useState<ConservationStatus>('Least Concern');
  const [description, setDescription] = useState('');
  const [habitat, setHabitat] = useState('');
  const [diet, setDiet] = useState('');
  const [behaviorNotes, setBehaviorNotes] = useState('');
  
  // Camera Specs
  const [camera, setCamera] = useState('Sony Alpha a7R IV');
  const [lens, setLens] = useState('90mm f/2.8 Macro');
  const [lighting, setLighting] = useState('Dual Inon Strobes');
  const [aperture, setAperture] = useState('f/11');
  const [shutterSpeed, setShutterSpeed] = useState('1/200s');
  const [iso, setIso] = useState('ISO 100');
  
  const [photographer, setPhotographer] = useState('Capt. Elena Vance');
  const [dateTaken, setDateTaken] = useState(new Date().toISOString().split('T')[0]);
  const [tagsInput, setTagsInput] = useState('Underwater, Coral, Macro');
  const [featured, setFeatured] = useState(false);

  // AI Extraction state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Security & Authentication Tab State
  const [secUsername, setSecUsername] = useState('admin');
  const [secPassword, setSecPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [totpSecret, setTotpSecret] = useState('JBSWY3DPEHPK3PXP');
  const [totpTestCode, setTotpTestCode] = useState('');
  const [passkeyActive, setPasskeyActive] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [secSuccess, setSecSuccess] = useState<string | null>(null);
  const [secError, setSecError] = useState<string | null>(null);

  useEffect(() => {
    getAdminSecurityConfig().then((config) => {
      setIs2FAActive(config.is2FAEnabled);
      setTotpSecret(config.totpSecret || 'JBSWY3DPEHPK3PXP');
      setPasskeyActive(config.passkeyRegistered);
    });
    isWebAuthnSupported().then(setPasskeySupported);
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecError(null);
    setSecSuccess(null);

    if (secPassword && secPassword !== secConfirmPassword) {
      setSecError('Passwords do not match.');
      return;
    }

    try {
      const config = await getAdminSecurityConfig();
      const salt = generateRandomSalt();
      const usernameHash = await hashSHA256(secUsername || 'admin');

      let passwordSalt = config.passwordSalt;
      let passwordHash = config.passwordHash;

      if (secPassword.trim().length > 0) {
        passwordSalt = salt;
        passwordHash = await derivePBKDF2Hash(secPassword, salt);
      }

      const updated = {
        ...config,
        usernameHash,
        passwordSalt,
        passwordHash,
        updatedAt: Date.now(),
      };

      await saveAdminSecurityConfig(updated);
      setSecSuccess('Security credentials updated with PBKDF2 salt & hash.');
      setSecPassword('');
      setSecConfirmPassword('');
    } catch (err) {
      setSecError('Failed to update credentials.');
    }
  };

  const handleToggle2FA = async () => {
    setSecError(null);
    setSecSuccess(null);

    if (!is2FAActive) {
      // Verifying code before enabling 2FA
      if (!totpTestCode || totpTestCode.length !== 6) {
        setSecError('Enter a 6-digit verification code from your authenticator to enable 2FA.');
        return;
      }

      const isValid = await verifyTOTPCode(totpSecret, totpTestCode);
      if (!isValid) {
        setSecError('Invalid 2FA test code. Please check your authenticator app.');
        return;
      }
    }

    try {
      const config = await getAdminSecurityConfig();
      const nextState = !is2FAActive;
      config.is2FAEnabled = nextState;
      config.totpSecret = totpSecret;
      await saveAdminSecurityConfig(config);
      setIs2FAActive(nextState);
      setTotpTestCode('');
      setSecSuccess(nextState ? '2-Factor Authentication (2FA) is now ENABLED.' : '2FA has been disabled.');
    } catch (err) {
      setSecError('Failed to update 2FA status.');
    }
  };

  const handleRegisterPasskey = async () => {
    setSecError(null);
    setSecSuccess(null);
    try {
      const ok = await registerPasskey(secUsername || 'admin');
      if (ok) {
        setPasskeyActive(true);
        setSecSuccess('Biometric Passkey registered successfully! You can now login with Touch ID/Face ID/Security Key.');
      } else {
        setSecError('Passkey pairing failed or was cancelled.');
      }
    } catch (err) {
      setSecError('Passkey error.');
    }
  };

  // Handle local file drop/select to base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // AI Auto-Extract Creature Metadata
  const handleAiAutoIdentify = async () => {
    setIsAiProcessing(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const isBase64 = imageUrl.startsWith('data:image');
      const payload: any = {
        descriptionPrompt: aiPrompt.trim() || title || 'Identify this underwater creature from photo.',
      };

      if (isBase64) {
        payload.imageBase64 = imageUrl;
        payload.mimeType = imageUrl.substring(imageUrl.indexOf(':') + 1, imageUrl.indexOf(';'));
      }

      const res = await fetch('/api/gemini/identify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'AI Auto-Extract failed.');
      }

      const data = json.data;
      if (data.title) setTitle(data.title);
      if (data.scientificName) setScientificName(data.scientificName);
      if (data.category && CATEGORIES.includes(data.category)) setCategory(data.category);
      if (data.depthRange) setDepthRange(data.depthRange);
      if (data.location) setLocation(data.location);
      if (data.conservationStatus && CONSERVATION_STATUSES.includes(data.conservationStatus)) {
        setConservationStatus(data.conservationStatus);
      }
      if (data.description) setDescription(data.description);
      if (data.habitat) setHabitat(data.habitat);
      if (data.diet) setDiet(data.diet);
      if (data.behaviorNotes) setBehaviorNotes(data.behaviorNotes);

      if (data.cameraEquipment) {
        if (data.cameraEquipment.camera) setCamera(data.cameraEquipment.camera);
        if (data.cameraEquipment.lens) setLens(data.cameraEquipment.lens);
        if (data.cameraEquipment.lighting) setLighting(data.cameraEquipment.lighting);
        if (data.cameraEquipment.aperture) setAperture(data.cameraEquipment.aperture);
        if (data.cameraEquipment.shutterSpeed) setShutterSpeed(data.cameraEquipment.shutterSpeed);
        if (data.cameraEquipment.iso) setIso(data.cameraEquipment.iso);
      }

      if (data.suggestedTags && Array.isArray(data.suggestedTags)) {
        setTagsInput(data.suggestedTags.join(', '));
      }

      setAiSuccessMessage(`✨ AI auto-populated biological and photography details for "${data.title || 'Creature'}"!`);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'AI Auto-Extract error.');
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Submit new photo entry
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newEntry: UnderwaterCreature = {
      id: `creature-${Date.now()}`,
      title: title.trim() || 'Untitled Underwater Creature',
      scientificName: scientificName.trim() || 'Species incertae sedis',
      category,
      imageUrl,
      depthRange: depthRange.trim() || '1 - 20 meters',
      location: location.trim() || 'Unspecified Ocean Site',
      conservationStatus,
      description: description.trim() || 'No description provided.',
      habitat: habitat.trim() || 'Tropical Marine Reef',
      diet: diet.trim() || 'Zooplankton and small marine organisms',
      behaviorNotes: behaviorNotes.trim(),
      cameraEquipment: {
        camera,
        lens,
        lighting,
        aperture,
        shutterSpeed,
        iso,
      },
      photographer: photographer.trim() || 'Anonymous Photographer',
      dateTaken,
      tags: parsedTags.length > 0 ? parsedTags : ['Marine Life'],
      likes: 0,
      featured,
      createdAt: new Date().toISOString(),
    };

    onAddCreature(newEntry);
    setSubmitSuccess(true);
    setTimeout(() => setSubmitSuccess(false), 4000);

    // Reset form fields
    setTitle('');
    setScientificName('');
    setDescription('');
    setHabitat('');
    setDiet('');
    setBehaviorNotes('');
  };

  // Filtered list for manage tab
  const managedCreatures = creatures.filter((c) => {
    if (!searchManageQuery.trim()) return true;
    const q = searchManageQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.scientificName.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      
      {/* Admin Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950 to-slate-900 border border-cyan-900/60 rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-widest">
              Admin Portal
            </span>
            <span className="text-xs text-slate-400">Manage Subsea Gallery Photos</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Underwater Photo Upload & Curation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Add new high-resolution creature photos with biological metadata, or use Gemini AI to auto-extract species details.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="p-1 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center gap-1">
          <button
            id="admin-tab-upload"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Photo</span>
          </button>

          <button
            id="admin-tab-manage"
            onClick={() => setActiveTab('manage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Manage Gallery ({creatures.length})</span>
          </button>

          <button
            id="admin-tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'analytics'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Analytics</span>
          </button>

          <button
            id="admin-tab-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'security'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4 text-cyan-300" />
            <span>Auth & Security</span>
          </button>
        </div>
      </div>

      {/* SUCCESS TOAST */}
      {submitSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-sm font-semibold flex items-center gap-3 animate-fade-in shadow-xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>New underwater creature photo successfully uploaded and published to the gallery!</span>
        </div>
      )}

      {/* TAB 1: UPLOAD PHOTO */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Form Side */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* AI Auto Extract Box */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/80 via-slate-950 to-slate-950 border border-teal-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">✨ AI Auto-Extract Species Details</h3>
                    <p className="text-[11px] text-teal-400">Powered by Gemini 3.6 Flash</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAiAutoIdentify}
                  disabled={isAiProcessing}
                  className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-teal-950/50"
                >
                  {isAiProcessing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Identify</span>
                    </>
                  )}
                </button>
              </div>

              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Optional prompt hint (e.g. 'Pygmy seahorse in Lembeh Strait at 25 meters')"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />

              {aiError && (
                <p className="text-xs text-rose-400 bg-rose-950/50 p-2 rounded-lg border border-rose-800">{aiError}</p>
              )}
              {aiSuccessMessage && (
                <p className="text-xs text-teal-300 bg-teal-950/50 p-2 rounded-lg border border-teal-800">{aiSuccessMessage}</p>
              )}
            </div>

            {/* Photo Upload Input */}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Photo Source (Upload File or Image URL)
                </label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Local File Drop */}
                  <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-2xl p-4 text-center cursor-pointer transition-colors flex flex-col items-center justify-center bg-slate-950/50">
                    <Upload className="w-6 h-6 text-cyan-400 mb-1" />
                    <span className="text-xs font-semibold text-slate-200">Select Image File</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, WEBP up to 10MB</span>
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {/* Direct Image URL */}
                  <div>
                    <input
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Or paste image URL (e.g. Unsplash)"
                      className="w-full h-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                </div>
              </div>

              {/* Title & Scientific Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Common Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Hawksbill Sea Turtle"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Scientific Name *</label>
                  <input
                    type="text"
                    required
                    value={scientificName}
                    onChange={(e) => setScientificName(e.target.value)}
                    placeholder="e.g. Eretmochelys imbricata"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 italic focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Category & Conservation Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Conservation Status</label>
                  <select
                    value={conservationStatus}
                    onChange={(e) => setConservationStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {CONSERVATION_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Depth Range & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Depth Range (e.g. 10 - 25m)</label>
                  <input
                    type="text"
                    value={depthRange}
                    onChange={(e) => setDepthRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Dive Site / Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Descriptions & Habitat */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Biological Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key physical traits, significance, or fascinating details..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Habitat</label>
                  <input
                    type="text"
                    value={habitat}
                    onChange={(e) => setHabitat(e.target.value)}
                    placeholder="e.g. Coral drop-offs & shallow reef ledges"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Diet</label>
                  <input
                    type="text"
                    value={diet}
                    onChange={(e) => setDiet(e.target.value)}
                    placeholder="e.g. Sponges, sea anemones, and soft corals"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Date Taken */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Date Taken</label>
                <input
                  type="date"
                  value={dateTaken}
                  onChange={(e) => setDateTaken(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                />
              </div>

              {/* Tags & Featured checkbox */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="w-full sm:w-2/3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-4 sm:pt-0">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-950 border-slate-800"
                  />
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                    Feature in Gallery
                  </span>
                </label>
              </div>

              {/* Form Submit Button */}
              <div className="pt-4 border-t border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-cyan-950/50 flex items-center gap-2 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Publish Creature Photo</span>
                </button>
              </div>

            </form>

          </div>

          {/* Right Side: Live Card Preview */}
          <div className="lg:col-span-4 space-y-4">
            <div className="sticky top-28 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Live Visitor Card Preview</span>
                </h3>
                <span className="text-[10px] text-cyan-400 uppercase font-mono">Realtime</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <img
                    src={imageUrl || 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80'}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-cyan-300 font-semibold border border-cyan-800">
                    {depthRange || '10 - 30m'}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-300">
                    <span className="truncate bg-slate-950/80 px-2 py-0.5 rounded-md border border-slate-800">
                      📍 {location || 'Raja Ampat'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950/80 text-cyan-300 text-[9px] font-bold border border-cyan-800 uppercase">
                      {category}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-slate-100 text-sm">{title || 'Sample Creature Title'}</h4>
                  <p className="text-xs italic text-cyan-400">{scientificName || 'Scientific name'}</p>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {description || 'Biological description snippet will appear here as you type.'}
                  </p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{conservationStatus}</span>
                    <span>By {photographer}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: MANAGE GALLERY */}
      {activeTab === 'manage' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          
          {/* Header & Reset Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchManageQuery}
                onChange={(e) => setSearchManageQuery(e.target.value)}
                placeholder="Filter entries in table..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100"
              />
            </div>

            <button
              onClick={onResetToDefault}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Reset Gallery to Initial Sample Dataset</span>
            </button>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Photo</th>
                  <th className="p-3.5">Title & Scientific Name</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Depth Range</th>
                  <th className="p-3.5">Likes</th>
                  <th className="p-3.5">Featured</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {managedCreatures.map((creature) => (
                  <tr key={creature.id} className="hover:bg-slate-950/50 transition-colors">
                    <td className="p-3.5">
                      <img
                        src={creature.imageUrl}
                        alt={creature.title}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-800"
                      />
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-slate-100">{creature.title}</p>
                      <p className="italic text-[11px] text-cyan-400">{creature.scientificName}</p>
                      <p className="text-[10px] text-slate-500">📍 {creature.location}</p>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-cyan-300 border border-slate-800 font-medium">
                        {creature.category}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="text-slate-300">{creature.depthRange}</span>
                    </td>
                    <td className="p-3.5 font-bold text-rose-300">
                      ♥ {creature.likes}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={() =>
                          onUpdateCreature({
                            ...creature,
                            featured: !creature.featured,
                          })
                        }
                        className={`p-1.5 rounded-lg border transition-all ${
                          creature.featured
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-500 border-slate-800'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${creature.featured ? 'fill-current' : ''}`} />
                      </button>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <button
                        onClick={() => setEditingCreature(creature)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${creature.title}"?`)) {
                            onDeleteCreature(creature.id);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: ANALYTICS & QUICK STATS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <p className="text-xs text-slate-400 font-medium">Total Gallery Photos</p>
            <p className="text-3xl font-extrabold text-cyan-300 mt-2">{creatures.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">High resolution underwater captures</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <p className="text-xs text-slate-400 font-medium">Total Visitor Likes</p>
            <p className="text-3xl font-extrabold text-rose-400 mt-2">
              {creatures.reduce((sum, c) => sum + c.likes, 0)}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Community appreciations</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <p className="text-xs text-slate-400 font-medium">Featured Highlights</p>
            <p className="text-3xl font-extrabold text-amber-300 mt-2">
              {creatures.filter((c) => c.featured).length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Pinned showcase entries</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <p className="text-xs text-slate-400 font-medium">Deep Sea & Macro Discoveries</p>
            <p className="text-3xl font-extrabold text-purple-300 mt-2">
              {creatures.filter((c) => c.category === 'Deep Sea' || c.category === 'Macro').length}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Specialized photography entries</p>
          </div>
        </div>
      )}

      {/* TAB 4: AUTHENTICATION & SECURITY SETTINGS */}
      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* Status alerts */}
          {secSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{secSuccess}</span>
            </div>
          )}

          {secError && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{secError}</span>
            </div>
          )}

          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">2-Factor Authentication</span>
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm font-bold text-slate-100">ACTIVE (TOTP Standard)</p>
              <p className="text-[11px] text-slate-400">Time-based One-Time Passcode (6-Digit Google Authenticator)</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Passkey / Biometrics</span>
                <Fingerprint className={`w-4 h-4 ${passkeyActive ? 'text-emerald-400' : 'text-slate-500'}`} />
              </div>
              <p className="text-sm font-bold text-slate-100">
                {passkeyActive ? 'Passkey Registered' : passkeySupported ? 'Supported' : 'Not Supported'}
              </p>
              <p className="text-[11px] text-slate-400">WebAuthn Touch ID / Face ID / Security Key</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. 2FA Secret Key Card */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Smartphone className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Google Authenticator Secret Key</h3>
                  <p className="text-[11px] text-slate-400">Use this secret key to pair Google Authenticator or Authy</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <p className="font-semibold text-cyan-300">Secret Key (Base32):</p>
                <code className="block p-3 bg-slate-900 border border-slate-800 rounded-xl text-emerald-300 font-mono text-center tracking-widest text-sm font-bold select-all">
                  {totpSecret}
                </code>
                <p className="text-[11px] text-slate-400">
                  Enter this secret key in your Google Authenticator app to generate your 6-digit login passcodes.
                </p>
              </div>
            </div>

            {/* 2. Biometric Passkey Registration */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                <Fingerprint className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Biometric Passkey (WebAuthn)</h3>
                  <p className="text-[11px] text-slate-400">Login instantly with Touch ID, Face ID, or Hardware Key</p>
                </div>
              </div>

              <p className="text-xs text-slate-300">
                Passkeys offer seamless, unforgeable hardware-level authentication directly tied to your device.
              </p>

              <button
                type="button"
                disabled={!passkeySupported}
                onClick={handleRegisterPasskey}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-white" />
                <span>{passkeyActive ? 'Re-register Passkey / Biometrics' : 'Pair Device Passkey / Biometric Key'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creature Edit Modal */}
      {editingCreature && (
        <CreatureEditModal
          creature={editingCreature}
          onClose={() => setEditingCreature(null)}
          onSave={(updated) => {
            onUpdateCreature(updated);
            setEditingCreature(null);
          }}
        />
      )}

    </div>
  );
};
