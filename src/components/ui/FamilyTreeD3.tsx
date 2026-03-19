import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { ZoomInIcon, ZoomOutIcon, MaximizeIcon, UserIcon } from 'lucide-react';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
import type { TreeGraph, FamilyGraph } from '../../types/family';
import type { PersonGraph } from '../../types/person';
interface FamilyTreeD3Props {
  graph: TreeGraph;
  onPersonClick: (personId: string) => void;
  selectedPersonId?: string;
}
// Internal node structure for D3 hierarchy
interface TreeNode {
  id: string;
  person: PersonGraph;
  spouse?: PersonGraph;
  familyId?: string;
  unionType?: string;
  children: TreeNode[];
}
const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;
const SPOUSE_GAP = 20;
export function FamilyTreeD3({
  graph,
  onPersonClick,
  selectedPersonId
}: FamilyTreeD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  // We need to keep a reference to the zoom behavior to call it from buttons
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<
    SVGSVGElement,
    unknown> |
  null>(null);
  useEffect(() => {
    if (!svgRef.current || !wrapperRef.current || graph.persons.length === 0)
    return;
    const svg = d3.select(svgRef.current);
    const width = wrapperRef.current.clientWidth;
    const height = wrapperRef.current.clientHeight;
    // Clear previous render
    svg.selectAll('*').remove();
    // 1. Build hierarchy from flat data
    const hierarchyData = buildHierarchy(graph);
    if (!hierarchyData) return;
    // 2. Setup D3 Tree Layout
    // We use a custom node size. If a node has a spouse, it needs more width.
    const treeLayout = d3.
    tree<TreeNode>().
    nodeSize([NODE_WIDTH * 2.5, NODE_HEIGHT * 2.5]).
    separation((a: any, b: any): number => {
      // Add more horizontal space if nodes have spouses
      const aHasSpouse = !!a.data.spouse;
      const bHasSpouse = !!b.data.spouse;
      let sep = a.parent === b.parent ? 1.2 : 1.5;
      if (aHasSpouse || bHasSpouse) sep += 0.5;
      return sep;
    });
    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);
    // 3. Setup Zoom
    const g = svg.append('g');
    const zoom = d3.
    zoom<SVGSVGElement, unknown>().
    scaleExtent([0.1, 3]).
    on('zoom', (event: any) => {
      g.attr('transform', event.transform);
      setZoomLevel(Math.round(event.transform.k * 100));
    });
    svg.call(zoom);
    zoomBehaviorRef.current = zoom;
    // Draw parent-child links
    g.selectAll('.link').
    data(root.links()).
    enter().
    append('path').
    attr('class', 'link').
    attr('fill', 'none').
    attr('stroke', '#C4A882') // warm-300
    .attr('stroke-width', 2).
    attr('d', (d: any): string => {
      // If parent has a spouse, the line should start from the middle of the couple
      const sourceX = d.source.data.spouse ?
      d.source.x + (NODE_WIDTH + SPOUSE_GAP) / 2 :
      d.source.x;
      const sourceY = d.source.y + NODE_HEIGHT;
      const targetX = d.target.x;
      const targetY = d.target.y;
      return `M${sourceX},${sourceY} C${sourceX},${(sourceY + targetY) / 2} ${targetX},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
    });
    // 5. Draw Nodes
    const nodeGroup = g.
    selectAll('.node').
    data(root.descendants()).
    enter().
    append('g').
    attr('class', 'node').
    attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    // Helper to render a person card inside foreignObject
    const renderPersonHtml = (person: PersonGraph) => {
      const isMale = person.gender === 'MALE';
      const isSelected = selectedPersonId === person.id;
      const isDeceased = !!person.dateOfDeath;
      const isRoot = graph.meta.rootPersonId === person.id;
      
      // Màu sắc cho viền
      let borderColor = 'border-warm-300';
      let bgColor = 'bg-white';
      let shadow = 'shadow-sm hover:shadow-md';
      
      if (isDeceased) {
        borderColor = 'border-gray-300';
        bgColor = isRoot ? 'bg-yellow-50' : 'bg-white';
      } else if (isMale) {
        borderColor = 'border-blue-400';
      } else {
        borderColor = 'border-pink-400';
      }
      
      // Highlight cho người được chọn
      if (isSelected) {
        bgColor = isDeceased ? 'bg-gray-50' : isMale ? 'bg-blue-50' : 'bg-pink-50';
        borderColor = isDeceased ? 'border-gray-400' : isMale ? 'border-blue-500' : 'border-pink-500';
        shadow = isDeceased
          ? 'shadow-lg shadow-gray-400/20'
          : isMale
          ? 'shadow-lg shadow-blue-400/20'
          : 'shadow-lg shadow-pink-400/20';
      }
      
      // Highlight cho người gốc
      if (isRoot && !isSelected) {
        bgColor = 'bg-yellow-50';
        shadow = 'shadow-md shadow-yellow-400/30 ring-2 ring-heritage-gold/40';
      }
      
      const opacity = isDeceased && !isRoot ? 'opacity-75' : isDeceased ? 'opacity-85' : 'opacity-100';
      
      const avatarBg = isDeceased
        ? 'bg-gray-100 text-gray-500'
        : isMale ?
        'bg-blue-50 text-blue-500' :
        'bg-pink-50 text-pink-500';
      
      const genderText = isMale ? 'Nam' : 'Nữ';
      const birthYear = person.dateOfBirth ?
      new Date(person.dateOfBirth).getFullYear() :
      '';
      const deathYear = person.dateOfDeath ?
      new Date(person.dateOfDeath).getFullYear() :
      '';
      const years = birthYear ?
      `${birthYear}${deathYear ? ` - ${deathYear}` : ''}` :
      '';
      const avatarUrl = person.avatarUrl || getDefaultAvatar(person.gender, person.dateOfBirth);
      
      return `
        <div class="w-full h-full rounded-xl border-2 ${borderColor} ${bgColor} ${shadow} ${opacity} p-2 flex items-center gap-2 cursor-pointer transition-all" 
             onclick="window.handlePersonClick('${person.id}')">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${avatarBg}">
            <img src="${avatarUrl}" class="w-10 h-10 rounded-lg object-cover" />
          </div>
          <div class="min-w-0 flex-1 text-left">
            <p class="font-semibold text-warm-800 truncate leading-tight text-[11px]">
              ${person.fullName || `${person.lastName} ${person.firstName}`}
            </p>
            <p class="text-warm-400 truncate text-[10px]">
              ${genderText} ${person.generation !== undefined ? `· Đời ${person.generation + 1}` : ''}
            </p>
            ${years ? `<p class="text-warm-300 truncate text-[9px]">${years}</p>` : ''}
          </div>
        </div>
      `;
    }
    // Attach click handler to window since we're using raw HTML string
;(window as any).handlePersonClick = (id: string) => {
      onPersonClick(id);
    };
    // Draw main person
    nodeGroup.
    append('foreignObject').
    attr('x', -NODE_WIDTH / 2).
    attr('y', 0).
    attr('width', NODE_WIDTH).
    attr('height', NODE_HEIGHT).
    html((d: any) => renderPersonHtml(d.data.person));
    // Draw spouse if exists
    const spouseGroups = nodeGroup.filter((d: any) => !!d.data.spouse);
    // Couple connector line
    spouseGroups.
    append('path').
    attr(
      'd',
      `M${NODE_WIDTH / 2},${NODE_HEIGHT / 2} L${NODE_WIDTH / 2 + SPOUSE_GAP},${NODE_HEIGHT / 2}`
    ).
    attr('stroke', '#C4A882').
    attr('stroke-width', 2).
    attr('stroke-dasharray', '4,4');
    // Heart icon
    spouseGroups.
    append('text').
    attr('x', NODE_WIDTH / 2 + SPOUSE_GAP / 2).
    attr('y', NODE_HEIGHT / 2 + 4).
    attr('text-anchor', 'middle').
    attr('fill', '#C49A3C').
    attr('font-size', '12px').
    text('♥');
    // Spouse foreignObject
    spouseGroups.
    append('foreignObject').
    attr('x', NODE_WIDTH / 2 + SPOUSE_GAP).
    attr('y', 0).
    attr('width', NODE_WIDTH).
    attr('height', NODE_HEIGHT).
    html((d: any): string => renderPersonHtml(d.data.spouse!));
    // 6. Center the tree initially
    const bounds = g.node()?.getBBox();
    if (bounds) {
      const dx = bounds.width;
      const dy = bounds.height;
      const x = bounds.x + dx / 2;
      const y = bounds.y + dy / 2;
      const scale = Math.max(
        0.3,
        Math.min(1, 0.9 / Math.max(dx / width, dy / height))
      );
      const translate = [width / 2 - scale * x, height / 2 - scale * y];
      svg.call(
        zoom.transform as any,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
    }
    // Cleanup
    return () => {
      delete (window as any).handlePersonClick;
    };
  }, [graph, selectedPersonId, onPersonClick]);
  // Helper to build hierarchy
  function buildHierarchy(graphData: TreeGraph): TreeNode | null {
    const { persons, families, meta } = graphData;
    if (!meta.rootPersonId || persons.length === 0) return null;
    const personMap = new Map(persons.map((p) => [p.id, p]));
    const familyMap = new Map<string, FamilyGraph[]>(); // personId -> families where they are parent
    families.forEach((f) => {
      if (!familyMap.has(f.parent1Id)) familyMap.set(f.parent1Id, []);
      familyMap.get(f.parent1Id)!.push(f);
      if (f.parent2Id) {
        if (!familyMap.has(f.parent2Id)) familyMap.set(f.parent2Id, []);
        familyMap.get(f.parent2Id)!.push(f);
      }
    });
    const visited = new Set<string>();
    function buildNode(personId: string): TreeNode | null {
      if (visited.has(personId)) return null; // Prevent infinite loops
      visited.add(personId);
      const person = personMap.get(personId);
      if (!person) return null;
      const node: TreeNode = {
        id: person.id,
        person: person,
        children: []
      };
      // Find families where this person is a parent
      const personFamilies = familyMap.get(personId) || [];
      // For simplicity in this visualization, we'll just take the first family for the spouse
      // A more complex visualization would handle multiple marriages differently
      if (personFamilies.length > 0) {
        const primaryFamily = personFamilies[0];
        node.familyId = primaryFamily.id;
        node.unionType = primaryFamily.unionType;
        // Find spouse
        const spouseId =
        primaryFamily.parent1Id === personId ?
        primaryFamily.parent2Id :
        primaryFamily.parent1Id;
        if (spouseId) {
          node.spouse = personMap.get(spouseId);
          visited.add(spouseId); // Mark spouse as visited so they don't appear as a separate root
        }
        // Add children
        primaryFamily.childrenIds.forEach((childId) => {
          const childNode = buildNode(childId);
          if (childNode) {
            node.children.push(childNode);
          }
        });
      }
      return node;
    }
    return buildNode(meta.rootPersonId);
  }
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).
      transition().
      duration(300).
      call(zoomBehaviorRef.current.scaleBy as any, 1.3);
    }
  };
  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).
      transition().
      duration(300).
      call(zoomBehaviorRef.current.scaleBy as any, 0.7);
    }
  };
  const handleCenter = () => {
    if (svgRef.current && zoomBehaviorRef.current && wrapperRef.current) {
      const svg = d3.select(svgRef.current);
      const g = svg.select('g');
      const bounds = (g.node() as SVGGElement)?.getBBox();
      if (bounds) {
        const width = wrapperRef.current.clientWidth;
        const height = wrapperRef.current.clientHeight;
        const dx = bounds.width;
        const dy = bounds.height;
        const x = bounds.x + dx / 2;
        const y = bounds.y + dy / 2;
        const scale = Math.max(
          0.3,
          Math.min(1, 0.9 / Math.max(dx / width, dy / height))
        );
        const translate = [width / 2 - scale * x, height / 2 - scale * y];
        svg.
        transition().
        duration(500).
        call(
          zoomBehaviorRef.current.transform as any,
          d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
        );
      }
    }
  };
  if (graph.persons.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-warm-400">
        <div className="text-center">
          <UserIcon className="w-12 h-12 mx-auto mb-3 text-warm-300" />
          <p className="font-heading text-lg font-semibold text-warm-600">
            Chưa có thành viên
          </p>
          <p className="text-sm mt-1">Thêm người đầu tiên vào cây gia phả</p>
        </div>
      </div>);

  }
  return (
    <div
      className="relative w-full h-full bg-cream texture-overlay"
      ref={wrapperRef}>
      
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-white rounded-xl border border-warm-200 shadow-sm p-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg text-warm-600 hover:bg-warm-50 transition-colors"
          aria-label="Phóng to">
          
          <ZoomInIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg text-warm-600 hover:bg-warm-50 transition-colors"
          aria-label="Thu nhỏ">
          
          <ZoomOutIcon className="w-4 h-4" />
        </button>
        <div className="w-full h-px bg-warm-100" />
        <button
          onClick={handleCenter}
          className="p-2 rounded-lg text-warm-600 hover:bg-warm-50 transition-colors"
          aria-label="Căn giữa">
          
          <MaximizeIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Legend - Chú thích */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-warm-200 shadow-lg p-3 max-w-xs">
        <h3 className="text-xs font-bold text-warm-800 mb-2.5 uppercase tracking-wider">Chú thích</h3>
        
        {/* Đường nối */}
        <div className="space-y-2">
          {/* Con cái - Solid line */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-5 relative flex items-center">
              <svg className="w-full h-full" viewBox="0 0 40 10">
                <path
                  d="M2 5 L38 5"
                  stroke="#C4A882"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-xs text-warm-700">Con cái</span>
          </div>

          {/* Vợ chồng - Dashed line */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-5 relative flex items-center">
              <svg className="w-full h-full" viewBox="0 0 40 10">
                <path
                  d="M2 5 L38 5"
                  stroke="#C4A882"
                  strokeWidth="2"
                  strokeDasharray="4,3"
                  fill="none"
                />
              </svg>
            </div>
            <span className="text-xs text-warm-700">Vợ chồng</span>
          </div>

          {/* Divider */}
          <div className="border-t border-warm-100 my-1.5" />

          {/* Người gốc - Yellow background with golden ring */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-warm-400 bg-yellow-50 ring-2 ring-heritage-gold/40 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-heritage-gold font-bold">⭐</span>
            </div>
            <span className="text-xs text-warm-700">Người gốc</span>
          </div>

          {/* Nam - Blue border */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-blue-400 bg-blue-50 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-blue-600 font-bold">♂</span>
            </div>
            <span className="text-xs text-warm-700">Nam</span>
          </div>

          {/* Nữ - Pink border */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-pink-400 bg-pink-50 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-pink-600 font-bold">♀</span>
            </div>
            <span className="text-xs text-warm-700">Nữ</span>
          </div>

          {/* Đã chết - Gray border, mờ */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded border-2 border-gray-400 bg-gray-50 opacity-60 flex items-center justify-center flex-shrink-0">
              <span className="text-[9px] text-gray-500 font-bold">†</span>
            </div>
            <span className="text-xs text-warm-700">Đã chết</span>
          </div>
        </div>
      </div>

      {/* Zoom level indicator */}
      <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-warm-200 text-xs text-warm-500 font-medium">
        {zoomLevel}%
      </div>

      {/* D3 SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing" />
      
    </div>);

}