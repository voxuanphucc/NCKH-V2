import { useEffect, useRef, useState, useCallback } from 'react';
import {
    MapPinIcon,
    LoaderIcon,
    SearchIcon,
    FilterIcon,
    XIcon,
    ChevronDownIcon,
    InfoIcon,
    LayersIcon,
    RefreshCwIcon,
    TreesIcon,
} from 'lucide-react';
import { addressService } from '../../services/addressService';
import { treeService } from '../../services/treeService';
import { showErrorToast } from '../../utils/validation';
import type { Address } from '../../types/address';
import type { Tree } from '../../types/tree';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCjGAY6GnolEUxiHADHxWxWMlonwvbtqTQ';

const HERITAGE_ADDRESS_TYPES = [
    { key: 'BURIAL_PLACE', label: 'Nơi an táng', color: '#6B7280', icon: '✝' },
    { key: 'ANCESTRAL_HOME', label: 'Nhà tổ tiên', color: '#6B7280', icon: '✝' },
    { key: 'CEMETERY', label: 'Nghĩa trang', color: '#4B5563', icon: '⚰' },
    { key: 'ALTAR_LOCATION', label: 'Bàn thờ', color: '#C49A3C', icon: '🕯' },
    { key: 'FAMILY_HOME', label: 'Nhà thờ họ', color: '#92400E', icon: '🏛' },
    { key: 'ORIGIN', label: 'Nguồn gốc dòng họ', color: '#1D4ED8', icon: '🌿' },
    { key: 'BIRTH_PLACE', label: 'Nơi sinh', color: '#059669', icon: '✦' },
    { key: 'DEATH_PLACE', label: 'Nơi mất', color: '#7C3AED', icon: '†' },
    { key: 'PERMANENT', label: 'Thường trú', color: '#0369A1', icon: '🏠' },
];

const TYPE_MAP = Object.fromEntries(HERITAGE_ADDRESS_TYPES.map((t) => [t.key, t]));
function getTypeInfo(addressType: string) {
    return TYPE_MAP[addressType] ?? { label: addressType, color: '#C4A882', icon: '📍' };
}

declare global { interface Window { google: typeof google } }

function loadGoogleMaps(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google?.maps) { resolve(); return; }
        const existing = document.getElementById('gmap-script');
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', reject);
            return;
        }
        const s = document.createElement('script');
        s.id = 'gmap-script';
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        s.async = true; s.defer = true;
        s.onload = () => resolve(); s.onerror = reject;
        document.head.appendChild(s);
    });
}

function markerSvg(color: string, icon: string, selected = false): string {
    const size = selected ? 52 : 40;
    const r = size / 2;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 10}" viewBox="0 0 ${size} ${size + 10}">
      <filter id="sh"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/></filter>
      <circle cx="${r}" cy="${r}" r="${r - 2}" fill="${color}" stroke="white" stroke-width="${selected ? 3 : 2}" filter="url(#sh)"/>
      <text x="${r}" y="${r + 5}" text-anchor="middle" font-size="${selected ? 18 : 14}" fill="white">${icon}</text>
      <line x1="${r}" y1="${size - 2}" x2="${r}" y2="${size + 8}" stroke="${color}" stroke-width="2"/>
    </svg>
  `)}`;
}

interface MarkerData { address: Address; marker: google.maps.Marker; }

export function HeritageMapPage() {
    const [trees, setTrees] = useState<Tree[]>([]);
    const [selectedTreeId, setSelectedTreeId] = useState<string>('');
    const [loadingTrees, setLoadingTrees] = useState(true);

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState<Record<string, number>>({});

    const mapRef = useRef<HTMLDivElement>(null);
    const gMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<MarkerData[]>([]);
    const [mapsReady, setMapsReady] = useState(false);
    const [mapsError, setMapsError] = useState(false);

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState<Set<string>>(
        new Set(HERITAGE_ADDRESS_TYPES.map((t) => t.key))
    );
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
            .catch(() => showErrorToast('Không thể tải danh sách gia phả'))
            .finally(() => setLoadingTrees(false));
    }, []);

    // Fetch addresses
    const fetchAddresses = useCallback(async () => {
        if (!selectedTreeId) return;
        setLoading(true);
        setSelectedAddress(null);
        try {
            const res = await addressService.getTreeAddresses(selectedTreeId);
            if (res.success && res.data) {
                const heritageKeys = new Set(HERITAGE_ADDRESS_TYPES.map((t) => t.key));
                const filtered = res.data.filter((a) => !a.addressType || heritageKeys.has(a.addressType));
                setAddresses(filtered);
                const s: Record<string, number> = {};
                filtered.forEach((a) => { const k = a.addressType || 'OTHER'; s[k] = (s[k] || 0) + 1; });
                setStats(s);
            }
        } catch {
            showErrorToast('Không thể tải địa chỉ');
        } finally {
            setLoading(false);
        }
    }, [selectedTreeId]);

    useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

    // Load Maps
    useEffect(() => {
        loadGoogleMaps(GOOGLE_MAPS_API_KEY)
            .then(() => setMapsReady(true))
            .catch(() => setMapsError(true));
    }, []);

    // Init map
    useEffect(() => {
        if (!mapsReady || !mapRef.current || gMapRef.current) return;
        const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 16.0544, lng: 108.2022 },
            zoom: 6,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
            styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
                { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8ddd0' }] },
                { featureType: 'water', stylers: [{ color: '#b8d4e8' }] },
                { featureType: 'landscape.natural', stylers: [{ color: '#e8f0e0' }] },
            ],
        });
        gMapRef.current = map;
        map.addListener('click', () => setSelectedAddress(null));
    }, [mapsReady]);

    // Place markers
    useEffect(() => {
        if (!gMapRef.current || !mapsReady) return;
        markersRef.current.forEach(({ marker }) => marker.setMap(null));
        markersRef.current = [];

        const visible = addresses.filter(
            (a) =>
                a.latitude && a.longitude &&
                activeFilters.has(a.addressType || 'OTHER') &&
                (!searchQuery ||
                    a.formattedAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (visible.length === 0) return;

        const bounds = new window.google.maps.LatLngBounds();
        visible.forEach((addr) => {
            const typeInfo = getTypeInfo(addr.addressType || '');
            const isSelected = selectedAddress?.id === addr.id;
            const marker = new window.google.maps.Marker({
                position: { lat: addr.latitude!, lng: addr.longitude! },
                map: gMapRef.current!,
                icon: {
                    url: markerSvg(typeInfo.color, typeInfo.icon, isSelected),
                    scaledSize: new window.google.maps.Size(isSelected ? 52 : 40, isSelected ? 62 : 50),
                    anchor: new window.google.maps.Point(isSelected ? 26 : 20, isSelected ? 62 : 50),
                },
                title: addr.formattedAddress || '',
                zIndex: isSelected ? 999 : 1,
            });
            marker.addListener('click', () => {
                setSelectedAddress(addr);
                gMapRef.current?.panTo({ lat: addr.latitude!, lng: addr.longitude! });
            });
            bounds.extend({ lat: addr.latitude!, lng: addr.longitude! });
            markersRef.current.push({ address: addr, marker });
        });

        if (visible.length === 1) {
            gMapRef.current.setCenter({ lat: visible[0].latitude!, lng: visible[0].longitude! });
            gMapRef.current.setZoom(14);
        } else {
            gMapRef.current.fitBounds(bounds, 80);
        }
    }, [addresses, activeFilters, searchQuery, mapsReady, selectedAddress?.id]);

    const toggleFilter = (key: string) => {
        setActiveFilters((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const filteredList = addresses.filter(
        (a) =>
            activeFilters.has(a.addressType || 'OTHER') &&
            (!searchQuery ||
                a.formattedAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const visibleOnMap = addresses.filter(
        (a) => a.latitude && a.longitude && activeFilters.has(a.addressType || 'OTHER')
    ).length;
    const noCoords = addresses.filter((a) => !a.latitude || !a.longitude).length;

    if (!loadingTrees && trees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] text-center">
                <TreesIcon className="w-12 h-12 text-warm-200 mb-4" />
                <h2 className="font-heading text-xl font-semibold text-warm-700 mb-2">Chưa có gia phả nào</h2>
                <p className="text-sm text-warm-400">Tạo gia phả trước để xem bản đồ di tích.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-cream overflow-hidden">

            {/* Top bar */}
            <div className="flex-shrink-0 bg-white border-b border-warm-200 px-6 py-3 flex flex-wrap items-center gap-3 shadow-sm">
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
                        <MapPinIcon className="w-5 h-5 text-heritage-gold" />
                    </div>
                    <div>
                        <h1 className="font-heading text-base font-bold text-warm-800 leading-tight">Bản đồ di tích</h1>
                        <p className="text-[11px] text-warm-400">
                            {visibleOnMap} hiển thị · {noCoords > 0 ? `${noCoords} chưa có tọa độ` : 'đủ tọa độ'}
                        </p>
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
                            {trees.map((tree) => (
                                <option key={tree.id} value={tree.id}>{tree.name}</option>
                            ))}
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
                        placeholder="Tìm địa điểm..."
                        className="w-full pl-9 pr-8 py-2 bg-warm-50 border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-500">
                            <XIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters((p) => !p)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex-shrink-0 ${showFilters ? 'bg-heritage-gold text-white border-heritage-gold' : 'bg-white text-warm-600 border-warm-200 hover:border-warm-300'
                        }`}
                >
                    <FilterIcon className="w-4 h-4" />
                    Lọc
                    <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                <button
                    onClick={fetchAddresses}
                    disabled={loading || !selectedTreeId}
                    className="p-2 rounded-lg border border-warm-200 text-warm-500 hover:bg-warm-50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filter bar */}
            {showFilters && (
                <div className="flex-shrink-0 bg-white border-b border-warm-100 px-6 py-3 flex flex-wrap gap-2 animate-fade-in">
                    {HERITAGE_ADDRESS_TYPES.map((type) => {
                        const active = activeFilters.has(type.key);
                        const count = stats[type.key] || 0;
                        return (
                            <button
                                key={type.key}
                                onClick={() => toggleFilter(type.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${active ? 'text-white border-transparent shadow-sm' : 'bg-white text-warm-400 border-warm-200 opacity-60'
                                    }`}
                                style={active ? { backgroundColor: type.color, borderColor: type.color } : {}}
                            >
                                <span>{type.icon}</span>
                                {type.label}
                                {count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20' : 'bg-warm-100'}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setActiveFilters(new Set(HERITAGE_ADDRESS_TYPES.map((t) => t.key)))}
                        className="px-3 py-1.5 rounded-lg border border-warm-200 text-xs text-warm-500 hover:bg-warm-50 transition-colors"
                    >
                        Chọn tất cả
                    </button>
                </div>
            )}

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <div className="w-72 flex-shrink-0 bg-white border-r border-warm-100 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-warm-100">
                        <p className="text-xs font-semibold text-warm-400 uppercase tracking-wider">
                            {filteredList.length} địa điểm
                        </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <LoaderIcon className="w-6 h-6 text-heritage-gold animate-spin" />
                            </div>
                        ) : !selectedTreeId ? (
                            <div className="text-center py-16 px-4">
                                <TreesIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                                <p className="text-sm text-warm-400">Chọn một gia phả để xem</p>
                            </div>
                        ) : filteredList.length === 0 ? (
                            <div className="text-center py-16 px-4">
                                <MapPinIcon className="w-10 h-10 mx-auto mb-3 text-warm-200" />
                                <p className="text-sm text-warm-400">Không có địa điểm nào</p>
                                <p className="text-xs text-warm-300 mt-1">Thêm địa chỉ di tích trong trang quản lý gia phả</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-warm-50">
                                {filteredList.map((addr) => {
                                    const typeInfo = getTypeInfo(addr.addressType || '');
                                    const isSelected = selectedAddress?.id === addr.id;
                                    const hasCoords = !!(addr.latitude && addr.longitude);
                                    return (
                                        <button
                                            key={addr.id}
                                            onClick={() => {
                                                setSelectedAddress(addr);
                                                if (hasCoords && gMapRef.current) {
                                                    gMapRef.current.panTo({ lat: addr.latitude!, lng: addr.longitude! });
                                                    gMapRef.current.setZoom(15);
                                                }
                                            }}
                                            className={`w-full text-left px-4 py-3.5 transition-colors hover:bg-warm-50 ${isSelected ? 'bg-heritage-gold/5 border-l-2 border-heritage-gold' : ''
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                                                    style={{ backgroundColor: `${typeInfo.color}18`, color: typeInfo.color }}
                                                >
                                                    {typeInfo.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-warm-800 truncate leading-tight">
                                                        {addr.formattedAddress || addr.addressLine || 'Chưa có địa chỉ'}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span
                                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                                                            style={{ backgroundColor: `${typeInfo.color}18`, color: typeInfo.color }}
                                                        >
                                                            {typeInfo.label}
                                                        </span>
                                                        {!hasCoords && (
                                                            <span className="text-[10px] text-warm-300 flex items-center gap-0.5">
                                                                <InfoIcon className="w-2.5 h-2.5" />
                                                                Chưa có tọa độ
                                                            </span>
                                                        )}
                                                    </div>
                                                    {addr.description && (
                                                        <p className="text-xs text-warm-400 mt-1 truncate">{addr.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    {mapsError ? (
                        <div className="flex items-center justify-center h-full bg-warm-50 text-warm-400 text-sm">
                            Không thể tải Google Maps. Kiểm tra API key.
                        </div>
                    ) : (
                        <div ref={mapRef} className="w-full h-full" />
                    )}

                    {(!mapsReady || (loading && addresses.length === 0)) && !mapsError && (
                        <div className="absolute inset-0 bg-warm-50/80 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
                                <p className="text-sm text-warm-400">Đang tải...</p>
                            </div>
                        </div>
                    )}

                    {/* Selected card */}
                    {selectedAddress && (
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-fade-in-up px-4 w-full max-w-sm">
                            <div className="bg-white rounded-2xl shadow-2xl border border-warm-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        {(() => {
                                            const t = getTypeInfo(selectedAddress.addressType || '');
                                            return (
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
                                                    style={{ backgroundColor: `${t.color}18`, color: t.color }}>
                                                    {t.icon}
                                                </div>
                                            );
                                        })()}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-warm-800 leading-tight">
                                                {selectedAddress.formattedAddress || selectedAddress.addressLine}
                                            </p>
                                            {(() => {
                                                const t = getTypeInfo(selectedAddress.addressType || '');
                                                return (
                                                    <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                                                        style={{ backgroundColor: `${t.color}18`, color: t.color }}>
                                                        {t.label}
                                                    </span>
                                                );
                                            })()}
                                            {selectedAddress.description && (
                                                <p className="text-xs text-warm-400 mt-1.5">{selectedAddress.description}</p>
                                            )}
                                            {(selectedAddress.ward || selectedAddress.district || selectedAddress.city) && (
                                                <p className="text-xs text-warm-300 mt-1">
                                                    {[selectedAddress.ward, selectedAddress.district, selectedAddress.city].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                            {selectedAddress.latitude && selectedAddress.longitude && (
                                                <p className="text-[10px] text-warm-300 mt-1 font-mono">
                                                    {selectedAddress.latitude.toFixed(5)}, {selectedAddress.longitude.toFixed(5)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedAddress(null)}
                                        className="p-1.5 rounded-lg text-warm-300 hover:bg-warm-100 transition-colors flex-shrink-0">
                                        <XIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                {selectedAddress.latitude && selectedAddress.longitude && (
                                    <a
                                        href={`https://www.google.com/maps?q=${selectedAddress.latitude},${selectedAddress.longitude}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-warm-800 text-cream text-xs font-medium rounded-lg hover:bg-warm-700 transition-colors"
                                    >
                                        <LayersIcon className="w-3.5 h-3.5" />
                                        Mở trong Google Maps
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Legend */}
                    {Object.keys(stats).length > 0 && (
                        <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl border border-warm-100 shadow-lg p-3 max-w-[180px]">
                            <p className="text-[10px] font-bold text-warm-600 uppercase tracking-wider mb-2">Chú thích</p>
                            <div className="space-y-1.5">
                                {HERITAGE_ADDRESS_TYPES.filter((t) => (stats[t.key] || 0) > 0).map((type) => (
                                    <div key={type.key} className="flex items-center gap-2">
                                        <span className="text-xs w-4 text-center">{type.icon}</span>
                                        <span className="text-[10px] text-warm-600 flex-1 truncate">{type.label}</span>
                                        <span className="text-[10px] text-warm-400 font-medium">{stats[type.key]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No-coords warning */}
                    {noCoords > 0 && (
                        <div className="absolute bottom-6 right-4 z-10 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                            <InfoIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-700">{noCoords} địa chỉ chưa có tọa độ</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}