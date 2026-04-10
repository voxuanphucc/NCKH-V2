import { useEffect, useRef, useState } from 'react';
import {
    XIcon,
    LoaderIcon,
    UploadIcon,
    ImageIcon,
    FileIcon,
    VideoIcon,
} from 'lucide-react';
import { mediaService } from '../../services/mediaService';
import { lookupService } from '../../services/lookupService';
import { showSuccessToast, showErrorToast } from '../../utils/validation';
import type { MediaFile } from '../../types/media';
import type { LookupItem } from '../../types/common';

interface UploadMediaModalProps {
    isOpen: boolean;
    treeId: string;
    personId?: string; // nếu có → upload cho person, không có → upload cho tree
    onClose: () => void;
    onSuccess: (file: MediaFile) => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function UploadMediaModal({
    isOpen,
    treeId,
    personId,
    onClose,
    onSuccess,
}: UploadMediaModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [mediaFileTypes, setMediaFileTypes] = useState<LookupItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [mediaFileTypeId, setMediaFileTypeId] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Load media file types
    useEffect(() => {
        if (isOpen && mediaFileTypes.length === 0) {
            setLoading(true);
            lookupService
                .getMediaFileTypes()
                .then((res) => {
                    if (res.success && res.data) setMediaFileTypes(res.data as LookupItem[]);
                })
                .catch(() => showErrorToast('Lỗi khi tải loại media'))
                .finally(() => setLoading(false));
        }
    }, [isOpen, mediaFileTypes.length]);

    // Reset on open/close
    useEffect(() => {
        if (isOpen) {
            setSelectedFile(null);
            setPreviewUrl(null);
            setMediaFileTypeId('');
            setDescription('');
            setErrors({});
        }
    }, [isOpen]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setErrors((prev) => ({ ...prev, file: '' }));

        // Preview nếu là ảnh
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setPreviewUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }

        // Auto-detect loại dựa trên MIME
        if (mediaFileTypes.length > 0) {
            let typeName = '';
            if (file.type.startsWith('image/')) typeName = 'IMAGE';
            else if (file.type.startsWith('video/')) typeName = 'VIDEO';
            else typeName = 'DOCUMENT';

            const matched = mediaFileTypes.find(
                (t) => t.name?.toUpperCase() === typeName
            );
            if (matched) setMediaFileTypeId(matched.id);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!selectedFile) newErrors.file = 'Vui lòng chọn file';
        if (!mediaFileTypeId) newErrors.mediaFileTypeId = 'Vui lòng chọn loại media';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || !selectedFile) return;
        setSubmitting(true);
        try {
            let res;
            if (personId) {
                res = await mediaService.uploadPersonMedia(
                    treeId,
                    personId,
                    selectedFile,
                    mediaFileTypeId,
                    description || undefined
                );
            } else {
                res = await mediaService.uploadTreeMedia(
                    treeId,
                    selectedFile,
                    mediaFileTypeId,
                    description || undefined
                );
            }

            if (res?.success && res.data) {
                showSuccessToast('Upload thành công');
                onSuccess(res.data as MediaFile);
                onClose();
            } else {
                showErrorToast(res?.message || 'Upload thất bại');
            }
        } catch (err) {
            console.error(err);
            showErrorToast('Có lỗi khi upload file');
        } finally {
            setSubmitting(false);
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
        if (file.type.startsWith('video/')) return <VideoIcon className="w-8 h-8 text-purple-400" />;
        return <FileIcon className="w-8 h-8 text-warm-400" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-warm-100 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
                            <UploadIcon className="w-4 h-4 text-purple-500" />
                        </div>
                        <h2 className="font-heading text-lg font-bold text-warm-800">
                            Upload media
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-warm-100 transition-colors text-warm-400 hover:text-warm-600"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <LoaderIcon className="w-6 h-6 text-heritage-gold animate-spin" />
                        </div>
                    ) : (
                        <>
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${dragOver
                                        ? 'border-heritage-gold bg-heritage-gold/5'
                                        : errors.file
                                            ? 'border-red-300 bg-red-50'
                                            : 'border-warm-200 bg-warm-50 hover:border-warm-300 hover:bg-warm-100'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,video/*,.pdf,.doc,.docx"
                                    onChange={handleInputChange}
                                    className="hidden"
                                />

                                {selectedFile ? (
                                    <div className="p-4 flex items-center gap-4">
                                        {/* Preview hoặc icon */}
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="preview"
                                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-warm-200"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-warm-200">
                                                {getFileIcon(selectedFile)}
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-warm-800 truncate">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-xs text-warm-400 mt-0.5">
                                                {formatBytes(selectedFile.size)} · {selectedFile.type || 'unknown'}
                                            </p>
                                            <p className="text-xs text-heritage-gold mt-1">
                                                Nhấn để đổi file
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center">
                                        <UploadIcon className="w-10 h-10 mx-auto mb-3 text-warm-300" />
                                        <p className="text-sm font-medium text-warm-600">
                                            Kéo thả file vào đây
                                        </p>
                                        <p className="text-xs text-warm-400 mt-1">
                                            hoặc <span className="text-heritage-gold">nhấn để chọn file</span>
                                        </p>
                                        <p className="text-[10px] text-warm-300 mt-2">
                                            Hỗ trợ: JPG, PNG, GIF, MP4, PDF, DOC
                                        </p>
                                    </div>
                                )}
                            </div>
                            {errors.file && (
                                <p className="text-xs text-red-500 -mt-3">{errors.file}</p>
                            )}

                            {/* Loại media */}
                            <div>
                                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                    Loại media <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={mediaFileTypeId}
                                    onChange={(e) => setMediaFileTypeId(e.target.value)}
                                    className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-warm-800 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors ${errors.mediaFileTypeId ? 'border-red-300' : 'border-warm-200'
                                        }`}
                                >
                                    <option value="">-- Chọn loại media --</option>
                                    {mediaFileTypes.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.description || t.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.mediaFileTypeId && (
                                    <p className="text-xs text-red-500 mt-1">{errors.mediaFileTypeId}</p>
                                )}
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-xs font-medium text-warm-500 mb-1.5">
                                    Mô tả
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Thêm mô tả về file..."
                                    rows={2}
                                    className="w-full px-3 py-2 bg-white border border-warm-200 rounded-lg text-sm text-warm-800 placeholder-warm-300 focus:outline-none focus:ring-2 focus:ring-heritage-gold/30 focus:border-heritage-gold transition-colors resize-none"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-warm-100 bg-warm-50 flex-shrink-0 rounded-b-2xl">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="flex-1 py-2.5 bg-warm-100 text-warm-700 text-sm font-medium rounded-lg hover:bg-warm-200 transition-colors disabled:opacity-60"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || loading || !selectedFile}
                        className="flex-1 py-2.5 bg-warm-800 text-cream text-sm font-medium rounded-lg hover:bg-warm-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                        {submitting ? (
                            <LoaderIcon className="w-4 h-4 animate-spin" />
                        ) : (
                            <UploadIcon className="w-4 h-4" />
                        )}
                        {submitting ? 'Đang upload...' : 'Upload'}
                    </button>
                </div>
            </div>
        </div>
    );
}