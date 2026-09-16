import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  MapPin,
  Compass,
  Layers,
  Heart,
  Info,
  Footprints,
  Accessibility,
  ArrowUpRight,
  Crosshair,
  Building2,
  Coffee,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  Cpu,
  Wrench,
  Search,
  CheckCircle2,
  ChevronsUp,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { Building, Room, Facility, CampusNode } from '../types/campus';

export const CampusMap: React.FC = () => {
  const {
    buildings,
    rooms,
    facilities,
    nodes,
    edges,
    currentFloor,
    setCurrentFloor,
    activeRoute,
    currentLocationNodeId,
    setCurrentLocation,
    startNavigation,
    toggleFavorite,
    isFavorited,
    selectedBuildingId,
    setSelectedBuildingId,
  } = useCampus();

  // Viewport state (pan in SVG coordinate units, zoom multiplier)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchDistance, setTouchDistance] = useState<number | null>(null);

  // Filter category on map
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Selected Entity state (for detailed inspector drawer)
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'building' | 'room' | 'facility' | 'node';
    item: any;
    nodeId: string;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-fit route when activeRoute changes
  useEffect(() => {
    if (activeRoute && activeRoute.path.length > 0) {
      // Find bounding box of the active route path
      const xs = activeRoute.path.map(n => n.x);
      const ys = activeRoute.path.map(n => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      const midX = (minX + maxX) / 2;
      const midY = (minY + maxY) / 2;

      // Center view on route midpoint
      // SVG center is (500, 425)
      setPan({
        x: (500 - midX) * 0.85,
        y: (425 - midY) * 0.85,
      });
      setZoom(1.1);

      // Auto-align current floor to the start of route if not already set
      if (activeRoute.startNode && activeRoute.startNode.floor !== undefined) {
        setCurrentFloor(activeRoute.startNode.floor);
      }
    }
  }, [activeRoute]);

  // Handle pointer down (mouse / touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  // Touch pinch-to-zoom support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchDistance(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchDistance;
      setZoom(prev => Math.min(Math.max(prev * factor, 0.65), 2.8));
      setTouchDistance(dist);
    }
  };

  const handleTouchEnd = () => {
    setTouchDistance(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.12 : -0.12;
    setZoom(prev => Math.min(Math.max(prev + zoomDelta, 0.65), 2.8));
  };

  // Quick navigation controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.8));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.65));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedEntity(null);
    setSelectedBuildingId(null);
  };

  const handleCenterOnMe = () => {
    const currentNode = nodes.find(n => n.id === currentLocationNodeId);
    if (currentNode) {
      setCurrentFloor(currentNode.floor);
      setPan({
        x: 500 - currentNode.x,
        y: 425 - currentNode.y,
      });
      setZoom(1.3);
    }
  };

  const handleFitRoute = () => {
    if (!activeRoute) return;
    const xs = activeRoute.path.map(n => n.x);
    const ys = activeRoute.path.map(n => n.y);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    setPan({
      x: 500 - midX,
      y: 425 - midY,
    });
    setZoom(1.15);
  };

  // Filter entities by currently active floor
  const visibleRooms = rooms.filter(r => r.floorNumber === currentFloor);
  const visibleFacilities = facilities.filter(f => (f.floorNumber ?? 0) === currentFloor);
  const visibleNodes = nodes.filter(n => n.floor === currentFloor);

  // Category filtering
  const matchesCategory = (item: any, type: string) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'labs') {
      return item.type === 'lab' || item.tags?.some((t: string) => t.includes('lab'));
    }
    if (activeCategory === 'admin') {
      return item.buildingId === 'bld-admin' || item.type === 'office';
    }
    if (activeCategory === 'canteen') {
      return item.buildingId === 'bld-canteen' || item.type === 'canteen';
    }
    if (activeCategory === 'library') {
      return item.buildingId === 'bld-library' || item.type === 'library';
    }
    if (activeCategory === 'medical') {
      return item.buildingId === 'bld-amenities' || item.type === 'medical';
    }
    if (activeCategory === 'hostel') {
      return item.buildingId === 'bld-hostel' || item.type === 'hostel';
    }
    if (activeCategory === 'restroom') {
      return item.type === 'restroom';
    }
    return true;
  };

  // Check if active route has steps on current floor
  const routeNodesOnCurrentFloor = activeRoute
    ? activeRoute.path.filter(n => n.floor === currentFloor)
    : [];

  const routePoints = routeNodesOnCurrentFloor.map(n => `${n.x},${n.y}`).join(' ');

  // Floor transition detection
  const hasFloorTransition = activeRoute && activeRoute.floorTransitions.length > 0;
  const currentFloorTransition = activeRoute?.floorTransitions.find(
    ft => ft.fromFloor === currentFloor
  );

  const currentNode = nodes.find(n => n.id === currentLocationNodeId);

  // Check if selected building has rooms
  const selectedBuilding = buildings.find(b => b.id === selectedBuildingId);
  const selectedBuildingRooms = selectedBuilding
    ? rooms.filter(r => r.buildingId === selectedBuilding.id)
    : [];

  return (
    <div className="relative w-full h-[640px] bg-[#050811] rounded-2xl overflow-hidden border border-slate-800/90 shadow-2xl select-none flex flex-col">
      {/* 1. TOP TOOLBAR: Quick Category Filters & Floor Selector */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Quick Category Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto overflow-x-auto max-w-[calc(100%-180px)] scrollbar-none">
          {[
            { id: 'all', label: 'All Campus' },
            { id: 'labs', label: 'Tech & Labs' },
            { id: 'admin', label: 'Admin Block' },
            { id: 'canteen', label: 'Food Court' },
            { id: 'library', label: 'Library' },
            { id: 'medical', label: 'Health Aid' },
            { id: 'hostel', label: 'Hostel' },
            { id: 'restroom', label: 'Restrooms' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Right: Floor Selector & Transition Indicator */}
        <div className="flex items-center gap-1.5 bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg pointer-events-auto">
          <span className="px-2 text-xs text-slate-400 font-semibold flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-400" /> Level:
          </span>
          <button
            id="map-floor-toggle-0"
            onClick={() => setCurrentFloor(0)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition relative ${
              currentFloor === 0
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            Ground (0)
            {activeRoute && activeRoute.path.some(n => n.floor === 0) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
          <button
            id="map-floor-toggle-1"
            onClick={() => setCurrentFloor(1)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition relative ${
              currentFloor === 1
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            1st Floor
            {activeRoute && activeRoute.path.some(n => n.floor === 1) && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* 2. FLOATING LEFT MAP CONTROLS (HUD) */}
      <div className="absolute top-16 left-3 z-20 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-slate-200">
        <button
          id="map-zoom-in-btn"
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          id="map-zoom-out-btn"
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          id="map-reset-view-btn"
          onClick={handleResetView}
          title="Center Campus"
          className="p-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-px bg-slate-800 my-0.5" />
        <button
          id="map-find-me-btn"
          onClick={handleCenterOnMe}
          title="Center on My Location"
          className="p-2 rounded-lg hover:bg-sky-950 hover:text-sky-300 text-slate-300 transition"
        >
          <Crosshair className="w-4 h-4 text-sky-400" />
        </button>
        {activeRoute && (
          <button
            id="map-fit-route-btn"
            onClick={handleFitRoute}
            title="Focus Active Route"
            className="p-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition"
          >
            <Navigation className="w-4 h-4 text-sky-400 animate-pulse" />
          </button>
        )}
      </div>

      {/* 3. MULTI-FLOOR ROUTE NOTICE BANNER (if route spans floors) */}
      {hasFloorTransition && (
        <div className="absolute top-16 right-3 z-20 flex items-center gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-xl border border-sky-500/40 shadow-xl text-xs">
          <div className="p-1 rounded-lg bg-sky-500 text-white font-bold">
            <ChevronsUp className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-200">
              Multi-Level Route ({activeRoute.path[0].floor === 0 ? 'Ground' : '1st'} →{' '}
              {activeRoute.path[activeRoute.path.length - 1].floor === 0 ? 'Ground' : '1st'})
            </p>
            {currentFloorTransition ? (
              <p className="text-[11px] text-sky-400">
                Ascend via {currentFloorTransition.via} at {currentFloorTransition.atNode}
              </p>
            ) : (
              <p className="text-[11px] text-emerald-400">Viewing destination floor</p>
            )}
          </div>
          <button
            onClick={() => setCurrentFloor(currentFloor === 0 ? 1 : 0)}
            className="ml-2 px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-semibold transition"
          >
            View {currentFloor === 0 ? 'Floor 1' : 'Ground'}
          </button>
        </div>
      )}

      {/* 4. COMPASS & SCALE INDICATOR (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs text-slate-300 shadow-lg pointer-events-none">
        <Compass className="w-4 h-4 text-sky-400 animate-pulse" />
        <span className="font-semibold text-[11px] tracking-wider uppercase text-slate-200">
          N ↑ Campus Metric Grid
        </span>
        <span className="text-[10px] text-slate-500 border-l border-slate-700 pl-2">
          Zoom: {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* 5. INTERACTIVE SVG VECTOR MAP CANVAS */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox="0 0 1000 850"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Engineering Campus Grid */}
            <pattern id="campus-grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.75" />
            </pattern>

            {/* Lush Gardens Pattern */}
            <pattern id="lawn-grass-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill="#064e3b" opacity="0.45" />
              <circle cx="12" cy="12" r="1.5" fill="#10b981" opacity="0.3" />
            </pattern>

            {/* Sports Turf Pattern */}
            <pattern id="sports-turf-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
              <rect width="16" height="16" fill="#047857" opacity="0.35" />
              <line x1="0" y1="8" x2="16" y2="8" stroke="#10b981" strokeWidth="0.5" opacity="0.3" />
            </pattern>

            {/* Pathway Granite Pavement */}
            <pattern id="pathway-pavement" width="12" height="12" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#1e293b" />
              <path d="M 0 0 L 12 12 M 12 0 L 0 12" stroke="#334155" strokeWidth="0.5" />
            </pattern>

            {/* Glowing active route filter */}
            <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Pulse beacon glow */}
            <filter id="beacon-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* INNER ROOT GROUP: Pans & Zooms smoothly inside SVG coordinate space */}
          <g
            id="map-viewport"
            transform={`translate(${pan.x + 500 * (1 - zoom)}, ${pan.y + 425 * (1 - zoom)}) scale(${zoom})`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            }}
          >
            {/* Background Canvas */}
            <rect width="1000" height="850" fill="#070b14" />
            <rect width="1000" height="850" fill="url(#campus-grid-pattern)" />

            {/* Campus Perimeter Boundary Wall */}
            <rect
              x="45"
              y="25"
              width="910"
              height="800"
              rx="28"
              fill="none"
              stroke="#334155"
              strokeWidth="3.5"
              strokeDasharray="10 8"
            />

            {/* Landscaping Gardens, Lawns & Botanical Courtyards */}
            <rect x="65" y="45" width="70" height="760" rx="14" fill="url(#lawn-grass-pattern)" />
            <rect x="865" y="45" width="70" height="760" rx="14" fill="url(#lawn-grass-pattern)" />
            <rect x="360" y="480" width="80" height="80" rx="10" fill="url(#lawn-grass-pattern)" />
            <rect x="560" y="480" width="80" height="80" rx="10" fill="url(#lawn-grass-pattern)" />
            <circle cx="500" cy="440" r="28" fill="#0284c7" opacity="0.15" />
            <circle cx="500" cy="440" r="14" fill="#38bdf8" opacity="0.3" />

            {/* Sports Complex Field & Athletic Track (North-East corner backdrop) */}
            <g transform="translate(680, 240)">
              <rect x="0" y="0" width="70" height="40" rx="12" fill="url(#sports-turf-pattern)" stroke="#059669" strokeWidth="1" />
              <circle cx="35" cy="20" r="8" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.5" />
            </g>

            {/* Outdoor Pedestrian Walkway Network */}
            {edges
              .filter(e => e.type === 'outdoor_path' || e.type === 'ramp')
              .map(edge => {
                const from = nodes.find(n => n.id === edge.fromNode);
                const to = nodes.find(n => n.id === edge.toNode);
                if (!from || !to) return null;
                return (
                  <g key={`walkway-bg-${edge.id}`}>
                    {/* Walkway outer asphalt */}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#1e293b"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    {/* Walkway paver stone fill */}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#334155"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    {/* Walkway centerline dashed guide */}
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke="#64748b"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                  </g>
                );
              })}

            {/* Walkway Intersection Waypoint Plazas */}
            {nodes
              .filter(n => n.type === 'landmark' && n.floor === 0)
              .map(n => (
                <circle
                  key={`plaza-${n.id}`}
                  cx={n.x}
                  cy={n.y}
                  r="12"
                  fill="#1e293b"
                  stroke="#475569"
                  strokeWidth="2"
                />
              ))}

            {/* BUILDINGS FOOTPRINTS & ARCHITECTURAL BLOCKS */}
            {buildings.map(bld => {
              const isSelected = selectedBuildingId === bld.id;
              const hasMatches =
                activeCategory !== 'all' &&
                rooms.some(r => r.buildingId === bld.id && matchesCategory(r, 'room'));

              return (
                <g
                  key={bld.id}
                  id={`building-${bld.id}`}
                  className="cursor-pointer transition-all duration-200"
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedBuildingId(bld.id);
                    setSelectedEntity({
                      type: 'building',
                      item: bld,
                      nodeId: bld.entranceNodeId,
                    });
                  }}
                >
                  {/* Building Outer Shadow */}
                  <rect
                    x={bld.x - bld.width / 2 + 4}
                    y={bld.y - bld.height / 2 + 6}
                    width={bld.width}
                    height={bld.height}
                    rx="14"
                    fill="#020617"
                    opacity="0.8"
                  />

                  {/* Building Base Enclosure */}
                  <rect
                    x={bld.x - bld.width / 2}
                    y={bld.y - bld.height / 2}
                    width={bld.width}
                    height={bld.height}
                    rx="14"
                    fill={isSelected ? '#1e293b' : '#0f172a'}
                    stroke={isSelected ? '#38bdf8' : hasMatches ? '#38bdf8' : bld.color}
                    strokeWidth={isSelected ? '3.5' : hasMatches ? '3' : '2'}
                  />

                  {/* Building Interior Floor Pattern / Texture */}
                  <rect
                    x={bld.x - bld.width / 2 + 6}
                    y={bld.y - bld.height / 2 + 6}
                    width={bld.width - 12}
                    height={bld.height - 12}
                    rx="8"
                    fill="#090d16"
                    opacity="0.9"
                  />

                  {/* Building Roof Header Bar */}
                  <rect
                    x={bld.x - bld.width / 2 + 8}
                    y={bld.y - bld.height / 2 + 8}
                    width={bld.width - 16}
                    height="22"
                    rx="6"
                    fill="#1e293b"
                  />

                  {/* Building Title & Floor Indicator */}
                  <text
                    x={bld.x}
                    y={bld.y - bld.height / 2 + 23}
                    textAnchor="middle"
                    fill="#f8fafc"
                    fontSize="10"
                    fontWeight="bold"
                    letterSpacing="0.5"
                  >
                    {bld.code} • {bld.name.split('(')[0].trim()}
                  </text>
                </g>
              );
            })}

            {/* INDOOR CORRIDORS & WALKWAYS */}
            {edges
              .filter(e => e.type === 'corridor')
              .map(edge => {
                const from = nodes.find(n => n.id === edge.fromNode);
                const to = nodes.find(n => n.id === edge.toNode);
                if (!from || !to) return null;
                // Only render if on current floor
                if (from.floor !== currentFloor && to.floor !== currentFloor) return null;
                return (
                  <line
                    key={`corridor-${edge.id}`}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="#334155"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeDasharray="2 2"
                    opacity="0.75"
                  />
                );
              })}

            {/* FLOOR-SPECIFIC ROOMS & LABS (Current Floor) */}
            {visibleRooms.map(rm => {
              const node = nodes.find(n => n.id === rm.nodeRefId);
              if (!node) return null;
              const isSelected = selectedEntity?.item?.id === rm.id;
              const isFiltered = matchesCategory(rm, 'room');

              // Color mapping by room type
              const typeColor =
                rm.type === 'lab'
                  ? '#a855f7' // purple
                  : rm.type === 'office'
                  ? '#3b82f6' // blue
                  : rm.type === 'library'
                  ? '#10b981' // emerald
                  : rm.type === 'canteen'
                  ? '#eab308' // amber
                  : rm.type === 'medical'
                  ? '#ef4444' // red
                  : '#64748b'; // slate

              return (
                <g
                  key={rm.id}
                  id={`room-marker-${rm.id}`}
                  className="cursor-pointer group transition-transform"
                  opacity={isFiltered ? 1 : 0.25}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedEntity({
                      type: 'room',
                      item: rm,
                      nodeId: rm.nodeRefId,
                    });
                  }}
                >
                  {/* Outer selection ring */}
                  {isSelected && (
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="18"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                      className="animate-ping"
                    />
                  )}

                  {/* Room Marker Pin */}
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? 14 : 11}
                    fill={typeColor}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="transition-all duration-150"
                  />

                  {/* Room Label Badge Box */}
                  <rect
                    x={node.x - 36}
                    y={node.y + 13}
                    width="72"
                    height="15"
                    rx="4"
                    fill="#0f172a"
                    stroke="#334155"
                    strokeWidth="0.8"
                    opacity="0.95"
                  />

                  {/* Room Code Text */}
                  <text
                    x={node.x}
                    y={node.y + 24}
                    textAnchor="middle"
                    fill="#f1f5f9"
                    fontSize="8.5"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {rm.roomNumber}
                  </text>
                </g>
              );
            })}

            {/* STAIRS, ELEVATORS & ACCESS RAMPS */}
            {visibleNodes
              .filter(n => n.type === 'stairs' || n.type === 'lift' || n.type === 'ramp')
              .map(n => {
                const isTransitionNode =
                  currentFloorTransition &&
                  (n.name.includes(currentFloorTransition.atNode) || n.id.includes(currentFloorTransition.via));

                return (
                  <g
                    key={n.id}
                    id={`transition-${n.id}`}
                    className="cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedEntity({ type: 'node', item: n, nodeId: n.id });
                    }}
                  >
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r="10"
                      fill={n.type === 'lift' ? '#06b6d4' : n.type === 'ramp' ? '#14b8a6' : '#f97316'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <text
                      x={n.x}
                      y={n.y + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {n.type === 'lift' ? 'L' : n.type === 'ramp' ? 'R' : 'S'}
                    </text>

                    {/* Transition Beacon Callout (if path requires stair/lift here) */}
                    {isTransitionNode && (
                      <g transform={`translate(${n.x}, ${n.y - 20})`}>
                        <rect
                          x="-45"
                          y="-16"
                          width="90"
                          height="18"
                          rx="5"
                          fill="#0284c7"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                          className="animate-bounce"
                        />
                        <text
                          x="0"
                          y="-4"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          ↑ Up to Floor 1
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}

            {/* ACTIVE ROUTE: POLYLINE & PATH HIGHLIGHT */}
            {activeRoute && routePoints && (
              <g id="active-route-layer">
                {/* Glow aura */}
                <polyline
                  points={routePoints}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#neon-glow)"
                  opacity="0.85"
                />
                {/* Main route stroke with animated dash */}
                <polyline
                  points={routePoints}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="8 6"
                  className="animate-pulse"
                />
              </g>
            )}

            {/* ROUTE START BEACON (Pin A / You) */}
            {activeRoute && activeRoute.startNode.floor === currentFloor && (
              <g
                id="route-start-pin"
                transform={`translate(${activeRoute.startNode.x}, ${activeRoute.startNode.y})`}
              >
                <circle r="18" fill="#10b981" opacity="0.3" className="animate-ping" />
                <circle r="12" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" />
                <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  A
                </text>
                <rect x="-24" y="16" width="48" height="14" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
                <text y="26" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                  START
                </text>
              </g>
            )}

            {/* ROUTE DESTINATION BEACON (Pin B / Target) */}
            {activeRoute && activeRoute.endNode.floor === currentFloor && (
              <g
                id="route-end-pin"
                transform={`translate(${activeRoute.endNode.x}, ${activeRoute.endNode.y})`}
              >
                <circle r="22" fill="#ef4444" opacity="0.35" className="animate-ping" />
                <circle r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
                <text y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                  B
                </text>
                <rect x="-28" y="17" width="56" height="14" rx="4" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
                <text y="27" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">
                  TARGET
                </text>
              </g>
            )}

            {/* USER LIVE LOCATION INDICATOR (if on this floor) */}
            {currentNode && currentNode.floor === currentFloor && !activeRoute && (
              <g
                id="user-location-beacon"
                transform={`translate(${currentNode.x}, ${currentNode.y})`}
              >
                <circle r="18" fill="#38bdf8" opacity="0.35" className="animate-ping" />
                <circle r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
                <circle r="3.5" fill="#ffffff" />
                <rect x="-32" y="13" width="64" height="14" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <text y="23" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="bold">
                  YOU ARE HERE
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* 6. FLOATING INSPECTOR CARD: Displayed when clicking any Building, Room, or Landmark */}
      {selectedEntity && (
        <div
          id="map-entity-inspector"
          className="absolute bottom-4 right-4 z-30 w-84 sm:w-96 bg-slate-900/98 backdrop-blur-md p-4 rounded-2xl border border-slate-700 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200 max-h-[85%] overflow-y-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 border border-slate-700">
                  {selectedEntity.type}
                </span>
                {selectedEntity.item.floorNumber !== undefined && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    Floor {selectedEntity.item.floorNumber === 0 ? 'Ground' : selectedEntity.item.floorNumber}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-sm sm:text-base text-slate-100 mt-1.5">
                {selectedEntity.item.name}
              </h4>
              {selectedEntity.item.roomNumber && (
                <p className="text-xs text-sky-400 font-mono font-semibold">
                  Code: {selectedEntity.item.roomNumber}
                </p>
              )}
            </div>
            <button
              onClick={() => setSelectedEntity(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-2">
            {selectedEntity.item.description ||
              (selectedEntity.item.headFaculty
                ? `Faculty In-charge: ${selectedEntity.item.headFaculty}`
                : 'Campus facility & active navigation node.')}
          </p>

          {/* If building selected: Show mini directory of rooms inside this building */}
          {selectedEntity.type === 'building' && selectedBuildingRooms.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-800">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Rooms & Labs in this block:
              </p>
              <div className="grid grid-cols-1 gap-1 max-h-36 overflow-y-auto pr-1">
                {selectedBuildingRooms.map(rm => (
                  <div
                    key={rm.id}
                    onClick={() => {
                      setCurrentFloor(rm.floorNumber);
                      setSelectedEntity({
                        type: 'room',
                        item: rm,
                        nodeId: rm.nodeRefId,
                      });
                    }}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-800/70 hover:bg-slate-800 cursor-pointer transition text-xs group"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 group-hover:text-sky-300">
                        {rm.name}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-2">({rm.roomNumber})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      Fl {rm.floorNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
            <button
              id="navigate-to-selected-btn"
              onClick={() => {
                startNavigation(selectedEntity.nodeId);
                setSelectedEntity(null);
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition active:scale-95"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Route Here</span>
            </button>

            <button
              id="set-location-selected-btn"
              onClick={() => {
                setCurrentLocation(selectedEntity.nodeId, 'manual');
              }}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Start from Here</span>
            </button>
          </div>

          {/* Favorite Toggle */}
          {selectedEntity.type === 'room' && (
            <button
              onClick={() => {
                toggleFavorite(
                  'room',
                  selectedEntity.item.id,
                  selectedEntity.nodeId,
                  selectedEntity.item.name,
                  selectedEntity.item.roomNumber
                );
              }}
              className="w-full mt-2 py-1.5 flex items-center justify-center gap-1.5 text-xs text-slate-300 hover:text-white transition rounded-lg hover:bg-slate-800/80"
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  isFavorited(selectedEntity.item.id)
                    ? 'fill-rose-500 text-rose-500'
                    : 'text-slate-400'
                }`}
              />
              <span>
                {isFavorited(selectedEntity.item.id) ? 'Saved to Favorites' : 'Add to Favorites'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
