import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Stage, Layer, Rect, Text, Line, Group, Circle } from 'react-konva';
import Konva from 'konva'; 
import { useStore } from '../../store/useStore';

// --- CLEAN LIGHT ENTERPRISE THEME ---
const THEME = {
  bg: '#F8F9FA',
  nodeFill: '#FFFFFF',
  nodeStroke: '#CBD5E1', 
  text: '#334155', 
  fontFamily: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
  wireRecessive: 'rgba(148, 163, 184, 0.5)', 
  accent: '#0284C7',
};

const NODE_LAYOUT = {
  height: 40,       
  paddingX: 20,     
  radius: 6, 
};

export const Viewer2D: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // FIX: Added saveHistory to the store import
  const { data, updateNodePosition, setSelectedItem, selectedItem, saveHistory } = useStore();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setDimensions({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.05; 
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const mousePointTo = {
      x: stage.getPointerPosition().x / oldScale - stage.x() / oldScale,
      y: stage.getPointerPosition().y / oldScale - stage.y() / oldScale,
    };
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    stage.scale({ x: newScale, y: newScale });
    const newPos = {
      x: -(mousePointTo.x - stage.getPointerPosition().x / newScale) * newScale,
      y: -(mousePointTo.y - stage.getPointerPosition().y / newScale) * newScale,
    };
    stage.position(newPos);
  };

  if (!data) return <div className="w-full h-full flex items-center justify-center text-[#0284C7] bg-[#F8F9FA]">INITIALIZING CANVAS...</div>;

  const rawNodes = data.connectors || data.nodes || [];
  const rawWires = data.wires || data.connections || [];

  // --- THE SMART PHYSICS LAYOUT ENGINE ---
  const safeNodes = useMemo(() => {
    const total = rawNodes.length;
    const columns = Math.ceil(Math.sqrt(total)); 
    const spacingX = 350; 
    const spacingY = 150; 
    const startOffsetX = 100;
    const startOffsetY = 100;

    // STEP 1: Calculate initial widths and positions
    let nodes = rawNodes.map((n: any, i: number) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      
      // Use existing coordinates if they were dragged, otherwise use the grid
      let x = n.x !== undefined ? n.x : startOffsetX + (col * spacingX);
      let y = n.y !== undefined ? n.y : startOffsetY + (row * spacingY);

      // Add a microscopic random jitter so perfectly stacked items can be pushed apart
      x += (Math.random() * 2 - 1);
      y += (Math.random() * 2 - 1);

      const label = n.label || n.id || "COMPONENT";
      const measurementText = new Konva.Text({
        text: label, fontSize: 12, fontFamily: THEME.fontFamily, fontStyle: '600',
      });

      return {
        ...n, x, y, id: n.id || `node_${i}`, label: label,
        rectWidth: measurementText.width() + (NODE_LAYOUT.paddingX * 2),
      };
    });

    // STEP 2: Anti-Overlap Collision Resolver (AABB Physics)
    const MIN_GAP = 40; // Minimum pixels of empty space between any two boxes
    
    // Run the physics engine for 10 iterations to smooth out the graph
    for (let iter = 0; iter < 10; iter++) {
      let hasOverlap = false;
      
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          let n1 = nodes[i];
          let n2 = nodes[j];

          // Define the collision boundaries (including the minimum gap)
          let r1 = { left: n1.x, right: n1.x + n1.rectWidth, top: n1.y, bottom: n1.y + NODE_LAYOUT.height };
          let r2 = { left: n2.x, right: n2.x + n2.rectWidth, top: n2.y, bottom: n2.y + NODE_LAYOUT.height };

          // Check if the two boxes are touching
          if (r1.left < r2.right + MIN_GAP && r1.right + MIN_GAP > r2.left &&
              r1.top < r2.bottom + MIN_GAP && r1.bottom + MIN_GAP > r2.top) {
              
              hasOverlap = true;

              // Calculate how deep the overlap is from all 4 sides
              let pushRight = (r2.right + MIN_GAP) - r1.left;
              let pushLeft = (r1.right + MIN_GAP) - r2.left;
              let pushDown = (r2.bottom + MIN_GAP) - r1.top;
              let pushUp = (r1.bottom + MIN_GAP) - r2.top;

              // Find the shortest path to push them apart
              let minPush = Math.min(pushRight, pushLeft, pushDown, pushUp);

              // Mathematically push both nodes away from each other
              if (minPush === pushRight) { n1.x += pushRight/2; n2.x -= pushRight/2; }
              else if (minPush === pushLeft) { n1.x -= pushLeft/2; n2.x += pushLeft/2; }
              else if (minPush === pushDown) { n1.y += pushDown/2; n2.y -= pushDown/2; }
              else if (minPush === pushUp) { n1.y -= pushUp/2; n2.y += pushUp/2; }
          }
        }
      }
      // If everything is cleanly separated, stop calculating early to save CPU!
      if (!hasOverlap) break; 
    }

    return nodes;
  }, [rawNodes]);

  const getPremiumColor = (colorString: string) => {
    if (!colorString) return THEME.wireRecessive;
    const c = colorString.toLowerCase();
    if (c.includes('red')) return '#EF4444';    
    if (c.includes('blue')) return '#3B82F6';   
    if (c.includes('green')) return '#10B981';  
    if (c.includes('yellow')) return '#F59E0B'; 
    return THEME.wireRecessive;
  };

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-[#F8F9FA]"
         style={{ backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      
      {dimensions.width > 0 && dimensions.height > 0 && (
        <Stage 
          width={dimensions.width} 
          height={dimensions.height} 
          draggable 
          onWheel={handleWheel}
          onClick={(e) => {
            // Click empty space to deselect
            if (e.target === e.target.getStage()) setSelectedItem(null);
          }}
        >
          <Layer> 
            
            {/* WIRES */}
            {rawWires.map((wire: any, index: number) => {
              const source = safeNodes.find((c: any) => c.id === wire.source);
              const target = safeNodes.find((c: any) => c.id === wire.target);
              if (!source || !target) return null;
              
              const startX = source.x + source.rectWidth / 2;
              const startY = source.y + NODE_LAYOUT.height / 2;
              const endX = target.x + target.rectWidth / 2;
              const endY = target.y + NODE_LAYOUT.height / 2;
              
              const controlPointX1 = startX + (endX - startX) / 2;
              const controlPointY1 = startY;
              const controlPointX2 = startX + (endX - startX) / 2;
              const controlPointY2 = endY;

              const isWireSelected = selectedItem?.id === wire.id && selectedItem?.type === 'wire';
              const isNodeSelected = selectedItem?.type === 'node';
              const isConnectedToSelectedNode = isNodeSelected && (wire.source === selectedItem.id || wire.target === selectedItem.id);
              
              const isHovered = hoveredId === wire.id;
              const isHighlighted = isWireSelected || isConnectedToSelectedNode || isHovered;
              
              const shouldDim = selectedItem !== null && !isHighlighted;
              
              const activeColor = getPremiumColor(wire.wire_color || wire.label);
              const renderColor = isHighlighted ? THEME.accent : activeColor;

              return (
                <Group 
                  key={wire.id || `wire_${index}`} 
                  opacity={isHighlighted ? 1 : (shouldDim ? 0.1 : 1)} 
                  onClick={(e) => { 
                    e.cancelBubble = true; 
                    setSelectedItem({ type: 'wire', ...wire }); 
                  }}
                  onMouseEnter={(e) => { setHoveredId(wire.id); e.target.getStage()!.container().style.cursor = 'pointer'; }}
                  onMouseLeave={(e) => { setHoveredId(null); e.target.getStage()!.container().style.cursor = 'grab'; }}
                >
                  <Line
                    points={[startX, startY, controlPointX1, controlPointY1, controlPointX2, controlPointY2, endX, endY]}
                    bezier={true}
                    stroke={renderColor}
                    strokeWidth={isHighlighted ? 4 : 2}
                    hitStrokeWidth={20}
                  />
                  <Circle x={startX} y={startY} radius={3} fill={renderColor} />
                  <Circle x={endX} y={endY} radius={3} fill={renderColor} />
                </Group>
              );
            })}

            {/* NODES */}
            {safeNodes.map((c: any) => {
              const isSelected = selectedItem?.id === c.id;
              const isHovered = hoveredId === c.id;
              const isActive = isSelected || isHovered;

              return (
                <Group 
                  key={c.id} x={c.x} y={c.y} draggable
                  // --- FIX: Take a snapshot of the history EXACTLY when the user starts dragging ---
                  onDragStart={() => saveHistory()}
                  onDragMove={(e) => updateNodePosition(c.id, e.target.x(), e.target.y())}
                  onClick={(e) => { 
                    e.cancelBubble = true; 
                    setSelectedItem({ type: 'node', ...c }); 
                  }}
                  onMouseEnter={(e) => { setHoveredId(c.id); e.target.getStage()!.container().style.cursor = 'pointer'; }}
                  onMouseLeave={(e) => { setHoveredId(null); e.target.getStage()!.container().style.cursor = 'grab'; }}
                >
                  <Rect
                    width={c.rectWidth}
                    height={NODE_LAYOUT.height}
                    fill={THEME.nodeFill}
                    stroke={isActive ? THEME.accent : THEME.nodeStroke}
                    strokeWidth={isActive ? 2 : 1}
                    cornerRadius={NODE_LAYOUT.radius}
                    shadowColor="rgba(0,0,0,0.05)"
                    shadowBlur={5}
                    shadowOffset={{ x: 0, y: 2 }}
                  />
                  <Text
                    width={c.rectWidth}
                    height={NODE_LAYOUT.height}
                    text={c.label}
                    fill={isActive ? THEME.accent : THEME.text}
                    fontSize={12}
                    fontFamily={THEME.fontFamily}
                    fontStyle="600"
                    align="center"
                    verticalAlign="middle" 
                  />
                </Group>
              );
            })}
          </Layer>
        </Stage>
      )}
    </div>
  );
};