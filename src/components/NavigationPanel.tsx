import React, { useState } from 'react';
import {
  Navigation,
  X,
  Footprints,
  Clock,
  Accessibility,
  Volume2,
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  ChevronsUp,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { NavigationStep } from '../types/campus';

export const NavigationPanel: React.FC = () => {
  const { activeRoute, clearNavigation, setCurrentFloor } = useCampus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  if (!activeRoute) return null;

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const text = `Navigation started from ${activeRoute.startNode.name} to ${activeRoute.endNode.name}. Total distance is ${activeRoute.totalDistance} meters. First step: ${activeRoute.steps[0]?.instruction || ''}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const getStepIcon = (actionType: NavigationStep['actionType']) => {
    switch (actionType) {
      case 'turn_left':
        return <CornerUpLeft className="w-4 h-4 text-sky-400" />;
      case 'turn_right':
        return <CornerUpRight className="w-4 h-4 text-sky-400" />;
      case 'take_stairs':
        return <ChevronsUp className="w-4 h-4 text-amber-400" />;
      case 'take_lift':
        return <Layers className="w-4 h-4 text-teal-400" />;
      case 'arrive':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <ArrowUp className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div
      id="active-navigation-hud"
      className="w-full bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-sky-500/40 rounded-2xl p-4 shadow-xl text-slate-100 mb-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-sky-400 tracking-wider">
                Live Navigation
              </span>
              {activeRoute.accessible && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-800">
                  <Accessibility className="w-3 h-3" /> Step-Free
                </span>
              )}
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>{activeRoute.startNode.name}</span>
              <span className="text-slate-500">→</span>
              <span className="text-sky-300">{activeRoute.endNode.name}</span>
            </h3>
          </div>
        </div>

        {/* Metrics & Controls */}
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <Footprints className="w-4 h-4 text-sky-400" />
              <span className="font-semibold">{activeRoute.totalDistance}m</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold">~{activeRoute.estimatedMinutes} min</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="voice-speak-nav-btn"
              onClick={handleSpeak}
              title="Voice directions"
              className={`p-2 rounded-lg border transition ${
                isSpeaking
                  ? 'bg-sky-500 text-white border-sky-400 animate-pulse'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              id="toggle-steps-list-btn"
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {isExpanded ? 'Hide Steps' : `Steps (${activeRoute.steps.length})`}
            </button>

            <button
              id="clear-nav-btn"
              onClick={clearNavigation}
              title="End Navigation"
              className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/80 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Immediate Next Step Card */}
      <div className="mt-3 bg-slate-800/60 rounded-xl p-3 border border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-950/80 border border-sky-800">
            {getStepIcon(activeRoute.steps[0]?.actionType || 'straight')}
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Immediate Direction
            </p>
            <p className="text-sm font-semibold text-slate-100">
              {activeRoute.steps[0]?.instruction || 'Proceed along marked route'}
            </p>
          </div>
        </div>

        {activeRoute.floorTransitions.length > 0 && (
          <button
            onClick={() => setCurrentFloor(activeRoute.floorTransitions[0].toFloor)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600/30 text-sky-300 border border-sky-500/40 text-xs font-medium hover:bg-sky-600/40"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Switch to Floor {activeRoute.floorTransitions[0].toFloor}</span>
          </button>
        )}
      </div>

      {/* Expanded Turn-by-Turn Step List */}
      {isExpanded && (
        <div className="mt-4 pt-3 border-t border-slate-800 max-h-60 overflow-y-auto space-y-2 pr-2">
          {activeRoute.steps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs"
            >
              <div className="mt-0.5 p-1.5 rounded-md bg-slate-800 border border-slate-700">
                {getStepIcon(step.actionType)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-200">{step.instruction}</p>
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Distance: {step.distance}m</span>
                  <span>•</span>
                  <span>Floor: {step.floor === 0 ? 'Ground' : `Floor ${step.floor}`}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
