import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Building,
  Floor,
  Room,
  Facility,
  Department,
  CampusNode,
  CampusEdge,
  Announcement,
  Favorite,
  RecentSearch,
  RouteResult,
} from '../types/campus';
import { NavigationEngine } from '../services/navigationEngine';
import { useAuth } from './AuthContext';

interface CampusContextType {
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  facilities: Facility[];
  departments: Department[];
  nodes: CampusNode[];
  edges: CampusEdge[];
  announcements: Announcement[];
  favorites: Favorite[];
  recentSearches: RecentSearch[];
  isLoadingData: boolean;

  // Navigation State
  currentLocationNodeId: string;
  locationMethod: 'gps' | 'qr' | 'manual';
  currentFloor: number;
  accessibleMode: boolean;
  activeRoute: RouteResult | null;
  selectedBuildingId: string | null;
  selectedRoom: Room | null;

  // Actions
  setCurrentFloor: (floor: number) => void;
  setAccessibleMode: (enabled: boolean) => void;
  setSelectedBuildingId: (bldId: string | null) => void;
  setSelectedRoom: (room: Room | null) => void;
  setCurrentLocation: (nodeId: string, method?: 'gps' | 'qr' | 'manual') => void;
  startNavigation: (destinationNodeId: string, startNodeId?: string) => Promise<boolean>;
  clearNavigation: () => void;
  toggleFavorite: (targetType: Favorite['targetType'], targetId: string, nodeId: string, title: string, subtitle: string) => Promise<void>;
  isFavorited: (targetId: string) => boolean;
  recordRecentSearch: (query: string, targetId: string, targetName: string, nodeId: string) => Promise<void>;
  clearRecentSearches: () => Promise<void>;
  refreshCampusData: () => Promise<void>;
}

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export const CampusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [nodes, setNodes] = useState<CampusNode[]>([]);
  const [edges, setEdges] = useState<CampusEdge[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Nav state
  const [currentLocationNodeId, setCurrentLocationNodeId] = useState<string>('node-main-gate');
  const [locationMethod, setLocationMethod] = useState<'gps' | 'qr' | 'manual'>('manual');
  const [currentFloor, setCurrentFloor] = useState<number>(0);
  const [accessibleMode, setAccessibleMode] = useState<boolean>(false);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const fetchCampusData = useCallback(async () => {
    try {
      const res = await fetch('/api/campus/all');
      if (res.ok) {
        const data = await res.json();
        setBuildings(data.buildings || []);
        setFloors(data.floors || []);
        setRooms(data.rooms || []);
        setFacilities(data.facilities || []);
        setDepartments(data.departments || []);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setAnnouncements(data.announcements || []);
      }
    } catch (e) {
      console.error('Failed to load campus data:', e);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const fetchUserData = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      setRecentSearches([]);
      return;
    }
    try {
      const [favRes, recRes] = await Promise.all([
        fetch(`/api/favorites?userId=${user.uid}`),
        fetch(`/api/recent-searches?userId=${user.uid}`),
      ]);
      if (favRes.ok) {
        const favData = await favRes.json();
        setFavorites(favData.favorites || []);
      }
      if (recRes.ok) {
        const recData = await recRes.json();
        setRecentSearches(recData.recentSearches || []);
      }
    } catch (e) {
      console.warn('Failed to load user favorites/recents', e);
    }
  }, [user]);

  useEffect(() => {
    fetchCampusData();
  }, [fetchCampusData]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Recalculate route if accessible mode or active route destination changes
  useEffect(() => {
    if (activeRoute) {
      const startId = activeRoute.startNode.id;
      const endId = activeRoute.endNode.id;
      const engine = new NavigationEngine(nodes, edges);
      const newRoute = engine.findRoute(startId, endId, { accessibleOnly: accessibleMode });
      if (newRoute) {
        setActiveRoute(newRoute);
      }
    }
  }, [accessibleMode, nodes, edges]);

  const setCurrentLocation = (nodeId: string, method: 'gps' | 'qr' | 'manual' = 'manual') => {
    setCurrentLocationNodeId(nodeId);
    setLocationMethod(method);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setCurrentFloor(node.floor);
      if (node.buildingId) {
        setSelectedBuildingId(node.buildingId);
      }
    }
  };

  const startNavigation = async (destinationNodeId: string, startNodeId?: string): Promise<boolean> => {
    const fromId = startNodeId || currentLocationNodeId;
    const engine = new NavigationEngine(nodes, edges);
    const route = engine.findRoute(fromId, destinationNodeId, { accessibleOnly: accessibleMode });

    if (route) {
      setActiveRoute(route);
      // Align current floor view to starting floor
      setCurrentFloor(route.startNode.floor);
      if (route.startNode.buildingId) {
        setSelectedBuildingId(route.startNode.buildingId);
      }
      setTimeout(() => {
        document.getElementById('active-navigation-hud')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return true;
    } else {
      return false;
    }
  };

  const clearNavigation = () => {
    setActiveRoute(null);
  };

  const isFavorited = (targetId: string) => {
    return favorites.some(f => f.targetId === targetId);
  };

  const toggleFavorite = async (
    targetType: Favorite['targetType'],
    targetId: string,
    nodeId: string,
    title: string,
    subtitle: string
  ) => {
    if (!user) return;
    const existing = favorites.find(f => f.targetId === targetId);
    if (existing) {
      await fetch(`/api/favorites/${existing.id}`, { method: 'DELETE' });
      setFavorites(prev => prev.filter(f => f.id !== existing.id));
    } else {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          targetType,
          targetId,
          nodeId,
          title,
          subtitle,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(prev => [...prev, data.favorite]);
      }
    }
  };

  const recordRecentSearch = async (
    query: string,
    targetId: string,
    targetName: string,
    nodeId: string
  ) => {
    if (!user) return;
    try {
      const res = await fetch('/api/recent-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          query,
          targetId,
          targetName,
          nodeId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecentSearches(prev => [data.recentSearch, ...prev.filter(r => r.nodeId !== nodeId)].slice(0, 10));
      }
    } catch (e) {
      console.warn('Recent search recording failed', e);
    }
  };

  const clearRecentSearches = async () => {
    if (!user) return;
    await fetch(`/api/recent-searches?userId=${user.uid}`, { method: 'DELETE' });
    setRecentSearches([]);
  };

  return (
    <CampusContext.Provider
      value={{
        buildings,
        floors,
        rooms,
        facilities,
        departments,
        nodes,
        edges,
        announcements,
        favorites,
        recentSearches,
        isLoadingData,
        currentLocationNodeId,
        locationMethod,
        currentFloor,
        accessibleMode,
        activeRoute,
        selectedBuildingId,
        selectedRoom,
        setCurrentFloor,
        setAccessibleMode,
        setSelectedBuildingId,
        setSelectedRoom,
        setCurrentLocation,
        startNavigation,
        clearNavigation,
        toggleFavorite,
        isFavorited,
        recordRecentSearch,
        clearRecentSearches,
        refreshCampusData: fetchCampusData,
      }}
    >
      {children}
    </CampusContext.Provider>
  );
};

export const useCampus = () => {
  const context = useContext(CampusContext);
  if (!context) {
    throw new Error('useCampus must be used within a CampusProvider');
  }
  return context;
};
