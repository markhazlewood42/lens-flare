import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding, TourType } from '@/context/OnboardingContext';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface TourStep {
  target: string;
  title: string;
  description: string;
}

const MAIN_STEPS: TourStep[] = [
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Your Dashboard',
    description: 'Your Dashboard is the filterable card grid of all team activity. Scan everything happening across critique requests in one place.',
  },
  {
    target: '[data-tour="nav-feed"]',
    title: 'Your Feed',
    description: 'Your Feed is the actionable, chronological list of updates specifically relevant to you: pending reviews, recent activity, and your own CRs.',
  },
  {
    target: '[data-tour="new-cr"]',
    title: 'Create a Critique Request',
    description: 'Click here to create a new Critique Request. Upload designs, add context, and invite reviewers to get feedback.',
  },
  {
    target: '[data-tour="profile-area"]',
    title: 'Your Profile',
    description: 'Your avatar, sign-out, and the lightbulb button to replay this tour are all here.',
  },
];

const CREATE_CR_STEPS: TourStep[] = [
  {
    target: '[data-tour="cr-title"]',
    title: 'CR Title',
    description: 'Give your critique request a clear, descriptive title so reviewers immediately know what they\'re looking at.',
  },
  {
    target: '[data-tour="cr-design-stage"]',
    title: 'Design Stage',
    description: 'Tag the maturity of your work — from early exploration to ready-for-handoff. This sets expectations for the kind of feedback you need.',
  },
  {
    target: '[data-tour="cr-description"]',
    title: 'Description',
    description: 'Explain what you\'re sharing and what specific feedback you\'re looking for. Context helps reviewers give better critique.',
  },
  {
    target: '[data-tour="cr-artifacts"]',
    title: 'Artifacts',
    description: 'Attach your design work here — paste Figma links, Loom recordings, images from clipboard, or upload files from your computer.',
  },
  {
    target: '[data-tour="cr-reviewers"]',
    title: 'Reviewers',
    description: 'Select team members to review your work. They\'ll be notified and can leave structured feedback.',
  },
  {
    target: '[data-tour="cr-publish"]',
    title: 'Publish or Save Draft',
    description: 'When you\'re ready, publish your CR to notify reviewers, or save it as a draft to come back to later.',
  },
];

const STEPS_MAP: Record<TourType, TourStep[]> = {
  'main': MAIN_STEPS,
  'create-cr': CREATE_CR_STEPS,
};

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function OnboardingTour() {
  const { tourActive, activeTour, stopTour, startTour } = useOnboarding();
  const { profile } = useAuth();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({});
  const [autoStarted, setAutoStarted] = useState(false);

  const steps = activeTour ? STEPS_MAP[activeTour] : MAIN_STEPS;

  // Auto-start main tour for new users
  useEffect(() => {
    if (profile && !(profile as any).onboarding_dismissed && !autoStarted) {
      setAutoStarted(true);
      const t = setTimeout(() => startTour('main'), 500);
      return () => clearTimeout(t);
    }
  }, [profile, autoStarted, startTour]);

  // Reset step when tour type changes
  useEffect(() => {
    setStep(0);
  }, [activeTour]);

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!tourActive || !activeTour) return;
    const currentStep = steps[step];
    if (!currentStep) return;
    const el = document.querySelector(currentStep.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const padding = 6;
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const popoverWidth = 340;
    const popoverHeight = 200;
    let top = rect.bottom + 12;
    let left = rect.left + rect.width / 2 - popoverWidth / 2;

    if (left < 16) left = 16;
    if (left + popoverWidth > window.innerWidth - 16) left = window.innerWidth - 16 - popoverWidth;
    if (top + popoverHeight > window.innerHeight - 16) {
      top = rect.top - popoverHeight - 12;
    }

    setPopoverStyle({ top, left, width: popoverWidth });
  }, [tourActive, activeTour, step, steps]);

  useEffect(() => {
    if (!tourActive) return;
    updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [tourActive, updatePosition]);

  const handleHideForNow = () => {
    stopTour();
    setStep(0);
  };

  const handleDontShowAgain = () => {
    // Public read-only demo: there's no session to persist this against, so
    // "don't show again" is just a client-side dismissal for this visit.
    stopTour();
    setStep(0);
  };

  const handleNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!tourActive || !activeTour) return null;

  const currentStep = steps[step];
  if (!currentStep) return null;
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
        <defs>
          <mask id="tour-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left}
                y={targetRect.top}
                width={targetRect.width}
                height={targetRect.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="hsl(var(--foreground) / 0.5)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: 'auto' }}
          onClick={handleHideForNow}
        />
      </svg>

      {/* Highlight ring */}
      {targetRect && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background transition-all duration-300"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Popover */}
      <div
        className="absolute rounded-xl border border-border bg-popover text-popover-foreground shadow-xl transition-all duration-300 animate-in fade-in-0 zoom-in-95"
        style={popoverStyle}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-base font-semibold text-foreground">{currentStep.title}</h3>
            <button onClick={handleHideForNow} className="text-muted-foreground hover:text-foreground rounded p-0.5">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{currentStep.description}</p>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={handleHideForNow}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Hide for now
              </button>
              <span className="text-muted">·</span>
              <button
                onClick={handleDontShowAgain}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Don't show again
              </button>
            </div>
            <div className="flex gap-1.5">
              {!isFirst && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-foreground bg-secondary hover:bg-secondary/80 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Back
                </button>
              )}
              <button
                onClick={isLast ? handleHideForNow : handleNext}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
              >
                {isLast ? 'Done' : 'Next'}
                {!isLast && <ChevronRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
