import {
  Building,
  Floor,
  Room,
  Facility,
  Department,
  CampusNode,
  CampusEdge,
  Announcement,
  User,
  Report,
  Favorite,
  RecentSearch,
} from '../src/types/campus';
import {
  INITIAL_BUILDINGS,
  INITIAL_FLOORS,
  INITIAL_DEPARTMENTS,
  INITIAL_ROOMS,
  INITIAL_FACILITIES,
  INITIAL_NODES,
  INITIAL_EDGES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_USERS,
} from '../src/constants/initialCampusData';

class CampusDataStore {
  public buildings: Building[] = [];
  public floors: Floor[] = [];
  public departments: Department[] = [];
  public rooms: Room[] = [];
  public facilities: Facility[] = [];
  public nodes: CampusNode[] = [];
  public edges: CampusEdge[] = [];
  public announcements: Announcement[] = [];
  public users: User[] = [];
  public reports: Report[] = [];
  public favorites: Favorite[] = [];
  public recentSearches: RecentSearch[] = [];

  constructor() {
    this.resetToDefaults();
  }

  public resetToDefaults() {
    this.buildings = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));
    this.floors = JSON.parse(JSON.stringify(INITIAL_FLOORS));
    this.departments = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
    this.rooms = JSON.parse(JSON.stringify(INITIAL_ROOMS));
    this.facilities = JSON.parse(JSON.stringify(INITIAL_FACILITIES));
    this.nodes = JSON.parse(JSON.stringify(INITIAL_NODES));
    this.edges = JSON.parse(JSON.stringify(INITIAL_EDGES));
    this.announcements = JSON.parse(JSON.stringify(INITIAL_ANNOUNCEMENTS));
    this.users = JSON.parse(JSON.stringify(INITIAL_USERS));
    this.reports = [
      {
        id: 'rep-1',
        userId: 'usr-student-1',
        userName: 'Gokul K.',
        userEmail: 'student@college.edu',
        locationName: 'ECE Block West Stairs',
        nodeId: 'node-ece-stairs-g',
        issueType: 'closed_access',
        description: 'Staircase railing maintenance currently under repair till evening.',
        status: 'pending',
        createdAt: '2026-09-02T14:30:00Z',
      },
    ];
    this.favorites = [
      {
        id: 'fav-1',
        userId: 'usr-student-1',
        targetType: 'room',
        targetId: 'rm-ece-lab-1',
        nodeId: 'node-ece-lab1',
        title: 'ECE Lab 1 (VLSI & DSP)',
        subtitle: 'ECE Block - Ground Floor',
        createdAt: '2026-09-01T10:00:00Z',
      },
      {
        id: 'fav-2',
        userId: 'usr-student-1',
        targetType: 'room',
        targetId: 'rm-library-ground',
        nodeId: 'node-lib-ground',
        title: 'Central Library',
        subtitle: 'Library Block - Ground Floor',
        createdAt: '2026-09-01T11:00:00Z',
      },
    ];
    this.recentSearches = [
      {
        id: 'rec-1',
        userId: 'usr-student-1',
        query: 'Principal Office',
        targetId: 'rm-principal',
        targetName: 'Principal Office',
        nodeId: 'node-admin-principal',
        timestamp: '2026-09-02T16:20:00Z',
      },
    ];
  }

  // User Auth Simulation
  public findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserById(uid: string): User | undefined {
    return this.users.find(u => u.uid === uid);
  }

  public createUser(userData: Omit<User, 'uid' | 'createdAt' | 'updatedAt'>): User {
    const existing = this.findUserByEmail(userData.email);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }
    const newUser: User = {
      ...userData,
      uid: 'usr-' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  // Multilingual Search
  public searchLocations(query: string) {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: 'building' | 'room' | 'facility' | 'department';
      nodeId: string;
      buildingName?: string;
      floor?: number;
    }> = [];

    // Search Buildings
    for (const b of this.buildings) {
      if (
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q)
      ) {
        results.push({
          id: b.id,
          title: b.name,
          subtitle: `${b.code} • ${b.floorsCount} Floor(s)`,
          category: 'building',
          nodeId: b.entranceNodeId,
          buildingName: b.name,
          floor: 0,
        });
      }
    }

    // Search Rooms
    for (const r of this.rooms) {
      const bld = this.buildings.find(b => b.id === r.buildingId);
      const matches =
        r.name.toLowerCase().includes(q) ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.tags.some(t => t.toLowerCase().includes(q)) ||
        r.aliases.some(a => a.toLowerCase().includes(q));

      if (matches) {
        results.push({
          id: r.id,
          title: r.name,
          subtitle: `${r.roomNumber} • ${bld?.name || ''} (Floor ${r.floorNumber})`,
          category: 'room',
          nodeId: r.nodeRefId,
          buildingName: bld?.name,
          floor: r.floorNumber,
        });
      }
    }

    // Search Facilities
    for (const f of this.facilities) {
      const bld = this.buildings.find(b => b.id === f.buildingId);
      if (
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q)
      ) {
        results.push({
          id: f.id,
          title: f.name,
          subtitle: `${f.openHours} • ${bld ? bld.name : 'Campus Outdoors'}`,
          category: 'facility',
          nodeId: f.nodeRefId,
          buildingName: bld?.name,
          floor: f.floorNumber ?? 0,
        });
      }
    }

    // Search Departments
    for (const d of this.departments) {
      const bld = this.buildings.find(b => b.id === d.buildingId);
      if (
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.hodName.toLowerCase().includes(q)
      ) {
        results.push({
          id: d.id,
          title: `${d.name} (${d.code})`,
          subtitle: `HOD: ${d.hodName} • ${bld?.name || ''}`,
          category: 'department',
          nodeId: bld?.entranceNodeId || 'node-main-gate',
          buildingName: bld?.name,
          floor: 0,
        });
      }
    }

    return results;
  }
}

export const dataStore = new CampusDataStore();
