import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Heart, 
  Info, 
  Sparkles, 
  Calendar, 
  User, 
  Plus, 
  X, 
  HardDrive,
  Eye,
  Link
} from 'lucide-react';
import { Photo } from '../types';

interface GalleryTabProps {
  photos: Photo[];
  onAddPhoto: (photoData: { imageUrl: string; caption: string; date: string }) => Promise<void>;
  onDeletePhoto: (id: string) => Promise<void>;
  currentUser: string;
  autoOpenUploadModal?: boolean;
  onResetAutoOpen?: () => void;
}

export default function GalleryTab({
  photos = [],
  onAddPhoto,
  onDeletePhoto,
  currentUser,
  autoOpenUploadModal,
  onResetAutoOpen
}: GalleryTabProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [randomMemoryQuote, setRandomMemoryQuote] = useState('');
  
  // Multi-file state
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string; date: string; sizeKB: number }[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Immersive Google Drive / Internet link upload
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [driveUrl, setDriveUrl] = useState('');

  // Helper to format Date locally to YYYY-MM-DD
  const formatDateLocal = (dateObj: Date): string => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to read file as DataURL (Base64)
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          resolve(e.target.result);
        } else {
          reject(new Error('Gagal membaca file'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  // Helper to parse Google Drive URLs to direct embeddable links
  const parseDriveUrl = (urlStr: string): string => {
    const url = urlStr.trim();
    if (!url) return '';
    // Match file ID from Google Drive share link
    const match = url.match(/(?:id=|\/d\/|\/file\/d\/)([a-zA-Z0-9_-]{25,})/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
    return url;
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Auto-open upload modal if triggered from Dashboard
  React.useEffect(() => {
    if (autoOpenUploadModal) {
      setShowUploadModal(true);
      if (onResetAutoOpen) {
        onResetAutoOpen();
      }
    }
  }, [autoOpenUploadModal]);

  // Storage estimation: soft limit of 50MB
  const STORAGE_LIMIT_MB = 50;
  
  // Calculate total database size of photos in megabytes
  const calculatePhotosSizeMB = () => {
    let totalBytes = 0;
    photos.forEach(p => {
      totalBytes += p.imageUrl.length;
    });
    // Base64 size to raw binary size conversion: length * 3/4
    const binaryBytes = totalBytes * 0.75;
    return binaryBytes / (1024 * 1024);
  };

  const currentSizeMB = calculatePhotosSizeMB();
  const storagePercentage = Math.min(100, Math.max(0.5, (currentSizeMB / STORAGE_LIMIT_MB) * 100));

  // Handle multiple files selection & convert to Base64
  const processFiles = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setErrorMessage('');
    const newSelectedFiles: { file: File; preview: string; date: string; sizeKB: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const sizeInMB = file.size / (1024 * 1024);
      if (sizeInMB > 12) {
        setErrorMessage(`File "${file.name}" (${sizeInMB.toFixed(1)} MB) melebihi batas 12 MB.`);
        continue;
      }

      try {
        const preview = await readFileAsDataURL(file);
        
        // Auto-detect photo date from file metadata lastModified (original capture date)
        let detectedDate = formatDateLocal(new Date());
        if (file.lastModified) {
          const lastMod = new Date(file.lastModified);
          if (!isNaN(lastMod.getTime())) {
            detectedDate = formatDateLocal(lastMod);
          }
        }

        newSelectedFiles.push({
          file,
          preview,
          date: detectedDate,
          sizeKB: Math.round(file.size / 1024)
        });
      } catch (err) {
        setErrorMessage('Gagal membaca beberapa file foto.');
      }
    }

    if (newSelectedFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-rose-400', 'bg-rose-50/50');
    }
  };

  const handleDragLeave = () => {
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-rose-400', 'bg-rose-50/50');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragLeave();
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (uploadType === 'file') {
      if (selectedFiles.length === 0) {
        setErrorMessage('Pilih atau seret foto yang ingin diupload terlebih dahulu.');
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress({ current: 0, total: selectedFiles.length });
        
        for (let i = 0; i < selectedFiles.length; i++) {
          const photoFile = selectedFiles[i];
          setUploadProgress({ current: i + 1, total: selectedFiles.length });
          
          await onAddPhoto({
            imageUrl: photoFile.preview,
            caption: '', // No caption as requested by the user
            date: photoFile.date
          });
        }
        
        // Reset form
        setSelectedFiles([]);
        setUploadProgress(null);
        setShowUploadModal(false);
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal menyimpan beberapa foto bersama.');
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    } else {
      if (!driveUrl.trim()) {
        setErrorMessage('Masukkan link Google Drive atau URL foto terlebih dahulu.');
        return;
      }
      const targetImageUrl = parseDriveUrl(driveUrl);

      try {
        setIsUploading(true);
        // Default to today for web URL
        const todayStr = formatDateLocal(new Date());
        await onAddPhoto({
          imageUrl: targetImageUrl,
          caption: '', // No caption as requested by the user
          date: todayStr
        });
        
        setDriveUrl('');
        setShowUploadModal(false);
      } catch (err: any) {
        setErrorMessage(err.message || 'Gagal menyimpan foto bersama.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Safe lossless download at original quality
  const handleDownload = (photo: Photo) => {
    const link = document.createElement('a');
    link.href = photo.imageUrl;
    
    // Attempt to extract extension from mime-type, fallback to png
    let ext = 'png';
    const match = photo.imageUrl.match(/^data:image\/(\w+);base64,/);
    if (match) {
      ext = match[1];
    }
    
    // Safe friendly filename
    const cleanCaption = photo.caption
      ? photo.caption.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : 'foto_bersama';
    
    link.download = `${photo.date}_${cleanCaption}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const CUTE_ROMANTIC_QUOTES = [
    "Ingat momen manis ini? Setiap detik bersamamu adalah bagian terindah dari hidupku! 💖",
    "Foto ini menyimpan tawa kita yang tak ternilai harganya. Terima kasih sudah selalu ada! 💕",
    "Aku jatuh cinta kepadamu setiap kali melihat senyumanmu di foto ini. Tetap bersama ya! 🌸",
    "Kenangan indah bersamamu selalu membuat hari-hariku jauh lebih cerah dan hangat! ☀️❤️",
    "Satu foto, sejuta rasa cinta. Bersamamu, semuanya terasa sempurna dan damai! 💑✨",
    "Momen ini begitu spesial, sama seperti dirimu yang selalu spesial di hatiku! 🥰🧸",
    "Mari terus mengukir kenangan manis lainnya dan menabung untuk masa depan kita! 💍🏡"
  ];

  const handleRandomMemory = () => {
    if (photos.length === 0) {
      alert('Belum ada foto di galeri untuk diputar. Yuk, unggah momen indah pertamamu dulu! 💕');
      return;
    }
    const randomIndex = Math.floor(Math.random() * photos.length);
    const selected = photos[randomIndex];
    
    // Pick a cute quote
    const randomQuote = CUTE_ROMANTIC_QUOTES[Math.floor(Math.random() * CUTE_ROMANTIC_QUOTES.length)];
    setRandomMemoryQuote(randomQuote);
    setSelectedPhoto(selected);
  };

  return (
    <div className="space-y-8 animate-fade-in" id="gallery-tab-root">
      
      {/* Dynamic Header with Info & Stats */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-100 shadow-xs flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-500 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black font-display text-gray-900">Galeri Foto Cinta 💖</h2>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed">
            Abadikan momen-momen manis dan berharga bersama <strong>{currentUser === 'Nibras' ? 'Zenita' : 'Nibras'}</strong> di sini. 
            Setiap kenangan disimpan dalam <strong>kualitas asli 100% tanpa kompresi</strong>, sehingga aman untuk didownload kapan saja dengan detail visual penuh!
          </p>
        </div>
        
        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            id="btn-random-memory"
            onClick={handleRandomMemory}
            className="w-full sm:w-auto px-5 py-3.5 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-bold rounded-2xl border border-rose-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Heart className="w-5 h-5 text-rose-500 fill-rose-400" />
            <span>Putar Kenangan Acak</span>
          </button>

          <button
            type="button"
            id="btn-open-upload-modal"
            onClick={() => {
              setShowUploadModal(true);
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Foto Baru</span>
          </button>
        </div>
      </div>

      {/* Info Box detailing storage details, limits and quality */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
              <Info className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-800">Berapa Kapasitas Upload?</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Setiap file foto mendukung hingga maksimal <strong>12 MB</strong>. Kapasitas penyimpanan total direkomendasikan hingga <strong>{STORAGE_LIMIT_MB} MB</strong> untuk memastikan kecepatan sinkronisasi data yang instan dan mulus antara perangkat kalian berdua.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-emerald-50 text-emerald-500 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-gray-800">Apakah Kualitas Berkurang?</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong>Sama sekali tidak!</strong> Foto disimpan dalam format raw base64. Saat didownload, file akan direkonstruksi byte-demi-byte sesuai aslinya tanpa melewati kompresi gambar apa pun. Foto Anda tetap jernih dan indah.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-rose-50 text-rose-500 rounded-lg">
                  <HardDrive className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-gray-800">Kapasitas Penyimpanan</h3>
              </div>
              <span className="text-xs font-mono font-bold text-rose-600">
                {currentSizeMB.toFixed(2)} / {STORAGE_LIMIT_MB} MB
              </span>
            </div>
            
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${storagePercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 italic flex items-center gap-1">
            <span>Terpakai sekitar {storagePercentage.toFixed(1)}% dari batas aman aplikasi</span>
          </div>
        </div>

      </div>

      {/* Photos Grid */}
      {photos.length === 0 ? (
        <div className="bg-white rounded-3xl py-16 px-4 border border-rose-50 shadow-2xs text-center space-y-4 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-rose-50 text-rose-400 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Camera className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-gray-800">Belum Ada Foto Terunggah</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Galeri masih kosong. Yuk, unggah foto liburan, makan malam, atau kenangan indah berdua sekarang!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl transition-all text-xs cursor-pointer"
          >
            Mulai Unggah Momen Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {photos.slice().reverse().map((photo) => (
            <div 
              key={photo.id}
              className="group bg-white rounded-2xl p-3 border border-gray-100 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-3 relative"
            >
              {/* Image Frame */}
              <div 
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-50 cursor-zoom-in"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.imageUrl} 
                  alt={photo.caption || 'Foto Bersama'} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Creator overlay badge */}
                <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                  <User className="w-3 h-3 text-rose-300" />
                  <span>{photo.addedBy}</span>
                </div>

                {/* Date overlay badge */}
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 shadow-sm">
                  <Calendar className="w-3 h-3" />
                  <span>{photo.date}</span>
                </div>

                {/* Quick view icon on hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="p-2.5 bg-white/90 rounded-full text-rose-500 shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Description and Action controls */}
              <div className="space-y-2 px-1">
                <p className="text-xs text-gray-700 font-medium line-clamp-2 h-8 leading-relaxed">
                  {photo.caption || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                </p>
                
                <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                  <button
                    type="button"
                    onClick={() => handleDownload(photo)}
                    className="p-1.5 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                    title="Download Kualitas Asli"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Apakah Anda yakin ingin menghapus foto kenangan ini?')) {
                        onDeletePhoto(photo.id);
                      }
                    }}
                    className="p-1.5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                    title="Hapus Kenangan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Photo Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-rose-50 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-rose-500 text-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                <h3 className="font-bold font-display">Kirim Foto Kenangan</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFiles([]);
                  setErrorMessage('');
                  setDriveUrl('');
                  setUploadType('file');
                }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector: Upload vs Google Drive */}
            <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
              <button
                type="button"
                onClick={() => {
                  setUploadType('file');
                  setErrorMessage('');
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadType === 'file'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Unggah File Foto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadType('link');
                  setErrorMessage('');
                }}
                className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  uploadType === 'link'
                    ? 'bg-white text-rose-600 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Link className="w-4 h-4 text-sky-500" />
                <span>Link Google Drive / Internet</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-grow">
              
              {errorMessage && (
                <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-semibold leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {uploadType === 'file' ? (
                /* Drag and Drop Zone / Photo Picker */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 block">Pilih File Foto</label>
                    {selectedFiles.length > 0 && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg font-bold border border-emerald-100 animate-pulse">
                        ✨ Tanggal Foto Otomatis Terdeteksi!
                      </span>
                    )}
                  </div>
                  
                  {selectedFiles.length > 0 ? (
                    <div className="space-y-4">
                      {/* Grid preview of selected photos */}
                      <div className="grid grid-cols-3 gap-2.5 max-h-[240px] overflow-y-auto p-1.5 border border-gray-100 rounded-2xl bg-gray-50/50">
                        {selectedFiles.map((fileObj, idx) => (
                          <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
                            <img 
                              src={fileObj.preview} 
                              alt="Pratinjau" 
                              className="w-full h-full object-cover"
                            />
                            {/* Auto detected date tag */}
                            <div className="absolute bottom-1 left-1 right-1 bg-black/65 backdrop-blur-3xs text-[8px] text-white font-mono px-1 py-0.5 rounded truncate text-center">
                              📅 {fileObj.date}
                            </div>
                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-md shadow-xs transition-colors cursor-pointer"
                              title="Hapus dari daftar"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add more button */}
                      <div className="flex justify-between items-center bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50">
                        <span className="text-xs font-bold text-rose-700">
                          🌟 {selectedFiles.length} foto siap dikirim sekaligus!
                        </span>
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 font-bold text-[10px] rounded-lg border border-rose-200 shadow-3xs cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Foto</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={dropZoneRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={triggerFileInput}
                      className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-rose-400 hover:bg-rose-50/10 transition-all cursor-pointer group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-gray-50 group-hover:bg-rose-50 group-hover:text-rose-500 text-gray-400 rounded-xl flex items-center justify-center mx-auto transition-colors mb-3">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-gray-700">Klik untuk memilih foto atau seret ke sini</p>
                      <p className="text-[10px] text-gray-400 mt-1">Bisa pilih banyak foto sekaligus! (Mendukung JPG, PNG, WEBP)</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Google Drive Link Input */
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-gray-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 block">Link Google Drive atau URL Foto</label>
                    <input
                      type="text"
                      id="input-drive-url"
                      value={driveUrl}
                      onChange={(e) => setDriveUrl(e.target.value)}
                      placeholder="Tempel link foto Google Drive atau URL gambar..."
                      className="w-full p-3 text-xs bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder:text-gray-400"
                    />
                  </div>

                  {/* Auto-converting hint */}
                  {driveUrl.trim() && (
                    <div className="space-y-2">
                      <div className="text-[10px] bg-sky-50 text-sky-700 p-2.5 rounded-lg font-medium border border-sky-100 leading-relaxed">
                        ✨ <strong>Sistem Pintar:</strong> Link Drive Anda dikonversi agar bisa langsung ditampilkan berdua!
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                        <img 
                          src={parseDriveUrl(driveUrl)} 
                          alt="Pratinjau Link Drive" 
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={(e) => {
                            e.currentTarget.style.display = 'block';
                          }}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-1 left-1 right-1 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[9px] font-mono text-white truncate text-center">
                          Pratinjau Gambar Aktif
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Help Guide */}
                  <div className="text-[9px] text-gray-500 leading-relaxed space-y-0.5 bg-white p-2.5 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-700">Cara mengambil link Google Drive agar bisa dilihat berdua:</p>
                    <ol className="list-decimal list-inside space-y-0.5">
                      <li>Buka Google Drive & klik kanan file foto.</li>
                      <li>Klik <strong className="text-rose-600">Bagikan</strong> & ubah akses umum menjadi <strong className="text-rose-600">Siapa saja yang memiliki link</strong>.</li>
                      <li>Klik <strong className="text-rose-600">Salin Link</strong> lalu tempel di atas!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Progress Bar inside modal when uploading */}
              {uploadProgress && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl space-y-2 text-center">
                  <div className="flex justify-between items-center text-xs font-bold text-emerald-800">
                    <span>Sedang Menyimpan Foto...</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300" 
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] text-emerald-600 font-medium">Mohon tunggu sebentar, jangan tutup halaman ini ya 💕</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedFiles([]);
                    setErrorMessage('');
                    setDriveUrl('');
                    setUploadType('file');
                  }}
                  className="w-1/2 py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (uploadType === 'file' ? selectedFiles.length === 0 : !driveUrl.trim())}
                  className="w-1/2 py-3 bg-rose-500 hover:bg-rose-600 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isUploading ? 'Menyimpan...' : 'Unggah Foto 💖'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Lightbox / High-Quality Detail modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 md:p-8 animate-fade-in">
          
          {/* Close trigger overlay */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => {
            setSelectedPhoto(null);
            setRandomMemoryQuote('');
          }}></div>
          
          <div className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh] z-10 border border-gray-800">
            
            {/* Image side */}
            <div className="relative flex-grow bg-black flex items-center justify-center min-h-[350px] md:min-h-[500px]">
              <img 
                src={selectedPhoto.imageUrl} 
                alt={selectedPhoto.caption || 'Foto Bersama'} 
                referrerPolicy="no-referrer"
                className="max-h-[50vh] md:max-h-[80vh] max-w-full object-contain"
              />
              <button
                type="button"
                onClick={() => {
                  setSelectedPhoto(null);
                  setRandomMemoryQuote('');
                }}
                className="absolute top-4 left-4 p-2 bg-black/50 text-white hover:bg-black/80 rounded-full transition-colors cursor-pointer"
                title="Tutup Viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info and Details Sidebar */}
            <div className="w-full md:w-80 bg-white p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-gray-100 overflow-y-auto">
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                      <span>Ruang Kenangan</span>
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 leading-tight">Detail Momen Manis</h4>
                </div>

                <div className="space-y-4">
                  
                  {/* Random Quote if open via random flashback */}
                  {randomMemoryQuote && (
                    <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-rose-700 animate-pulse text-xs font-bold leading-relaxed space-y-1.5">
                      <div className="flex items-center gap-1.5 text-rose-600">
                        <Sparkles className="w-4 h-4 text-rose-500 fill-rose-300" />
                        <span>Pesan Cinta Untukmu:</span>
                      </div>
                      <p className="italic">"{randomMemoryQuote}"</p>
                    </div>
                  )}

                  {/* Caption */}
                  <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/30">
                    <p className="text-xs text-gray-700 italic leading-relaxed">
                      "{selectedPhoto.caption || 'Tidak ada catatan cerita untuk foto ini'}"
                    </p>
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Diunggah Oleh</span>
                      </span>
                      <span className="font-bold text-gray-800">{selectedPhoto.addedBy}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Tanggal Kenangan</span>
                      </span>
                      <span className="font-bold text-gray-800">{selectedPhoto.date}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-gray-50">
                      <span className="text-gray-400 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5" />
                        <span>Kualitas Asli</span>
                      </span>
                      <span className="font-mono text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Lossless (100%)
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="pt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => handleDownload(selectedPhoto)}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Kualitas Asli (100%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Apakah Anda yakin ingin menghapus foto kenangan ini?')) {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                      setRandomMemoryQuote('');
                    }
                  }}
                  className="w-full py-3 border border-gray-200 hover:border-red-100 hover:bg-red-50 text-gray-500 hover:text-red-600 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus Foto dari Galeri</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
