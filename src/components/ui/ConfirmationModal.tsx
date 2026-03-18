import { useEffect } from 'react';
import { AlertCircleIcon, CheckIcon, XIcon } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in-up">
        {/* Header */}
        <div className={`p-6 border-b ${
          isDangerous ? 'border-red-100' : 'border-warm-100'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              isDangerous ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertCircleIcon className={`w-6 h-6 ${
                isDangerous ? 'text-red-600' : 'text-amber-600'
              }`} />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-warm-800">
                {title}
              </h2>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-warm-400 hover:text-warm-600 transition-colors disabled:opacity-50"
              aria-label="Đóng"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-warm-700 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="bg-warm-50 rounded-b-2xl px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg font-medium text-warm-700 bg-warm-100 hover:bg-warm-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-heritage-gold hover:bg-heritage-gold-light'
            }`}
          >
            {isLoading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckIcon className="w-4 h-4" />
                {confirmText}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
