/* ---------- DATA & STORAGE ---------- */
let dataTransaksi = JSON.parse(localStorage.getItem("tabunganData")) || [];
let saldo = JSON.parse(localStorage.getItem("saldoSiswa")) || {};

/* ---------- HELPERS ---------- */
function simpanData() {
    localStorage.setItem("tabunganData", JSON.stringify(dataTransaksi));
    localStorage.setItem("saldoSiswa", JSON.stringify(saldo));
}

function toast(msg) {
    let x = document.getElementById("toast");
    x.innerText = msg;
    x.className = "show";
    setTimeout(() => { x.className = x.className.replace("show", ""); }, 2200);
}

function formatRp(num) {
    return "Rp " + Number(num).toLocaleString("id-ID");
}

/* ---------- TRANSAKSI ---------- */
function prosesTransaksi() {
    let nama = document.getElementById("nama").value.trim();
    let nominal = parseInt(document.getElementById("nominal").value);
    let jenis = document.getElementById("jenis").value;

    if (!nama || isNaN(nominal) || nominal <= 0) {
        alert("Isi semua data dengan benar (nominal > 0)!");
        return;
    }

    if (!saldo[nama]) saldo[nama] = 0;
    if (jenis === "tarik" && saldo[nama] < nominal) {
        alert("Saldo tidak cukup!");
        return;
    }

    saldo[nama] += (jenis === "setor" ? nominal : -nominal);

    const transaksi = {
        id: Date.now(),
        nama,
        jenis,
        nominal,
        saldoAkhir: saldo[nama]
    };

    dataTransaksi.push(transaksi);
    simpanData();
    tampilkanData();
    toast("Transaksi berhasil!");

    document.querySelector("table").scrollIntoView({ behavior: "smooth", block: "start" });

    document.getElementById("nama").value = "";
    document.getElementById("nominal").value = "";
}

/* ---------- TAMPILKAN ---------- */
function tampilkanData() {
    let tabel = document.getElementById("tabel-body");
    tabel.innerHTML = "";

    dataTransaksi.forEach(t => {
        tabel.innerHTML += `
            <tr>
                <td>${escapeHtml(t.nama)}</td>
                <td>${t.jenis}</td>
                <td>${formatRp(t.nominal)}</td>
                <td>${formatRp(t.saldoAkhir)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editTransaksi(${t.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="hapusTransaksi(${t.id})">Hapus</button>
                </td>
            </tr>`;
    });

    hitungTotalSaldo();
}

/* ---------- EDIT / HAPUS ---------- */
function editTransaksi(id) {
    let transaksi = dataTransaksi.find(t => t.id === id);
    if (!transaksi) return;

    document.getElementById("nama").value = transaksi.nama;
    document.getElementById("nominal").value = transaksi.nominal;
    document.getElementById("jenis").value = transaksi.jenis;

    dataTransaksi = dataTransaksi.filter(t => t.id !== id);

    saldo = {};
    dataTransaksi.forEach(t => {
        if (!saldo[t.nama]) saldo[t.nama] = 0;
        saldo[t.nama] += (t.jenis === "setor" ? t.nominal : -t.nominal);
    });

    simpanData();
    tampilkanData();
}

function hapusTransaksi(id) {
    if (!confirm("Hapus transaksi ini?")) return;

    dataTransaksi = dataTransaksi.filter(t => t.id !== id);

    saldo = {};
    dataTransaksi.forEach(t => {
        if (!saldo[t.nama]) saldo[t.nama] = 0;
        saldo[t.nama] += (t.jenis === "setor" ? t.nominal : -t.nominal);
    });

    simpanData();
    tampilkanData();
}

function resetData() {
    if (!confirm("Yakin reset semua data?")) return;
    dataTransaksi = [];
    saldo = {};
    simpanData();
    tampilkanData();
}

/* ---------- UTIL ---------- */
function hitungTotalSaldo() {
    let total = Object.values(saldo).reduce((a, b) => a + b, 0);
    document.getElementById("total-saldo").innerText = formatRp(total);
}

function filterNama() {
    let filter = document.getElementById("filter").value.toLowerCase();
    let rows = document.querySelectorAll("#tabel-body tr");

    rows.forEach(row => {
        let nama = row.children[0].innerText.toLowerCase();
        row.style.display = nama.includes(filter) ? "" : "none";
    });
}

function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
}

/* ---------- CETAK PDF ---------- */
function cetakPDF() {
    const title = "Laporan Tabungan Siswa";
    const date = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });

    let html = `
    <html>
    <head>
        <title>${title}</title>
        <style>
            body { font-family: Arial, sans-serif; color: #111; margin: 20px; }
            h1 { text-align: center; color: #d63384; }
            .meta { text-align: center; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #aaa; padding: 8px; }
            th { background: #ffd6e8; }
        </style>
    </head>
    <body>
        <h1>${title}</h1>
        <div class="meta">Tanggal: ${date}</div>

        <table>
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>Jenis</th>
                    <th>Nominal</th>
                    <th>Saldo Akhir</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (dataTransaksi.length === 0) {
        html += `<tr><td colspan="4" style="text-align:center;">Tidak ada transaksi</td></tr>`;
    } else {
        dataTransaksi.forEach(t => {
            html += `
            <tr>
                <td>${escapeHtml(t.nama)}</td>
                <td>${t.jenis}</td>
                <td>${formatRp(t.nominal)}</td>
                <td>${formatRp(t.saldoAkhir)}</td>
            </tr>`;
        });
    }

    const total = Object.values(saldo).reduce((a, b) => a + b, 0);

    html += `
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align:right; font-weight:bold;">Total Saldo Semua Siswa:</td>
                    <td>${formatRp(total)}</td>
                </tr>
            </tfoot>
        </table>
    </body>
    </html>`;

    const newWin = window.open("", "_blank", "width=900,height=700");
    newWin.document.write(html);
    newWin.document.close();

    newWin.focus();
    newWin.onafterprint = () => newWin.close();

    setTimeout(() => newWin.print(), 500);
}

/* ---------- EXPORT CSV ---------- */
function downloadCSV() {
    let csv = "Nama,Jenis,Nominal,SaldoAkhir\n";

    dataTransaksi.forEach(t => {
        csv += `"${t.nama}","${t.jenis}",${t.nominal},${t.saldoAkhir}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "laporan_tabungan.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

/* ---------- MUSIK ---------- */
function toggleMusic() {
    let audio = document.getElementById("bgMusic");
    let btn = document.getElementById("musicBtn");

    if (audio.paused) {
        audio.play();
        btn.innerHTML = "⏸️";
    } else {
        audio.pause();
        btn.innerHTML = "🎵";
    }
}

/* ---------- INIT ---------- */
tampilkanData();
