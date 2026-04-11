import { useEffect, useRef, useState, useCallback } from 'react';
import {
    XIcon,
    LoaderIcon,
    CalendarDaysIcon,
    MapPinIcon,
    MapIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    XCircleIcon,
} from 'lucide-react';
import { eventService } from '../../services/eventService';
import { addressService } from '../../services/addressService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { TreeEvent, CreateEventRequest } from '../../types/event';
import type { Address } from '../../types/address';
import type { LookupItem } from '../../types/common';

// ─── Đặt Google Maps API Key của bạn vào đây ────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'AIzaSyD0qG3nvvKneWxx0cJJVaxEwQHMlO-tmKk';
// ─────────────────────────────────────────────────────────────────────────────

// ─── Google Maps loader ──────────────────────────────────────────────────────
declare global {
    interface Window {
        google: typeof google;
    }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) { resolve(); return; }
        const existing = document.getElementById('google-maps-script');
        if (existing) {
            existing.addEventListener('load', () => resolve());
            existing.addEventListener('error', reject);
            return;
        }
        const script = document.createElement('script');
        script.id = 'google-maps-script';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function dateOnlyToIsoStart(dateOnly?: string): string | undefined {
    if (!dateOnly) return undefined;
    const d = new Date(dateOnly);
    if (Number.isNaN(d.getTime())) return undefined;
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
}

function dateOnlyToIsoEnd(dateOnly?: string): string | undefined {
    if (!dateOnly) return undefined;
    const d = new Date(dateOnly);
    if (Number.isNaN(d.getTime())) return undefined;
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface AddEventModalProps {
    isOpen: boolean;
    treeId: string;
    personId: string;
    mode: 'create' | 'edit';
    event?: TreeEvent;
    onClose: () => void;
    onSuccess: (event: TreeEvent) => void;
}

// ─── Address mode ─────────────────────────────────────────────────────────────
type AddressMode = 'existing' | 'new';

export function CreatePersonEventModal({
    isOpen,
    treeId,
    personId,
    mode,
    event,
    onClose,
    onSuccess,
}: AddEventModalProps) {
    // ── Event fields ────────────────────────────────────────────────────────────
    const [eventName, setEventName] = useState(event?.name || '');
    const [description, setDescription] = useState(event?.description || '');
    const [startedAt, setStartedAt] = useState(
        event?.startedAt ? new Date(event.startedAt).toISOString().split('T')[0] : ''
    );
    const [endedAt, setEndedAt] = useState(
        event?.endedAt ? new Date(event.endedAt).toISOString().split('T')[0] : ''
    );
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [eventTypes, setEventTypes] = useState<LookupItem[]>([]);
    const [eventTypeId, setEventTypeId] = useState('');
    // ── Address mode ────────────────────────────────────────────────────────────
    const [addressMode, setAddressMode] = useState<AddressMode>('existing');

    // ── Existing address ────────────────────────────────────────────────────────
    const [treeAddresses, setTreeAddresses] = useState<Address[]>([]);
    const [addressId, setAddressId] = useState('');

    // ── New address fields ──────────────────────────────────────────────────────
    const [addressTypes, setAddressTypes] = useState<LookupItem[]>([]);
    const [addressTypesLoaded, setAddressTypesLoaded] = useState(false);

    const [formattedAddress, setFormattedAddress] = useState('');
    const [addressLine, setAddressLine] = useState('');
    const [ward, setWard] = useState('');
    const [district, setDistrict] = useState('');
    const [city, setCity] = useState('');
    const [province, setProvince] = useState('');
    const [country, setCountry] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [addressTypeId, setAddressTypeId] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [addrDescription, setAddrDescription] = useState('');
    const [showOptional, setShowOptional] = useState(false);

    // ── Map state ───────────────────────────────────────────────────────────────
    const [showMap, setShowMap] = useState(false);
    const [mapsLoaded, setMapsLoaded] = useState(false);
    const [mapsError, setMapsError] = useState(false);
    const [mapSearchQuery, setMapSearchQuery] = useState('');

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    // ── Load existing addresses ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;

        lookupService.getEventTypes()
            .then(res => {
                if (res.success && res.data) {
                    setEventTypes(res.data);
                }
            })
            .catch(() => showErrorToast('Không thể tải loại sự kiện'));
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        addressService.getTreeAddresses(treeId)
            .then(res => {
                if (res.success && res.data) {
                    setTreeAddresses(res.data);
                }
            })
            .catch(() => showErrorToast('Không thể tải danh sách địa chỉ'));
    }, [isOpen, treeId]);

    // ── Load address types when switching to new address mode ────────────────────
    useEffect(() => {
        if (addressMode !== 'new' || addressTypesLoaded) return;
        lookupService
            .getAddressTypes()
            .then((res) => {
                if (res.success && res.data) {
                    setAddressTypes(res.data);
                    setAddressTypesLoaded(true);
                }
            })
            .catch(() => showErrorToast('Lỗi khi tải loại địa chỉ'));
    }, [addressMode, addressTypesLoaded]);

    // ── Load Google Maps when map panel opened ───────────────────────────────────
    useEffect(() => {
        if (!showMap) return;
        loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
            .then(() => setMapsLoaded(true))
            .catch(() => setMapsError(true));
    }, [showMap]);

    // ── Init map ──────────────────────────────────────────────────────────────────
    const initMap = useCallback(() => {
        if (!mapContainerRef.current || !window.google) return;

        const defaultCenter = { lat: 16.0544, lng: 108.2022 }; // Đà Nẵng
        const initialLat = latitude ? parseFloat(latitude) : null;
        const initialLng = longitude ? parseFloat(longitude) : null;
        const center =
            initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter;

        const map = new window.google.maps.Map(mapContainerRef.current, {
            center,
            zoom: initialLat ? 15 : 12,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_CENTER },
        });
        mapRef.current = map;

        const marker = new window.google.maps.Marker({
            map,
            draggable: true,
            position: initialLat && initialLng ? center : undefined,
            visible: !!(initialLat && initialLng),
        });
        markerRef.current = marker;

        marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            if (pos) {
                setLatitude(pos.lat().toFixed(6));
                setLongitude(pos.lng().toFixed(6));
                reverseGeocode(pos.lat(), pos.lng());
            }
        });

        map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
                marker.setPosition(e.latLng);
                marker.setVisible(true);
                setLatitude(e.latLng.lat().toFixed(6));
                setLongitude(e.latLng.lng().toFixed(6));
                reverseGeocode(e.latLng.lat(), e.latLng.lng());
            }
        });

        if (searchInputRef.current) {
            const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
                fields: ['geometry', 'address_components', 'formatted_address'],
            });
            autocompleteRef.current = ac;

            ac.addListener('place_changed', () => {
                const place = ac.getPlace();
                if (!place.geometry?.location) return;
                const loc = place.geometry.location;
                map.setCenter(loc);
                map.setZoom(16);
                marker.setPosition(loc);
                marker.setVisible(true);
                setLatitude(loc.lat().toFixed(6));
                setLongitude(loc.lng().toFixed(6));
                fillAddressFromComponents(place.address_components || [], place.formatted_address || '');
            });
        }
    }, [latitude, longitude]);

    useEffect(() => {
        if (mapsLoaded && showMap) {
            setTimeout(initMap, 100);
        }
    }, [mapsLoaded, showMap, initMap]);

    const reverseGeocode = (lat: number, lng: number) => {
        if (!window.google) return;
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results[0]) {
                fillAddressFromComponents(results[0].address_components, results[0].formatted_address);
            }
        });
    };

    const fillAddressFromComponents = (
        components: google.maps.GeocoderAddressComponent[],
        formatted: string
    ) => {
        setFormattedAddress(formatted);
        let streetNumber = '', route = '', wardVal = '', districtVal = '',
            cityVal = '', provinceVal = '', countryVal = '';

        for (const comp of components) {
            const types = comp.types;
            if (types.includes('street_number')) streetNumber = comp.long_name;
            else if (types.includes('route')) route = comp.long_name;
            else if (types.includes('sublocality_level_1') || types.includes('sublocality')) wardVal = comp.long_name;
            else if (types.includes('administrative_area_level_3')) districtVal = comp.long_name;
            else if (types.includes('locality') || types.includes('administrative_area_level_2')) cityVal = comp.long_name;
            else if (types.includes('administrative_area_level_1')) provinceVal = comp.long_name;
            else if (types.includes('country')) countryVal = comp.short_name;
        }

        if (streetNumber || route) setAddressLine([streetNumber, route].filter(Boolean).join(' '));
        if (wardVal) setWard(wardVal);
        if (districtVal) setDistrict(districtVal);
        if (cityVal) setCity(cityVal);
        if (provinceVal) setProvince(provinceVal);
        if (countryVal) setCountry(countryVal);
    };

    // ── Validation ────────────────────────────────────────────────────────────────
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!eventName.trim()) newErrors.eventName = 'Tên sự kiện là bắt buộc';
        if (!eventTypeId) newErrors.eventTypeId = 'Loại sự kiện là bắt buộc';
        if (!startedAt) newErrors.startedAt = 'Ngày bắt đầu là bắt buộc';

        if (addressMode === 'new') {
            if (!formattedAddress.trim()) newErrors.formattedAddress = 'Địa chỉ đầy đủ là bắt buộc';
            if (!addressTypeId) newErrors.addressTypeId = 'Loại địa chỉ là bắt buộc';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ── Submit ────────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const startDate = new Date(startedAt);
            startDate.setHours(0, 0, 0, 0);
            const endDate = endedAt ? new Date(endedAt) : null;
            if (endDate) endDate.setHours(23, 59, 59, 999);

            // Step 1: Create new address if needed
            let resolvedAddressId: string | undefined = addressId || undefined;

            if (addressMode === 'new' && formattedAddress.trim()) {
                const addrPayload = {
                    formattedAddress,
                    addressLine,
                    ward,
                    district,
                    city,
                    province,
                    country,
                    latitude: latitude ? parseFloat(latitude) : undefined,
                    longitude: longitude ? parseFloat(longitude) : undefined,
                    addressTypeId,
                    fromDate: dateOnlyToIsoStart(fromDate),
                    toDate: dateOnlyToIsoEnd(toDate),
                    description: addrDescription,
                };

                const addrRes = await addressService.addTreeAddress(treeId, addrPayload);
                if (addrRes.success && addrRes.data) {
                    resolvedAddressId = addrRes.data.id;
                } else {
                    showErrorToast(addrRes.message || 'Không thể tạo địa chỉ mới');
                    return;
                }
            }

            // Step 2: Create / update event
            const payload = {
                name: eventName,
                description,
                startedAt: startDate.toISOString(),
                endedAt: endDate ? endDate.toISOString() : startDate.toISOString(),

                personId, // ✅ từ props
                eventTypeId,

                addressId: resolvedAddressId,
            };

            const res =
                mode === 'edit' && event
                    ? await eventService.updatePersonEvent(treeId, event.id, payload) // nếu có
                    : await eventService.createPersonEvent(treeId, payload);
            if (res.success) {
                showSuccessToast(mode === 'create' ? 'Tạo sự kiện thành công' : 'Cập nhật sự kiện thành công');
                onSuccess(res.data);
                handleClose();
            }
        } catch (err: unknown) {
            showErrorToast(err instanceof Error ? err.message : 'Không thể lưu sự kiện');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEventName(''); setDescription(''); setStartedAt(''); setEndedAt('');
        setAddressId(''); setAddressMode('existing');
        setFormattedAddress(''); setAddressLine(''); setWard(''); setDistrict('');
        setCity(''); setProvince(''); setCountry(''); setLatitude(''); setLongitude('');
        setAddressTypeId(''); setFromDate(''); setToDate(''); setAddrDescription('');
        setShowMap(false); setShowOptional(false); setMapSearchQuery('');
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-warm-900/50 animate-fade-in" onClick={handleClose} />

            <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in-up">

                {/* ── Header ──────────────────────────────────────────────────────────── */}
                <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-6 border-b border-warm-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-heritage-gold/10 flex items-center justify-center">
                            <CalendarDaysIcon className="w-5 h-5 text-heritage-gold" />
                        </div>
                        <div>
                            <h2 className="font-heading text-lg font-semibold text-warm-800">
                                {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật sự kiện'}
                            </h2>
                            <p className="text-xs text-warm-400">Quản lý sự kiện trong cây gia phả</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-warm-400 hover:bg-warm-100 transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* ── Form ────────────────────────────────────────────────────────────── */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Event Name */}
                    <div>
                        <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                            Tên sự kiện
                        </label>
                        <input
                            type="text"
                            value={eventName}
                            onChange={(e) => setEventName(e.target.value)}
                            placeholder="VD: Lễ cưới, sinh nhật, ..."
                            className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${errors.eventName ? 'border-red-300' : 'border-warm-200'}`}
                        />
                        {errors.eventName && <p className="text-xs text-red-500 mt-1">{errors.eventName}</p>}
                    </div>

                    {/* Event Type */}
                    <div>
                        <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                            Loại sự kiện *
                        </label>
                        <select
                            value={eventTypeId}
                            onChange={(e) => setEventTypeId(e.target.value)}
                            className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 
    ${errors.eventTypeId ? 'border-red-300' : 'border-warm-200'}`}
                        >
                            <option value="">-- Chọn loại sự kiện --</option>
                            {eventTypes.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.description}
                                </option>
                            ))}
                        </select>
                        {errors.eventTypeId && <p className="text-xs text-red-500 mt-1">{errors.eventTypeId}</p>}
                    </div>


                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                            Mô tả
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả chi tiết về sự kiện này..."
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all resize-none"
                        />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="date"
                                value={startedAt}
                                onChange={(e) => setStartedAt(e.target.value)}
                                className={`w-full px-4 py-3 bg-white border rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all ${errors.startedAt ? 'border-red-300' : 'border-warm-200'}`}
                            />
                            {errors.startedAt && <p className="text-xs text-red-500 mt-1">{errors.startedAt}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider mb-2">
                                Ngày kết thúc
                            </label>
                            <input
                                type="date"
                                value={endedAt}
                                onChange={(e) => setEndedAt(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                            />
                        </div>
                    </div>

                    {/* ── Address Section ─────────────────────────────────────────────── */}
                    <div className="space-y-3">
                        <label className="block text-xs font-semibold text-warm-500 uppercase tracking-wider">
                            Địa điểm
                        </label>

                        {/* Toggle tabs */}
                        <div className="flex rounded-xl border border-warm-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setAddressMode('existing')}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${addressMode === 'existing'
                                    ? 'bg-heritage-gold text-white'
                                    : 'bg-white text-warm-500 hover:bg-warm-50'
                                    }`}
                            >
                                Chọn địa chỉ có sẵn
                            </button>
                            <button
                                type="button"
                                onClick={() => setAddressMode('new')}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors border-l border-warm-200 ${addressMode === 'new'
                                    ? 'bg-heritage-gold text-white'
                                    : 'bg-white text-warm-500 hover:bg-warm-50'
                                    }`}
                            >
                                Địa chỉ mới
                            </button>
                        </div>

                        {/* ── Existing address ──────────────────────────────────────────── */}
                        {addressMode === 'existing' && (
                            <select
                                value={addressId}
                                onChange={(e) => setAddressId(e.target.value)}
                                className="w-full px-4 py-3 bg-white border border-warm-200 rounded-xl text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-all"
                            >
                                <option value="">-- Không chọn --</option>
                                {treeAddresses.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.formattedAddress || a.addressLine}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* ── New address ───────────────────────────────────────────────── */}
                        {addressMode === 'new' && (
                            <div className="space-y-4 p-4 bg-warm-50 rounded-xl border border-warm-100">

                                {/* Map toggle */}
                                <button
                                    type="button"
                                    onClick={() => setShowMap((p) => !p)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-warm-300 text-warm-600 hover:border-heritage-gold hover:text-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-medium"
                                >
                                    <MapIcon className="w-4 h-4" />
                                    {showMap ? 'Ẩn bản đồ' : 'Chọn vị trí trên bản đồ'}
                                    {showMap ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                </button>

                                {/* Map panel */}
                                {showMap && (
                                    <div className="rounded-xl overflow-hidden border border-warm-200 shadow-sm">
                                        <div className="p-2 bg-warm-50 border-b border-warm-100">
                                            <div className="relative">
                                                <MapPinIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400 pointer-events-none" />
                                                <input
                                                    ref={searchInputRef}
                                                    type="text"
                                                    value={mapSearchQuery}
                                                    onChange={(e) => setMapSearchQuery(e.target.value)}
                                                    placeholder="Tìm kiếm địa điểm..."
                                                    className="w-full pl-8 pr-8 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold"
                                                />
                                                {mapSearchQuery && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setMapSearchQuery('')}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-warm-300 hover:text-warm-500"
                                                    >
                                                        <XCircleIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {mapsError ? (
                                            <div className="flex items-center justify-center h-48 bg-warm-50 text-warm-400 text-sm">
                                                Không thể tải Google Maps. Kiểm tra API key.
                                            </div>
                                        ) : !mapsLoaded ? (
                                            <div className="flex items-center justify-center h-48 bg-warm-50">
                                                <LoaderIcon className="w-6 h-6 text-heritage-gold animate-spin" />
                                            </div>
                                        ) : (
                                            <div ref={mapContainerRef} className="w-full h-56" />
                                        )}

                                        <p className="px-3 py-1.5 text-[11px] text-warm-400 bg-warm-50 border-t border-warm-100">
                                            Click vào bản đồ hoặc kéo ghim để chọn vị trí
                                        </p>
                                    </div>
                                )}

                                {/* Coordinates (shown when map open or filled) */}
                                {(showMap || latitude || longitude) && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-warm-500 mb-1">Vĩ độ</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={latitude}
                                                onChange={(e) => setLatitude(e.target.value)}
                                                placeholder="VD: 16.0544"
                                                className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-warm-500 mb-1">Kinh độ</label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={longitude}
                                                onChange={(e) => setLongitude(e.target.value)}
                                                placeholder="VD: 108.2022"
                                                className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Formatted address (required) */}
                                <div>
                                    <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                        Địa chỉ đầy đủ *
                                    </label>
                                    <input
                                        type="text"
                                        value={formattedAddress}
                                        onChange={(e) => setFormattedAddress(e.target.value)}
                                        placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP HCM"
                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.formattedAddress ? 'border-red-300' : 'border-warm-200'}`}
                                    />
                                    {errors.formattedAddress && <p className="text-xs text-red-500 mt-1">{errors.formattedAddress}</p>}
                                </div>

                                {/* Address line (required) */}
                                <div>
                                    <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                        Số nhà/Phố
                                    </label>
                                    <input
                                        type="text"
                                        value={addressLine}
                                        onChange={(e) => setAddressLine(e.target.value)}
                                        placeholder="VD: 123 Nguyễn Huệ"
                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.addressLine ? 'border-red-300' : 'border-warm-200'}`}
                                    />
                                    {errors.addressLine && <p className="text-xs text-red-500 mt-1">{errors.addressLine}</p>}
                                </div>

                                {/* Address type (required) */}
                                <div>
                                    <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                        Loại địa chỉ *
                                    </label>
                                    <select
                                        value={addressTypeId}
                                        onChange={(e) => setAddressTypeId(e.target.value)}
                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.addressTypeId ? 'border-red-300' : 'border-warm-200'}`}
                                    >
                                        <option value="">-- Chọn loại địa chỉ --</option>
                                        {addressTypes.map((type) => (
                                            <option key={type.id} value={type.id}>{type.description}</option>
                                        ))}
                                    </select>
                                    {errors.addressTypeId && <p className="text-xs text-red-500 mt-1">{errors.addressTypeId}</p>}
                                </div>

                                {/* From date (required) */}
                                <div>
                                    <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                        Ngày bắt đầu (địa chỉ)
                                    </label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.addrFromDate ? 'border-red-300' : 'border-warm-200'}`}
                                    />
                                    {errors.addrFromDate && <p className="text-xs text-red-500 mt-1">{errors.addrFromDate}</p>}
                                </div>

                                {/* Optional extra fields */}
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setShowOptional((p) => !p)}
                                        className="flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors py-1"
                                    >
                                        {showOptional
                                            ? <ChevronUpIcon className="w-3.5 h-3.5" />
                                            : <ChevronDownIcon className="w-3.5 h-3.5" />}
                                        {showOptional ? 'Ẩn thông tin thêm' : 'Thêm thông tin chi tiết (tùy chọn)'}
                                    </button>

                                    {showOptional && (
                                        <div className="mt-3 space-y-3 pt-3 border-t border-warm-100">
                                            {/* Ward, District, City */}
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { label: 'Phường/Xã', value: ward, set: setWard, placeholder: 'Phường' },
                                                    { label: 'Quận/Huyện', value: district, set: setDistrict, placeholder: 'Quận' },
                                                    { label: 'Thành phố', value: city, set: setCity, placeholder: 'TP' },
                                                ].map(({ label, value, set, placeholder }) => (
                                                    <div key={label}>
                                                        <label className="block text-xs font-medium text-warm-500 mb-1">{label}</label>
                                                        <input
                                                            type="text"
                                                            value={value}
                                                            onChange={(e) => set(e.target.value)}
                                                            placeholder={placeholder}
                                                            className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Province, Country */}
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    { label: 'Tỉnh/Thành', value: province, set: setProvince, placeholder: 'Tỉnh' },
                                                    { label: 'Quốc gia', value: country, set: setCountry, placeholder: 'VN' },
                                                ].map(({ label, value, set, placeholder }) => (
                                                    <div key={label}>
                                                        <label className="block text-xs font-medium text-warm-500 mb-1">{label}</label>
                                                        <input
                                                            type="text"
                                                            value={value}
                                                            onChange={(e) => set(e.target.value)}
                                                            placeholder={placeholder}
                                                            className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            {/* To Date */}
                                            <div>
                                                <label className="block text-xs font-medium text-warm-500 mb-1.5">Ngày kết thúc (địa chỉ)</label>
                                                <input
                                                    type="date"
                                                    value={toDate}
                                                    onChange={(e) => setToDate(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                                                />
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-xs font-medium text-warm-500 mb-1.5">Ghi chú địa chỉ</label>
                                                <textarea
                                                    value={addrDescription}
                                                    onChange={(e) => setAddrDescription(e.target.value)}
                                                    placeholder="Thêm ghi chú..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors resize-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info tip */}
                    <div className="bg-heritage-gold/5 rounded-xl p-3 border border-heritage-gold/10">
                        <p className="text-xs text-warm-600">
                            💡 Sau khi tạo sự kiện, bạn có thể thêm các thành viên tham gia từ tab sự kiện.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 bg-warm-100 text-warm-700 font-medium rounded-xl hover:bg-warm-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 bg-heritage-gold text-white font-medium rounded-xl hover:bg-heritage-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading
                                ? <LoaderIcon className="w-4 h-4 animate-spin" />
                                : <CalendarDaysIcon className="w-4 h-4" />}
                            {mode === 'create' ? 'Tạo sự kiện' : 'Cập nhật'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}