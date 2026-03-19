import { useEffect, useState } from 'react';
import { XIcon, LoaderIcon, SaveIcon } from 'lucide-react';
import { addressService } from '../../services/addressService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { Address, CreateAddressRequest } from '../../types/address';
import type { LookupItem } from '../../types/common';

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
  onSuccess
}: AddAddressModalProps) {
  const [addressTypes, setAddressTypes] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
  const [placeId, setPlaceId] = useState('');
  const [addressTypeId, setAddressTypeId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load address types
  useEffect(() => {
    if (isOpen && addressTypes.length === 0) {
      setLoading(true);
      lookupService
        .getAddressTypes()
        .then((res) => {
          if (res.success && res.data) {
            setAddressTypes(res.data);
          }
        })
        .catch((error) => {
          console.error('Error fetching address types:', error);
          showErrorToast('Lỗi khi tải loại địa chỉ');
        })
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
      setPlaceId(address.placeId || '');
      setFromDate(toDateInputValue(address.fromDate));
      setToDate(toDateInputValue(address.toDate));
      setIsPrimary(address.isPrimary || false);
      setDescription(address.description || '');
      // Find the address type ID from the name
      const type = addressTypes.find(
        (t) => t.name === address.addressType
      );
      if (type) {
        setAddressTypeId(type.id);
      }
    } else if (mode === 'create') {
      // Reset form for create
      setFormattedAddress('');
      setAddressLine('');
      setWard('');
      setDistrict('');
      setCity('');
      setProvince('');
      setCountry('');
      setLatitude('');
      setLongitude('');
      setPlaceId('');
      setAddressTypeId('');
      setFromDate('');
      setToDate('');
      setIsPrimary(false);
      setDescription('');
      setErrors({});
    }
  }, [mode, address, addressTypes, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formattedAddress.trim()) {
      newErrors.formattedAddress = 'Địa chỉ đầy đủ là bắt buộc';
    }
    if (!addressLine.trim()) {
      newErrors.addressLine = 'Số nhà/phố là bắt buộc';
    }
    if (!fromDate) {
      newErrors.fromDate = 'Ngày bắt đầu là bắt buộc';
    }
    if (!addressTypeId) {
      newErrors.addressTypeId = 'Loại địa chỉ là bắt buộc';
    }

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
        placeId,
        addressTypeId,
        fromDate: dateOnlyToIsoStart(fromDate),
        toDate: dateOnlyToIsoEnd(toDate),
        ...(isPersonAddress ? { isPrimary } : {}),
        description
      };

      let res;

      if (personId) {
        // Person address
        if (mode === 'create') {
          res = await addressService.addPersonAddress(treeId, personId, payload);
        } else if (address) {
          res = await addressService.updatePersonAddress(
            treeId,
            personId,
            address.id,
            payload
          );
        }
      } else {
        // Tree address
        if (mode === 'create') {
          res = await addressService.addTreeAddress(treeId, payload);
        } else if (address) {
          res = await addressService.updateTreeAddress(
            treeId,
            address.id,
            payload
          );
        }
      }

      if (res?.success && res.data) {
        showSuccessToast(
          mode === 'create' ? 'Thêm địa chỉ thành công' : 'Cập nhật địa chỉ thành công'
        );
        onSuccess(res.data);
        onClose();
      } else {
        showErrorToast(
          res?.message ||
            (mode === 'create' ? 'Thêm địa chỉ thất bại' : 'Cập nhật địa chỉ thất bại')
        );
      }
    } catch (error) {
      console.error('Error submitting address:', error);
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
              {/* Formatted Address */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Địa chỉ đầy đủ *
                </label>
                <input
                  type="text"
                  value={formattedAddress}
                  onChange={(e) => setFormattedAddress(e.target.value)}
                  placeholder="VD: 123 Nguyễn Huệ, Quận 1, TP HCM"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${
                    errors.formattedAddress ? 'border-red-300' : 'border-warm-200'
                  }`}
                />
                {errors.formattedAddress && (
                  <p className="text-xs text-red-500 mt-1">{errors.formattedAddress}</p>
                )}
              </div>

              {/* Address Line */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Số nhà/Phố *
                </label>
                <input
                  type="text"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  placeholder="VD: 123"
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${
                    errors.addressLine ? 'border-red-300' : 'border-warm-200'
                  }`}
                />
                {errors.addressLine && (
                  <p className="text-xs text-red-500 mt-1">{errors.addressLine}</p>
                )}
              </div>

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

              {/* Latitude, Longitude */}
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
                    placeholder="VD: 10.7769"
                    className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
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
                    placeholder="VD: 106.6869"
                    className="w-full px-2 py-1.5 bg-white border border-warm-200 rounded-lg text-xs text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
                  />
                </div>
              </div>

              {/* Address Type */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Loại địa chỉ *
                </label>
                <select
                  value={addressTypeId}
                  onChange={(e) => setAddressTypeId(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${
                    errors.addressTypeId ? 'border-red-300' : 'border-warm-200'
                  }`}
                >
                  <option value="">-- Chọn loại địa chỉ --</option>
                  {addressTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {errors.addressTypeId && (
                  <p className="text-xs text-red-500 mt-1">{errors.addressTypeId}</p>
                )}
              </div>

              {/* From Date */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Ngày bắt đầu *
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${
                    errors.fromDate ? 'border-red-300' : 'border-warm-200'
                  }`}
                />
                {errors.fromDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.fromDate}</p>
                )}
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

              {/* Place ID */}
              <div>
                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                  Place ID
                </label>
                <input
                  type="text"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  placeholder="VD: ChIJV4qKJr1HdDgR..."
                  className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors"
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

              {/* Is Primary Checkbox (Person only) */}
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
