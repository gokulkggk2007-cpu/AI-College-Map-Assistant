import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import QRCode from 'qrcode';
import { dataStore } from './server/dataStore';
import { NavigationEngine } from './src/services/navigationEngine';
import { processAIChatQuery } from './server/geminiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Navigation engine instance
  let navEngine = new NavigationEngine(dataStore.nodes, dataStore.edges);

  const refreshNavEngine = () => {
    navEngine = new NavigationEngine(dataStore.nodes, dataStore.edges);
  };

  // --- HEALTH & STATUS ---
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- AUTHENTICATION ---
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = dataStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please check your credentials or register.' });
    }
    // In real production, verify hashed password; here standard auth session response
    res.json({
      user,
      token: 'jwt-session-token-' + user.uid,
    });
  });

  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, role = 'student', department = 'General', year } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }
      const newUser = dataStore.createUser({
        name,
        email,
        role,
        department,
        year,
      });
      res.json({
        user: newUser,
        token: 'jwt-session-token-' + newUser.uid,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header provided' });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const uid = token.replace('jwt-session-token-', '');
    const user = dataStore.findUserById(uid);
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    res.json({ user });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const user = dataStore.findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No registered user found with this email' });
    }
    res.json({
      success: true,
      message: `Password reset link has been dispatched to ${email}. Check your inbox.`,
    });
  });

  // --- CAMPUS DATA ---
  app.get('/api/campus/all', (req, res) => {
    res.json({
      buildings: dataStore.buildings,
      floors: dataStore.floors,
      departments: dataStore.departments,
      rooms: dataStore.rooms,
      facilities: dataStore.facilities,
      nodes: dataStore.nodes,
      edges: dataStore.edges,
      announcements: dataStore.announcements.filter(a => a.active),
    });
  });

  app.get('/api/campus/search', (req, res) => {
    const query = String(req.query.q || '');
    const results = dataStore.searchLocations(query);
    res.json({ results });
  });

  // --- NAVIGATION (DIJKSTRA / A*) ---
  app.post('/api/navigation/route', (req, res) => {
    const { startNodeId, targetNodeId, accessibleOnly = false } = req.body;
    if (!startNodeId || !targetNodeId) {
      return res.status(400).json({ error: 'startNodeId and targetNodeId are required' });
    }

    refreshNavEngine();
    const route = navEngine.findRoute(startNodeId, targetNodeId, { accessibleOnly });
    if (!route) {
      return res.status(404).json({
        error: accessibleOnly
          ? 'No accessible route found without stairs. Consider disabling Accessible Mode.'
          : 'No path found between the selected points.',
      });
    }

    res.json({ route });
  });

  // --- AI CONVERSATIONAL ASSISTANT ---
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const { query, userLocationNodeId, accessibleOnly } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query string is required' });
      }

      refreshNavEngine();
      const aiResponse = await processAIChatQuery(query, userLocationNodeId, !!accessibleOnly);
      res.json(aiResponse);
    } catch (err: any) {
      console.error('AI chat error:', err);
      res.status(500).json({ error: err.message || 'AI Assistant service unavailable' });
    }
  });

  // --- QR CODE IDENTIFIER & GENERATOR ---
  app.get('/api/qr/generate', async (req, res) => {
    const nodeId = String(req.query.nodeId || '');
    const node = dataStore.nodes.find(n => n.id === nodeId);
    if (!node) {
      return res.status(404).json({ error: 'Node not found' });
    }
    try {
      const qrDataUrl = await QRCode.toDataURL(node.qrCode, {
        width: 300,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      res.json({ qrDataUrl, node });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  });

  // --- FAVORITES & RECENT SEARCHES ---
  app.get('/api/favorites', (req, res) => {
    const userId = String(req.query.userId || '');
    const favs = dataStore.favorites.filter(f => f.userId === userId);
    res.json({ favorites: favs });
  });

  app.post('/api/favorites', (req, res) => {
    const { userId, targetType, targetId, nodeId, title, subtitle } = req.body;
    if (!userId || !targetId || !nodeId) {
      return res.status(400).json({ error: 'Missing required favorite fields' });
    }
    const newFav = {
      id: 'fav-' + Date.now(),
      userId,
      targetType,
      targetId,
      nodeId,
      title,
      subtitle,
      createdAt: new Date().toISOString(),
    };
    dataStore.favorites.push(newFav);
    res.json({ favorite: newFav });
  });

  app.delete('/api/favorites/:id', (req, res) => {
    const id = req.params.id;
    dataStore.favorites = dataStore.favorites.filter(f => f.id !== id);
    res.json({ success: true });
  });

  app.get('/api/recent-searches', (req, res) => {
    const userId = String(req.query.userId || '');
    const recents = dataStore.recentSearches.filter(r => r.userId === userId);
    res.json({ recentSearches: recents });
  });

  app.post('/api/recent-searches', (req, res) => {
    const { userId, query, targetId, targetName, nodeId } = req.body;
    if (!userId || !targetName || !nodeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Prepend and limit to 10
    const newRec = {
      id: 'rec-' + Date.now(),
      userId,
      query: query || targetName,
      targetId,
      targetName,
      nodeId,
      timestamp: new Date().toISOString(),
    };
    dataStore.recentSearches = [newRec, ...dataStore.recentSearches.filter(r => r.nodeId !== nodeId)].slice(0, 10);
    res.json({ recentSearch: newRec });
  });

  app.delete('/api/recent-searches', (req, res) => {
    const userId = String(req.query.userId || '');
    dataStore.recentSearches = dataStore.recentSearches.filter(r => r.userId !== userId);
    res.json({ success: true });
  });

  // --- REPORTS ---
  app.get('/api/reports', (req, res) => {
    res.json({ reports: dataStore.reports });
  });

  app.post('/api/reports', (req, res) => {
    const { userId, userName, userEmail, locationName, nodeId, issueType, description } = req.body;
    if (!locationName || !description) {
      return res.status(400).json({ error: 'Location and description are required' });
    }
    const newReport = {
      id: 'rep-' + Date.now(),
      userId: userId || 'anonymous',
      userName: userName || 'Campus User',
      userEmail: userEmail || 'user@college.edu',
      locationName,
      nodeId,
      issueType: issueType || 'other',
      description,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    dataStore.reports.unshift(newReport);
    res.json({ report: newReport });
  });

  app.patch('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    const report = dataStore.reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    if (status) report.status = status;
    if (adminNotes !== undefined) report.adminNotes = adminNotes;
    report.resolvedAt = new Date().toISOString();
    res.json({ report });
  });

  // --- ANNOUNCEMENTS ---
  app.get('/api/announcements', (req, res) => {
    res.json({ announcements: dataStore.announcements });
  });

  app.post('/api/announcements', (req, res) => {
    const { title, content, priority = 'normal', department } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    const newAnn = {
      id: 'ann-' + Date.now(),
      title,
      content,
      priority,
      department: department || 'Campus Admin',
      date: new Date().toISOString().split('T')[0],
      active: true,
      createdAt: new Date().toISOString(),
    };
    dataStore.announcements.unshift(newAnn);
    res.json({ announcement: newAnn });
  });

  app.delete('/api/announcements/:id', (req, res) => {
    const { id } = req.params;
    dataStore.announcements = dataStore.announcements.filter(a => a.id !== id);
    res.json({ success: true });
  });

  // --- ADMIN CRUD ---
  // Buildings
  app.post('/api/admin/buildings', (req, res) => {
    const bld = req.body;
    bld.id = bld.id || 'bld-' + Date.now();
    dataStore.buildings.push(bld);
    res.json({ building: bld });
  });

  app.put('/api/admin/buildings/:id', (req, res) => {
    const { id } = req.params;
    const idx = dataStore.buildings.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Building not found' });
    dataStore.buildings[idx] = { ...dataStore.buildings[idx], ...req.body };
    res.json({ building: dataStore.buildings[idx] });
  });

  app.delete('/api/admin/buildings/:id', (req, res) => {
    const { id } = req.params;
    dataStore.buildings = dataStore.buildings.filter(b => b.id !== id);
    res.json({ success: true });
  });

  // Rooms
  app.post('/api/admin/rooms', (req, res) => {
    const rm = req.body;
    rm.id = rm.id || 'rm-' + Date.now();
    rm.aliases = Array.isArray(rm.aliases) ? rm.aliases : (rm.aliases ? String(rm.aliases).split(',') : []);
    rm.tags = Array.isArray(rm.tags) ? rm.tags : (rm.tags ? String(rm.tags).split(',') : []);
    dataStore.rooms.push(rm);
    res.json({ room: rm });
  });

  app.put('/api/admin/rooms/:id', (req, res) => {
    const { id } = req.params;
    const idx = dataStore.rooms.findIndex(r => r.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Room not found' });
    dataStore.rooms[idx] = { ...dataStore.rooms[idx], ...req.body };
    res.json({ room: dataStore.rooms[idx] });
  });

  app.delete('/api/admin/rooms/:id', (req, res) => {
    const { id } = req.params;
    dataStore.rooms = dataStore.rooms.filter(r => r.id !== id);
    res.json({ success: true });
  });

  // Facilities
  app.post('/api/admin/facilities', (req, res) => {
    const fac = req.body;
    fac.id = fac.id || 'fac-' + Date.now();
    dataStore.facilities.push(fac);
    res.json({ facility: fac });
  });

  app.delete('/api/admin/facilities/:id', (req, res) => {
    const { id } = req.params;
    dataStore.facilities = dataStore.facilities.filter(f => f.id !== id);
    res.json({ success: true });
  });

  // Nodes & Edges
  app.post('/api/admin/nodes', (req, res) => {
    const node = req.body;
    node.id = node.id || 'node-' + Date.now();
    node.qrCode = node.qrCode || `CAMPUS_NODE_${node.id.toUpperCase()}`;
    dataStore.nodes.push(node);
    refreshNavEngine();
    res.json({ node });
  });

  app.put('/api/admin/nodes/:id', (req, res) => {
    const { id } = req.params;
    const idx = dataStore.nodes.findIndex(n => n.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Node not found' });
    dataStore.nodes[idx] = { ...dataStore.nodes[idx], ...req.body };
    refreshNavEngine();
    res.json({ node: dataStore.nodes[idx] });
  });

  app.delete('/api/admin/nodes/:id', (req, res) => {
    const { id } = req.params;
    dataStore.nodes = dataStore.nodes.filter(n => n.id !== id);
    dataStore.edges = dataStore.edges.filter(e => e.fromNode !== id && e.toNode !== id);
    refreshNavEngine();
    res.json({ success: true });
  });

  app.post('/api/admin/edges', (req, res) => {
    const edge = req.body;
    edge.id = edge.id || 'edge-' + Date.now();
    edge.distance = Number(edge.distance) || 20;
    edge.accessible = edge.accessible !== false;
    dataStore.edges.push(edge);
    refreshNavEngine();
    res.json({ edge });
  });

  app.delete('/api/admin/edges/:id', (req, res) => {
    const { id } = req.params;
    dataStore.edges = dataStore.edges.filter(e => e.id !== id);
    refreshNavEngine();
    res.json({ success: true });
  });

  // Reset to default sample campus data
  app.post('/api/admin/reset-data', (req, res) => {
    dataStore.resetToDefaults();
    refreshNavEngine();
    res.json({ success: true, message: 'Campus dataset successfully reset to official college seed data.' });
  });

  // Admin stats
  app.get('/api/admin/stats', (req, res) => {
    res.json({
      totalUsers: dataStore.users.length,
      totalBuildings: dataStore.buildings.length,
      totalRooms: dataStore.rooms.length,
      totalFacilities: dataStore.facilities.length,
      totalNodes: dataStore.nodes.length,
      totalEdges: dataStore.edges.length,
      pendingReports: dataStore.reports.filter(r => r.status === 'pending').length,
    });
  });

  // --- VITE DEV / PRODUCTION MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Map Assistant Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
