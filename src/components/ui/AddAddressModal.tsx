import { useEffect, useRef, useState, useCallback } from 'react';
import {
  XIcon,
  LoaderIcon,
  SaveIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  MapIcon,
  XCircleIcon,
} from 'lucide-react';
import { addressService } from '../../services/addressService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { Address, CreateAddressRequest } from '../../types/address';
import type { LookupItem } from '../../types/common';

// ─── Đặt Google Maps API Key của bạn vào đây ────────────────────────────────
const GOOGLE_MAPS_API_KEY = 'AIzaSyD0qG3nvvKneWxx0cJJVaxEwQHMlO-tmKk';
// ─────────────────────────────────────────────────────────────────────────────

function toDateInputValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

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

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps?: () => void;
  }
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
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

interface AddAddressModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  address?: Address;
  treeId: string;
  personId?: string;
  onClose: () => void;
  onSuccess: (address: Address) => void;
}

export function AddAddressModal({
  isOpen,
  mode,
  address,
  treeId,
  personId,
  onClose,
  onSuccess,
}: AddAddressModalProps) {
  const [addressTypes, setAddressTypes] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsError, setMapsError] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // Form state
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
  const [isPrimary, setIsPrimary] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load address types
  useEffect(() => {
    if (isOpen && addressTypes.length === 0) {
      setLoading(true);
      lookupService
        .getAddressTypes()
        .then((res) => {
          if (res.success && res.data) setAddressTypes(res.data);
        })
        .catch(() => showErrorToast('Lỗi khi tải loại địa chỉ'))
        .finally(() => setLoading(false));
    }
  }, [isOpen, addressTypes.length]);

  // Pre-fill form when editing
  useEffect(() => {
    if (mode === 'edit' && address) {
      setFormattedAddress(address.formattedAddress || '');
      setAddressLine(address.addressLine || '');
      setWard(address.ward || '');
      setDistrict(address.district || '');
      setCity(address.city || '');
      setProvince(address.province || '');
      setCountry(address.country || '');
      setLatitude(address.latitude?.toString() || '');
      setLongitude(address.longitude?.toString() || '');
      setFromDate(toDateInputValue(address.fromDate));
      setToDate(toDateInputValue(address.toDate));
      setIsPrimary(address.isPrimary || false);
      setDescription(address.description || '');
      const type = addressTypes.find((t) => t.name === address.addressType);
      if (type) setAddressTypeId(type.id);
    } else if (mode === 'create') {
      setFormattedAddress('');
      setAddressLine('');
      setWard('');
      setDistrict('');
      setCity('');
      setProvince('');
      setCountry('');
      setLatitude('');
      setLongitude('');
      setAddressTypeId('');
      setFromDate('');
      setToDate('');
      setIsPrimary(false);
      setDescription('');
      setErrors({});
    }
  }, [mode, address, addressTypes, isOpen]);

  // Load Google Maps when map is opened
  useEffect(() => {
    if (!showMap) return;
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => setMapsLoaded(true))
      .catch(() => setMapsError(true));
  }, [showMap]);

  // Initialize map and autocomplete once loaded
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google) return;

    const defaultCenter = { lat: 16.0544, lng: 108.2022 }; // Đà Nẵng
    const initialLat = latitude ? parseFloat(latitude) : null;
    const initialLng = longitude ? parseFloat(longitude) : null;
    const center =
      initialLat && initialLng
        ? { lat: initialLat, lng: initialLng }
        : defaultCenter;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center,
      zoom: initialLat ? 15 : 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControlOptions: {
        position: window.google.maps.ControlPosition.RIGHT_CENTER,
      },
    });
    mapRef.current = map;

    const marker = new window.google.maps.Marker({
      map,
      draggable: true,
      position: initialLat && initialLng ? center : undefined,
      visible: !!(initialLat && initialLng),
    });
    markerRef.current = marker;

    // Drag marker → update coordinates
    marker.addListener('dragend', () => {
      const pos = marker.getPosition();
      if (pos) {
        setLatitude(pos.lat().toFixed(6));
        setLongitude(pos.lng().toFixed(6));
        reverseGeocode(pos.lat(), pos.lng());
      }
    });

    // Click map → move marker & update coordinates
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        marker.setPosition(e.latLng);
        marker.setVisible(true);
        setLatitude(e.latLng.lat().toFixed(6));
        setLongitude(e.latLng.lng().toFixed(6));
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      }
    });

    // Setup autocomplete on search input
    if (searchInputRef.current) {
      const ac = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { fields: ['geometry', 'address_components', 'formatted_address'] }
      );
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

        // Parse address components
        fillAddressFromComponents(
          place.address_components || [],
          place.formatted_address || ''
        );
      });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (mapsLoaded && showMap) {
      // Small delay to ensure DOM is ready
      setTimeout(initMap, 100);
    }
  }, [mapsLoaded, showMap, initMap]);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        fillAddressFromComponents(
          results[0].address_components,
          results[0].formatted_address
        );
      }
    });
  };

  const fillAddressFromComponents = (
    components: google.maps.GeocoderAddressComponent[],
    formatted: string
  ) => {
    setFormattedAddress(formatted);

    let streetNumber = '';
    let route = '';
    let wardVal = '';
    let districtVal = '';
    let cityVal = '';
    let provinceVal = '';
    let countryVal = '';

    for (const comp of components) {
      const types = comp.types;
      if (types.includes('street_number')) streetNumber = comp.long_name;
      else if (types.includes('route')) route = comp.long_name;
      else if (
        types.includes('sublocality_level_1') ||
        types.includes('sublocality')
      )
        wardVal = comp.long_name;
      else if (types.includes('administrative_area_level_3'))
        districtVal = comp.long_name;
      else if (
        types.includes('locality') ||
        types.includes('administrative_area_level_2')
      )
        cityVal = comp.long_name;
      else if (types.includes('administrative_area_level_1'))
        provinceVal = comp.long_name;
      else if (types.includes('country')) countryVal = comp.short_name;
    }

    if (streetNumber || route)
      setAddressLine([streetNumber, route].filter(Boolean).join(' '));
    if (wardVal) setWard(wardVal);
    if (districtVal) setDistrict(districtVal);
    if (cityVal) setCity(cityVal);
    if (provinceVal) setProvince(provinceVal);
    if (countryVal) setCountry(countryVal);
  };

  const handleToggleMap = () => {
    setShowMap((prev) => !prev);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formattedAddress.trim())
      newErrors.formattedAddress = 'Địa chỉ đầy đủ là bắt buộc';
    if (!addressTypeId) newErrors.addressTypeId = 'Loại địa chỉ là bắt buộc';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const isPersonAddress = !!personId;
      const payload: CreateAddressRequest = {
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
        ...(isPersonAddress ? { isPrimary } : {}),
        description,
      };

      let res;
      if (personId) {
        res =
          mode === 'create'
            ? await addressService.addPersonAddress(treeId, personId, payload)
            : address
              ? await addressService.updatePersonAddress(
                treeId,
                personId,
                address.id,
                payload
              )
              : undefined;
      } else {
        res =
          mode === 'create'
            ? await addressService.addTreeAddress(treeId, payload)
            : address
              ? await addressService.updateTreeAddress(
                treeId,
                address.id,
                payload
              )
              : undefined;
      }

      if (res?.success && res.data) {
        showSuccessToast(
          mode === 'create'
            ? 'Thêm địa chỉ thành công'
            : 'Cập nhật địa chỉ thành công'
        );
        onSuccess(res.data);
        onClose();
      } else {
        showErrorToast(
          res?.message ||
          (mode === 'create'
            ? 'Thêm địa chỉ thất bại'
            : 'Cập nhật địa chỉ thất bại')
        );
      }
    } catch {
      showErrorToast('Có lỗi khi lưu địa chỉ');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-100">
          <h2 className="font-heading text-lg font-bold text-warm-800">
            {mode === 'create' ? 'Thêm địa chỉ mới' : 'Cập nhật địa chỉ'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-warm-100 transition-colors text-warm-400 hover:text-warm-600"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoaderIcon className="w-6 h-6 text-heritage-gold animate-spin" />
            </div>
          ) : (
            <>
              {/* ── Google Map Toggle ── */}
              <div>
                <button
                  type="button"
                  onClick={handleToggleMap}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-warm-300 text-warm-600 hover:border-heritage-gold hover:text-heritage-gold hover:bg-heritage-gold/5 transition-all text-sm font-medium"
                >
                  <MapIcon className="w-4 h-4" />
                  {showMap ? 'Ẩn bản đồ' : 'Chọn vị trí trên bản đồ'}
                  {showMap ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>

                {/* Map Panel */}
                {showMap && (
                  <div className="mt-3 rounded-xl overflow-hidden border border-warm-200 shadow-sm">
                    {/* Search inside map */}
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
              </div>

              {/* ── Tọa độ (hiển thị inline khi có giá trị hoặc khi map mở) ── */}
              {(showMap || latitude || longitude) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Vĩ độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="VD: 16.0544"
                      className="w-full px-2 py-1.5 bg-warm-50 border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-warm-500 mb-1">
                      Kinh độ
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="VD: 108.2022"
                      className="w-full px-2 py-1.5 bg-warm-50 border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* ── Địa chỉ đầy đủ (bắt buộc) ── */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Địa chỉ đầy đủ *
                </label>
                <input
                  type="text"
                  value={formattedAddress}
                  onChange={(e) => setFormattedAddress(e.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP HCM"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.formattedAddress
                    ? 'border-red-300'
                    : 'border-warm-200'
                    }`}
                />
                {errors.formattedAddress && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.formattedAddress}
                  </p>
                )}
              </div>

              {/* ── Số nhà/Phố (bắt buộc) ── */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Số nhà/Phố
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.addressLine ? 'border-red-300' : 'border-warm-200'
                    }`}
                />
                {errors.addressLine && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.addressLine}
                  </p>
                )}
              </div>

              {/* ── Loại địa chỉ (bắt buộc) ── */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Loại địa chỉ *
                </label>
                <select
                  value={addressTypeId}
                  onChange={(e) => setAddressTypeId(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.addressTypeId ? 'border-red-300' : 'border-warm-200'
                    }`}
                >
                  <option value="">-- Chọn loại địa chỉ --</option>
                  {addressTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.description}
                    </option>
                  ))}
                </select>
                {errors.addressTypeId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.addressTypeId}
                  </p>
                )}
              </div>

              {/* ── Ngày bắt đầu (bắt buộc) ── */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.fromDate ? 'border-red-300' : 'border-warm-200'
                    }`}
                />
                {errors.fromDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.fromDate}</p>
                )}
              </div>

              {/* ── Toggle thông tin không bắt buộc ── */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowOptional((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs text-warm-400 hover:text-warm-600 transition-colors py-1"
                >
                  {showOptional ? (
                    <ChevronUpIcon className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDownIcon className="w-3.5 h-3.5" />
                  )}
                  {showOptional
                    ? 'Ẩn thông tin thêm'
                    : 'Thêm thông tin chi tiết (tùy chọn)'}
                </button>

                {showOptional && (
                  <div className="mt-3 space-y-3 pt-3 border-t border-warm-100">
                    {/* Ward, District, City */}
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-warm-500 mb-1">
                          Phường/Xã
                        </label>
                        <input
                          type="text"
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          placeholder="Phường"
                          className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-warm-500 mb-1">
                          Quận/Huyện
                        </label>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="Quận"
                          className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-warm-500 mb-1">
                          Thành phố
                        </label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="TP"
                          className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                        />
                      </div>
                    </div>

                    {/* Province, Country */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-warm-500 mb-1">
                          Tỉnh/Thành
                        </label>
                        <input
                          type="text"
                          value={province}
                          onChange={(e) => setProvince(e.target.value)}
                          placeholder="Tỉnh"
                          className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-warm-500 mb-1">
                          Quốc gia
                        </label>
                        <input
                          type="text"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          placeholder="VN"
                          className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                        />
                      </div>
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="block text-xs font-medium text-warm-500 mb-1.5">
                        Ngày kết thúc
                      </label>
                      <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-medium text-warm-500 mb-1.5">
                        Ghi chú
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Thêm ghi chú..."
                        rows={2}
                        className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors resize-none"
                      />
                    </div>

                    {/* Is Primary (Person only) */}
                    {personId && (
                      <div className="flex items-center gap-2 p-3 bg-warm-50 rounded-lg">
                        <input
                          type="checkbox"
                          id="isPrimary"
                          checked={isPrimary}
                          onChange={(e) => setIsPrimary(e.target.checked)}
                          className="w-4 h-4 rounded border-warm-300 text-heritage-gold focus:ring-heritage-gold/30 cursor-pointer"
                        />
                        <label
                          htmlFor="isPrimary"
                          className="text-sm text-warm-700 cursor-pointer flex-1"
                        >
                          Đặt làm địa chỉ chính
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-warm-100 bg-warm-50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 py-2.5 bg-warm-100 text-warm-700 text-sm font-medium rounded-lg hover:bg-warm-200 transition-colors disabled:opacity-60"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="flex-1 py-2.5 bg-warm-800 text-cream text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <SaveIcon className="w-4 h-4" />
            )}
            {mode === 'create' ? 'Thêm' : 'Cập nhật'}
          </button>
        </div>
      </div>
    </div>
  );
}