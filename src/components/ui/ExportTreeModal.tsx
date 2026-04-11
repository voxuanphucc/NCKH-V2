/**
 * ExportTreeModal.tsx
 *
 * Vẽ lại cây gia phả trực tiếp lên Canvas API — giống y chang giao diện web.
 * Không dùng html2canvas hay SVG serialization để tránh lỗi tainted canvas.
 *
 * Dependencies: npm install jspdf
 *
 * Thay đổi so với version cũ:
 *   - Nhận thêm prop `graph: TreeGraph` và `selectedPersonId?: string`
 *   - Tự build lại D3 layout rồi vẽ thủ công lên canvas
 *
 * Cập nhật usage trong TreeDetailPage:
 *   <ExportTreeModal
 *     isOpen={showExport}
 *     treeName={tree.name}
 *     treeSelector="#family-tree-svg"
 *     graph={graph}
 *     selectedPersonId={selectedPersonId}
 *     onClose={() => setShowExport(false)}
 *   />
 */

import { useState } from 'react';
import * as d3 from 'd3';
import {
    XIcon,
    DownloadIcon,
    LoaderIcon,
    ImageIcon,
    FileIcon,
    CodeIcon,
} from 'lucide-react';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
import type { TreeGraph, FamilyGraph } from '../../types/family';
import type { PersonGraph } from '../../types/person';

// ─── Types ───────────────────────────────────────────────────────────────────

type ExportFormat = 'png' | 'pdf' | 'svg';

interface ExportOption {
    format: ExportFormat;
    label: string;
    desc: string;
    icon: React.ReactNode;
    color: string;
}

interface TreeNode {
    id: string;
    person: PersonGraph;
    spouse?: PersonGraph;
    familyId?: string;
    children: TreeNode[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTIONS: ExportOption[] = [
    {
        format: 'png',
        label: 'Hình ảnh PNG',
        desc: 'Ảnh chất lượng cao, phù hợp in ấn & chia sẻ',
        icon: <ImageIcon className="w-5 h-5" />,
        color: 'text-blue-500',
    },
    {
        format: 'pdf',
        label: 'Tài liệu PDF',
        desc: 'Định dạng tài liệu, hỗ trợ in nhiều trang',
        icon: <FileIcon className="w-5 h-5" />,
        color: 'text-red-500',
    },
    {
        format: 'svg',
        label: 'Vector SVG',
        desc: 'Đồ họa vector (không có avatar)',
        icon: <CodeIcon className="w-5 h-5" />,
        color: 'text-green-500',
    },
];

// Giống FamilyTreeD3
const NODE_W = 180;
const NODE_H = 80;
const SPOUSE_GAP = 20;
const AVATAR_SIZE = 40;
const CORNER_R = 12;
const PADDING = 8;

// Màu sắc — giữ đúng với Tailwind classes trong FamilyTreeD3
const COLORS = {
    bg: '#FAF7F2',           // cream
    nodeBg: '#FFFFFF',
    borderMale: '#60A5FA',   // blue-400
    borderFemale: '#F472B6', // pink-400
    borderDeceased: '#9CA3AF', // gray-400
    borderSelected: '#3B82F6',
    gold: '#C49A3C',         // heritage-gold
    warm800: '#3D2B1F',
    warm400: '#A08060',
    warm300: '#C4A882',
    warm100: '#F0E8DC',
    blueBg: '#EFF6FF',
    pinkBg: '#FDF2F8',
    yellowBg: '#FEFCE8',
    grayBg: '#F9FAFB',
    link: '#C4A882',
    shadow: 'rgba(0,0,0,0.08)',
};

// ─── Canvas drawing helpers ───────────────────────────────────────────────────

function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, w: number, h: number, r: number
) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawCard(
    ctx: CanvasRenderingContext2D,
    person: PersonGraph,
    x: number,
    y: number,
    isRoot: boolean,
    isSelected: boolean,
    avatarImage: HTMLImageElement | null
) {
    const isMale = person.gender === 'MALE';
    const isDeceased = !!person.dateOfDeath;

    // Pick colors
    let borderColor = isDeceased ? COLORS.borderDeceased : isMale ? COLORS.borderMale : COLORS.borderFemale;
    let bgColor = isDeceased ? COLORS.grayBg : isMale ? COLORS.blueBg : COLORS.pinkBg;
    if (isRoot) bgColor = COLORS.yellowBg;
    if (isSelected) borderColor = isDeceased ? COLORS.borderDeceased : isMale ? '#3B82F6' : '#EC4899';

    const alpha = isDeceased && !isRoot ? 0.75 : 1;
    ctx.globalAlpha = alpha;

    // Shadow
    ctx.shadowColor = isRoot ? 'rgba(196,154,60,0.25)' : COLORS.shadow;
    ctx.shadowBlur = isSelected ? 12 : 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;

    // Card bg
    roundRect(ctx, x, y, NODE_W, NODE_H, CORNER_R);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    roundRect(ctx, x, y, NODE_W, NODE_H, CORNER_R);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = isSelected ? 2.5 : 2;
    ctx.stroke();

    // Gold ring for root
    if (isRoot) {
        roundRect(ctx, x - 2, y - 2, NODE_W + 4, NODE_H + 4, CORNER_R + 2);
        ctx.strokeStyle = 'rgba(196,154,60,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.globalAlpha = 1;

    // Avatar area
    const avatarX = x + PADDING;
    const avatarY = y + (NODE_H - AVATAR_SIZE) / 2;
    const avatarBg = isDeceased ? '#F3F4F6' : isMale ? '#EFF6FF' : '#FDF2F8';
    const avatarFg = isDeceased ? '#6B7280' : isMale ? '#3B82F6' : '#EC4899';

    // Avatar rounded rect clip
    ctx.save();
    roundRect(ctx, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE, 8);
    ctx.fillStyle = avatarBg;
    ctx.fill();
    ctx.clip();

    if (avatarImage) {
        ctx.drawImage(avatarImage, avatarX, avatarY, AVATAR_SIZE, AVATAR_SIZE);
    } else {
        // Fallback: person silhouette
        ctx.fillStyle = avatarFg;
        ctx.font = `bold ${AVATAR_SIZE * 0.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const initials = (person.firstName || person.lastName || '?')[0].toUpperCase();
        ctx.fillText(initials, avatarX + AVATAR_SIZE / 2, avatarY + AVATAR_SIZE / 2);
    }
    ctx.restore();

    // Text area
    const textX = avatarX + AVATAR_SIZE + 6;
    const textMaxW = NODE_W - AVATAR_SIZE - PADDING * 2 - 6;

    ctx.fillStyle = COLORS.warm800;
    ctx.font = `600 11px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    // Full name - truncate
    const fullName = person.fullName || `${person.lastName || ''} ${person.firstName || ''}`.trim();
    ctx.fillText(truncateText(ctx, fullName, textMaxW), textX, y + PADDING + 4);

    // Gender + generation
    ctx.fillStyle = COLORS.warm400;
    ctx.font = `400 10px system-ui, sans-serif`;
    const genderText = `${isMale ? 'Nam' : 'Nữ'}${person.generation !== undefined ? ` · Đời ${person.generation}` : ''}`;
    ctx.fillText(truncateText(ctx, genderText, textMaxW), textX, y + PADDING + 20);

    // Birth/death years
    const birthYear = person.dateOfBirth ? new Date(person.dateOfBirth).getFullYear() : '';
    const deathYear = person.dateOfDeath ? new Date(person.dateOfDeath).getFullYear() : '';
    if (birthYear) {
        const years = `${birthYear}${deathYear ? ` - ${deathYear}` : ''}`;
        ctx.fillStyle = COLORS.warm300;
        ctx.font = `400 9px system-ui, sans-serif`;
        ctx.fillText(truncateText(ctx, years, textMaxW), textX, y + PADDING + 35);
    }
}

function truncateText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text;
    let lo = 0, hi = text.length;
    while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (ctx.measureText(text.slice(0, mid) + '…').width <= maxWidth) lo = mid;
        else hi = mid - 1;
    }
    return text.slice(0, lo) + '…';
}

// ─── Preload all avatar images ────────────────────────────────────────────────

async function loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // fail silently
        img.src = src;
    });
}

async function preloadAvatars(persons: PersonGraph[]): Promise<Map<string, HTMLImageElement | null>> {
    const map = new Map<string, HTMLImageElement | null>();
    await Promise.all(
        persons.map(async (p) => {
            const url = p.avatarUrl || getDefaultAvatar(p.gender, p.dateOfBirth);
            const img = await loadImage(url);
            map.set(p.id, img);
        })
    );
    return map;
}

// ─── Build hierarchy (same logic as FamilyTreeD3) ────────────────────────────

function buildHierarchy(graphData: TreeGraph): TreeNode | null {
    const { persons, families, meta } = graphData;
    if (!meta.rootPersonId || persons.length === 0) return null;

    const personMap = new Map(persons.map((p) => [p.id, p]));
    const parentFamilyMap = new Map<string, FamilyGraph[]>();
    const childFamilyMap = new Map<string, FamilyGraph>();

    families.forEach((f) => {
        if (!parentFamilyMap.has(f.parent1Id)) parentFamilyMap.set(f.parent1Id, []);
        parentFamilyMap.get(f.parent1Id)!.push(f);
        if (f.parent2Id) {
            if (!parentFamilyMap.has(f.parent2Id)) parentFamilyMap.set(f.parent2Id, []);
            parentFamilyMap.get(f.parent2Id)!.push(f);
        }
        f.childrenIds.forEach((childId) => childFamilyMap.set(childId, f));
    });

    function findTopAncestor(personId: string): string {
        const pf = childFamilyMap.get(personId);
        if (!pf) return personId;
        return findTopAncestor(pf.parent1Id);
    }

    const topAncestorId = findTopAncestor(meta.rootPersonId);
    const visited = new Set<string>();

    function buildNode(personId: string): TreeNode | null {
        if (visited.has(personId)) return null;
        visited.add(personId);
        const person = personMap.get(personId);
        if (!person) return null;

        const node: TreeNode = { id: person.id, person, children: [] };
        const personFamilies = parentFamilyMap.get(personId) || [];

        if (personFamilies.length > 0) {
            const primaryFamily =
                personFamilies.find((f) => {
                    const sid = f.parent1Id === personId ? f.parent2Id : f.parent1Id;
                    return !!sid;
                }) || personFamilies[0];

            node.familyId = primaryFamily.id;
            const spouseId = primaryFamily.parent1Id === personId
                ? primaryFamily.parent2Id
                : primaryFamily.parent1Id;

            if (spouseId) {
                node.spouse = personMap.get(spouseId);
                visited.add(spouseId);
            }

            const allChildIds = new Set<string>();
            personFamilies.forEach((f) => f.childrenIds.forEach((id) => allChildIds.add(id)));
            allChildIds.forEach((childId) => {
                const childNode = buildNode(childId);
                if (childNode) node.children.push(childNode);
            });
        }

        return node;
    }

    return buildNode(topAncestorId);
}

// ─── Main render function ─────────────────────────────────────────────────────

async function renderTreeToCanvas(
    graph: TreeGraph,
    selectedPersonId: string | undefined,
    scale: number
): Promise<HTMLCanvasElement> {
    // 1. Build hierarchy + D3 layout (same as FamilyTreeD3)
    const hierarchyData = buildHierarchy(graph);
    if (!hierarchyData) throw new Error('Không thể build cây');

    const treeLayout = d3.tree<TreeNode>()
        .nodeSize([NODE_W * 2.5, NODE_H * 2.5])
        .separation((a: any, b: any) => {
            let sep = a.parent === b.parent ? 1.2 : 1.5;
            if (a.data.spouse || b.data.spouse) sep += 0.5;
            return sep;
        });

    const root = d3.hierarchy(hierarchyData);
    treeLayout(root);

    // 2. Compute bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    root.descendants().forEach((d: any) => {
        const left = d.x - NODE_W / 2;
        const right = d.data.spouse ? d.x + NODE_W + SPOUSE_GAP + NODE_W / 2 : d.x + NODE_W / 2;
        minX = Math.min(minX, left);
        maxX = Math.max(maxX, right);
        minY = Math.min(minY, d.y);
        maxY = Math.max(maxY, d.y + NODE_H);
    });

    const MARGIN = 60;
    const treeW = maxX - minX + MARGIN * 2;
    const treeH = maxY - minY + MARGIN * 2;
    const offsetX = -minX + MARGIN;
    const offsetY = -minY + MARGIN;

    // 3. Preload all avatars
    const allPersons = graph.persons;
    const avatarMap = await preloadAvatars(allPersons);

    // 4. Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = treeW * scale;
    canvas.height = treeH * scale;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, treeW, treeH);

    // Draw dot pattern (texture overlay)
    ctx.fillStyle = 'rgba(160,128,96,0.07)';
    for (let gx = 0; gx < treeW; gx += 24) {
        for (let gy = 0; gy < treeH; gy += 24) {
            ctx.beginPath();
            ctx.arc(gx, gy, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // 5. Draw links (parent-child)
    ctx.strokeStyle = COLORS.link;
    ctx.lineWidth = 2;

    root.links().forEach((link: any) => {
        const sourceX = link.source.data.spouse
            ? link.source.x + (NODE_W + SPOUSE_GAP) / 2
            : link.source.x;
        const sx = sourceX + offsetX;
        const sy = link.source.y + NODE_H + offsetY;
        const tx = link.target.x + offsetX;
        const ty = link.target.y + offsetY;
        const midY = (sy + ty) / 2;

        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(sx, midY, tx, midY, tx, ty);
        ctx.stroke();
    });

    // 6. Draw nodes
    root.descendants().forEach((d: any) => {
        const node: TreeNode = d.data;
        const nx = d.x + offsetX - NODE_W / 2;
        const ny = d.y + offsetY;
        const isRoot = graph.meta.rootPersonId === node.person.id;
        const isSelected = selectedPersonId === node.person.id;

        // Draw main person card
        drawCard(
            ctx,
            node.person,
            nx,
            ny,
            isRoot,
            isSelected,
            avatarMap.get(node.person.id) ?? null
        );

        // Spouse
        if (node.spouse) {
            // Dashed connector line
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = COLORS.link;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(nx + NODE_W, ny + NODE_H / 2);
            ctx.lineTo(nx + NODE_W + SPOUSE_GAP, ny + NODE_H / 2);
            ctx.stroke();
            ctx.restore();

            // Heart
            ctx.fillStyle = COLORS.gold;
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('♥', nx + NODE_W + SPOUSE_GAP / 2, ny + NODE_H / 2);

            // Spouse card
            const spouseIsSelected = selectedPersonId === node.spouse.id;
            drawCard(
                ctx,
                node.spouse,
                nx + NODE_W + SPOUSE_GAP,
                ny,
                false,
                spouseIsSelected,
                avatarMap.get(node.spouse.id) ?? null
            );
        }
    });

    return canvas;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(url: string, filename: string) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function exportSVGFallback(treeSelector: string, treeName: string) {
    const el = document.querySelector(treeSelector);
    const svg = el?.tagName.toLowerCase() === 'svg'
        ? el as SVGSVGElement
        : el?.querySelector('svg') as SVGSVGElement | null;
    if (!svg) { alert('Không tìm thấy SVG!'); return; }
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const str = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([str], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${treeName}.svg`);
    URL.revokeObjectURL(url);
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ExportTreeModalProps {
    isOpen: boolean;
    treeName: string;
    treeSelector: string;
    graph: TreeGraph;
    selectedPersonId?: string;
    onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportTreeModal({
    isOpen,
    treeName,
    treeSelector,
    graph,
    selectedPersonId,
    onClose,
}: ExportTreeModalProps) {
    const [selected, setSelected] = useState<ExportFormat>('png');
    const [exporting, setExporting] = useState(false);
    const [scale, setScale] = useState(2);

    if (!isOpen) return null;

    const handleExport = async () => {
        setExporting(true);
        try {
            if (selected === 'svg') {
                exportSVGFallback(treeSelector, treeName);
            } else {
                const canvas = await renderTreeToCanvas(graph, selectedPersonId, scale);

                if (selected === 'png') {
                    await new Promise<void>((resolve) => {
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                triggerDownload(url, `${treeName}.png`);
                                URL.revokeObjectURL(url);
                            }
                            resolve();
                        }, 'image/png');
                    });
                } else if (selected === 'pdf') {
                    const { default: jsPDF } = await import('jspdf');
                    const w = canvas.width / scale;
                    const h = canvas.height / scale;
                    const orientation = w > h ? 'landscape' : 'portrait';
                    const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
                    pdf.save(`${treeName}.pdf`);
                }
            }
            onClose();
        } catch (err) {
            console.error('Export error:', err);
            alert('Có lỗi khi xuất file. Vui lòng thử lại.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-warm-100">
                    <h2 className="font-heading text-lg font-bold text-warm-800">
                        Xuất cây gia phả
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-warm-100 transition-colors text-warm-400 hover:text-warm-600"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Format options */}
                <div className="p-6 space-y-3">
                    {OPTIONS.map((opt) => (
                        <button
                            key={opt.format}
                            type="button"
                            onClick={() => setSelected(opt.format)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${selected === opt.format
                                    ? 'border-heritage-gold bg-heritage-gold/5'
                                    : 'border-warm-100 hover:border-warm-200 hover:bg-warm-50'
                                }`}
                        >
                            <span className={opt.color}>{opt.icon}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-warm-800">{opt.label}</p>
                                <p className="text-xs text-warm-400 mt-0.5">{opt.desc}</p>
                            </div>
                            <div
                                className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${selected === opt.format
                                        ? 'border-heritage-gold bg-heritage-gold'
                                        : 'border-warm-300'
                                    }`}
                            />
                        </button>
                    ))}

                    {selected !== 'svg' && (
                        <div className="pt-2">
                            <label className="block text-xs font-medium text-warm-500 mb-2">
                                Độ phân giải (scale)
                            </label>
                            <div className="flex gap-2">
                                {[1, 2, 3].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setScale(s)}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${scale === s
                                                ? 'border-heritage-gold bg-heritage-gold/10 text-heritage-gold'
                                                : 'border-warm-200 text-warm-500 hover:border-warm-300'
                                            }`}
                                    >
                                        {s}x {s === 1 ? '(thường)' : s === 2 ? '(cao)' : '(rất cao)'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-warm-100 bg-warm-50 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={exporting}
                        className="flex-1 py-2.5 bg-warm-100 text-warm-700 text-sm font-medium rounded-lg hover:bg-warm-200 transition-colors disabled:opacity-60"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={exporting}
                        className="flex-1 py-2.5 bg-warm-800 text-cream text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {exporting ? (
                            <LoaderIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <DownloadIcon className="w-4 h-4" />
                        )}
                        {exporting ? 'Đang xuất...' : 'Xuất file'}
                    </button>
                </div>
            </div>
        </div>
    );
}