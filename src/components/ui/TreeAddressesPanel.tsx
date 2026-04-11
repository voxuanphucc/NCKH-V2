import { useEffect, useState } from 'react';
import { XIcon, LoaderIcon, PlusIcon, PencilIcon, TrashIcon, MapPinIcon } from 'lucide-react';
import { addressService } from '../../services/addressService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import { AddAddressModal } from './AddAddressModal';
import { ConfirmationModal } from './ConfirmationModal';
import type { Address } from '../../types/address';

interface TreeAddressesPanelProps {
  treeId: string;
  onClose: () => void;
}

export function TreeAddressesPanel({ treeId, onClose }: TreeAddressesPanelProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressModalMode, setAddressModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAddressToEdit, setSelectedAddressToEdit] = useState<Address | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, [treeId]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressService.getTreeAddresses(treeId);
      if (res.success && res.data) {
        setAddresses(res.data);
      }
    } catch (error) {
      console.error('Error fetching tree addresses:', error);
      showErrorToast('Lỗi khi tải địa chỉ của cây gia phả');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setAddressModalMode('create');
    setSelectedAddressToEdit(undefined);
    setShowAddressModal(true);
  };

  const handleEditAddress = (address: Address) => {
    setAddressModalMode('edit');
    setSelectedAddressToEdit(address);
    setShowAddressModal(true);
  };

  const handleDeleteAddress = (address: Address) => {
    setAddressToDelete(address);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressToDelete) return;
    setDeletingAddress(true);
    try {
      const res = await addressService.deleteTreeAddress(treeId, addressToDelete.id);
      if (res.success) {
        showSuccessToast('Xóa địa chỉ thành công');
        setAddresses(addresses.filter((a) => a.id !== addressToDelete.id));
        setShowDeleteConfirm(false);
        setAddressToDelete(null);
      } else {
        showErrorToast(res.message || 'Xóa địa chỉ thất bại');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      showErrorToast('Có lỗi khi xóa địa chỉ');
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleAddressSuccess = (address: Address) => {
    if (addressModalMode === 'create') {
      setAddresses([...addresses, address]);
    } else {
      setAddresses(addresses.map((a) => (a.id === address.id ? address : a)));
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[480px] bg-white shadow-2xl border-l border-warm-200 flex flex-col animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-warm-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3">
          <MapPinIcon className="w-6 h-6 text-heritage-gold" />
          <div>
            <h2 className="font-heading text-lg font-bold text-warm-800">Địa chỉ của cây gia phả</h2>
            <p className="text-xs text-warm-400 mt-0.5">{addresses.length} địa chỉ</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white transition-colors text-warm-400 hover:text-warm-600"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderIcon className="w-8 h-8 text-heritage-gold animate-spin" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPinIcon className="w-12 h-12 mx-auto mb-3 text-warm-200" />
            <p className="text-sm text-warm-400">Chưa có địa chỉ nào</p>
            <button
              onClick={handleAddAddress}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-heritage-gold text-white text-sm font-medium rounded-lg hover:bg-heritage-gold/90 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Thêm địa chỉ
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className="p-4 bg-warm-50 rounded-xl border border-warm-100 hover:border-warm-200 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-warm-800">
                      {addr.formattedAddress ||
                        `${addr.addressLine}, ${addr.ward}, ${addr.district}, ${addr.city}`}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {addr.addressType && (
                        <span className="px-2 py-0.5 bg-warm-100 rounded-md text-xs text-warm-600">
                          {addr.addressTypeDescription}
                        </span>
                      )}
                      {addr.isPrimary && (
                        <span className="px-2 py-0.5 bg-heritage-gold/10 text-heritage-gold text-xs font-medium rounded-md">
                          Chính
                        </span>
                      )}
                      {addr.fromDate && (
                        <span className="text-xs text-warm-400">
                          Từ {new Date(addr.fromDate).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                    {addr.description && (
                      <p className="text-xs text-warm-500 mt-2">{addr.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditAddress(addr)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(addr)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {addresses.length > 0 && (
        <div className="p-4 border-t border-warm-100 bg-warm-50">
          <button
            onClick={handleAddAddress}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-warm-200 rounded-lg text-sm text-warm-600 hover:border-warm-300 hover:text-warm-700 hover:bg-warm-100 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm địa chỉ mới
          </button>
        </div>
      )}

      {/* Address Modal */}
      <AddAddressModal
        isOpen={showAddressModal}
        mode={addressModalMode}
        address={selectedAddressToEdit}
        treeId={treeId}
        onClose={() => setShowAddressModal(false)}
        onSuccess={handleAddressSuccess}
      />

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        title="Xóa địa chỉ này?"
        message={`${addressToDelete?.formattedAddress || 'Địa chỉ này'} sẽ bị xóa vĩnh viễn.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDangerous
        isLoading={deletingAddress}
        onConfirm={handleConfirmDeleteAddress}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
