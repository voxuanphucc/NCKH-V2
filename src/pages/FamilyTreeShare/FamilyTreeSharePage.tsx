import { useEffect, useState, useRef } from "react";
import * as d3 from "d3";

// ─── Constants ────────────────────────────────────────────────────────────────
const NODE_WIDTH = 190;
const NODE_HEIGHT = 100; // cao hơn để chứa ngày sinh/mất như PersonCard
const SPOUSE_GAP = 20;
const BASE_URL = "http://localhost:8080/api/v1";
const SHARE_TOKEN = "b1c8c30f-92b0-444c-be91-4d20f4147935";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDefaultAvatar(gender: string, _dateOfBirth?: string | null) {
    return gender === "MALE"
        ? "https://api.dicebear.com/7.x/avataaars/svg?seed=male&backgroundColor=b6e3f4"
        : "https://api.dicebear.com/7.x/avataaars/svg?seed=female&backgroundColor=ffdfbf";
}

function formatShortDate(iso?: string | null): string {
    if (!iso) return "";
    const d = new Date(iso);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FamilyTreeSharePage() {
    const [graph, setGraph] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPerson, setSelectedPerson] = useState<any>(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const zoomBehaviorRef = useRef<any>(null);

    // Fetch data
    useEffect(() => {
        const token = new URLSearchParams(window.location.search).get("token") || SHARE_TOKEN;
        fetch(`${BASE_URL}/share/graph?token=${token}`)
            .then((r) => r.json())
            .then((res) => {
                if (res.success) setGraph(res.data);
                else setError(res.message || "Không tải được dữ liệu");
            })
            .catch(() => setError("Lỗi kết nối máy chủ"))
            .finally(() => setLoading(false));
    }, []);

    // D3 render
    useEffect(() => {
        if (!graph || !svgRef.current || !wrapperRef.current || graph.persons.length === 0) return;

        const svg = d3.select(svgRef.current);
        const width = wrapperRef.current.clientWidth;
        const height = wrapperRef.current.clientHeight;
        svg.selectAll("*").remove();

        const hierarchyData = buildHierarchy(graph);
        if (!hierarchyData) return;

        const treeLayout = d3
            .tree<any>()
            .nodeSize([NODE_WIDTH * 2.8, NODE_HEIGHT * 2.8])
            .separation((a: any, b: any) => {
                let sep = a.parent === b.parent ? 0.7 : 1.0;
                if (!!a.data.spouse || !!b.data.spouse) sep += 0.3;
                return sep;
            });

        const root = d3.hierarchy<any>(hierarchyData);
        treeLayout(root);

        const g = svg.append("g");

        const zoom = d3
            .zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        svg.call(zoom);
        zoomBehaviorRef.current = zoom;

        // Links
        g.selectAll(".link")
            .data(root.links())
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("fill", "none")
            .attr("stroke", "#C4A882")
            .attr("stroke-width", 2)
            .attr("d", (d: any) => {
                const sourceX = d.source.data.spouse
                    ? d.source.x + (NODE_WIDTH + SPOUSE_GAP) / 2
                    : d.source.x;
                const sourceY = d.source.y + NODE_HEIGHT;
                const tx = d.target.x;
                const ty = d.target.y;
                const my = (sourceY + ty) / 2;
                return `M${sourceX},${sourceY} C${sourceX},${my} ${tx},${my} ${tx},${ty}`;
            });

        // Nodes
        const nodeGroup = g
            .selectAll(".node")
            .data(root.descendants())
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", (d: any) => `translate(${d.x},${d.y})`);

        // ── renderPersonHtml — khớp PersonCard ────────────────────────────────────
        const renderPersonHtml = (person: any) => {
            const isMale = person.gender === "MALE";
            const isSelected = selectedPerson?.id === person.id;
            const isDeceased = !!person.dateOfDeath;
            const isRoot = graph.meta.rootPersonId === person.id;

            const birthDate = formatShortDate(person.dateOfBirth);
            const deathDate = formatShortDate(person.dateOfDeath);
            const avatarUrl = person.avatarUrl || getDefaultAvatar(person.gender, person.dateOfBirth);

            // ─── Class mapping giống 100% PersonCard ───────────────────
            const borderClass = isSelected
                ? isDeceased
                    ? "border-gray-400 shadow-lg shadow-gray-400/10"
                    : isMale
                        ? "border-blue-400 shadow-lg shadow-blue-400/10"
                        : "border-pink-400 shadow-lg shadow-pink-400/10"
                : isDeceased
                    ? "border-gray-300 hover:border-gray-400 hover:shadow-md"
                    : isMale
                        ? "border-blue-300 hover:border-blue-400 hover:shadow-md"
                        : "border-pink-300 hover:border-pink-400 hover:shadow-md";

            const ringClass = isRoot
                ? isDeceased
                    ? "ring-2 ring-gray-400/20"
                    : isMale
                        ? "ring-2 ring-blue-400/20"
                        : "ring-2 ring-pink-400/20"
                : "";

            const opacity = isDeceased ? "opacity-75" : "";

            const avatarBg = isDeceased
                ? "bg-gray-100 text-gray-500"
                : isMale
                    ? "bg-blue-50 text-blue-500"
                    : "bg-pink-50 text-pink-500";

            return `
    <button
        onclick="window.__treePersonClick('${person.id}')"
        class="relative bg-white rounded-2xl border-2 p-4 transition-all text-left w-full ${borderClass} ${ringClass} ${opacity}"
        title="${person.fullName}"
        style="width:100%;height:100%;"
    >

        <div style="display:flex;align-items:flex-start;gap:12px;">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${avatarBg}">
                <img src="${avatarUrl}" class="w-12 h-12 rounded-xl object-cover" />
            </div>

            <div style="min-width:0;flex:1;">
                <h4 style="font-size:14px;font-weight:600;color:#3b2f2f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                    ${person.fullName || `${person.lastName} ${person.firstName}`}
                </h4>

                <p style="font-size:12px;color:#a78b7a;margin-top:2px;">
                    ${isMale ? "Nam" : "Nữ"}
                    ${person.generation !== undefined
                    ? ` · Đời ${person.generation + 1}`
                    : ""
                }
                </p>
            </div>
        </div>

        
    </button>
    `;
        };

        (window as any).__treePersonClick = (id: string) => {
            const person = graph.persons.find((p: any) => p.id === id);
            setSelectedPerson((prev: any) => (prev?.id === id ? null : person));
        };

        // Main person node
        nodeGroup
            .append("foreignObject")
            .attr("x", -NODE_WIDTH / 2)
            .attr("y", 0)
            .attr("width", NODE_WIDTH)
            .attr("height", NODE_HEIGHT)
            .html((d: any) => renderPersonHtml(d.data.person));

        // Spouse connector + node
        const spouseGroups = nodeGroup.filter((d: any) => !!d.data.spouse);

        spouseGroups
            .append("path")
            .attr("d", `M${NODE_WIDTH / 2},${NODE_HEIGHT / 2} L${NODE_WIDTH / 2 + SPOUSE_GAP},${NODE_HEIGHT / 2}`)
            .attr("stroke", "#C4A882")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        spouseGroups
            .append("text")
            .attr("x", NODE_WIDTH / 2 + SPOUSE_GAP / 2)
            .attr("y", NODE_HEIGHT / 2 + 4)
            .attr("text-anchor", "middle")
            .attr("fill", "#C49A3C")
            .attr("font-size", "12px")
            .text("♥");

        spouseGroups
            .append("foreignObject")
            .attr("x", NODE_WIDTH / 2 + SPOUSE_GAP)
            .attr("y", 0)
            .attr("width", NODE_WIDTH)
            .attr("height", NODE_HEIGHT)
            .html((d: any) => renderPersonHtml(d.data.spouse));

        // Center tree
        const bounds = g.node()?.getBBox();
        if (bounds) {
            const dx = bounds.width, dy = bounds.height;
            const x = bounds.x + dx / 2, y = bounds.y + dy / 2;
            const scale = Math.max(0.3, Math.min(1, 0.9 / Math.max(dx / width, dy / height)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];
            svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
        }

        return () => { delete (window as any).__treePersonClick; };
    }, [graph, selectedPerson]);

    function buildHierarchy(graphData: any) {
        const { persons, families, meta } = graphData;
        if (!meta.rootPersonId || persons.length === 0) return null;

        const personMap = new Map(persons.map((p: any) => [p.id, p]));
        const parentFamilyMap = new Map<string, any[]>();
        const childFamilyMap = new Map<string, any>();

        families.forEach((f: any) => {
            if (!parentFamilyMap.has(f.parent1Id)) parentFamilyMap.set(f.parent1Id, []);
            parentFamilyMap.get(f.parent1Id)!.push(f);
            if (f.parent2Id) {
                if (!parentFamilyMap.has(f.parent2Id)) parentFamilyMap.set(f.parent2Id, []);
                parentFamilyMap.get(f.parent2Id)!.push(f);
            }
            f.childrenIds.forEach((id: string) => childFamilyMap.set(id, f));
        });

        function findTopAncestor(id: string): string {
            const pf = childFamilyMap.get(id);
            if (!pf) return id;
            return findTopAncestor(pf.parent1Id);
        }

        const visited = new Set<string>();

        function buildNode(personId: string): any {
            if (visited.has(personId)) return null;
            visited.add(personId);
            const person = personMap.get(personId);
            if (!person) return null;

            const node: any = { id: person.id, person, children: [] };
            const personFamilies = parentFamilyMap.get(personId) || [];

            if (personFamilies.length > 0) {
                const primary =
                    personFamilies.find((f: any) => {
                        const sid = f.parent1Id === personId ? f.parent2Id : f.parent1Id;
                        return !!sid;
                    }) || personFamilies[0];

                node.familyId = primary.id;
                const spouseId = primary.parent1Id === personId ? primary.parent2Id : primary.parent1Id;
                if (spouseId) { node.spouse = personMap.get(spouseId); visited.add(spouseId); }

                const allChildren = new Set<string>();
                personFamilies.forEach((f: any) => f.childrenIds.forEach((id: string) => allChildren.add(id)));
                allChildren.forEach((cid) => {
                    const cn = buildNode(cid);
                    if (cn) node.children.push(cn);
                });
            }

            return node;
        }

        return buildNode(findTopAncestor(meta.rootPersonId));
    }

    const handleZoomIn = () => {
        if (svgRef.current && zoomBehaviorRef.current)
            d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.3);
    };
    const handleZoomOut = () => {
        if (svgRef.current && zoomBehaviorRef.current)
            d3.select(svgRef.current).transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.7);
    };
    const handleCenter = () => {
        if (!svgRef.current || !zoomBehaviorRef.current || !wrapperRef.current) return;
        const svg = d3.select(svgRef.current);
        const bounds = (svg.select("g").node() as SVGGElement)?.getBBox();
        if (!bounds) return;
        const { clientWidth: w, clientHeight: h } = wrapperRef.current;
        const scale = Math.max(0.3, Math.min(1, 0.9 / Math.max(bounds.width / w, bounds.height / h)));
        const tx = w / 2 - scale * (bounds.x + bounds.width / 2);
        const ty = h / 2 - scale * (bounds.y + bounds.height / 2);
        svg.transition().duration(500).call(
            zoomBehaviorRef.current.transform,
            d3.zoomIdentity.translate(tx, ty).scale(scale)
        );
    };

    // ─── States ────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-amber-50">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto border-4 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                <p className="text-amber-700 font-medium text-lg">Đang tải gia phả…</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center h-screen bg-amber-50">
            <div className="text-center space-y-3 p-8 bg-white rounded-2xl shadow-lg border border-amber-200 max-w-sm">
                <div className="text-5xl">⚠️</div>
                <p className="text-amber-800 font-semibold text-lg">Không tải được dữ liệu</p>
                <p className="text-gray-500 text-sm">{error}</p>
            </div>
        </div>
    );

    if (!graph || graph.persons.length === 0) return (
        <div className="flex items-center justify-center h-screen bg-amber-50">
            <div className="text-center space-y-3">
                <div className="text-6xl">🌳</div>
                <p className="text-amber-700 font-semibold text-lg">Chưa có thành viên trong gia phả</p>
            </div>
        </div>
    );

    const rootPerson = graph.persons.find((p: any) => p.id === graph.meta.rootPersonId);

    return (
        <div className="flex flex-col h-screen bg-amber-50 font-sans overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-amber-200 shadow-sm px-5 py-3 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌳</span>
                    <div>
                        <h1 className="font-bold text-amber-900 text-base leading-tight">Gia Phả Gia Đình</h1>
                        {rootPerson && (
                            <p className="text-xs text-amber-500">
                                Gốc: <span className="font-medium text-amber-700">{rootPerson.fullName}</span>
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-amber-600">
                    <span className="bg-amber-100 px-3 py-1 rounded-full font-medium">
                        {graph.meta.totalPersons} thành viên · {graph.meta.totalGenerations} đời
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded-full text-gray-500 text-[10px]">👁 Chỉ xem</span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Canvas */}
                <div className="relative flex-1 overflow-hidden" ref={wrapperRef}>
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #d97706 1px, transparent 0)`, backgroundSize: "32px 32px" }} />

                    {/* Zoom controls */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-white rounded-xl border border-amber-200 shadow-md p-1.5">
                        <button onClick={handleZoomIn} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-sm font-bold" title="Phóng to">＋</button>
                        <button onClick={handleZoomOut} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-sm font-bold" title="Thu nhỏ">－</button>
                        <div className="w-full h-px bg-amber-100" />
                        <button onClick={handleCenter} className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors text-sm" title="Căn giữa">⊙</button>
                    </div>

                    {/* Legend */}
                    <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-amber-200 shadow-lg p-3 text-xs space-y-2">
                        <p className="font-bold text-amber-800 uppercase tracking-wider text-[10px] mb-2">Chú thích</p>
                        <div className="flex items-center gap-2">
                            <svg width="36" height="10" viewBox="0 0 36 10"><path d="M2 5 L34 5" stroke="#C4A882" strokeWidth="2" fill="none" /></svg>
                            <span className="text-gray-600">Con cái</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <svg width="36" height="10" viewBox="0 0 36 10"><path d="M2 5 L34 5" stroke="#C4A882" strokeWidth="2" strokeDasharray="4,3" fill="none" /></svg>
                            <span className="text-gray-600">Vợ chồng</span>
                        </div>
                        <div className="border-t border-amber-100 my-1" />
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded border-2 border-amber-400 bg-yellow-50 ring-2 ring-yellow-400/40 flex items-center justify-center text-[9px]">⭐</div>
                            <span className="text-gray-600">Người gốc</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded border-2 border-blue-300 bg-white flex items-center justify-center text-[9px] text-blue-600">♂</div>
                            <span className="text-gray-600">Nam</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded border-2 border-pink-300 bg-white flex items-center justify-center text-[9px] text-pink-600">♀</div>
                            <span className="text-gray-600">Nữ</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 bg-white opacity-75 flex items-center justify-center text-[9px] text-gray-500">†</div>
                            <span className="text-gray-600">Đã mất</span>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-4 z-10 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg border border-amber-200 text-xs text-amber-500 font-medium">
                        {zoomLevel}%
                    </div>

                    <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
                </div>

                {/* Sidebar */}
                {selectedPerson && (
                    <aside className="w-72 flex-shrink-0 bg-white border-l border-amber-200 shadow-xl overflow-y-auto z-10 flex flex-col">
                        <div className="p-4 border-b border-amber-100 flex items-center justify-between">
                            <h2 className="font-bold text-amber-900 text-sm">Thông tin thành viên</h2>
                            <button onClick={() => setSelectedPerson(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                        </div>
                        <div className="p-5 space-y-4 flex-1">
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-20 h-20 rounded-2xl overflow-hidden border-4 shadow-md ${selectedPerson.gender === "MALE" ? "border-blue-300" : "border-pink-300"}`}>
                                    <img src={selectedPerson.avatarUrl || getDefaultAvatar(selectedPerson.gender, selectedPerson.dateOfBirth)} className="w-full h-full object-cover" alt={selectedPerson.fullName} />
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-amber-900 text-base">{selectedPerson.fullName}</p>
                                    {graph.meta.rootPersonId === selectedPerson.id && (
                                        <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">⭐ Người gốc</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 text-sm">
                                <InfoRow label="Giới tính" value={selectedPerson.gender === "MALE" ? "♂ Nam" : "♀ Nữ"} />
                                {selectedPerson.generation !== undefined && <InfoRow label="Thế hệ" value={`Đời ${selectedPerson.generation}`} />}
                                {selectedPerson.dateOfBirth && <InfoRow label="Ngày sinh" value={new Date(selectedPerson.dateOfBirth).toLocaleDateString("vi-VN")} />}
                                {selectedPerson.dateOfDeath && <InfoRow label="Ngày mất" value={new Date(selectedPerson.dateOfDeath).toLocaleDateString("vi-VN")} deceased />}
                            </div>
                            <RelationshipsPanel person={selectedPerson} graph={graph} onSelect={setSelectedPerson} />
                        </div>
                        <div className="p-3 border-t border-amber-100 text-center">
                            <p className="text-[10px] text-gray-400">👁 Chế độ xem — không thể chỉnh sửa</p>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function InfoRow({ label, value, deceased }: { label: string; value: string; deceased?: boolean }) {
    return (
        <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <span className="text-gray-400 text-xs">{label}</span>
            <span className={`font-medium text-xs ${deceased ? "text-gray-400" : "text-amber-800"}`}>{value}</span>
        </div>
    );
}

function RelationshipsPanel({ person, graph, onSelect }: any) {
    const { families, persons } = graph;
    const personMap = new Map(persons.map((p: any) => [p.id, p]));

    const asParent = families.filter((f: any) => f.parent1Id === person.id || f.parent2Id === person.id);
    const asChild = families.find((f: any) => f.childrenIds.includes(person.id));

    const spouses = asParent.map((f: any) => {
        const sid = f.parent1Id === person.id ? f.parent2Id : f.parent1Id;
        return sid ? personMap.get(sid) : null;
    }).filter(Boolean);

    const children = asParent.flatMap((f: any) =>
        f.childrenIds.map((id: string) => personMap.get(id)).filter(Boolean)
    );

    const parents = asChild
        ? [asChild.parent1Id ? personMap.get(asChild.parent1Id) : null, asChild.parent2Id ? personMap.get(asChild.parent2Id) : null].filter(Boolean)
        : [];

    const siblings = asChild
        ? asChild.childrenIds.filter((id: string) => id !== person.id).map((id: string) => personMap.get(id)).filter(Boolean)
        : [];

    return (
        <div className="space-y-3">
            {parents.length > 0 && <RelGroup title="Cha / Mẹ" persons={parents} onSelect={onSelect} />}
            {spouses.length > 0 && <RelGroup title="Vợ / Chồng" persons={spouses} onSelect={onSelect} />}
            {children.length > 0 && <RelGroup title={`Con cái (${children.length})`} persons={children} onSelect={onSelect} />}
            {siblings.length > 0 && <RelGroup title={`Anh chị em (${siblings.length})`} persons={siblings} onSelect={onSelect} />}
        </div>
    );
}

function RelGroup({ title, persons, onSelect }: any) {
    return (
        <div>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5">{title}</p>
            <div className="space-y-1">
                {persons.map((p: any) => (
                    <button key={p.id} onClick={() => onSelect(p)} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-amber-50 transition-colors text-left">
                        <img src={p.avatarUrl || getDefaultAvatar(p.gender, p.dateOfBirth)} className="w-7 h-7 rounded-lg object-cover flex-shrink-0 border border-amber-200" alt={p.fullName} />
                        <span className="text-xs text-amber-900 font-medium truncate">{p.fullName}</span>
                        {p.dateOfDeath && <span className="text-[9px] text-gray-400 ml-auto flex-shrink-0">†</span>}
                    </button>
                ))}
            </div>
        </div>
    );
}