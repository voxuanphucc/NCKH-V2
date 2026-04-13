import { useState, useEffect } from 'react';
import { XIcon, GitBranchIcon, LoaderIcon, ChevronRightIcon, HeartIcon, UsersIcon } from 'lucide-react';
import { getDefaultAvatar } from '../../utils/getDefaultAvatar';
import type { PersonGraph } from '../../types/person';
import type { TreeGraph } from '../../types/family';
import { treeService } from '../../services/treeService';

// ── Types ──────────────────────────────────────────────────────────────────
interface RelationshipPersonNode {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    gender: number; // 1=MALE, 2=FEMALE
    relation: string | null; // nhãn quan hệ từ người trước đến người này
}

interface RelationshipData {
    fromPerson: RelationshipPersonNode;
    toPerson: RelationshipPersonNode;
    relationshipFromA: string;
    relationshipFromB: string;
    generationDiff: number;
    path: RelationshipPersonNode[];
}

interface RelationshipPathPanelProps {
    treeId: string;
    graph: TreeGraph;
    onClose: () => void;
    onPersonClick: (id: string) => void;
    // Nếu đã có sẵn personAId, dùng làm mặc định
    defaultPersonAId?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getGenderLabel(gender: number) {
    return gender === 1 ? 'Nam' : 'Nữ';
}

function getRelationBadgeStyle(relation: string | null) {
    if (!relation) return '';
    const r = relation.toLowerCase();
    if (r.includes('vợ') || r.includes('chồng')) return 'bg-rose-50 text-rose-600 border-rose-200';
    if (r.includes('cha') || r.includes('mẹ') || r.includes('bố')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (r.includes('con')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (r.includes('cháu') || r.includes('chắt')) return 'bg-violet-50 text-violet-600 border-violet-200';
    if (r.includes('anh') || r.includes('chị') || r.includes('em')) return 'bg-green-50 text-green-600 border-green-200';
    return 'bg-warm-50 text-warm-600 border-warm-200';
}

function getGenerationDiffLabel(diff: number) {
    if (diff === 0) return 'Cùng thế hệ';
    if (diff > 0) return `Cao hơn ${diff} thế hệ`;
    return `Thấp hơn ${Math.abs(diff)} thế hệ`;
}

// ── PersonAvatar (mini) ────────────────────────────────────────────────────
function PersonAvatar({
    person,
    size = 'md',
    onClick,
}: {
    person: RelationshipPersonNode | PersonGraph;
    size?: 'sm' | 'md' | 'lg';
    onClick?: () => void;
}) {
    const isMale = (person.gender === 1 || (person as PersonGraph).gender === 'MALE');
    const isDeceased = 'dateOfDeath' in person && !!(person as any).dateOfDeath;
    const avatarUrl = person.avatarUrl || getDefaultAvatar(
        (person.gender === 1 || (person as PersonGraph).gender === 'MALE') ? 'MALE' : 'FEMALE',
        (person as any).dateOfBirth
    );

    const sizeClass = {
        sm: 'w-8 h-8 rounded-lg',
        md: 'w-10 h-10 rounded-xl',
        lg: 'w-14 h-14 rounded-2xl',
    }[size];

    const borderClass = isDeceased
        ? 'ring-2 ring-gray-300'
        : isMale
            ? 'ring-2 ring-blue-300'
            : 'ring-2 ring-pink-300';

    return (
        <button
            onClick={onClick}
            className={`${sizeClass} ${borderClass} flex-shrink-0 overflow-hidden transition-transform hover:scale-105 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        </button>
    );
}

// ── PersonSelector ─────────────────────────────────────────────────────────
function PersonSelector({
    label,
    persons,
    selectedId,
    onSelect,
}: {
    label: string;
    persons: PersonGraph[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = persons.filter((p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.firstName.toLowerCase().includes(search.toLowerCase()) ||
        p.lastName.toLowerCase().includes(search.toLowerCase())
    );
    const selected = persons.find((p) => p.id === selectedId);

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-warm-500 uppercase tracking-wider">{label}</label>
            {selected ? (
                <div className="flex items-center gap-2 p-2.5 bg-white border-2 border-heritage-gold/40 rounded-xl">
                    <PersonAvatar person={selected as any} size="sm" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-warm-800 truncate">{selected.fullName}</p>
                        <p className="text-xs text-warm-400">
                            {getGenderLabel(selected.gender === 'MALE' ? 1 : 2)} · Đời {selected.generation}
                        </p>
                    </div>
                    <button
                        onClick={() => onSelect('')}
                        className="p-1 rounded-lg text-warm-300 hover:text-warm-500 hover:bg-warm-100 transition-colors"
                    >
                        <XIcon className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border border-warm-200 rounded-xl focus:outline-none focus:border-heritage-gold/60 focus:ring-1 focus:ring-heritage-gold/20 placeholder:text-warm-300"
                    />
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-warm-100 bg-white divide-y divide-warm-50">
                        {filtered.length === 0 ? (
                            <p className="text-xs text-warm-400 p-3 text-center">Không tìm thấy</p>
                        ) : (
                            filtered.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { onSelect(p.id); setSearch(''); }}
                                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-warm-50 transition-colors text-left"
                                >
                                    <PersonAvatar person={p as any} size="sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-warm-800 truncate">{p.fullName}</p>
                                        <p className="text-xs text-warm-400">
                                            {p.gender === 'MALE' ? 'Nam' : 'Nữ'} · Đời {p.generation}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── PathNode Card ──────────────────────────────────────────────────────────
function PathNodeCard({
    node,
    isFirst,
    isLast,
    onClick,
}: {
    node: RelationshipPersonNode;
    isFirst: boolean;
    isLast: boolean;
    onClick: () => void;
}) {
    const isMale = node.gender === 1;

    const cardBorder = isFirst || isLast
        ? isMale ? 'border-blue-300 bg-blue-50/60' : 'border-pink-300 bg-pink-50/60'
        : 'border-warm-200 bg-white hover:border-warm-300';

    const ringClass = isFirst
        ? 'ring-2 ring-offset-1 ring-heritage-gold/40'
        : isLast
            ? 'ring-2 ring-offset-1 ring-heritage-gold/40'
            : '';

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all hover:shadow-sm ${cardBorder} ${ringClass} w-full text-left group`}
        >
            <PersonAvatar node={node as any} person={node as any} size="md" />
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-semibold text-warm-800 truncate">
                        {node.fullName}
                    </p>
                    {(isFirst || isLast) && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 bg-heritage-gold text-white rounded-md uppercase tracking-wide">
                            {isFirst ? 'A' : 'B'}
                        </span>
                    )}
                </div>
                <p className="text-xs text-warm-400 mt-0.5">
                    {isMale ? '♂ Nam' : '♀ Nữ'}
                </p>
            </div>
            <ChevronRightIcon className="w-3.5 h-3.5 text-warm-300 group-hover:text-warm-500 transition-colors flex-shrink-0" />
        </button>
    );
}

// ── RelationBadge (giữa 2 node) ────────────────────────────────────────────
function RelationBadge({ label }: { label: string }) {
    const style = getRelationBadgeStyle(label);
    const isSpouse = label.toLowerCase().includes('vợ') || label.toLowerCase().includes('chồng');
    return (
        <div className="flex items-center justify-center py-1">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${style}`}>
                {isSpouse && <HeartIcon className="w-3 h-3" />}
                {label}
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────
export function RelationshipPathPanel({
    treeId,
    graph,
    onClose,
    onPersonClick,
    defaultPersonAId,
}: RelationshipPathPanelProps) {
    const [personAId, setPersonAId] = useState<string>(defaultPersonAId || '');
    const [personBId, setPersonBId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<RelationshipData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Auto-fetch khi cả 2 đã chọn
    useEffect(() => {
        if (!personAId || !personBId || personAId === personBId) {
            setResult(null);
            setError(null);
            return;
        }
        fetchRelationship();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personAId, personBId]);

    const fetchRelationship = async () => {
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            const res = await treeService.getRelationship(treeId, personAId, personBId);
            if (res.success && res.data) {
                setResult(res.data);
            } else {
                setError(res.message || 'Không thể tải quan hệ');
            }
        } catch {
            setError('Lỗi kết nối, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const persons = graph.persons;
    const personsExcludeA = persons.filter((p) => p.id !== personAId);
    const personsExcludeB = persons.filter((p) => p.id !== personBId);

    return (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white shadow-2xl border-l border-warm-200 animate-slide-in-right flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-warm-100 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
                        <GitBranchIcon className="w-4 h-4 text-heritage-gold" />
                    </div>
                    <div>
                        <h2 className="font-heading text-base font-bold text-warm-800">Tìm quan hệ</h2>
                        <p className="text-xs text-warm-400">Đường đi giữa hai người</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-warm-400 hover:bg-warm-100 transition-colors"
                >
                    <XIcon className="w-4 h-4" />
                </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto">
                {/* Selectors */}
                <div className="px-5 py-4 space-y-4 border-b border-warm-100">
                    <PersonSelector
                        label="Người A"
                        persons={personsExcludeB}
                        selectedId={personAId}
                        onSelect={setPersonAId}
                    />
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-warm-100" />
                        <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center">
                            <UsersIcon className="w-3 h-3 text-warm-400" />
                        </div>
                        <div className="flex-1 h-px bg-warm-100" />
                    </div>
                    <PersonSelector
                        label="Người B"
                        persons={personsExcludeA}
                        selectedId={personBId}
                        onSelect={setPersonBId}
                    />

                    {personAId === personBId && personAId !== '' && (
                        <p className="text-xs text-amber-500 text-center">Vui lòng chọn hai người khác nhau</p>
                    )}
                </div>

                {/* Result area */}
                <div className="px-5 py-4">
                    {/* Loading */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <LoaderIcon className="w-7 h-7 text-heritage-gold animate-spin" />
                            <p className="text-sm text-warm-400">Đang tìm đường đi...</p>
                        </div>
                    )}

                    {/* Error */}
                    {error && !loading && (
                        <div className="text-center py-10">
                            <p className="text-sm text-red-500">{error}</p>
                            <button
                                onClick={fetchRelationship}
                                className="mt-3 text-xs text-heritage-gold underline"
                            >
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {!loading && !error && !result && (
                        <div className="text-center py-12">
                            <div className="w-14 h-14 rounded-2xl bg-warm-50 flex items-center justify-center mx-auto mb-3">
                                <GitBranchIcon className="w-7 h-7 text-warm-300" />
                            </div>
                            <p className="text-sm font-medium text-warm-500">Chọn hai người để xem quan hệ</p>
                            <p className="text-xs text-warm-300 mt-1">Hệ thống sẽ tự động tìm đường đi ngắn nhất</p>
                        </div>
                    )}

                    {/* Result */}
                    {result && !loading && (
                        <div className="space-y-5">
                            {/* Summary cards */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* A gọi B là */}
                                <div className="bg-gradient-to-br from-heritage-gold/5 to-heritage-gold/10 border border-heritage-gold/20 rounded-2xl p-3.5 space-y-1.5">
                                    <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">A gọi B là</p>
                                    <div className="flex items-center gap-1.5">
                                        <PersonAvatar person={result.fromPerson as any} size="sm" />
                                        <ChevronRightIcon className="w-3 h-3 text-warm-300 flex-shrink-0" />
                                        <PersonAvatar person={result.toPerson as any} size="sm" />
                                    </div>
                                    <p className="text-sm font-bold text-warm-800 leading-tight">
                                        {result.relationshipFromA}
                                    </p>
                                    <p className="text-[10px] text-warm-400 truncate">{result.toPerson.fullName}</p>
                                </div>
                                {/* B gọi A là */}
                                <div className="bg-gradient-to-br from-blue-50/60 to-blue-100/40 border border-blue-100 rounded-2xl p-3.5 space-y-1.5">
                                    <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wider">B gọi A là</p>
                                    <div className="flex items-center gap-1.5">
                                        <PersonAvatar person={result.toPerson as any} size="sm" />
                                        <ChevronRightIcon className="w-3 h-3 text-warm-300 flex-shrink-0" />
                                        <PersonAvatar person={result.fromPerson as any} size="sm" />
                                    </div>
                                    <p className="text-sm font-bold text-warm-800 leading-tight">
                                        {result.relationshipFromB}
                                    </p>
                                    <p className="text-[10px] text-warm-400 truncate">{result.fromPerson.fullName}</p>
                                </div>
                            </div>

                            {/* Generation diff */}
                            <div className="flex items-center justify-center">
                                <span className={`
                  px-3 py-1.5 rounded-full text-xs font-semibold border
                  ${result.generationDiff === 0
                                        ? 'bg-green-50 text-green-600 border-green-200'
                                        : result.generationDiff > 0
                                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                                            : 'bg-violet-50 text-violet-600 border-violet-200'
                                    }
                `}>
                                    {getGenerationDiffLabel(result.generationDiff)}
                                </span>
                            </div>

                            {/* Path */}
                            {result.path.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider">
                                            Đường đi
                                        </h3>
                                        <span className="text-xs text-warm-300">
                                            ({result.path.length} người · {result.path.length - 1} bước)
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        {result.path.map((node, idx) => {
                                            const isFirst = idx === 0;
                                            const isLast = idx === result.path.length - 1;
                                            const nextNode = result.path[idx + 1];

                                            return (
                                                <div key={node.id}>
                                                    <PathNodeCard
                                                        node={node}
                                                        isFirst={isFirst}
                                                        isLast={isLast}
                                                        onClick={() => onPersonClick(node.id)}
                                                    />
                                                    {/* Relation badge đến node tiếp theo */}
                                                    {nextNode?.relation && (
                                                        <RelationBadge label={nextNode.relation} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* No path */}
                            {result.path.length === 0 && (
                                <div className="text-center py-6 bg-warm-50 rounded-2xl">
                                    <p className="text-sm font-medium text-warm-500">Không tìm thấy đường đi</p>
                                    <p className="text-xs text-warm-400 mt-1">Hai người này không có quan hệ trong cây</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}