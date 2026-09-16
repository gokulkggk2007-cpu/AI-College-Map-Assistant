import { GoogleGenAI } from '@google/genai';
import { dataStore } from './dataStore';
import { NavigationEngine } from '../src/services/navigationEngine';
import { AIResponsePayload } from '../src/types/campus';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

/**
 * Deterministic location entity matcher that checks all rooms, buildings, facilities, and aliases
 */
function resolveCampusLocation(text: string): { id: string; name: string; nodeId: string } | null {
  const normalized = text.toLowerCase().trim();

  // 1. Direct specific entity checks for high-intent campus keywords
  if (normalized.includes('principal') || normalized.includes('mudhalvar') || normalized.includes('head office')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-principal');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('exam') || normalized.includes('coe') || normalized.includes('paritchai') || normalized.includes('hall ticket')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-exam-cell');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('fee') || normalized.includes('account') || normalized.includes('cashier') || normalized.includes('kattanam')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-accounts');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('board room') || normalized.includes('conference')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-board-room');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('dean') || normalized.includes('academic dean')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-dean-office');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('seminar') || normalized.includes('seminar hall')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-ece-seminar');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('ece') || normalized.includes('vlsi') || normalized.includes('dsp') || normalized.includes('embedded') || normalized.includes('iot')) {
    if (normalized.includes('hod') || normalized.includes('dept')) {
      const rm = dataStore.rooms.find(r => r.id === 'rm-ece-dept-office');
      if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    }
    const rm = dataStore.rooms.find(r => r.id === 'rm-ece-lab-1');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('cse') || normalized.includes('cloud') || normalized.includes('software') || normalized.includes('datahub') || normalized.includes('computer')) {
    if (normalized.includes('hod') || normalized.includes('dept')) {
      const rm = dataStore.rooms.find(r => r.id === 'rm-cse-dept-office');
      if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    }
    const rm = dataStore.rooms.find(r => r.id === 'rm-cse-lab-1');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('mech') || normalized.includes('cad') || normalized.includes('cam') || normalized.includes('machinery')) {
    if (normalized.includes('hod') || normalized.includes('dept')) {
      const rm = dataStore.rooms.find(r => r.id === 'rm-mech-dept-office');
      if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    }
    const rm = dataStore.rooms.find(r => r.id === 'rm-mech-lab-1');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
  }

  if (normalized.includes('library') || normalized.includes('noolagam') || normalized.includes('reading') || normalized.includes('journal') || normalized.includes('pusthakam')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-lib-stack');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    const bld = dataStore.buildings.find(b => b.code === 'LIB');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('canteen') || normalized.includes('food') || normalized.includes('saapadu') || normalized.includes('tea') || normalized.includes('coffee') || normalized.includes('bakery') || normalized.includes('juice')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-canteen-main');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    const bld = dataStore.buildings.find(b => b.code === 'CAN');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('hospital') || normalized.includes('clinic') || normalized.includes('doctor') || normalized.includes('medical') || normalized.includes('emergency') || normalized.includes('maruthuvamanai') || normalized.includes('first aid') || normalized.includes('pharmacy') || normalized.includes('ambulance')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-health-clinic');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    const bld = dataStore.buildings.find(b => b.code === 'HEALTH');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('hostel') || normalized.includes('viduthi') || normalized.includes('dorm') || normalized.includes('warden')) {
    const rm = dataStore.rooms.find(r => r.id === 'rm-hostel');
    if (rm) return { id: rm.id, name: rm.name, nodeId: rm.nodeRefId };
    const bld = dataStore.buildings.find(b => b.code === 'HOSTEL');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('auditorium') || normalized.includes('audi') || normalized.includes('convocation') || normalized.includes('stage')) {
    const bld = dataStore.buildings.find(b => b.code === 'AUD');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('parking') || normalized.includes('vandi') || normalized.includes('bike') || normalized.includes('car')) {
    const bld = dataStore.buildings.find(b => b.code === 'PARK');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  if (normalized.includes('atm') || normalized.includes('cash machine')) {
    const fac = dataStore.facilities.find(f => f.type === 'atm');
    if (fac) return { id: fac.id, name: fac.name, nodeId: fac.nodeRefId };
  }

  if (normalized.includes('gate') || normalized.includes('entrance') || normalized.includes('security') || normalized.includes('entry') || normalized.includes('vasal')) {
    const bld = dataStore.buildings.find(b => b.code === 'GATE');
    if (bld) return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
  }

  // 2. Iterative loop check against room aliases and names
  for (const room of dataStore.rooms) {
    if (
      normalized.includes(room.name.toLowerCase()) ||
      normalized.includes(room.roomNumber.toLowerCase()) ||
      room.aliases.some(alias => normalized.includes(alias.toLowerCase())) ||
      room.tags.some(tag => normalized.includes(tag.toLowerCase()))
    ) {
      return { id: room.id, name: room.name, nodeId: room.nodeRefId };
    }
  }

  // 3. Buildings check
  for (const bld of dataStore.buildings) {
    if (
      normalized.includes(bld.name.toLowerCase()) ||
      normalized.includes(bld.code.toLowerCase())
    ) {
      return { id: bld.id, name: bld.name, nodeId: bld.entranceNodeId };
    }
  }

  // 4. Facilities check
  for (const fac of dataStore.facilities) {
    if (
      normalized.includes(fac.name.toLowerCase()) ||
      normalized.includes(fac.type.toLowerCase())
    ) {
      return { id: fac.id, name: fac.name, nodeId: fac.nodeRefId };
    }
  }

  // 5. Direct node names
  for (const node of dataStore.nodes) {
    if (normalized.includes(node.name.toLowerCase())) {
      return { id: node.id, name: node.name, nodeId: node.id };
    }
  }

  return null;
}

export async function processAIChatQuery(
  userQuery: string,
  userLocationNodeId?: string,
  accessibleOnly: boolean = false
): Promise<AIResponsePayload> {
  const query = userQuery.trim();
  const navEngine = new NavigationEngine(dataStore.nodes, dataStore.edges);

  // List all valid campus locations for grounding context
  const campusLocationsSummary = [
    ...dataStore.rooms.map(r => ({ name: r.name, aliases: r.aliases, roomNumber: r.roomNumber, nodeId: r.nodeRefId })),
    ...dataStore.buildings.map(b => ({ name: b.name, code: b.code, nodeId: b.entranceNodeId })),
    ...dataStore.facilities.map(f => ({ name: f.name, type: f.type, nodeId: f.nodeRefId })),
  ];

  let parsedStartName: string | null = null;
  let parsedDestName: string | null = null;

  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `
You are the AI Campus Navigation Assistant for a college campus map system.
You understand English, Tamil, and Tanglish (Tamil in English script).
Examples of queries:
- English: "How do I reach the ECE lab?", "Route from Main Gate to Seminar Hall"
- Tamil: "ECE lab-ku epdi poganum?", "Main Gate-la irundhu library-ku vazhi sollu"
- Tanglish: "Principal office enga irukku?", "Library-ku route sollu", "Canteen epdi porathu?"
- Mixed: "Hostel-la irundhu Audi-ku epdi ponum?"

Here is the EXACT list of legitimate campus locations in this college:
${JSON.stringify(campusLocationsSummary)}

USER QUERY: "${query}"

Extract the start location (if mentioned, otherwise null) and destination location (if mentioned, otherwise null).
CRITICAL RULE: NEVER invent or hallucinate buildings, rooms, distances, or locations not present in this campus list.
If the requested location is completely unknown or outside the college:
respond with isValidLocation: false.

Return STRICT JSON with format:
{
  "startName": string or null,
  "destName": string or null,
  "isValidLocation": boolean,
  "detectedLanguage": "en" | "ta" | "tanglish"
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);

      if (parsed.isValidLocation === false) {
        return {
          message: "I couldn't find that location in the college map. Please select a location from the search results.",
          routeFound: false,
          isUnknownLocation: true,
          detectedLanguage: parsed.detectedLanguage || 'en',
        };
      }

      parsedStartName = parsed.startName;
      parsedDestName = parsed.destName;
    } catch (err) {
      console.warn('Gemini extraction error, falling back to deterministic parser:', err);
    }
  }

  // Fallback to deterministic regex/keyword resolution if Gemini couldn't resolve or was not configured
  const startLoc = (parsedStartName ? resolveCampusLocation(parsedStartName) : null) ||
    (userLocationNodeId ? {
      id: userLocationNodeId,
      name: dataStore.nodes.find(n => n.id === userLocationNodeId)?.name || 'Current Location',
      nodeId: userLocationNodeId,
    } : {
      id: 'node-main-gate',
      name: 'Main Campus Gate',
      nodeId: 'node-main-gate',
    });

  const destLoc = parsedDestName ? resolveCampusLocation(parsedDestName) : resolveCampusLocation(query);

  if (!destLoc) {
    return {
      message: "I couldn't find that location in the college map. Please select a location from the search results.",
      routeFound: false,
      isUnknownLocation: true,
      detectedLanguage: query.match(/[\u0B80-\u0BFF]/) ? 'ta' : 'en',
    };
  }

  // Calculate actual route using Dijkstra Graph Navigation Engine
  const route = navEngine.findRoute(startLoc.nodeId, destLoc.nodeId, { accessibleOnly });

  if (!route) {
    return {
      message: accessibleOnly
        ? `No accessible route found between ${startLoc.name} and ${destLoc.name}. You may disable Accessible Mode to check standard routes including stairs.`
        : `No direct navigation route found between ${startLoc.name} and ${destLoc.name}. Please check with campus security at Main Gate.`,
      startLocation: startLoc,
      destinationLocation: destLoc,
      routeFound: false,
      isUnknownLocation: false,
    };
  }

  // Format the step-by-step summary strictly per requirements:
  // "Start → step → step → Destination. Distance: Xm, Estimated walking time: Y mins."
  const stepSummaries = route.steps.map(s => s.instruction).join(' → ');
  const formattedMessage = `
📍 **Start**: ${startLoc.name}
🏁 **Destination**: ${destLoc.name}
🚶‍♂️ **Step-by-step directions**:
${route.steps.map((s, idx) => `${idx + 1}. ${s.instruction}`).join('\n')}

📏 **Total Distance**: ${route.totalDistance} meters
⏱️ **Estimated Walking Time**: ~${route.estimatedMinutes} min(s)
${accessibleOnly ? '♿ *Wheelchair / Accessible Path Verified (No stairs)*' : ''}
`.trim();

  return {
    message: formattedMessage,
    startLocation: startLoc,
    destinationLocation: destLoc,
    routeFound: true,
    route,
    isUnknownLocation: false,
  };
}
