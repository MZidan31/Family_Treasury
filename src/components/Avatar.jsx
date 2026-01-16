import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Camera, Loader2, X, Check, ZoomIn } from 'lucide-react';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../utils/cropImage'; // Import alat potong tadi

export default function Avatar({ url, size, onUpload, editable = false }) {
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // State Cropper
  const [imageSrc, setImageSrc] = useState(null); // Gambar mentah yg dipilih
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);

  // 1. Download Gambar dari Supabase
  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path) {
    try {
      const { data, error } = await supabase.storage.from('avatars').download(path);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      setAvatarUrl(url);
    } catch (error) {
      console.log('Error downloading image: ', error.message);
    }
  }

  // 2. Saat User Pilih File -> Buka Mode Crop
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setIsCropping(true); // Buka Modal Crop
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  // 3. Simpan Koordinat Crop
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // 4. Eksekusi Upload (Setelah di-Crop)
  const uploadCroppedImage = async () => {
    try {
      setUploading(true);
      
      // Ambil hasil potongan (Blob)
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const fileName = `${Math.random()}.jpg`;
      const filePath = `${fileName}`;

      // Upload ke Supabase
      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, croppedImageBlob);

      if (uploadError) throw uploadError;

      onUpload(null, filePath); // Beritahu parent (Profiles.jsx)
      setIsCropping(false); // Tutup Modal
      setImageSrc(null);
    } catch (error) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group">
      
      {/* --- TAMPILAN FOTO UTAMA --- */}
      <div 
        style={{ width: size, height: size }} 
        className="rounded-full overflow-hidden border-4 border-slate-800 bg-slate-800 shadow-xl flex items-center justify-center relative"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
        ) : (
          <div className="h-full w-full bg-slate-700 flex items-center justify-center text-slate-500 text-xs text-center px-1">
            No Img
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-yellow-500 z-10">
             <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      {/* --- TOMBOL KAMERA (Hanya Mode Edit) --- */}
      {editable && !uploading && (
        <div className="absolute bottom-0 right-0 z-20">
          <label className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 p-2 rounded-full cursor-pointer shadow-lg flex items-center justify-center transition-transform active:scale-95 border-2 border-slate-900">
            <Camera size={18} />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={onFileChange}
            />
          </label>
        </div>
      )}

      {/* --- MODAL CROPPER (Muncul saat file dipilih) --- */}
      {isCropping && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
          
          <div className="relative w-full max-w-md h-80 bg-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-slate-700">
             <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1} // Bulat = 1:1
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              cropShape="round" // Visual bulat
              showGrid={false}
            />
          </div>

          {/* Kontrol Zoom & Tombol */}
          <div className="w-full max-w-md mt-6 bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-slate-400">
               <ZoomIn size={16} />
               <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-labelledby="Zoom"
                onChange={(e) => setZoom(e.target.value)}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>

            <div className="flex gap-3">
               <button 
                 onClick={() => { setIsCropping(false); setImageSrc(null); }}
                 className="flex-1 py-3 rounded-xl bg-slate-800 text-white font-bold flex justify-center items-center hover:bg-slate-700 transition"
               >
                 <X size={18} className="mr-2"/> Batal
               </button>
               <button 
                 onClick={uploadCroppedImage}
                 className="flex-1 py-3 rounded-xl bg-yellow-500 text-slate-900 font-bold flex justify-center items-center hover:bg-yellow-400 transition shadow-lg shadow-yellow-500/20"
               >
                 <Check size={18} className="mr-2"/> Simpan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}