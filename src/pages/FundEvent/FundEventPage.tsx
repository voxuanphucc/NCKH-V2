import { useState, useEffect, useCallback } from 'react';
import {
    WalletIcon, CalendarIcon, ArrowDownIcon, ArrowUpIcon,
    LoaderIcon, RefreshCwIcon, BanknoteIcon, ClockIcon,
    ChevronDownIcon, UsersIcon, MapPinIcon, CheckCircleIcon,
} from 'lucide-react';
import { treeService } from '@/services/treeService';
import { fundPageService } from '@/services/fundService';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Tree {
    id: string;
    name: string;
}

interface FundResponse {
    id: string;
    name: string;
    treeId: string;
    treeName: string;
    treeEventId: string;
    treeEventName: string;
    treeEventCreatedAt: string;
    eventId: string;
    eventName: string;
    eventDescription: string;
    eventStartedAt: string;
    eventEndedAt: string;
    eventStatus: number;
}

interface PersonInEvent {
    id: string;
    person: { id: string; fullName: string; firstName: string; lastName: string; avatarUrl?: string };
    eventType: string;
    eventTypeDescription: string;
    address?: { fullAddress?: string };
    name: string;
}

interface EventResponse {
    id: string;
    name: string;
    description: string;
    startedAt: string;
    endedAt: string;
    status: number;
    createdBy: string;
    participants: PersonInEvent[];
}

interface SePayTransaction {
    id: string;
    bank_brand_name: string;
    account_number: string;
    transaction_date: string;
    amount_out: string;
    amount_in: string;
    accumulated: string;
    transaction_content: string;
    reference_number: string;
    code: string | null;
    sub_account: string;
    bank_account_id: string;
}

interface MatchedTransaction extends SePayTransaction {
    matchedFundName: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BASE_URL = 'http://localhost:8080/api/v1';
const SEPAY_TOKEN = 'LSMHHARWZOJRMDNFGKIER38JXLBC7QF0T1LMS6QGY5WAWGVTP1D6JEBBJUKZFX29';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: string | number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n));

const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });

// Thêm hàm xóa dấu
function removeDiacritics(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function matchesFund(content: string, fundName: string): boolean {
    const normalize = (s: string) => removeDiacritics(s.toLowerCase().trim());
    return normalize(content).startsWith(normalize(fundName));
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export function FundEventPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [selectedTree, setSelectedTree] = useState<Tree | null>(null);
    const [loadingTrees, setLoadingTrees] = useState(true);
    const [showTreeDropdown, setShowTreeDropdown] = useState(false);

    const [funds, setFunds] = useState<FundResponse[]>([]);
    const [loadingFunds, setLoadingFunds] = useState(false);

    const [events, setEvents] = useState<EventResponse[]>([]);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventResponse | null>(null);

    const [transactions, setTransactions] = useState<SePayTransaction[]>([]);
    const [loadingTx, setLoadingTx] = useState(true);

    const [selectedFund, setSelectedFund] = useState<FundResponse | null>(null);
    const [activeTab, setActiveTab] = useState<'funds' | 'events' | 'transactions'>('funds');

    // ── Fetch trees ─────────────────────────────────────────────────────────────
    useEffect(() => {
        treeService.getMyTrees()
            .then(res => {
                const data = res.data || [];
                setTrees(data);
                if (data.length > 0) setSelectedTree(data[0]);
            })
            .catch(() => { })
            .finally(() => setLoadingTrees(false));
    }, []);

    // ── Fetch funds when tree changes ───────────────────────────────────────────
    useEffect(() => {
        if (!selectedTree) return;
        setLoadingFunds(true);
        setFunds([]);
        setSelectedFund(null);
        fundPageService.getFunds(selectedTree.id)
            .then(res => { if (res.data) setFunds(res.data); })
            .catch(() => { })
            .finally(() => setLoadingFunds(false));
    }, [selectedTree]);

    // ── Fetch events when tree changes ──────────────────────────────────────────
    useEffect(() => {
        if (!selectedTree) return;
        setLoadingEvents(true);
        setEvents([]);
        setSelectedEvent(null);
        fundPageService.getEvents(selectedTree.id)
            .then(res => { if (res.data) setEvents(res.data); })
            .catch(() => { })
            .finally(() => setLoadingEvents(false));
    }, [selectedTree]);

    // ── Fetch SePay transactions ─────────────────────────────────────────────────
    const fetchTransactions = useCallback(async () => {
        setLoadingTx(true);
        try {
            const res = await fundPageService.getTransactions();
            // SePay trả { transactions: [...] }, backend wrap thành { data: { transactions: [...] } }
            const txList = res.data?.transactions ?? (res as any).transactions ?? [];
            setTransactions(txList);
        } catch { }
        finally { setLoadingTx(false); }
    }, []);
    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    // ── Derived ─────────────────────────────────────────────────────────────────
    const matchedTransactions: MatchedTransaction[] = transactions.flatMap(tx => {
        const matches = funds.filter(f => {
            const result = matchesFund(tx.transaction_content, f.name);
            return result;
        });
        return matches.map(f => ({ ...tx, matchedFundName: f.name }));

    });

    const txForFund = (fund: FundResponse) =>
        matchedTransactions.filter(tx => tx.matchedFundName === fund.name);

    const totalIn = (fund: FundResponse) =>
        txForFund(fund).reduce((sum, tx) => sum + parseFloat(tx.amount_in || '0'), 0);

    const totalAllIn = matchedTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount_in || '0'), 0);

    // ── Render ──────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-amber-50">

            {/* ── Header ── */}
            <div className="bg-white border-b border-amber-200 shadow-sm sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">

                    {/* Title */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                            <WalletIcon className="w-5 h-5 text-amber-700" />
                        </div>
                        <div>
                            <h1 className="font-bold text-amber-900 text-lg leading-tight">Quỹ & Lễ</h1>
                            <p className="text-[11px] text-amber-400">Quản lý quỹ và sự kiện gia phả</p>
                        </div>
                    </div>

                    {/* Tree selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowTreeDropdown(v => !v)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors min-w-[180px] justify-between"
                        >
                            {loadingTrees ? (
                                <LoaderIcon className="w-4 h-4 animate-spin text-amber-400" />
                            ) : (
                                <span className="truncate">{selectedTree?.name || 'Chọn gia phả'}</span>
                            )}
                            <ChevronDownIcon className="w-4 h-4 flex-shrink-0 text-amber-500" />
                        </button>
                        {showTreeDropdown && (
                            <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-amber-200 rounded-xl shadow-lg z-30 overflow-hidden">
                                {trees.map(tree => (
                                    <button
                                        key={tree.id}
                                        onClick={() => { setSelectedTree(tree); setShowTreeDropdown(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${selectedTree?.id === tree.id
                                            ? 'bg-amber-50 text-amber-800 font-semibold'
                                            : 'text-gray-700 hover:bg-amber-50'
                                            }`}
                                    >
                                        {tree.name}
                                        {selectedTree?.id === tree.id && <CheckCircleIcon className="w-4 h-4 text-amber-500" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchTransactions}
                        disabled={loadingTx}
                        className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
                    >
                        <RefreshCwIcon className={`w-4 h-4 ${loadingTx ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Làm mới</span>
                    </button>
                </div>

                {/* Summary */}
                <div className="max-w-6xl mx-auto px-6 pb-3 grid grid-cols-3 gap-3">
                    <SummaryCard icon={<WalletIcon className="w-4 h-4" />} label="Tổng quỹ" value={`${funds.length} quỹ`} color="amber" />
                    <SummaryCard icon={<CalendarIcon className="w-4 h-4" />} label="Sự kiện" value={`${events.length} lễ`} color="blue" />
                    <SummaryCard icon={<BanknoteIcon className="w-4 h-4" />} label="Tổng thu khớp" value={fmt(totalAllIn)} color="green" />
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-6 flex gap-1 border-t border-amber-100">
                    {(['funds', 'events', 'transactions'] as const).map(tab => {
                        const labels = {
                            funds: `Quỹ (${funds.length})`,
                            events: `Lễ / Sự kiện (${events.length})`,
                            transactions: `Giao dịch khớp (${matchedTransactions.length})`,
                        };
                        return (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-amber-500 text-amber-700'
                                    : 'border-transparent text-gray-400 hover:text-amber-600'
                                    }`}
                            >
                                {labels[tab]}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Content ── */}
            <div className="max-w-6xl mx-auto px-6 py-6">

                {/* ── FUNDS TAB ── */}
                {activeTab === 'funds' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Fund list */}
                        <div className="space-y-2">
                            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Danh sách quỹ</h2>
                            {loadingFunds ? (
                                <Spinner />
                            ) : funds.length === 0 ? (
                                <Empty icon={<WalletIcon className="w-10 h-10" />} text="Chưa có quỹ nào" />
                            ) : (
                                funds.map(fund => {
                                    const matched = txForFund(fund);
                                    const total = totalIn(fund);
                                    const isSelected = selectedFund?.id === fund.id;
                                    return (
                                        <button
                                            key={fund.id}
                                            onClick={() => setSelectedFund(isSelected ? null : fund)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${isSelected
                                                ? 'border-amber-400 bg-amber-50 shadow-md'
                                                : 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-amber-900 text-sm truncate">{fund.name}</p>
                                                    <p className="text-xs text-amber-400 mt-0.5 truncate">{fund.treeEventName}</p>
                                                </div>
                                                <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${matched.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                    {matched.length} GD
                                                </span>
                                            </div>
                                            {total > 0 && (
                                                <p className="mt-2 text-sm font-bold text-green-700">+{fmt(total)}</p>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Fund detail */}
                        <div className="lg:col-span-2">
                            {selectedFund ? (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-amber-900 text-lg">{selectedFund.name}</h3>
                                                <p className="text-sm text-amber-400">{selectedFund.eventName}</p>
                                            </div>
                                            <EventStatusBadge status={selectedFund.eventStatus} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InfoBlock label="Sự kiện" value={selectedFund.treeEventName} />
                                            <InfoBlock label="Tổng thu" value={fmt(totalIn(selectedFund))} highlight />
                                            <InfoBlock label="Bắt đầu" value={fmtDate(selectedFund.eventStartedAt)} />
                                            <InfoBlock label="Kết thúc" value={fmtDate(selectedFund.eventEndedAt)} />
                                            {selectedFund.eventDescription && (
                                                <div className="col-span-2">
                                                    <InfoBlock label="Mô tả" value={selectedFund.eventDescription} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                                            Giao dịch khớp ({txForFund(selectedFund).length})
                                        </h4>
                                        {txForFund(selectedFund).length === 0 ? (
                                            <Empty icon={<BanknoteIcon className="w-10 h-10" />} text="Không có giao dịch khớp" />
                                        ) : (
                                            <div className="space-y-2">
                                                {txForFund(selectedFund).map(tx => (
                                                    <TransactionRow key={tx.id} tx={tx} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <WalletIcon className="w-12 h-12 text-amber-200 mb-3" />
                                    <p className="text-amber-400 text-sm">Chọn một quỹ để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── EVENTS TAB ── */}
                {activeTab === 'events' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Event list */}
                        <div className="space-y-2">
                            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">Danh sách sự kiện</h2>
                            {loadingEvents ? (
                                <Spinner />
                            ) : events.length === 0 ? (
                                <Empty icon={<CalendarIcon className="w-10 h-10" />} text="Chưa có sự kiện nào" />
                            ) : (
                                events.map(ev => {
                                    const isSelected = selectedEvent?.id === ev.id;
                                    return (
                                        <button
                                            key={ev.id}
                                            onClick={() => setSelectedEvent(isSelected ? null : ev)}
                                            className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${isSelected
                                                ? 'border-blue-400 bg-blue-50 shadow-md'
                                                : 'border-amber-200 bg-white hover:border-amber-300 hover:shadow-sm'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-amber-900 text-sm truncate">{ev.name}</p>
                                                <EventStatusBadge status={ev.status} />
                                            </div>
                                            <p className="text-xs text-amber-400 mt-1">
                                                {new Date(ev.startedAt).toLocaleDateString('vi-VN')}
                                            </p>
                                            {ev.participants?.length > 0 && (
                                                <p className="text-xs text-blue-500 mt-1 flex items-center gap-1">
                                                    <UsersIcon className="w-3 h-3" />
                                                    {ev.participants.length} người tham gia
                                                </p>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {/* Event detail */}
                        <div className="lg:col-span-2">
                            {selectedEvent ? (
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-amber-900 text-lg">{selectedEvent.name}</h3>
                                                {selectedEvent.createdBy && (
                                                    <p className="text-xs text-amber-400 mt-0.5">Tạo bởi: {selectedEvent.createdBy}</p>
                                                )}
                                            </div>
                                            <EventStatusBadge status={selectedEvent.status} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <InfoBlock label="Bắt đầu" value={fmtDate(selectedEvent.startedAt)} />
                                            <InfoBlock label="Kết thúc" value={fmtDate(selectedEvent.endedAt)} />
                                            {selectedEvent.description && (
                                                <div className="col-span-2">
                                                    <InfoBlock label="Mô tả" value={selectedEvent.description} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Participants */}
                                    <div>
                                        <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
                                            Người tham gia ({selectedEvent.participants?.length || 0})
                                        </h4>
                                        {!selectedEvent.participants?.length ? (
                                            <Empty icon={<UsersIcon className="w-10 h-10" />} text="Chưa có người tham gia" />
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {selectedEvent.participants.map(p => (
                                                    <div key={p.id} className="bg-white rounded-xl border border-amber-100 p-3 flex items-center gap-3">
                                                        {p.person?.avatarUrl ? (
                                                            <img src={p.person.avatarUrl} className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-amber-200" alt="" />
                                                        ) : (
                                                            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600 font-bold text-sm">
                                                                {(p.person?.fullName || p.person?.firstName || '?')[0]}
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-amber-900 truncate">
                                                                {p.person?.fullName || `${p.person?.lastName} ${p.person?.firstName}`}
                                                            </p>
                                                            <p className="text-xs text-amber-500 truncate">
                                                                {p.eventTypeDescription || p.eventType}
                                                            </p>
                                                            {p.address?.fullAddress && (
                                                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                                                    <MapPinIcon className="w-3 h-3" />
                                                                    {p.address.fullAddress}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <CalendarIcon className="w-12 h-12 text-amber-200 mb-3" />
                                    <p className="text-amber-400 text-sm">Chọn một sự kiện để xem chi tiết</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── TRANSACTIONS TAB ── */}
                {activeTab === 'transactions' && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                                Giao dịch khớp với quỹ
                            </h2>
                            {loadingTx && <LoaderIcon className="w-4 h-4 text-amber-400 animate-spin" />}
                        </div>

                        {!loadingTx && matchedTransactions.length === 0 ? (
                            <Empty icon={<BanknoteIcon className="w-10 h-10" />} text="Không tìm thấy giao dịch nào khớp với quỹ" />
                        ) : (
                            <div className="space-y-3">
                                {matchedTransactions.map((tx, i) => (
                                    <div key={`${tx.id}-${i}`} className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                                        {tx.matchedFundName}
                                                    </span>
                                                    <span className="text-xs text-gray-400">{tx.bank_brand_name}</span>
                                                    <span className="text-xs text-gray-300">·</span>
                                                    <span className="text-xs text-gray-400">{tx.account_number}</span>
                                                </div>
                                                <p className="text-sm text-gray-700 truncate">{tx.transaction_content}</p>
                                                <p className="text-xs text-gray-400 mt-1">{fmtDate(tx.transaction_date)}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                {parseFloat(tx.amount_in) > 0 && (
                                                    <p className="font-bold text-green-600 flex items-center gap-1 justify-end text-sm">
                                                        <ArrowDownIcon className="w-3.5 h-3.5" />
                                                        {fmt(tx.amount_in)}
                                                    </p>
                                                )}
                                                {parseFloat(tx.amount_out) > 0 && (
                                                    <p className="font-bold text-red-500 flex items-center gap-1 justify-end text-sm">
                                                        <ArrowUpIcon className="w-3.5 h-3.5" />
                                                        {fmt(tx.amount_out)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
    const colors: Record<string, string> = {
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        green: 'bg-green-50 text-green-700 border-green-200',
    };
    return (
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border ${colors[color]}`}>
            <div className="opacity-70">{icon}</div>
            <div>
                <p className="text-[11px] opacity-60">{label}</p>
                <p className="font-bold text-sm">{value}</p>
            </div>
        </div>
    );
}

function InfoBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-[11px] text-amber-400 mb-0.5">{label}</p>
            <p className={`font-semibold text-sm ${highlight ? 'text-green-700' : 'text-amber-900'}`}>{value}</p>
        </div>
    );
}

function EventStatusBadge({ status }: { status: number }) {
    const map: Record<number, { label: string; cls: string }> = {
        1: { label: 'Sắp diễn ra', cls: 'bg-blue-100 text-blue-700' },
        2: { label: 'Đang diễn ra', cls: 'bg-green-100 text-green-700' },
        3: { label: 'Đã kết thúc', cls: 'bg-gray-100 text-gray-500' },
    };
    const s = map[status] || { label: `Status ${status}`, cls: 'bg-gray-100 text-gray-500' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.cls}`}>{s.label}</span>;
}

function TransactionRow({ tx }: { tx: MatchedTransaction }) {
    const amountIn = parseFloat(tx.amount_in || '0');
    const amountOut = parseFloat(tx.amount_out || '0');
    return (
        <div className="bg-white rounded-xl border border-amber-100 p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${amountIn > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    {amountIn > 0
                        ? <ArrowDownIcon className="w-4 h-4 text-green-600" />
                        : <ArrowUpIcon className="w-4 h-4 text-red-500" />}
                </div>
                <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{tx.transaction_content}</p>
                    <p className="text-xs text-gray-400">{tx.bank_brand_name} · {new Date(tx.transaction_date).toLocaleDateString('vi-VN')}</p>
                </div>
            </div>
            <div className="flex-shrink-0 text-right">
                {amountIn > 0 && <p className="font-bold text-green-600 text-sm">+{fmt(amountIn)}</p>}
                {amountOut > 0 && <p className="font-bold text-red-500 text-sm">-{fmt(amountOut)}</p>}
            </div>
        </div>
    );
}

function Spinner() {
    return <div className="flex justify-center py-10"><LoaderIcon className="w-6 h-6 text-amber-400 animate-spin" /></div>;
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-amber-200 mb-3">{icon}</div>
            <p className="text-amber-400 text-sm">{text}</p>
        </div>
    );
}