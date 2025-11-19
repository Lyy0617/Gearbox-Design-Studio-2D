
import React, { useState, useCallback } from 'react';
import { ComponentPalette } from './components/ComponentPalette';
import { DesignCanvas } from './components/DesignCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { GearboxItem, ComponentType, GearComponent, ShaftComponent, BearingComponent, HousingComponent, WormComponent, SimplePartComponent, BearingType } from './types';
import { Box } from 'lucide-react';

function App() {
  const [items, setItems] = useState<GearboxItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleAddItem = useCallback((type: ComponentType, x: number, y: number) => {
    const id = Math.random().toString(36).substr(2, 9);
    let newItem: GearboxItem;

    // Default parameters optimized for Top View (Plan View)
    switch (type) {
      case ComponentType.HELICAL:
        newItem = {
            id, type, x, y, rotation: 0, selected: false,
            params: { teeth: 30, module: 4, pressureAngle: 20, holeDiameter: 20, thickness: 30, helixAngle: 15, color: '#6366f1' }
        } as GearComponent;
        break;
      case ComponentType.BEVEL:
        newItem = {
            id, type, x, y, rotation: 0, selected: false,
            params: { teeth: 24, module: 4, pressureAngle: 20, holeDiameter: 20, thickness: 25, color: '#8b5cf6' }
        } as GearComponent;
        break;
      case ComponentType.WORM:
        newItem = {
            id, type, x, y, rotation: 0, selected: false,
            params: { length: 80, diameter: 40, module: 4, color: '#14b8a6' }
        } as WormComponent;
        break;
      case ComponentType.GEAR:
        newItem = {
          id, type, x, y, rotation: 0, selected: false,
          params: { teeth: 40, module: 4, pressureAngle: 20, holeDiameter: 20, thickness: 20, color: '#3b82f6' }
        } as GearComponent;
        break;
      case ComponentType.SHAFT:
        newItem = {
          id, type, x, y, rotation: 0, selected: false,
          params: { 
            segments: [
              { id: Math.random().toString(36), length: 50, diameter: 20 },
              { id: Math.random().toString(36), length: 150, diameter: 30 },
              { id: Math.random().toString(36), length: 50, diameter: 20 }
            ], 
            color: '#e2e8f0' 
          }
        } as ShaftComponent;
        break;
      case ComponentType.BEARING:
        newItem = {
          id, type, x, y, rotation: 0, selected: false,
          params: { subtype: BearingType.DEEP_GROOVE, width: 15, outerDiameter: 50, innerDiameter: 20, color: '#e2e8f0' }
        } as BearingComponent;
        break;
      case ComponentType.HOUSING:
        newItem = {
          id, type, x, y, rotation: 0, selected: false,
          params: { width: 400, height: 300, color: '#f1f5f9' }
        } as HousingComponent;
        break;
      case ComponentType.COUPLING:
      case ComponentType.SPACER:
      case ComponentType.CIRCLIP:
          newItem = {
              id, type, x, y, rotation: 0, selected: false,
              params: { 
                  width: type === ComponentType.CIRCLIP ? 2 : (type === ComponentType.SPACER ? 10 : 40), 
                  outerDiameter: type === ComponentType.CIRCLIP ? 25 : 40, 
                  innerDiameter: 20, 
                  color: type === ComponentType.COUPLING ? '#64748b' : '#cbd5e1' 
              }
          } as SimplePartComponent;
          break;
      default:
        newItem = {
            id, type: ComponentType.SHAFT, x, y, rotation: 0, selected: false,
            params: { segments: [], color: '#000' }
        } as ShaftComponent;
    }

    setItems(prev => [...prev, newItem]);
    setSelectedId(id);
  }, []);

  const handlePositionChange = useCallback((id: string, newPos: { x?: number, y?: number }) => {
    setItems(prev => {
      const movedItem = prev.find(i => i.id === id);
      if (!movedItem) return prev;

      // 1. Update the moved item first in a new array
      let updatedItems = prev.map(item => 
        item.id === id ? { ...item, ...newPos } : item
      );

      // 2. Linked Movement: If a Shaft moves, move components mounted on it
      if (movedItem.type === ComponentType.SHAFT && newPos.y !== undefined) {
        const shaft = movedItem as ShaftComponent;
        const deltaY = newPos.y - movedItem.y;
        const deltaX = newPos.x !== undefined ? newPos.x - movedItem.x : 0;
        
        // Calculate Shaft Geometry (Horizontal Bounds)
        const totalLength = shaft.params.segments.reduce((a,b) => a + b.length, 0);
        // The movedItem still has OLD coordinates. The shaft covers [oldX - L/2, oldX + L/2]
        const shaftMinX = movedItem.x - totalLength / 2;
        const shaftMaxX = movedItem.x + totalLength / 2;

        updatedItems = updatedItems.map(item => {
          if (item.id === id) return item;
          
          // Condition 1: Must be on the same Axis (Y-aligned)
          const wasAlignedY = Math.abs(item.y - movedItem.y) < 0.1;
          
          // Condition 2: Must be strictly overlapped by the Shaft's length
          // We add a small margin (10px) to catch items slightly hanging off the end or just barely touching
          const margin = 20;
          const isOverlappingX = item.x >= (shaftMinX - margin) && item.x <= (shaftMaxX + margin);

          // Only move items that are NOT shafts and NOT housings
          if (wasAlignedY && 
              isOverlappingX &&
              item.type !== ComponentType.SHAFT && 
              item.type !== ComponentType.HOUSING) {
             return {
               ...item,
               y: item.y + deltaY,
               x: item.x + deltaX // Keep relative X position
             };
          }
          return item;
        });
      }

      return updatedItems;
    });
  }, []);

  const handleUpdateItem = useCallback((id: string, updates: Partial<GearboxItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (updates.params) {
          return { ...item, params: { ...item.params, ...updates.params } } as GearboxItem;
      }
      return { ...item, ...updates } as GearboxItem;
    }));
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const selectedItem = items.find(i => i.id === selectedId) || null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-500/20">
            <Box size={20} className="text-white" />
          </div>
          <div>
              <h1 className="font-bold text-lg tracking-tight text-slate-800 leading-tight">Gearbox Design Studio</h1>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">二维设计平台 (Plan View)</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${items.length > 0 ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                <span className="text-xs text-slate-500 font-medium">组件数量: {items.length}</span>
             </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette />
        
        <div className="flex-1 relative flex flex-col min-w-0">
          <DesignCanvas 
            items={items} 
            selectedId={selectedId}
            onAddItem={handleAddItem}
            onSelectItem={setSelectedId}
            onPositionChange={handlePositionChange}
          />
          
          {selectedId && (
            <PropertiesPanel 
              item={selectedItem} 
              onUpdate={handleUpdateItem} 
              onDelete={handleDeleteItem}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
