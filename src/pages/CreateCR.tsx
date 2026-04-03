import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCR } from '@/context/CRContext';
import { DesignStage, DESIGN_STAGES, ArtifactType, Artifact } from '@/types/cr';
import { X, Plus, Link2, Upload, GripVertical, Loader2, ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useOnboarding } from '@/context/OnboardingContext';
import { toast } from 'sonner';

const CR_TOUR_SEEN_KEY = 'crTourSeen';

export default function CreateCR() {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id?: string }>();
  const { addCR, updateCR, currentUser, teamMembers, crs } = useCR();
  const { user, profile } = useAuth();
  const { startTour, tourActive } = useOnboarding();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState<DesignStage | null>(null);
  const [projectTag, setProjectTag] = useState('');
  const [artifacts, setArtifacts] = useState<Partial<Artifact>[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const isEditing = !!editId;
  const existingCR = isEditing ? crs.find(cr => cr.id === editId) : null;

  // Auto-start CR creation tour for first-time creators
  useEffect(() => {
    if (isEditing || tourActive) return;
    if (profile && !(profile as any).onboarding_dismissed) {
      const seen = sessionStorage.getItem(CR_TOUR_SEEN_KEY);
      if (!seen) {
        sessionStorage.setItem(CR_TOUR_SEEN_KEY, '1');
        const t = setTimeout(() => startTour('create-cr'), 600);
        return () => clearTimeout(t);
      }
    }
  }, [isEditing, profile, tourActive, startTour]);

  // Pre-populate when editing
  useEffect(() => {
    if (existingCR) {
      setTitle(existingCR.title);
      setDescription(existingCR.description);
      setStage(existingCR.design_stage);
      setProjectTag(existingCR.project_tag || '');
      setArtifacts(existingCR.artifacts.map(a => ({ ...a })));
      setSelectedReviewers(existingCR.reviewers.map(r => r.user_id));
    }
  }, [existingCR?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const detectArtifactType = (url: string): ArtifactType => {
    if (url.includes('figma.com')) return 'figma';
    if (url.includes('loom.com')) return 'loom';
    if (url.includes('figjam')) return 'figjam';
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/i.test(url)) return 'image';
    return 'url';
  };

  const addArtifactUrl = () => {
    if (!urlInput.trim()) return;
    const type = detectArtifactType(urlInput);
    setArtifacts(prev => [...prev, {
      id: `new-${Date.now()}`,
      type,
      url: urlInput,
      title: type === 'figma' ? 'Figma design' : type === 'loom' ? 'Loom recording' : urlInput.split('/').pop() || 'Link',
      sort_order: prev.length,
    }]);
    setUrlInput('');
  };

  const removeArtifact = (index: number) => {
    setArtifacts(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = useCallback(async (file: File) => {
    if (!user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be under 10MB');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('artifact-uploads').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('artifact-uploads').getPublicUrl(path);
      setArtifacts(prev => [...prev, {
        id: `new-${Date.now()}`,
        type: 'image' as ArtifactType,
        url: publicUrl,
        title: file.name,
        sort_order: prev.length,
      }]);
      toast.success('Image uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [user]);

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) uploadFile(file);
        return;
      }
    }
  }, [uploadFile]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(uploadFile);
    }
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    Array.from(files).forEach(uploadFile);
  }, [uploadFile]);

  const toggleReviewer = (userId: string) => {
    setSelectedReviewers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handlePublish = async (asDraft: boolean) => {
    if (!title.trim() || !stage) return;

    if (isEditing && editId) {
      await updateCR(editId, {
        title,
        description,
        design_stage: stage,
        project_tag: projectTag || undefined,
        artifacts: artifacts.map((a, i) => ({ ...a, sort_order: i })),
        reviewerIds: selectedReviewers,
      });
      navigate(`/cr/${editId}`);
    } else {
      const newCR = {
        id: `cr-${Date.now()}`,
        title,
        description,
        author: currentUser,
        status: asDraft ? 'draft' as const : 'open' as const,
        design_stage: stage,
        project_tag: projectTag || undefined,
        artifacts: artifacts.map((a, i) => ({ ...a, id: a.id || `a-${i}`, cr_id: `cr-${Date.now()}`, sort_order: i } as Artifact)),
        reviewers: selectedReviewers.map(uid => ({
          cr_id: `cr-${Date.now()}`,
          user_id: uid,
          user: teamMembers.find(m => m.id === uid)!,
          status: 'pending' as const,
        })),
        comments: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        events: [],
      };
      await addCR(newCR);
      navigate('/');
    }
  };

  const otherMembers = teamMembers.filter(m => m.id !== currentUser.id);

  if (isEditing && !existingCR) {
    return (
      <div className="container max-w-3xl py-8 text-center text-muted-foreground">
        CR not found.
      </div>
    );
  }

  return (
    <div className="container max-w-3xl py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Critique Request' : 'New Critique Request'}
          </h1>
          <div data-tour="cr-publish" className="flex gap-2">
            <button
              onClick={() => navigate(isEditing ? `/cr/${editId}` : '/')}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            {!isEditing && (
              <button
                onClick={() => handlePublish(true)}
                disabled={!title.trim() || !stage}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-40"
              >
                Save Draft
              </button>
            )}
            <button
              onClick={() => handlePublish(isEditing ? false : false)}
              disabled={!title.trim() || !stage}
              className="gradient-warm rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-all disabled:opacity-40"
            >
              {isEditing ? 'Save Changes' : 'Publish CR'}
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          data-tour="cr-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give your CR a title..."
          autoFocus
          className="w-full border-none bg-transparent font-display text-3xl font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
        />

        {/* Design Stage */}
        <div data-tour="cr-design-stage" className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Design Stage</label>
          <div className="flex flex-wrap gap-2">
            {DESIGN_STAGES.map(s => (
              <button
                key={s.value}
                onClick={() => setStage(s.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                  stage === s.value
                    ? 'shadow-md scale-105'
                    : 'border border-border bg-card hover:bg-secondary'
                }`}
                style={stage === s.value ? {
                  backgroundColor: `hsl(var(--${s.color}))`,
                  color: 'white',
                } : undefined}
              >
                {s.emoji} {s.label}
              </button>
            ))}
          </div>
          {stage && (
            <p className="text-xs text-muted-foreground animate-fade-in">
              {DESIGN_STAGES.find(s => s.value === stage)?.description}
            </p>
          )}
        </div>

        {/* Description */}
        <div data-tour="cr-description" className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What are you sharing? What feedback do you need?"
            className="w-full rounded-xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none min-h-[120px]"
            rows={5}
          />
        </div>

        {/* Artifacts */}
        <div data-tour="cr-artifacts" className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Artifacts</label>

          {/* Drop zone / URL input */}
          <div
            className="rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-center transition-colors hover:border-primary/30"
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <>
                <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-1">Drop an image, paste from clipboard, or add a URL</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-medium text-primary hover:underline mb-4"
                >
                  <ImageIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                  Browse files
                </button>
                <p className="text-xs text-muted-foreground mb-4">Supports: Figma, Loom, FigJam, images, any URL</p>
              </>
            )}
            <div className="flex gap-2 max-w-md mx-auto">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addArtifactUrl()}
                  placeholder="Paste URL..."
                  className="w-full rounded-lg border border-border bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={addArtifactUrl}
                className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Added artifacts */}
          {artifacts.length > 0 && (
            <div className="space-y-2">
              {artifacts.map((a, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragIndex !== null && dragIndex !== i) {
                      setArtifacts(prev => {
                        const next = [...prev];
                        const [moved] = next.splice(dragIndex, 1);
                        next.splice(i, 0, moved);
                        return next;
                      });
                    }
                    setDragIndex(null);
                    setDragOverIndex(null);
                  }}
                  className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-all ${
                    dragIndex === i ? 'opacity-40' : ''
                  } ${dragOverIndex === i && dragIndex !== i ? 'border-primary' : 'border-border'}`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-medium">
                    {a.type === 'figma' ? '🎨' : a.type === 'loom' ? '🎬' : a.type === 'image' ? '🖼️' : '🔗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{a.url}</p>
                  </div>
                  <button onClick={() => removeArtifact(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reviewers */}
        <div data-tour="cr-reviewers" className="space-y-3">
          <label className="text-sm font-medium text-muted-foreground">Reviewers</label>
          <div className="flex flex-wrap gap-2">
            {otherMembers.map(member => (
              <button
                key={member.id}
                onClick={() => toggleReviewer(member.id)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-all ${
                  selectedReviewers.includes(member.id)
                    ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <img src={member.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                {member.name.split(' ')[0]}
                {selectedReviewers.includes(member.id) && <X className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Project tag */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Project (optional)</label>
          <input
            type="text"
            value={projectTag}
            onChange={e => setProjectTag(e.target.value)}
            placeholder="e.g., Release Management"
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </motion.div>
    </div>
  );
}
