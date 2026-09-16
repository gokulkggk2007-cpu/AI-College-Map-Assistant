export type UserRole = 'student' | 'staff' | 'admin';

export interface User {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  year?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Building {
  id: string;
  name: string;
  code: string;
  description: string;
  floorsCount: number;
  color: string;
  x: number; // canvas map bounding box
  y: number;
  width: number;
  height: number;
  entranceNodeId: string;
}

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: number; // 0 = Ground, 1 = First Floor, 2 = Second Floor
  name: string;
  elevation: number;
}

export type RoomType =
  | 'classroom'
  | 'lab'
  | 'office'
  | 'hall'
  | 'restroom'
  | 'medical'
  | 'library'
  | 'canteen'
  | 'facility';

export interface Room {
  id: string;
  name: string;
  roomNumber: string;
  buildingId: string;
  floorNumber: number;
  departmentId?: string;
  type: RoomType;
  capacity?: number;
  headFaculty?: string;
  nodeRefId: string;
  tags: string[];
  aliases: string[]; // English, Tamil, Tanglish synonyms
}

export interface Facility {
  id: string;
  name: string;
  type: 'medical' | 'canteen' | 'restroom' | 'parking' | 'atm' | 'sports' | 'library' | 'security';
  buildingId?: string;
  floorNumber?: number;
  description: string;
  openHours: string;
  emergency: boolean;
  nodeRefId: string;
  contactNumber?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  buildingId: string;
  hodName: string;
  contactEmail: string;
}

export type NodeType =
  | 'room'
  | 'corridor'
  | 'stairs'
  | 'lift'
  | 'ramp'
  | 'entrance'
  | 'gate'
  | 'landmark'
  | 'parking';

export interface CampusNode {
  id: string;
  name: string;
  buildingId?: string;
  floor: number; // 0 for ground / outdoor
  x: number;
  y: number;
  type: NodeType;
  qrCode: string;
}

export interface CampusEdge {
  id: string;
  fromNode: string;
  toNode: string;
  distance: number; // meters
  accessible: boolean; // false for stairs, true for ramps, lifts, flat corridors
  type: 'corridor' | 'stairs' | 'lift' | 'ramp' | 'outdoor_path';
  bidirectional?: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  targetType: 'room' | 'facility' | 'building' | 'node';
  targetId: string;
  nodeId: string;
  title: string;
  subtitle: string;
  createdAt: string;
}

export interface RecentSearch {
  id: string;
  userId: string;
  query: string;
  targetId: string;
  targetName: string;
  nodeId: string;
  timestamp: string;
}

export interface Report {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  locationName: string;
  nodeId?: string;
  issueType: 'incorrect_info' | 'closed_access' | 'broken_lift' | 'wrong_room_number' | 'other';
  description: string;
  status: 'pending' | 'resolved' | 'rejected';
  adminNotes?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'urgent' | 'normal' | 'event';
  department?: string;
  date: string;
  active: boolean;
  createdAt: string;
}

export interface NavigationStep {
  instruction: string;
  distance: number;
  floor: number;
  actionType: 'straight' | 'turn_left' | 'turn_right' | 'take_stairs' | 'take_lift' | 'take_ramp' | 'arrive';
  fromNodeName: string;
  toNodeName: string;
  nodeId: string;
}

export interface RouteResult {
  path: CampusNode[];
  totalDistance: number;
  estimatedMinutes: number;
  steps: NavigationStep[];
  accessible: boolean;
  startNode: CampusNode;
  endNode: CampusNode;
  floorTransitions: Array<{ fromFloor: number; toFloor: number; via: 'stairs' | 'lift' | 'ramp'; atNode: string }>;
}

export interface AIResponsePayload {
  message: string;
  startLocation?: { id: string; name: string; nodeId: string };
  destinationLocation?: { id: string; name: string; nodeId: string };
  routeFound: boolean;
  route?: RouteResult;
  isUnknownLocation?: boolean;
  detectedLanguage?: 'en' | 'ta' | 'tanglish';
}
