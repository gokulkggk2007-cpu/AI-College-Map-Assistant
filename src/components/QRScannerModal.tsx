import React, { useState, useRef } from 'react';
import {
  QrCode,
  X,
  Camera,
  MapPin,
  CheckCircle2,
  Navigation,
  Sparkles,
  Compass,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const { nodes, setCurrentLocation, startNavigation } = useCampus();

  const [activeTab, setActiveTab] = useState<'scan' | 'presets' | 'gps'>('presets');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedNode, setScannedNode] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  if (!isOpen) return null;

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable in this container iframe. You can select any campus QR Placard below.');
      setActiveTab('presets');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleSimulateScan = (node: any) => {
    setCurrentLocation(node.id, 'qr');
    setScannedNode(node);
  };

  const handleUseGPS = () => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        // Set nearest campus outdoor node (Main Gate or Central Quad)
        setCurrentLocation('node-main-gate', 'gps');
        setScannedNode(nodes.find(n => n.id === 'node-main-gate'));
      },
      err => {
        // Fallback default
        setCurrentLocation('node-main-gate', 'gps');
        setScannedNode(nodes.find(n => n.id === 'node-main-gate'));
      }
    );
  };

  const closeModal = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        id="qr-scanner-modal"
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100 flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Indoor Positioning & QR Scan</h3>
              <p className="text-[11px] text-slate-400">
                Identify your exact location by scanning campus node codes or GPS
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 text-xs font-semibold">
          <button
            id="qr-tab-presets"
            onClick={() => {
              stopCamera();
              setActiveTab('presets');
            }}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'presets'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Campus Placards (Presets)
          </button>
          <button
            id="qr-tab-camera"
            onClick={() => {
              setActiveTab('scan');
              startCamera();
            }}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'scan'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Camera Scanner
          </button>
          <button
            id="qr-tab-gps"
            onClick={() => {
              stopCamera();
              setActiveTab('gps');
            }}
            className={`flex-1 py-2.5 text-center transition border-b-2 ${
              activeTab === 'gps'
                ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            GPS Auto-Locate
          </button>
        </div>

        {/* Tab content */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-64 h-64 bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-emerald-500/50 flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" />
                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <Camera className="w-8 h-8 text-slate-500 mb-2" />
                    <p className="text-xs text-slate-400">Camera preview initializing...</p>
                  </div>
                )}
                {/* Target reticle */}
                <div className="absolute inset-8 border border-emerald-400/60 rounded-xl pointer-events-none" />
              </div>
              {cameraError && (
                <p className="text-xs text-amber-400 mt-3 text-center px-4">{cameraError}</p>
              )}
            </div>
          )}

          {activeTab === 'presets' && (
            <div>
              <p className="text-xs text-slate-400 mb-3">
                Simulate scanning a real QR placard attached to a campus pillar or doorway:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {nodes
                  .filter(n => n.type === 'room' || n.type === 'gate' || n.type === 'entrance' || n.type === 'lift')
                  .slice(0, 10)
                  .map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleSimulateScan(node)}
                      className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left text-xs transition ${
                        scannedNode?.id === node.id
                          ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200'
                          : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">{node.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{node.qrCode}</p>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'gps' && (
            <div className="text-center py-6">
              <Compass className="w-12 h-12 text-sky-400 mx-auto mb-3 animate-spin-slow" />
              <h4 className="font-bold text-sm text-slate-100">Outdoor Campus GPS Detection</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Use your device's GPS to find the nearest campus entrance or outdoor pathway node.
              </p>
              <button
                onClick={handleUseGPS}
                className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-500/20 transition"
              >
                Acquire Device Location
              </button>
            </div>
          )}

          {/* Success confirmation card */}
          {scannedNode && (
            <div className="mt-4 p-3 bg-emerald-950/40 border border-emerald-500/60 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-emerald-200">
                    Location Set to: {scannedNode.name}
                  </p>
                  <p className="text-[10px] text-emerald-400/80">
                    Floor: {scannedNode.floor === 0 ? 'Ground Floor' : `Floor ${scannedNode.floor}`}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
