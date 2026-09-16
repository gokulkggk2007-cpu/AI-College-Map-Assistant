import React, { useState } from 'react';
import { AlertTriangle, X, Send, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCampus } from '../context/CampusContext';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { nodes, currentLocationNodeId } = useCampus();

  const [locationName, setLocationName] = useState('');
  const [issueType, setIssueType] = useState<'incorrect_info' | 'closed_access' | 'broken_lift' | 'wrong_room_number' | 'other'>('incorrect_info');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.uid || 'guest-user',
          userName: user?.name || 'Campus Student',
          userEmail: user?.email || 'student@college.edu',
          locationName,
          nodeId: currentLocationNodeId,
          issueType,
          description,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setLocationName('');
          setDescription('');
          onClose();
        }, 1800);
      }
    } catch (err) {
      console.error('Report submission failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="report-issue-modal"
        className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Report Map Information</h3>
              <p className="text-[11px] text-slate-400">Help keep college map accurate and up-to-date</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-bounce" />
            <h4 className="font-bold text-base text-slate-100">Report Successfully Submitted</h4>
            <p className="text-xs text-slate-400 mt-1">
              Campus administrators have been notified to review and update map coordinates.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Location Name / Room Code:
              </label>
              <input
                type="text"
                required
                value={locationName}
                onChange={e => setLocationName(e.target.value)}
                placeholder="e.g. 'ECE Lab 2 Door', 'Admin Block Elevator', 'Room 102'"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Category:</label>
              <select
                value={issueType}
                onChange={e => setIssueType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="incorrect_info">Incorrect Room / Name Information</option>
                <option value="closed_access">Closed Accessway / Door Locked</option>
                <option value="broken_lift">Broken Lift / Inaccessible Ramp</option>
                <option value="wrong_room_number">Wrong Room Number on Map</option>
                <option value="other">Other Campus Issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Description:</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe what is wrong or needs updating..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white shadow-md transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
