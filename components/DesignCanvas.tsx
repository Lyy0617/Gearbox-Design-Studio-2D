
import React, { useRef, useState } from 'react';
import { GearboxItem, ComponentType, GearComponent, ShaftComponent, BearingComponent, HousingComponent, WormComponent, SimplePartComponent, BearingType, SNAP_GRID, ViewPort } from '../types';
import { ZoomIn, ZoomOut, RefreshCw, Magnet, AlignStartVertical } from 'lucide-react';

interface Props {
  items: GearboxItem[];
  selectedId: string | null;
  onAddItem: (type: ComponentType, x: number, y: number) => void;
  onSelectItem: (id: string | null) => void;
  onPositionChange: (id: string, newPos: { x?: number, y?: number }) => void;
}

export const DesignCanvas: React.FC<Props> = ({ items, selectedId, onAddItem, onSelectItem, onPositionChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewport, setViewport] = useState<ViewPort>({ x: -500, y: -400, zoom: 1 });
  const [isDraggingView, setIsDraggingView] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [alignLine, setAlignLine] = useState<number | null>(null);
  const [meshSnapLine, setMeshSnapLine] = useState<{y: number, label: string} | null>(null);

  // --- Coordinate Conversion ---
  const getSVGPoint = (clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const pt = svgRef.current.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM()?.inverse());
  };

  // --- Drag & Drop (Add New) ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('componentType') as ComponentType;
    if (type) {
      const point = getSVGPoint(e.clientX, e.clientY);
      let x = point.x;
      let y = point.y;
      
      // Default snap for new items
      x = Math.round(x / SNAP_GRID) * SNAP_GRID;
      y = Math.round(y / SNAP_GRID) * SNAP_GRID;

      onAddItem(type, x, y);
    }
  };

  // --- Canvas Pan/Zoom ---
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.002;
      const newZoom = Math.min(Math.max(0.1, viewport.zoom + zoomFactor), 5);
      setViewport(prev => ({ ...prev, zoom: newZoom }));
    } else {
      if (!draggingItemId) {
        setViewport(prev => ({
          ...prev,
          x: prev.x - e.deltaX / prev.zoom,
          y: prev.y - e.deltaY / prev.zoom
        }));
      }
    }
  };

  // --- Item Dragging & Logic ---
  const handlePointerDown = (e: React.PointerEvent, itemId?: string) => {
    e.preventDefault();
    const pt = getSVGPoint(e.clientX, e.clientY);
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (itemId) {
      e.stopPropagation();
      const item = items.find(i => i.id === itemId);
      if (item) {
        setDraggingItemId(itemId);
        setDragOffset({ x: pt.x - item.x, y: pt.y - item.y });
        onSelectItem(itemId);
      }
    } else {
      if (e.button === 0 && !e.shiftKey) {
        onSelectItem(null);
      }
      if (e.button === 1 || e.shiftKey || e.button === 0) {
        setIsDraggingView(true);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.preventDefault();
    const pt = getSVGPoint(e.clientX, e.clientY);

    if (draggingItemId) {
      let newX = pt.x - dragOffset.x;
      let newY = pt.y - dragOffset.y;
      let currentAlignLine = null;
      let currentMeshLine = null;

      const draggingItem = items.find(i => i.id === draggingItemId);
      
      if (draggingItem && snapEnabled) {
          // 1. Shaft Snapping (Snap Y to grid, X to grid)
          if (draggingItem.type === ComponentType.SHAFT) {
              newX = Math.round(newX / SNAP_GRID) * SNAP_GRID;
              newY = Math.round(newY / SNAP_GRID) * SNAP_GRID;
          } 
          // 2. Component Snapping
          else if (draggingItem.type !== ComponentType.HOUSING) {
              let nearestShaftY = null;
              let meshY = null;
              
              // Thresholds
              const shaftSnapDist = 25 / viewport.zoom; 
              const meshSnapDist = 20 / viewport.zoom;

              // A. Snap to Shaft
              for (const item of items) {
                  if (item.type === ComponentType.SHAFT) {
                      const dist = Math.abs(newY - item.y);
                      if (dist < shaftSnapDist) {
                          nearestShaftY = item.y;
                      }
                  }
              }

              // B. Gear Meshing Snap (Only for gears)
              if (draggingItem.type === ComponentType.GEAR || draggingItem.type === ComponentType.HELICAL || draggingItem.type === ComponentType.BEVEL) {
                 const myGear = draggingItem as GearComponent;
                 const myRadius = (myGear.params.teeth * myGear.params.module) / 2;

                 for (const otherItem of items) {
                     // Look for other gears that are NOT the one being dragged
                     if (otherItem.id !== draggingItem.id && 
                        (otherItem.type === ComponentType.GEAR || otherItem.type === ComponentType.HELICAL || otherItem.type === ComponentType.BEVEL)) {
                        
                        const otherGear = otherItem as GearComponent;
                        const otherRadius = (otherGear.params.teeth * otherGear.params.module) / 2;
                        
                        // Target Distance = Sum of Pitch Radii
                        const targetDistance = myRadius + otherRadius;
                        
                        // Check if we are close to a valid mesh distance above or below
                        const meshTop = otherItem.y - targetDistance;
                        const meshBottom = otherItem.y + targetDistance;

                        if (Math.abs(newY - meshTop) < meshSnapDist) {
                            meshY = meshTop;
                            currentMeshLine = { y: meshTop, label: `Mesh Dist: ${targetDistance}mm` };
                        } else if (Math.abs(newY - meshBottom) < meshSnapDist) {
                            meshY = meshBottom;
                            currentMeshLine = { y: meshBottom, label: `Mesh Dist: ${targetDistance}mm` };
                        }
                     }
                 }
              }

              // Priority: Mesh Snap > Shaft Snap > Grid Snap
              if (meshY !== null) {
                  newY = meshY;
              } else if (nearestShaftY !== null) {
                  newY = nearestShaftY;
                  currentAlignLine = newY;
              } else {
                  // If no shaft/mesh, snap to grid
                  newY = Math.round(newY / SNAP_GRID) * SNAP_GRID;
              }
              // Always snap X to grid for cleaner layout
              newX = Math.round(newX / SNAP_GRID) * SNAP_GRID;
          }
          // 3. Housing Snap
          else {
              newX = Math.round(newX / (SNAP_GRID*2)) * (SNAP_GRID*2);
              newY = Math.round(newY / (SNAP_GRID*2)) * (SNAP_GRID*2);
          }
      }

      setAlignLine(currentAlignLine);
      setMeshSnapLine(currentMeshLine);
      onPositionChange(draggingItemId, { x: newX, y: newY });

    } else if (isDraggingView) {
        const dx = (e.clientX - lastMousePos.x) / viewport.zoom;
        const dy = (e.clientY - lastMousePos.y) / viewport.zoom;
        setViewport(prev => ({ ...prev, x: prev.x - dx, y: prev.y - dy }));
        setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handlePointerUp = () => {
    setDraggingItemId(null);
    setIsDraggingView(false);
    setAlignLine(null);
    setMeshSnapLine(null);
  };

  // --- Renderers (PLAN VIEW / TOP VIEW) ---
  
  const renderGrid = () => (
      <g className="pointer-events-none opacity-20">
        <defs>
          <pattern id="smallGrid" width={SNAP_GRID} height={SNAP_GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${SNAP_GRID} 0 L 0 0 0 ${SNAP_GRID}`} fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
          </pattern>
          <pattern id="largeGrid" width={SNAP_GRID * 5} height={SNAP_GRID * 5} patternUnits="userSpaceOnUse">
            <rect width={SNAP_GRID * 5} height={SNAP_GRID * 5} fill="url(#smallGrid)" />
            <path d={`M ${SNAP_GRID * 5} 0 L 0 0 0 ${SNAP_GRID * 5}`} fill="none" stroke="#94a3b8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x={-5000} y={-5000} width={10000} height={10000} fill="url(#largeGrid)" />
        {/* Axis markers */}
        <line x1={-5000} y1={0} x2={5000} y2={0} stroke="#3b82f6" strokeWidth="2" opacity="0.3" />
        <line x1={0} y1={-5000} x2={0} y2={5000} stroke="#3b82f6" strokeWidth="2" opacity="0.3" />
      </g>
  );

  const renderItem = (item: GearboxItem, isSelected: boolean) => {
    // Common selection stroke
    const strokeColor = isSelected ? '#2563eb' : '#334155'; // Blue-600 selected, Slate-700 normal
    const strokeWidth = isSelected ? 2.5 : 1.5;
    const rotation = item.rotation || 0;

    const containerTransform = `rotate(${rotation})`;

    switch (item.type) {
      case ComponentType.SHAFT: {
        const shaft = item as ShaftComponent;
        // Calculate total length for centering
        const totalLength = shaft.params.segments.reduce((acc, seg) => acc + seg.length, 0);
        
        let currentX = -totalLength / 2;

        return (
          <g>
             {/* Segments */}
             {shaft.params.segments.map((seg, idx) => {
                const segEl = (
                    <rect 
                        key={seg.id}
                        x={currentX} 
                        y={-seg.diameter/2} 
                        width={seg.length} 
                        height={seg.diameter} 
                        fill="#e2e8f0" 
                        stroke={strokeColor} 
                        strokeWidth={strokeWidth}
                    />
                );
                currentX += seg.length;
                return segEl;
             })}
             
             {/* Centerline */}
             <line x1={-totalLength/2 - 20} y1={0} x2={totalLength/2 + 20} y2={0} stroke="#94a3b8" strokeDasharray="15 5 3 5" strokeWidth="1" />
          </g>
        );
      }

      case ComponentType.GEAR:
      case ComponentType.HELICAL:
      case ComponentType.BEVEL: {
        const gear = item as GearComponent;
        const pd = gear.params.teeth * gear.params.module; // Pitch Diameter
        const width = gear.params.thickness;
        const isHelical = item.type === ComponentType.HELICAL;
        const isBevel = item.type === ComponentType.BEVEL;
        
        return (
          <g transform={containerTransform}>
             {/* Gear Profile */}
             <rect 
                x={-width/2} 
                y={-pd/2} 
                width={width} 
                height={pd} 
                fill={gear.params.color} 
                fillOpacity="0.9" 
                stroke={strokeColor} 
                strokeWidth={strokeWidth} 
             />
             {/* Center Pitch Line */}
             <line x1={-width/2} y1={0} x2={width/2} y2={0} stroke="white" strokeOpacity="0.7" strokeDasharray="4 2" />
             
             {isHelical && (
                 <g stroke="white" strokeOpacity="0.5" strokeWidth="1">
                     <line x1={-width/2} y1={-pd/2} x2={width/2} y2={-pd/2 + 10} />
                     <line x1={-width/2} y1={-pd/2 + 20} x2={width/2} y2={-pd/2 + 30} />
                     <line x1={-width/2} y1={pd/2 - 30} x2={width/2} y2={pd/2 - 20} />
                     <line x1={-width/2} y1={pd/2 - 10} x2={width/2} y2={pd/2} />
                 </g>
             )}

             {isBevel && (
                 <g>
                    <path 
                        d={`M ${-width/2} ${-pd/2} L ${width/2} ${-pd/2 * 0.8} L ${width/2} ${pd/2 * 0.8} L ${-width/2} ${pd/2} Z`} 
                        fill="none" 
                        stroke="white" 
                        strokeOpacity="0.5" 
                    />
                    {/* Orientation Indicator */}
                    <path d={`M 0 0 L ${width/2+10} 0`} stroke="white" markerEnd="url(#arrow)" opacity="0.5"/>
                 </g>
             )}
          </g>
        );
      }

      case ComponentType.BEARING: {
          const bearing = item as BearingComponent;
          const od = bearing.params.outerDiameter;
          const width = bearing.params.width;
          const subtype = bearing.params.subtype;
          
          return (
              <g transform={containerTransform}>
                  <rect 
                    x={-width/2} 
                    y={-od/2} 
                    width={width} 
                    height={od} 
                    fill="#ffffff" 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth}
                  />
                  
                  {/* Specific Bearing Symbols (Standard Schematic Representations) */}
                  <g stroke="#64748b" strokeWidth="1" fill="none">
                    {/* 1. Deep Groove Ball: Box with circle or dot */}
                    {subtype === BearingType.DEEP_GROOVE && (
                         <>
                            <circle cx={0} cy={-od/4} r={Math.min(width, od/2)/3} />
                            <circle cx={0} cy={od/4} r={Math.min(width, od/2)/3} />
                         </>
                    )}

                    {/* 2. Angular Contact: Box with slanted line passing through corners/center */}
                    {subtype === BearingType.ANGULAR_CONTACT && (
                        <>
                            <circle cx={0} cy={-od/4} r={Math.min(width, od/2)/3} />
                            <circle cx={0} cy={od/4} r={Math.min(width, od/2)/3} />
                            <line x1={-width/2} y1={-od/2} x2={width/2} y2={0} strokeOpacity="0.5" />
                            <line x1={width/2} y1={0} x2={-width/2} y2={od/2} strokeOpacity="0.5" />
                        </>
                    )}

                    {/* 3. Cylindrical Roller: Box with rectangle or parallel lines */}
                    {subtype === BearingType.CYLINDRICAL_ROLLER && (
                         <>
                            <rect x={-width/4} y={-od/2 + 2} width={width/2} height={od/2 - 4} />
                            <rect x={-width/4} y={2} width={width/2} height={od/2 - 4} />
                         </>
                    )}

                    {/* 4. Tapered Roller: Trapezoid symbol */}
                    {subtype === BearingType.TAPERED_ROLLER && (
                        <>
                           {/* Upper roller */}
                           <path d={`M ${-width/4} ${-od/2 + 2} L ${width/4} ${-od/2 + 4} L ${width/4} ${-2} L ${-width/4} ${-4} Z`} />
                           {/* Lower roller */}
                           <path d={`M ${-width/4} ${od/2 - 2} L ${width/4} ${od/2 - 4} L ${width/4} ${2} L ${-width/4} ${4} Z`} />
                           {/* Force lines */}
                           <line x1={-width/2} y1={-od/2} x2={width/2} y2={-od/4} strokeOpacity="0.3" />
                           <line x1={-width/2} y1={od/2} x2={width/2} y2={od/4} strokeOpacity="0.3" />
                        </>
                    )}

                    {/* 5. Self-Aligning: Outer raceway is curved (arc) */}
                    {subtype === BearingType.SELF_ALIGNING && (
                        <>
                            {/* Draw arc for outer race */}
                            <path d={`M ${-width/2} ${-od/2} Q ${0} ${-od/2 + 5} ${width/2} ${-od/2}`} />
                            <path d={`M ${-width/2} ${od/2} Q ${0} ${od/2 - 5} ${width/2} ${od/2}`} />
                            {/* Double balls */}
                            <circle cx={-width/4} cy={-od/3.5} r={2} fill="#64748b" stroke="none"/>
                            <circle cx={width/4} cy={-od/3.5} r={2} fill="#64748b" stroke="none"/>
                            <circle cx={-width/4} cy={od/3.5} r={2} fill="#64748b" stroke="none"/>
                            <circle cx={width/4} cy={od/3.5} r={2} fill="#64748b" stroke="none"/>
                        </>
                    )}
                    
                    {/* 6. Thrust: Split vertically */}
                    {subtype === BearingType.THRUST && (
                        <>
                             <line x1={0} y1={-od/2} x2={0} y2={od/2} />
                             <circle cx={0} cy={-od/4} r={Math.min(width/2, od/4)-1} />
                             <circle cx={0} cy={od/4} r={Math.min(width/2, od/4)-1} />
                             <rect x={-width/2} y={-od/2} width={width/3} height={od} opacity="0.1" fill="#000"/>
                             <rect x={width/6} y={-od/2} width={width/3} height={od} opacity="0.1" fill="#000"/>
                        </>
                    )}
                  </g>
              </g>
          );
      }

      case ComponentType.SPACER: {
          const part = item as SimplePartComponent;
          return (
              <rect 
                  transform={containerTransform}
                  x={-part.params.width/2} 
                  y={-part.params.outerDiameter/2} 
                  width={part.params.width} 
                  height={part.params.outerDiameter} 
                  fill="#94a3b8"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
              />
          )
      }

      case ComponentType.COUPLING: {
        const part = item as SimplePartComponent;
        return (
            <g transform={containerTransform}>
                <rect 
                    x={-part.params.width/2} 
                    y={-part.params.outerDiameter/2} 
                    width={part.params.width} 
                    height={part.params.outerDiameter} 
                    fill="#64748b"
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                />
                {/* Split line */}
                <line x1={0} y1={-part.params.outerDiameter/2} x2={0} y2={part.params.outerDiameter/2} stroke="white" strokeOpacity="0.5" />
                {/* Keyway hint */}
                <rect x={-part.params.width/2} y={-5} width={part.params.width} height={10} fill="none" stroke="white" strokeOpacity="0.3" />
            </g>
        )
      }

      case ComponentType.CIRCLIP: {
          const part = item as SimplePartComponent;
          const od = part.params.outerDiameter;
          return (
              <g transform={containerTransform}>
                 <rect x={-2} y={-od/2} width={4} height={od} fill="#475569" stroke={strokeColor} strokeWidth={1} />
                 <circle cx={0} cy={-od/2 - 2} r={2} fill="none" stroke={strokeColor} strokeWidth={1} />
                 <circle cx={0} cy={od/2 + 2} r={2} fill="none" stroke={strokeColor} strokeWidth={1} />
              </g>
          )
      }

      case ComponentType.WORM: {
          const worm = item as WormComponent;
          const len = worm.params.length;
          const diam = worm.params.diameter;

          return (
              <g transform={containerTransform}>
                  <rect 
                    x={-len/2} 
                    y={-diam/2} 
                    width={len} 
                    height={diam} 
                    rx={4}
                    fill={worm.params.color} 
                    stroke={strokeColor} 
                    strokeWidth={strokeWidth}
                  />
                  {/* Thread lines */}
                  {[...Array(Math.floor(len/12))].map((_, i) => (
                       <path 
                        key={i}
                        d={`M ${-len/2 + i*12 + 5} ${-diam/2} Q ${-len/2 + i*12 + 10} 0 ${-len/2 + i*12 + 5} ${diam/2}`} 
                        fill="none" 
                        stroke="white" 
                        strokeOpacity="0.6"
                       />
                  ))}
              </g>
          );
      }

      case ComponentType.HOUSING: {
          const housing = item as HousingComponent;
          const w = housing.params.width;
          const h = housing.params.height;
          return (
              <g transform={containerTransform}>
                  <rect x={-w/2} y={-h/2} width={w} height={h} fill="none" stroke={isSelected ? '#2563eb' : '#94a3b8'} strokeWidth="2" strokeDasharray="8 4" />
                  <text x={-w/2 + 10} y={-h/2 + 20} fill="#94a3b8" fontSize="12" fontFamily="monospace">HOUSING BOUNDARY</text>
              </g>
          );
      }
    }
  };

  return (
    <div className="relative flex-1 h-full bg-white overflow-hidden cursor-crosshair">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur border border-slate-200 rounded-lg p-1.5 shadow-xl flex flex-col gap-1">
                <button onClick={() => setViewport(v => ({...v, zoom: v.zoom * 1.2}))} className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="放大"><ZoomIn size={20} /></button>
                <button onClick={() => setViewport(v => ({...v, zoom: v.zoom / 1.2}))} className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="缩小"><ZoomOut size={20} /></button>
                <button onClick={() => setViewport({x: -500, y: -400, zoom: 1})} className="p-2 hover:bg-slate-100 rounded text-slate-600 transition-colors" title="重置视图"><RefreshCw size={20} /></button>
                <div className="h-px bg-slate-200 my-1"></div>
                <button 
                    onClick={() => setSnapEnabled(!snapEnabled)} 
                    className={`p-2 rounded transition-all ${snapEnabled ? 'bg-blue-50 text-blue-600' : 'hover:bg-slate-100 text-slate-400'}`}
                    title="切换自动吸附"
                >
                    {snapEnabled ? <Magnet size={20} /> : <AlignStartVertical size={20} />}
                </button>
            </div>
            
            <div className="bg-white/80 backdrop-blur px-3 py-1 rounded-full border border-slate-200 text-xs text-slate-500 font-mono text-center shadow-sm">
                {Math.round(viewport.zoom * 100)}%
            </div>
        </div>

        <svg
            ref={svgRef}
            className="w-full h-full touch-none"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onPointerDown={(e) => handlePointerDown(e)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            viewBox={`${viewport.x} ${viewport.y} ${svgRef.current?.clientWidth ? svgRef.current.clientWidth / viewport.zoom : 800} ${svgRef.current?.clientHeight ? svgRef.current.clientHeight / viewport.zoom : 600}`}
        >
            {renderGrid()}

            {/* Alignment Guide Line (Shaft) */}
            {alignLine !== null && (
                <line 
                    x1={-10000} y1={alignLine} 
                    x2={10000} y2={alignLine} 
                    stroke="#10b981" 
                    strokeWidth="1" 
                    strokeDasharray="4 2"
                    opacity="0.8"
                />
            )}

            {/* Mesh Guide Line (Gear) */}
            {meshSnapLine !== null && (
                <g>
                    <line 
                        x1={-10000} y1={meshSnapLine.y} 
                        x2={10000} y2={meshSnapLine.y} 
                        stroke="#f59e0b" 
                        strokeWidth="1.5" 
                        strokeDasharray="2 2"
                    />
                    <text x={viewport.x + 20} y={meshSnapLine.y - 5} fill="#f59e0b" fontSize="10">
                        {meshSnapLine.label}
                    </text>
                </g>
            )}
            
            {/* Render Shafts First (Background Layer) */}
            {[...items].filter(i => i.type === ComponentType.HOUSING).map(item => (
                 <g key={item.id} transform={`translate(${item.x}, ${item.y})`} onPointerDown={(e) => handlePointerDown(e, item.id)}>
                    {renderItem(item, item.id === selectedId)}
                </g>
            ))}
            
            {[...items].filter(i => i.type === ComponentType.SHAFT).map(item => (
                 <g key={item.id} transform={`translate(${item.x}, ${item.y})`} onPointerDown={(e) => handlePointerDown(e, item.id)} className="cursor-move">
                    {renderItem(item, item.id === selectedId)}
                </g>
            ))}

            {/* Render Components on Top */}
            {[...items]
                .filter(i => i.type !== ComponentType.SHAFT && i.type !== ComponentType.HOUSING)
                .sort((a, b) => (a.selected ? 1 : 0) - (b.selected ? 1 : 0)) // Selected on top
                .map(item => (
                    <g
                        key={item.id}
                        transform={`translate(${item.x}, ${item.y})`}
                        onPointerDown={(e) => handlePointerDown(e, item.id)}
                        className="cursor-move hover:opacity-90 transition-opacity"
                    >
                        {renderItem(item, item.id === selectedId)}
                        {/* Invisible hit area for easier grabbing of thin items */}
                        <rect x="-10" y="-10" width="20" height="20" fill="transparent" /> 
                    </g>
                ))
            }
        </svg>
    </div>
  );
};
