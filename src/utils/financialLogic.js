// --- THE ALLOCATOR ENGINE v1.0 ---
// Spesifik untuk Keluarga 5 Dewasa/Remaja

export const calculateBudget = (income) => {
  const totalIncome = parseInt(income);
  
  // 1. BEBAN PASTI (FIXED COST) - TIDAK ADA TOLERANSI
  const hardFixed = {
    cicilan_kendaraan: 1350000,
    sewa_hunian: 500000,
    infaq_pendidikan: 50000,
    internet: 100000,  // Estimasi rata-rata
    listrik: 150000    // Estimasi rata-rata
  };

  const totalHardFixed = Object.values(hardFixed).reduce((a, b) => a + b, 0);

  // 2. HUTANG (PRIORITAS TINGGI) - TARGET 3 BULAN
  // Total 2.5jt / 3 bulan = ~833.333 per bulan
  const debtTarget = 834000; 

  // Hitung Sisa setelah Beban Wajib & Hutang
  const remainingAfterFixed = totalIncome - totalHardFixed - debtTarget;

  // 3. ALOKASI VARIABEL (The Living Cost)
  // Jika sisa minus atau nol, set ke 0 (Mode Bertahan Hidup)
  const safeRemaining = remainingAfterFixed > 0 ? remainingAfterFixed : 0;

  // Rumus Pembagian Sisa (Berdasarkan Prioritas 5 Orang):
  // Dapur (Makan): 50% dari sisa (Karena 5 orang dewasa itu boros di makan)
  // Mobilitas (Bensin): 15% dari sisa
  // Uang Saku Pendidikan: 15% dari sisa
  // Sedekah Jumat: 5% dari sisa
  // Kebutuhan Lain/Darurat: 15% dari sisa

  // Catatan Prof: 
  // Untuk 5 orang, budget masak ideal hemat = Rp 50.000/hari x 30 = 1.500.000
  // Jika 'safeRemaining' kecil, persentase dapur akan kita paksa naik.

  let allocations = {};
  
  // Logika Adaptif (Survival Mode vs Normal Mode)
  if (safeRemaining < 2000000) {
    // MODE DARURAT (Utamakan Perut)
    allocations = {
      dapur: safeRemaining * 0.70, // 70% untuk makan
      mobilitas: safeRemaining * 0.15,
      saku_pendidikan: safeRemaining * 0.10,
      sedekah: safeRemaining * 0.05, // Sedekah tetap ada walau sempit
      lainnya: 0
    };
  } else {
    // MODE NORMAL
    allocations = {
      dapur: safeRemaining * 0.45, 
      mobilitas: safeRemaining * 0.15,
      saku_pendidikan: safeRemaining * 0.20,
      sedekah: safeRemaining * 0.05, 
      lainnya: safeRemaining * 0.15
    };
  }

  return {
    breakdown: {
      ...hardFixed,
      hutang_kas: debtTarget,
      ...allocations
    },
    summary: {
      income: totalIncome,
      totalFixed: totalHardFixed + debtTarget,
      totalVariable: safeRemaining,
      isDanger: remainingAfterFixed < 0,
      message: remainingAfterFixed < 0 
        ? "BAHAYA! Pemasukan tidak menutup biaya wajib & hutang." 
        : safeRemaining < 1500000 
          ? "WASPADA! Budget makan/harian sangat ketat." 
          : "AMAN. Alokasi budget seimbang."
    }
  };
};