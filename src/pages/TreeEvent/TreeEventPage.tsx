import { useEffect, useState, useCallback } from 'react';
import {
    CalendarDaysIcon,
    LoaderIcon,
    SearchIcon,
    XIcon,
    TreesIcon,
    UsersIcon,
    MapPinIcon,
    ChevronDownIcon,
    FilterIcon,
    RefreshCwIcon,
    UserIcon,
    CalendarIcon,
    ClockIcon,
    Baby,
    Skull,
    Heart,
    Cross,
    CandlestickChart,
    Home,
    BookOpen,
    Briefcase,
    Pin,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { treeService } from '../../services/treeService';
import { showErrorToast } from '../../utils/validation';
import type { TreeEvent } from '../../types/event';
import type { Tree } from '../../types/tree';
import { formatDate } from '../../utils/formatDate';

// ─── Event type colors ────────────────────────────────────────────────────────
const EVENT_TYPE_STYLES: Record<
    string,
    { color: string; bg: string; label: string; icon: React.ReactNode }
> = {
    BIRTH: { color: "#059669", bg: "#ecfdf5", label: "Sinh", icon: <Baby size={16} /> },
    DEATH: { color: "#6B7280", bg: "#f3f4f6", label: "Mất", icon: <Skull size={16} /> },
    MARRIAGE: { color: "#C49A3C", bg: "#fffbeb", label: "Kết hôn", icon: <Heart size={16} /> },
    BURIAL: { color: "#4B5563", bg: "#f9fafb", label: "An táng", icon: <Cross size={16} /> },
    MEMORIAL: { color: "#7C3AED", bg: "#f5f3ff", label: "Giỗ", icon: <CandlestickChart size={16} /> },
    MOVE: { color: "#0369A1", bg: "#eff6ff", label: "Chuyển nơi ở", icon: <Home size={16} /> },
    EDUCATION: { color: "#0891B2", bg: "#ecfeff", label: "Học vấn", icon: <BookOpen size={16} /> },
    CAREER: { color: "#D97706", bg: "#fffbeb", label: "Sự nghiệp", icon: <Briefcase size={16} /> },
    OTHER: { color: "#C4A882", bg: "#faf9f7", label: "Khác", icon: <Pin size={16} /> },
};

function getEventStyle(type?: string) {
    return EVENT_TYPE_STYLES[type?.toUpperCase() || ''] ?? EVENT_TYPE_STYLES.OTHER;
}

// ─── Group events by year ─────────────────────────────────────────────────────
function groupByYear(events: TreeEvent[]): Map<number, TreeEvent[]> {
    const map = new Map<number, TreeEvent[]>();
    events.forEach((e) => {
        const year = e.startedAt ? new Date(e.startedAt).getFullYear() : 0;
        if (!map.has(year)) map.set(year, []);
        map.get(year)!.push(e);
    });
    return new Map([...map.entries()].sort((a, b) => b[0] - a[0]));
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────
interface EventDetailPanelProps {
    event: TreeEvent;
    onClose: () => void;
}

function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
    const style = getEventStyle(event.participants?.[0]?.eventType);

    return (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white shadow-2xl border-l border-warm-200 flex flex-col animate-slide-in-right">
            {/* Header banner */}
            <div className="relative">
                <div
                    className="h-28"
                    style={{ background: `linear-gradient(135deg, ${style.bg}, white)` }}
                />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-white/80 backdrop-blur-sm text-warm-600 hover:bg-white transition-colors shadow-sm"
                >
                    <XIcon className="w-4 h-4" />
                </button>

                {/* Icon */}
                <div className="absolute bottom-0 left-6 translate-y-1/2">
                    <div
                        className="w-16 h-16 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: style.bg, color: style.color }}
                    >
                        {style.icon}
                    </div>
                </div>
            </div>

            {/* Title */}
            <div className="px-6 pt-12 pb-4">
                <h2 className="font-heading text-xl font-bold text-warm-800">{event.name}</h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: style.bg, color: style.color }}
                    >
                        {style.label}
                    </span>
                    <span className="text-xs text-warm-400">bởi {event.createdBy}</span>
                </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-warm-100 mx-6" />

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

                {/* Description */}
                {event.description && (
                    <div className="p-4 bg-warm-50 rounded-xl">
                        <p className="text-sm text-warm-700 leading-relaxed">{event.description}</p>
                    </div>
                )}

                {/* Time */}
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">Thời gian</h3>
                    <div className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                        <CalendarIcon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-warm-700">
                                {formatDate(event.startedAt)}
                                {event.endedAt && event.endedAt !== event.startedAt && (
                                    <span className="text-warm-400"> → {formatDate(event.endedAt)}</span>
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Participants */}
                {event.participants?.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
                            Người tham gia ({event.participants.length})
                        </h3>
                        <div className="space-y-2">
                            {event.participants.map((p) => {
                                const pStyle = getEventStyle(p.eventType);
                                return (
                                    <div key={p.id} className="flex items-center gap-3 p-3 bg-warm-50 rounded-xl">
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${p.person.gender === 'MALE' ? 'bg-blue-100' : 'bg-pink-100'}`}>
                                            {p.person.avatarUrl ? (
                                                <img src={p.person.avatarUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <UserIcon className={`w-4 h-4 ${p.person.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-warm-800 truncate">
                                                {p.person.fullName || `${p.person.lastName} ${p.person.firstName}`}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                {p.eventType && (
                                                    <span
                                                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                                        style={{ backgroundColor: pStyle.bg, color: pStyle.color }}
                                                    >
                                                        {p.eventTypeDescription || pStyle.label}
                                                    </span>
                                                )}
                                                {p.name && p.name !== event.name && (
                                                    <span className="text-[10px] text-warm-400">{p.name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Address */}
                {event.participants?.some((p) => p.address) && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wider">Địa điểm</h3>
                        {event.participants
                            .filter((p) => p.address)
                            .slice(0, 1)
                            .map((p) => (
                                <div key={p.id} className="flex items-start gap-3 p-3 bg-warm-50 rounded-xl">
                                    <MapPinIcon className="w-4 h-4 text-warm-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-warm-700">
                                        {p.address!.formattedAddress || p.address!.addressLine}
                                    </p>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function TreeEventsPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [selectedTreeId, setSelectedTreeId] = useState('');
    const [loadingTrees, setLoadingTrees] = useState(true);

    const [events, setEvents] = useState<TreeEvent[]>([]);
    const [loading, setLoading] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<TreeEvent | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);

    // Fetch trees
    useEffect(() => {
        setLoadingTrees(true);
        treeService.getMyTrees()
            .then((res) => {
                if (res.success && res.data?.length > 0) {
                    setTrees(res.data);
                    setSelectedTreeId(res.data[0].id);
                }
            })
            .catch(() => showErrorToast('Không thể tải gia phả'))
            .finally(() => setLoadingTrees(false));
    }, []);

    // Fetch events
    const fetchEvents = useCallback(async () => {
        if (!selectedTreeId) return;
        setLoading(true);
        setSelectedEvent(null);
        try {
            const res = await eventService.getTreeEvents(selectedTreeId);
            if (res.success && res.data) {
                // Sort by date desc
                const sorted = [...(res.data as TreeEvent[])].sort((a, b) =>
                    new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime()
                );
                setEvents(sorted);
            }
        } catch {
            showErrorToast('Không thể tải sự kiện');
        } finally {
            setLoading(false);
        }
    }, [selectedTreeId]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Derived
    const allTypes = [...new Set(
        events.flatMap((e) => e.participants?.map((p) => p.eventType).filter(Boolean) || [])
    )];

    const filteredEvents = events.filter((e) => {
        const matchSearch = !searchQuery ||
            e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.participants?.some((p) =>
                (p.person.fullName || `${p.person.lastName} ${p.person.firstName}`)
                    .toLowerCase().includes(searchQuery.toLowerCase())
            );
        const matchFilter = activeFilters.size === 0 ||
            e.participants?.some((p) => activeFilters.has(p.eventType || ''));
        return matchSearch && matchFilter;
    });

    const grouped = groupByYear(filteredEvents);

    const toggleFilter = (type: string) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(type)) next.delete(type); else next.add(type);
            return next;
        });
    };

    if (!loadingTrees && trees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center">
                <TreesIcon className="w-12 h-12 text-warm-200 mb-4" />
                <h2 className="font-heading text-xl font-semibold text-warm-700 mb-2">Chưa có gia phả nào</h2>
                <p className="text-sm text-warm-400">Tạo gia phả trước để xem sự kiện.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-cream overflow-hidden">

            {/* ── Top bar ────────────────────────────────────────────────────────────── */}
            <div className="flex-shrink-0 bg-white border-b border-warm-200 px-6 py-3 flex flex-wrap items-center gap-3 shadow-sm">
                {/* Title */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
                        <CalendarDaysIcon className="w-5 h-5 text-heritage-gold" />
                    </div>
                    <div>
                        <h1 className="font-heading text-base font-bold text-warm-800 leading-tight">Dòng thời gian sự kiện</h1>
                        <p className="text-[11px] text-warm-400">{filteredEvents.length} sự kiện</p>
                    </div>
                </div>

                {/* Tree selector */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <TreesIcon className="w-4 h-4 text-warm-400" />
                    {loadingTrees ? (
                        <LoaderIcon className="w-4 h-4 animate-spin text-heritage-gold" />
                    ) : (
                        <select
                            value={selectedTreeId}
                            onChange={(e) => setSelectedTreeId(e.target.value)}
                            className="px-3 py-2 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all max-w-[200px]"
                        >
                            {trees.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    )}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[160px] max-w-sm">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Tìm sự kiện, người tham gia..."
                        className="w-full pl-9 pr-8 py-2 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-500">
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filter */}
                {allTypes.length > 0 && (
                    <button
                        onClick={() => setShowFilters((p) => !p)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${showFilters || activeFilters.size > 0
                            ? 'bg-heritage-gold text-white border-heritage-gold'
                            : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
                            }`}
                    >
                        <FilterIcon className="w-4 h-4" />
                        Lọc {activeFilters.size > 0 && `(${activeFilters.size})`}
                        <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                    </button>
                )}

                {/* Refresh */}
                <button
                    onClick={fetchEvents}
                    disabled={loading || !selectedTreeId}
                    className="p-2 rounded-lg border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filter bar */}
            {showFilters && allTypes.length > 0 && (
                <div className="flex-shrink-0 bg-white border-b border-warm-100 px-6 py-3 flex flex-wrap gap-2 animate-fade-in">
                    {allTypes.map((type) => {
                        const style = getEventStyle(type);
                        const active = activeFilters.has(type || '');
                        return (
                            <button
                                key={type}
                                onClick={() => toggleFilter(type || '')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'text-white border-transparent shadow-sm' : 'bg-white text-warm-500 border-warm-200'
                                    }`}
                                style={active ? { backgroundColor: style.color } : {}}
                            >
                                <span>{style.icon}</span>
                                {style.label}
                            </button>
                        );
                    })}
                    {activeFilters.size > 0 && (
                        <button
                            onClick={() => setActiveFilters(new Set())}
                            className="px-3 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-500 hover:bg-warm-50"
                        >
                            Xóa bộ lọc
                        </button>
                    )}
                </div>
            )}

            {/* ── Body ───────────────────────────────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Timeline */}
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
                        </div>
                    ) : !selectedTreeId ? (
                        <div className="text-center py-20">
                            <TreesIcon className="w-12 h-12 text-warm-200 mx-auto mb-4" />
                            <p className="text-warm-400">Chọn một gia phả để xem sự kiện</p>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <div className="text-center py-20">
                            <CalendarDaysIcon className="w-12 h-12 text-warm-200 mx-auto mb-4" />
                            <p className="text-warm-500 font-medium">Chưa có sự kiện nào</p>
                            <p className="text-warm-400 text-sm mt-1">Thêm sự kiện trong trang quản lý gia phả</p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto">
                            {[...grouped.entries()].map(([year, yearEvents]) => (
                                <div key={year} className="mb-10">
                                    {/* Year marker */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-warm-800 flex items-center justify-center shadow-md">
                                                <span className="text-xs font-bold text-cream">{year || '?'}</span>
                                            </div>
                                            <div className="h-px flex-1 bg-warm-200 w-24" />
                                        </div>
                                        <span className="text-xs text-warm-400 font-medium">{yearEvents.length} sự kiện</span>
                                    </div>

                                    {/* Events in this year */}
                                    <div className="relative pl-8">
                                        {/* Vertical line */}
                                        <div className="absolute left-3 top-0 bottom-0 w-px bg-warm-200" />

                                        <div className="space-y-4">
                                            {yearEvents.map((event, idx) => {
                                                const style = getEventStyle(event.participants?.[0]?.eventType);
                                                const isSelected = selectedEvent?.id === event.id;
                                                const date = event.startedAt ? new Date(event.startedAt) : null;

                                                return (
                                                    <div key={event.id} className="relative">
                                                        {/* Dot on timeline */}
                                                        <div
                                                            className="absolute -left-8 top-4 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] z-10 transition-transform"
                                                            style={{
                                                                backgroundColor: isSelected ? style.color : style.bg,
                                                                color: isSelected ? 'white' : style.color,
                                                                borderColor: style.color,
                                                                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                                                            }}
                                                        >
                                                            {style.icon}
                                                        </div>

                                                        {/* Card */}
                                                        <button
                                                            onClick={() => setSelectedEvent(isSelected ? null : event)}
                                                            className={`w-full text-left rounded-2xl border transition-all duration-200 ${isSelected
                                                                ? 'shadow-lg border-heritage-gold/30 bg-heritage-gold/3'
                                                                : 'bg-white border-warm-100 hover:border-warm-200 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className="p-4">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                                            <span
                                                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                                                style={{ backgroundColor: style.bg, color: style.color }}
                                                                            >
                                                                                {style.label}
                                                                            </span>
                                                                            {date && (
                                                                                <span className="text-[10px] text-warm-400 flex items-center gap-1">
                                                                                    <ClockIcon className="w-2.5 h-2.5" />
                                                                                    {date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <h3 className="text-sm font-semibold text-warm-800 truncate">
                                                                            {event.name}
                                                                        </h3>

                                                                        {event.description && (
                                                                            <p className="text-xs text-warm-400 mt-1 line-clamp-2">{event.description}</p>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Participants */}
                                                                {event.participants?.length > 0 && (
                                                                    <div className="mt-3 flex items-center gap-2">
                                                                        <div className="flex -space-x-2">
                                                                            {event.participants.slice(0, 4).map((p) => (
                                                                                <div
                                                                                    key={p.id}
                                                                                    className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center overflow-hidden ${p.person.gender === 'MALE' ? 'bg-blue-100' : 'bg-pink-100'
                                                                                        }`}
                                                                                    title={p.person.fullName}
                                                                                >
                                                                                    {p.person.avatarUrl ? (
                                                                                        <img src={p.person.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <UserIcon className={`w-3 h-3 ${p.person.gender === 'MALE' ? 'text-blue-500' : 'text-pink-500'}`} />
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                            {event.participants.length > 4 && (
                                                                                <div className="w-6 h-6 rounded-full border-2 border-white bg-warm-100 flex items-center justify-center">
                                                                                    <span className="text-[8px] font-bold text-warm-500">+{event.participants.length - 4}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <span className="text-[10px] text-warm-400 flex items-center gap-1">
                                                                            <UsersIcon className="w-2.5 h-2.5" />
                                                                            {event.participants.length} người
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Bottom cap */}
                            <div className="flex justify-center mt-6">
                                <div className="w-3 h-3 rounded-full bg-warm-300" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats sidebar */}
                {!selectedEvent && filteredEvents.length > 0 && (
                    <div className="w-64 flex-shrink-0 border-l border-warm-100 bg-white p-5 overflow-y-auto hidden lg:block">
                        <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-4">Thống kê</h3>

                        <div className="space-y-3">
                            <div className="p-3 bg-warm-50 rounded-xl">
                                <p className="text-2xl font-bold text-warm-800">{filteredEvents.length}</p>
                                <p className="text-xs text-warm-400 mt-0.5">Tổng sự kiện</p>
                            </div>
                            <div className="p-3 bg-warm-50 rounded-xl">
                                <p className="text-2xl font-bold text-warm-800">{grouped.size}</p>
                                <p className="text-xs text-warm-400 mt-0.5">Năm có sự kiện</p>
                            </div>
                            <div className="p-3 bg-warm-50 rounded-xl">
                                <p className="text-2xl font-bold text-warm-800">
                                    {new Set(filteredEvents.flatMap((e) => e.participants?.map((p) => p.person.id) || [])).size}
                                </p>
                                <p className="text-xs text-warm-400 mt-0.5">Người tham gia</p>
                            </div>
                        </div>

                        {/* By type */}
                        <h3 className="text-xs font-bold text-warm-500 uppercase tracking-wider mb-3 mt-6">Theo loại</h3>
                        <div className="space-y-2">
                            {Object.entries(
                                filteredEvents.reduce((acc, e) => {
                                    const type = e.participants?.[0]?.eventType || 'OTHER';
                                    acc[type] = (acc[type] || 0) + 1;
                                    return acc;
                                }, {} as Record<string, number>)
                            )
                                .sort((a, b) => b[1] - a[1])
                                .map(([type, count]) => {
                                    const style = getEventStyle(type);
                                    return (
                                        <div key={type} className="flex items-center gap-2">
                                            <span className="text-sm w-5 text-center">{style.icon}</span>
                                            <span className="text-xs text-warm-600 flex-1 truncate">{style.label}</span>
                                            <span className="text-xs font-semibold text-warm-700">{count}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            {/* Event detail panel */}
            {selectedEvent && (
                <EventDetailPanel
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                />
            )}
        </div>
    );
}