import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  DoorOpen,
  Coffee,
  GitGraph,
  Bell,
  AlertTriangle,
  QrCode,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  Compass,
  Download,
} from 'lucide-react';
import { useCampus } from '../context/CampusContext';
import { Building, Room, Facility, CampusNode, CampusEdge, Announcement, Report } from '../types/campus';

export const AdminDashboard: React.FC = () => {
  const {
    buildings,
    rooms,
    facilities,
    departments,
    nodes,
    edges,
    announcements,
    refreshCampusData,
  } = useCampus();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'buildings' | 'rooms' | 'facilities' | 'graph' | 'announcements' | 'reports' | 'qr'
  >('overview');

  const [stats, setStats] = useState<any>({
    totalUsers: 3,
    totalBuildings: buildings.length,
    totalRooms: rooms.length,
    totalFacilities: facilities.length,
    totalNodes: nodes.length,
    totalEdges: edges.length,
    pendingReports: 1,
  });

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedQRNodeId, setSelectedQRNodeId] = useState<string>(nodes[0]?.id || 'node-main-gate');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // Forms state
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [bldForm, setBldForm] = useState({ name: '', code: '', description: '', floorsCount: 2, color: '#3b82f6', width: 200, height: 120, x: 400, y: 400 });

  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomForm, setRoomForm] = useState({ name: '', roomNumber: '', buildingId: 'bld-admin', floorNumber: 0, type: 'classroom' as any, nodeRefId: 'node-admin-lobby', aliases: '' });

  const [showEdgeModal, setShowEdgeModal] = useState(false);
  const [edgeForm, setEdgeForm] = useState({ fromNode: 'node-main-gate', toNode: 'node-admin-ent', distance: 30, accessible: true, type: 'corridor' as any });

  const [annForm, setAnnForm] = useState({ title: '', content: '', priority: 'normal' as any, department: 'Admin' });

  // Load backend reports & stats
  const fetchAdminData = async () => {
    try {
      const [statsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/reports'),
      ]);
      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }
      if (reportsRes.ok) {
        const r = await reportsRes.json();
        setReports(r.reports || []);
      }
    } catch (e) {
      console.error('Failed to load admin stats', e);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Fetch QR Code for selected node
  useEffect(() => {
    if (selectedQRNodeId) {
      fetch(`/api/qr/generate?nodeId=${selectedQRNodeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.qrDataUrl) setQrDataUrl(data.qrDataUrl);
        })
        .catch(console.error);
    }
  }, [selectedQRNodeId]);

  // Handle building CRUD
  const handleSaveBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...bldForm,
      id: editingBuilding ? editingBuilding.id : 'bld-' + Date.now(),
      entranceNodeId: 'node-main-gate',
    };

    const url = editingBuilding ? `/api/admin/buildings/${editingBuilding.id}` : '/api/admin/buildings';
    const method = editingBuilding ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowBuildingModal(false);
    setEditingBuilding(null);
    await refreshCampusData();
    await fetchAdminData();
  };

  const handleDeleteBuilding = async (id: string) => {
    if (!confirm('Are you sure you want to delete this building?')) return;
    await fetch(`/api/admin/buildings/${id}`, { method: 'DELETE' });
    await refreshCampusData();
    await fetchAdminData();
  };

  // Handle room CRUD
  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...roomForm,
      id: editingRoom ? editingRoom.id : 'rm-' + Date.now(),
      aliases: roomForm.aliases.split(',').map(s => s.trim()).filter(Boolean),
      tags: [roomForm.name.toLowerCase(), roomForm.roomNumber.toLowerCase()],
    };

    const url = editingRoom ? `/api/admin/rooms/${editingRoom.id}` : '/api/admin/rooms';
    const method = editingRoom ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    setShowRoomModal(false);
    setEditingRoom(null);
    await refreshCampusData();
    await fetchAdminData();
  };

  const handleDeleteRoom = async (id: string) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    await fetch(`/api/admin/rooms/${id}`, { method: 'DELETE' });
    await refreshCampusData();
    await fetchAdminData();
  };

  // Handle Edge CRUD
  const handleSaveEdge = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/edges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edgeForm),
    });
    setShowEdgeModal(false);
    await refreshCampusData();
    await fetchAdminData();
  };

  const handleDeleteEdge = async (id: string) => {
    await fetch(`/api/admin/edges/${id}`, { method: 'DELETE' });
    await refreshCampusData();
    await fetchAdminData();
  };

  // Handle Report status resolution
  const handleResolveReport = async (id: string, status: 'resolved' | 'rejected') => {
    await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes: 'Verified and updated in college floor directory.' }),
    });
    await fetchAdminData();
  };

  // Handle Announcement creation
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title || !annForm.content) return;
    await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annForm),
    });
    setAnnForm({ title: '', content: '', priority: 'normal', department: 'Admin' });
    await refreshCampusData();
  };

  const handleDeleteAnnouncement = async (id: string) => {
    await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
    await refreshCampusData();
  };

  // Reset to default seed
  const handleResetSeed = async () => {
    if (!confirm('Reset entire campus map, graph nodes, and rooms to default seed data?')) return;
    await fetch('/api/admin/reset-data', { method: 'POST' });
    await refreshCampusData();
    await fetchAdminData();
    alert('Campus map successfully reset to official college seed data.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 text-slate-100">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Campus Administration Portal
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                Live Firestore Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Manage buildings, indoor floor plans, navigation nodes, edges, announcements and student reports
            </p>
          </div>
        </div>

        <button
          onClick={handleResetSeed}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 shadow-sm transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span>Reset to Default Campus Seed</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Campus Users', val: stats.totalUsers, icon: <Users className="w-4 h-4 text-sky-400" /> },
          { label: 'Buildings', val: stats.totalBuildings, icon: <Building2 className="w-4 h-4 text-purple-400" /> },
          { label: 'Rooms & Labs', val: stats.totalRooms, icon: <DoorOpen className="w-4 h-4 text-emerald-400" /> },
          { label: 'Map Nodes', val: stats.totalNodes, icon: <Compass className="w-4 h-4 text-cyan-400" /> },
          { label: 'Active Edges', val: stats.totalEdges, icon: <GitGraph className="w-4 h-4 text-amber-400" /> },
          { label: 'Pending Reports', val: stats.pendingReports, icon: <AlertTriangle className="w-4 h-4 text-rose-400" /> },
        ].map((m, idx) => (
          <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-semibold text-slate-400">{m.label}</span>
              {m.icon}
            </div>
            <span className="text-xl font-extrabold text-slate-100">{m.val}</span>
          </div>
        ))}
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-none text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'buildings', label: 'Buildings' },
          { id: 'rooms', label: 'Rooms & Labs' },
          { id: 'graph', label: 'Graph (Nodes & Edges)' },
          { id: 'qr', label: 'QR Signage Studio' },
          { id: 'announcements', label: 'Announcements' },
          { id: 'reports', label: `Reports (${stats.pendingReports})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-t-xl transition whitespace-nowrap border-b-2 font-bold ${
              activeTab === tab.id
                ? 'border-sky-500 text-sky-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="font-bold text-sm text-slate-100">Live Campus State Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              All modifications executed through this Admin Dashboard immediately propagate across the
              system, updating the Dijkstra pathfinder calculations, SVG architectural overlays, and
              multilingual AI conversational assistant in real time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-xs text-sky-400 mb-1">Graph Connectivity</h4>
                <p className="text-xs text-slate-300">
                  {nodes.length} spatial waypoints connected by {edges.length} corridors and walkways.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-xs text-emerald-400 mb-1">Accessibility Coverage</h4>
                <p className="text-xs text-slate-300">
                  {edges.filter(e => e.accessible).length} barrier-free accessible pathways equipped with ramps and elevators.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
                <h4 className="font-bold text-xs text-purple-400 mb-1">Campus Verification</h4>
                <p className="text-xs text-slate-300">
                  Strict grounding active: AI assistant checks every destination against verified rooms before generating paths.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Buildings */}
      {activeTab === 'buildings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">Campus Buildings ({buildings.length})</h3>
            <button
              onClick={() => {
                setEditingBuilding(null);
                setBldForm({ name: '', code: '', description: '', floorsCount: 2, color: '#3b82f6', width: 200, height: 120, x: 400, y: 400 });
                setShowBuildingModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Building</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {buildings.map(bld => (
              <div key={bld.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-slate-100">{bld.name}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                      {bld.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{bld.description}</p>
                  <p className="text-[11px] text-slate-500 mt-2">
                    {bld.floorsCount} Floor(s) • Canvas Box: {bld.width}x{bld.height}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setEditingBuilding(bld);
                      setBldForm({
                        name: bld.name,
                        code: bld.code,
                        description: bld.description,
                        floorsCount: bld.floorsCount,
                        color: bld.color,
                        width: bld.width,
                        height: bld.height,
                        x: bld.x,
                        y: bld.y,
                      });
                      setShowBuildingModal(true);
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteBuilding(bld.id)}
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Rooms & Labs */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">Rooms & Labs Directory ({rooms.length})</h3>
            <button
              onClick={() => {
                setEditingRoom(null);
                setRoomForm({ name: '', roomNumber: '', buildingId: buildings[0]?.id || 'bld-admin', floorNumber: 0, type: 'classroom', nodeRefId: nodes[0]?.id || '', aliases: '' });
                setShowRoomModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Room</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">Room / Lab Name</th>
                  <th className="p-3">Code</th>
                  <th className="p-3">Floor</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Tamil / Tanglish Aliases</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                {rooms.map(rm => (
                  <tr key={rm.id} className="hover:bg-slate-800/50 transition">
                    <td className="p-3 font-semibold text-slate-100">{rm.name}</td>
                    <td className="p-3 font-mono text-sky-400">{rm.roomNumber}</td>
                    <td className="p-3">{rm.floorNumber === 0 ? 'Ground' : `Floor ${rm.floorNumber}`}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {rm.type}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 truncate max-w-[200px]">{rm.aliases.join(', ')}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteRoom(rm.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950/40"
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

      {/* TAB CONTENT: Graph Editor */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">
                Navigation Graph Matrix ({nodes.length} Nodes • {edges.length} Edges)
              </h3>
              <p className="text-xs text-slate-400">
                Directly manages Dijkstra graph weights and accessibility flags
              </p>
            </div>
            <button
              onClick={() => setShowEdgeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect New Edge</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Edges List */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-h-96 overflow-y-auto">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">
                Active Graph Edges
              </h4>
              <div className="space-y-1.5">
                {edges.map(e => {
                  const from = nodes.find(n => n.id === e.fromNode);
                  const to = nodes.find(n => n.id === e.toNode);
                  return (
                    <div
                      key={e.id}
                      className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                          <span>{from?.name || e.fromNode}</span>
                          <span className="text-slate-500">⇄</span>
                          <span>{to?.name || e.toNode}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span>Dist: {e.distance}m</span>
                          <span>•</span>
                          <span className={e.accessible ? 'text-teal-400' : 'text-amber-400'}>
                            {e.accessible ? 'Accessible' : 'Stairs/Restricted'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteEdge(e.id)}
                        className="p-1 rounded text-rose-400 hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nodes List */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 max-h-96 overflow-y-auto">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">
                Campus Waypoint Nodes
              </h4>
              <div className="space-y-1.5">
                {nodes.map(n => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{n.name}</p>
                      <p className="text-[10px] text-slate-400">
                        Floor: {n.floor} • Type: {n.type} • Coordinates: ({n.x}, {n.y})
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-sky-400">
                      {n.qrCode}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: QR Signage Studio */}
      {activeTab === 'qr' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">Campus QR Placard Generator</h3>
              <p className="text-xs text-slate-400">
                Print and mount scannable QR placards across doors and corridors for instant student positioning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Location Node:
              </label>
              <select
                value={selectedQRNodeId}
                onChange={e => setSelectedQRNodeId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} (Floor {n.floor})
                  </option>
                ))}
              </select>

              <div className="mt-4 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs space-y-2">
                <p className="text-slate-300">
                  <strong>Selected Point:</strong> {nodes.find(n => n.id === selectedQRNodeId)?.name}
                </p>
                <p className="text-slate-400 font-mono">
                  <strong>QR Payload:</strong> {nodes.find(n => n.id === selectedQRNodeId)?.qrCode}
                </p>
                <p className="text-emerald-400">
                  ✓ Ready for physical printing or in-app scanning
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800">
              {qrDataUrl ? (
                <div className="flex flex-col items-center">
                  <img src={qrDataUrl} alt="Campus QR Code" className="w-56 h-56 rounded-xl shadow-lg" />
                  <a
                    href={qrDataUrl}
                    download={`campus-qr-${selectedQRNodeId}.png`}
                    className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download High-Res Printable PNG</span>
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Generating QR Code...</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">Manage Campus Announcements</h3>
          </div>

          <form onSubmit={handleAddAnnouncement} className="p-4 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
              <input
                type="text"
                required
                value={annForm.title}
                onChange={e => setAnnForm({ ...annForm, title: e.target.value })}
                placeholder="e.g. 'Semester Practical Exams at ECE Lab 1'"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={annForm.priority}
                onChange={e => setAnnForm({ ...annForm, priority: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              >
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="event">Event</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition"
              >
                Post Notice
              </button>
            </div>
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Details</label>
              <input
                type="text"
                required
                value={annForm.content}
                onChange={e => setAnnForm({ ...annForm, content: e.target.value })}
                placeholder="Provide full description for students and staff..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
              />
            </div>
          </form>

          <div className="space-y-2">
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100">{ann.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-sky-400">
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">{ann.content}</p>
                </div>
                <button
                  onClick={() => handleDeleteAnnouncement(ann.id)}
                  className="p-1 rounded text-rose-400 hover:bg-rose-950/40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Reports */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-100">
              User Submitted Inaccuracy & Issue Reports ({reports.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {reports.map(rep => (
              <div
                key={rep.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-100 text-sm">{rep.locationName}</span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        rep.status === 'resolved'
                          ? 'bg-emerald-950 text-emerald-300'
                          : rep.status === 'rejected'
                          ? 'bg-rose-950 text-rose-300'
                          : 'bg-amber-950 text-amber-300'
                      }`}
                    >
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-slate-300 mt-1">{rep.description}</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Reported by: {rep.userName} ({rep.userEmail}) • {new Date(rep.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Building Create/Edit Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleSaveBuilding} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-100">{editingBuilding ? 'Edit Building' : 'Add New Building'}</h3>
            <div>
              <label className="block text-slate-300 mb-1">Building Name</label>
              <input
                type="text"
                required
                value={bldForm.name}
                onChange={e => setBldForm({ ...bldForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Code</label>
                <input
                  type="text"
                  required
                  value={bldForm.code}
                  onChange={e => setBldForm({ ...bldForm, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Floors Count</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={5}
                  value={bldForm.floorsCount}
                  onChange={e => setBldForm({ ...bldForm, floorsCount: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Description</label>
              <textarea
                rows={2}
                value={bldForm.description}
                onChange={e => setBldForm({ ...bldForm, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowBuildingModal(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-semibold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleSaveRoom} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-100">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
            <div>
              <label className="block text-slate-300 mb-1">Room / Lab Name</label>
              <input
                type="text"
                required
                value={roomForm.name}
                onChange={e => setRoomForm({ ...roomForm, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Room Code</label>
                <input
                  type="text"
                  required
                  value={roomForm.roomNumber}
                  onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Floor Level</label>
                <select
                  value={roomForm.floorNumber}
                  onChange={e => setRoomForm({ ...roomForm, floorNumber: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value={0}>Ground Floor (0)</option>
                  <option value={1}>1st Floor</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Tamil & Tanglish Aliases (comma-separated)</label>
              <input
                type="text"
                value={roomForm.aliases}
                onChange={e => setRoomForm({ ...roomForm, aliases: e.target.value })}
                placeholder="e.g. ece lab-ku, vlsi arai, lab enga"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowRoomModal(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-semibold">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edge Modal */}
      {showEdgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <form onSubmit={handleSaveEdge} className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-100">Connect Navigation Edge</h3>
            <div>
              <label className="block text-slate-300 mb-1">From Node</label>
              <select
                value={edgeForm.fromNode}
                onChange={e => setEdgeForm({ ...edgeForm, fromNode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} (Fl {n.floor})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">To Node</label>
              <select
                value={edgeForm.toNode}
                onChange={e => setEdgeForm({ ...edgeForm, toNode: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.name} (Fl {n.floor})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-300 mb-1">Distance (meters)</label>
                <input
                  type="number"
                  min={1}
                  value={edgeForm.distance}
                  onChange={e => setEdgeForm({ ...edgeForm, distance: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Accessibility</label>
                <select
                  value={edgeForm.accessible ? 'true' : 'false'}
                  onChange={e => setEdgeForm({ ...edgeForm, accessible: e.target.value === 'true' })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                >
                  <option value="true">Wheelchair Accessible</option>
                  <option value="false">Stairs / Not Accessible</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowEdgeModal(false)} className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-4 py-1.5 rounded-xl bg-sky-600 text-white font-semibold">
                Save Edge
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
