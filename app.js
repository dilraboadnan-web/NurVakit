/* ================================================================
   NurVakit — uygulama mantığı (v4)
   Her özellik kendi try/catch bloğunda çalışır: biri hata verse bile
   diğer tüm butonlar ve sekmeler çalışmaya devam eder.
   ================================================================ */
const $ = id => document.getElementById(id);
const VAKITLER = [
  {k:"Imsak", ad:"İmsak"},{k:"Sunrise", ad:"Güneş"},{k:"Dhuhr", ad:"Öğle"},
  {k:"Asr", ad:"İkindi"},{k:"Maghrib", ad:"Akşam"},{k:"Isha", ad:"Yatsı"}
];

/* ============ GÖRSEL CİLA: yıldızlar, ripple, splash, konfeti ============ */
(function(){
  try{
    // Açılış ekranındaki rastgele parıldayan yıldızlar
    const alan = $('splashYildizlar');
    if(alan){
      for(let i=0;i<45;i++){
        const s = document.createElement('div');
        s.className = 'yildiz';
        const boy = Math.random()*2.2 + .6;
        s.style.width = boy + 'px'; s.style.height = boy + 'px';
        s.style.left = Math.random()*100 + '%';
        s.style.top = Math.random()*100 + '%';
        s.style.animationDelay = (Math.random()*2.6) + 's';
        alan.appendChild(s);
      }
    }
    // Sonraki-vakit kartındaki küçük yıldız serpintisi
    const sy = $('sonrakiYildiz');
    if(sy){
      for(let i=0;i<14;i++){
        const s = document.createElement('span');
        const boy = Math.random()*1.6 + .5;
        s.style.width = boy + 'px'; s.style.height = boy + 'px';
        s.style.left = Math.random()*100 + '%';
        s.style.top = Math.random()*100 + '%';
        s.style.animationDelay = (Math.random()*3) + 's';
        sy.appendChild(s);
      }
    }
    // Açılış ekranı: TAM 0.7 saniye sonra otomatik kapanır.
    // window.load gibi ağa/yavaş kaynaklara bağımlı hiçbir bekleme YOK — bu yüzden artık asla takılı kalmaz.
    const SPLASH_SURE = 700;
    let splashKapandi = false;
    function splashGizle(){
      if(splashKapandi) return;
      splashKapandi = true;
      const sp = $('splash');
      if(sp) sp.classList.add('gizli');
    }
    setTimeout(splashGizle, SPLASH_SURE);

    // Ek güvenceler: splash'e herhangi bir yere dokunma veya tuşa basma da hemen kapatır.
    const splashEl = $('splash');
    if(splashEl){
      splashEl.addEventListener('click', (e) => {
        if(e.target && e.target.id === 'splashVideoBtn') return; // video butonu kendi işini yapsın
        splashGizle();
      });
    }
    document.addEventListener('keydown', () => splashGizle(), {once:true});

    // "Tanıtımı İzle" butonu: splash'i kapat, sayfanın en altındaki video bölümüne kaydır, videoyu göster/oynat.
    const videoBtn = $('splashVideoBtn');
    if(videoBtn){
      videoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        splashGizle();
        setTimeout(() => {
          const bolum = $('tanitimVideo');
          if(bolum) bolum.scrollIntoView({behavior:'smooth', block:'start'});
          const video = $('tanitimVideoEl');
          if(video && video.currentSrc){
            video.classList.add('hazir');
            const yt = $('videoYerTutucu'); if(yt) yt.classList.add('gizli');
            video.play().catch(() => {});
          }
        }, 380);
      });
    }

    // Her butona dokunma dalgası (ripple) efekti
    document.addEventListener('pointerdown', e => {
      const btn = e.target.closest('button');
      if(!btn || btn.disabled) return;
      btn.classList.add('ripple');
      const r = btn.getBoundingClientRect();
      const boyut = Math.max(r.width, r.height) * 1.3;
      const dalga = document.createElement('span');
      dalga.className = 'ripple-dalga';
      dalga.style.width = dalga.style.height = boyut + 'px';
      dalga.style.left = (e.clientX - r.left - boyut/2) + 'px';
      dalga.style.top = (e.clientY - r.top - boyut/2) + 'px';
      btn.appendChild(dalga);
      setTimeout(() => dalga.remove(), 600);
    }, {passive:true});
  }catch(e){ console.error('[NurVakit] görsel efektler:', e); }
})();

function konfetiPatlat(){
  try{
    const alan = $('konfetiAlan');
    if(!alan) return;
    const renkler = ['#C9A227','#E4C965','#7BE495','#F7F3E8'];
    for(let i=0;i<36;i++){
      const p = document.createElement('div');
      p.className = 'konfeti-parca';
      const boy = Math.random()*7 + 5;
      p.style.width = boy + 'px'; p.style.height = (boy*.4) + 'px';
      p.style.left = (Math.random()*100) + 'vw';
      p.style.background = renkler[Math.floor(Math.random()*renkler.length)];
      p.style.animationDuration = (1.6 + Math.random()*1.2) + 's';
      p.style.transform = 'rotate(' + (Math.random()*360) + 'deg)';
      alan.appendChild(p);
      setTimeout(() => p.remove(), 3200);
    }
  }catch(e){}
}

/* ============ KALICI HAFIZA (localStorage) ============ */
const SKEY = 'nurvakit_state_v1';
function stateOku(){
  try{
    const ham = localStorage.getItem(SKEY);
    return ham ? JSON.parse(ham) : {};
  }catch(e){ return {}; }
}
function stateYaz(kismi){
  try{
    const mevcut = stateOku();
    localStorage.setItem(SKEY, JSON.stringify(Object.assign(mevcut, kismi)));
  }catch(e){ /* localStorage kapalıysa sessizce geç */ }
}
const kayitli = stateOku();

let lat = typeof kayitli.lat === 'number' ? kayitli.lat : 41.0082;
let lon = typeof kayitli.lon === 'number' ? kayitli.lon : 28.9784;
let yerAdi = kayitli.yerAdi || "İstanbul (varsayılan)";
let konumSecildi = !!kayitli.konumSecildi;
let takvim = [], timerId = null, sonVakitKey = "", zamanDilimi = null;
let sesli = !!kayitli.sesli;

function durum(msg, y){ const el = $('durum'); if(!el) return; el.textContent = msg || ''; el.className = 'durum' + (y ? ' yukleniyor' : ''); }
function tarihStr(d){ return String(d.getDate()).padStart(2,'0') + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + d.getFullYear(); }
function dkParse(t){ const m = String(t).trim().match(/^(\d{1,2}):(\d{2})/); return m ? (+m[1])*60 + (+m[2]) : 0; }
function temiz(t){ const m = String(t).trim().match(/^(\d{1,2}:\d{2})/); return m ? m[1] : '--:--'; }
function vakitAl(g, k){ return k === "Imsak" ? g.timings.Fajr : g.timings[k]; }

/* Her bölümü izole çalıştırmak için yardımcı */
function bolum(ad, fn){
  try{ fn(); }
  catch(e){ console.error('[NurVakit] "' + ad + '" bölümünde hata:', e); }
}

/* ============ SEKMELER (nav) ============ */
bolum('sekmeler', () => {
  const kayitliSayfa = kayitli.sayfa || 'vakit';
  document.querySelectorAll('nav button').forEach(b => {
    b.addEventListener('click', () => {
      const aktifOlan = document.querySelector('nav .aktif');
      if(aktifOlan) aktifOlan.classList.remove('aktif');
      b.classList.add('aktif');
      document.querySelectorAll('.sayfa').forEach(s => s.classList.remove('acik'));
      const hedef = $('sayfa-' + b.dataset.sayfa);
      if(hedef) hedef.classList.add('acik');
      stateYaz({sayfa: b.dataset.sayfa});
    });
  });
  if(kayitliSayfa !== 'vakit'){
    const btn = document.querySelector('nav button[data-sayfa="' + kayitliSayfa + '"]');
    if(btn) btn.click();
  }
});

/* ============ KONUM SİSTEMİ ============ */
bolum('konum', () => {
  if(konumSecildi){
    $('konumBanner').classList.remove('goster');
    $('yerAdi').textContent = yerAdi;
  }
  async function tersGeokod(){
    try{
      const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lon + '&localityLanguage=tr');
      const j = await r.json();
      const ad = [j.locality || j.city, j.principalSubdivision].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).join(', ');
      const nihai = ad || (lat.toFixed(2) + ', ' + lon.toFixed(2));
      yerAdi = nihai;
      $('yerAdi').textContent = nihai;
      stateYaz({yerAdi: nihai});
    }catch(e){
      yerAdi = lat.toFixed(2) + ', ' + lon.toFixed(2);
      $('yerAdi').textContent = yerAdi;
    }
  }
  function konumIste(){
    if(!navigator.geolocation){ durum('Tarayıcın konum desteklemiyor, listeden şehir seç.'); $('sehir').classList.add('goster'); return; }
    durum('Konumun alınıyor…', true);
    navigator.geolocation.getCurrentPosition(
      p => {
        lat = p.coords.latitude; lon = p.coords.longitude;
        konumSecildi = true;
        $('konumBanner').classList.remove('goster');
        $('sehir').classList.remove('goster');
        durum('');
        stateYaz({lat: lat, lon: lon, konumSecildi: true});
        tersGeokod();
        bolum('vakit-yenile', yukle);
        bolum('kible-yenile', () => { if(window.__kibleHesapla) window.__kibleHesapla(); });
      },
      () => {
        durum('Konum izni verilmedi — aşağıdan şehrini seçebilirsin.');
        $('sehir').classList.add('goster');
      },
      {enableHighAccuracy: true, timeout: 12000}
    );
  }
  $('konumIste').addEventListener('click', konumIste);
  $('konumChip').addEventListener('click', konumIste);
  $('sehir').addEventListener('change', e => {
    if(!e.target.value) return;
    const p = e.target.value.split(',');
    lat = +p[0]; lon = +p[1];
    konumSecildi = true;
    yerAdi = p[2];
    $('yerAdi').textContent = yerAdi;
    $('konumBanner').classList.remove('goster');
    durum('');
    stateYaz({lat: lat, lon: lon, yerAdi: yerAdi, konumSecildi: true});
    bolum('vakit-yenile', yukle);
    bolum('kible-yenile', () => { if(window.__kibleHesapla) window.__kibleHesapla(); });
  });
  if(konumSecildi) tersGeokod();
});

/* ============ VAKİTLER ============ */
// Diyanet resmi temkin: Güneş -7, Öğle +5, İkindi +4, Akşam +7 dk
// tune sırası: Imsak,Fajr,Sunrise,Dhuhr,Asr,Maghrib,Sunset,Isha,Midnight
const TUNE = "0,0,-7,5,4,7,0,0,0";

async function yukle(){
  durum('Vakitler yükleniyor…', true);
  document.querySelectorAll('#liste .vakit .saat').forEach(el => el.classList.add('iskelet'));
  if(timerId){ clearInterval(timerId); timerId = null; }
  try{
    const simdi = new Date();
    const u = (y,m) => 'https://api.aladhan.com/v1/calendar/' + y + '/' + m + '?latitude=' + lat + '&longitude=' + lon + '&method=13&tune=' + TUNE;
    const r = await fetch(u(simdi.getFullYear(), simdi.getMonth()+1));
    if(!r.ok) throw new Error('api');
    const j = await r.json();
    if(!j.data || !j.data.length) throw new Error('bos');
    takvim = j.data;
    zamanDilimi = (j.data[0].meta && j.data[0].meta.timezone) || null;
    const sa = new Date(simdi.getFullYear(), simdi.getMonth()+1, 1);
    fetch(u(sa.getFullYear(), sa.getMonth()+1)).then(x => x.json()).then(j2 => {
      if(j2.data) takvim = takvim.concat(j2.data);
    }).catch(()=>{});
    ciz(); durum('');
    document.querySelectorAll('#liste .vakit .saat').forEach(el => el.classList.remove('iskelet'));
    timerId = setInterval(tik, 1000); tik();
  }catch(e){
    durum('⚠️ Vakitler alınamadı. İnternet bağlantını kontrol edip sayfayı yenile.');
    document.querySelectorAll('#liste .vakit .saat').forEach(el => el.classList.remove('iskelet'));
  }
}
function bugunKaydi(d){ const ts = tarihStr(d); return takvim.find(g => g.date.gregorian.date === ts); }

function ciz(){
  const simdi = new Date(), g = bugunKaydi(simdi);
  if(!g) return;
  const gg = g.date.gregorian, hh = g.date.hijri;
  const gun = {Monday:"Pazartesi",Tuesday:"Salı",Wednesday:"Çarşamba",Thursday:"Perşembe",Friday:"Cuma",Saturday:"Cumartesi",Sunday:"Pazar"};
  const ay = {January:"Ocak",February:"Şubat",March:"Mart",April:"Nisan",May:"Mayıs",June:"Haziran",July:"Temmuz",August:"Ağustos",September:"Eylül",October:"Ekim",November:"Kasım",December:"Aralık"};
  const hAy = {Muharram:"Muharrem",Safar:"Safer","Rabi al-awwal":"Rebiülevvel","Rabi al-thani":"Rebiülahir","Jumada al-awwal":"Cemaziyelevvel","Jumada al-thani":"Cemaziyelahir",Rajab:"Recep","Sha'ban":"Şaban",Ramadan:"Ramazan",Shawwal:"Şevval","Dhu al-Qi'dah":"Zilkade","Dhu al-Hijjah":"Zilhicce"};
  $('miladi').textContent = (+gg.day) + ' ' + (ay[gg.month.en] || gg.month.en) + ' ' + gg.year + ', ' + (gun[gg.weekday.en] || '');
  $('hicri').textContent = (+hh.day) + ' ' + (hAy[hh.month.en] || hh.month.en) + ' ' + hh.year;
  $('cumaBanner').classList.toggle('goster', simdi.getDay() === 5);
  document.querySelectorAll('#liste .vakit').forEach(el => {
    el.querySelector('.saat').textContent = temiz(vakitAl(g, el.dataset.k));
  });
  if(!window.__vakitKartGirdi){
    window.__vakitKartGirdi = true;
    document.querySelectorAll('#liste .vakit').forEach((el, i) => {
      el.classList.add('sirala-giris');
      el.style.animationDelay = (i * 0.06) + 's';
    });
  }
  const tb = $('tabloBody'); tb.innerHTML = '';
  takvim.filter(x => x.date.gregorian.month.number === (simdi.getMonth()+1) && +x.date.gregorian.year === simdi.getFullYear())
    .forEach(x => {
      const tr = document.createElement('tr');
      if(x.date.gregorian.date === tarihStr(simdi)) tr.className = 'bugun';
      tr.innerHTML = '<td>' + (+x.date.gregorian.day) + '</td>' + VAKITLER.map(v => '<td>' + temiz(vakitAl(x, v.k)) + '</td>').join('');
      tb.appendChild(tr);
    });
}

/* ============ CANLI SAAT (salise dahil) ============ */
bolum('canli-saat', () => {
  const saatFmt = () => new Intl.DateTimeFormat('tr-TR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: zamanDilimi || undefined
  });
  let sonFmt = null, sonTz = 'ilk';
  setInterval(() => {
    try{
      const simdi = new Date();
      if(sonTz !== zamanDilimi){ sonFmt = saatFmt(); sonTz = zamanDilimi; $('canliSaatAlt').textContent = (konumSecildi ? yerAdi : 'Yerel') + ' Saati'; }
      const t = sonFmt.format(simdi);
      const salise = String(Math.floor(simdi.getMilliseconds()/10)).padStart(2,'0');
      $('canliSaat').innerHTML = t + '<span class="salise">.' + salise + '</span>';
    }catch(e){}
  }, 43);
});

/* ============ EZAN SESİ (vakit girdiğinde BAŞTAN SONA tam çalar) ============ */
let ezanCal = () => {}, ezanDur = () => {}, beep = () => {};
bolum('ezan-sesi', () => {
  const ezanSes = new Audio();
  ezanSes.preload = 'auto';
  // Birden fazla kaynak deneniyor; format desteklenmezse otomatik sıradakine geçer (iOS/Android/Masaüstü uyumu için)
  const EZAN_KAYNAKLAR = [
    'https://upload.wikimedia.org/wikipedia/commons/6/6a/Beautiful_adhan.ogg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Beautiful_adhan.ogg',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Azan.ogg'
  ];
  let ezanIdx = 0;
  ezanSes.src = EZAN_KAYNAKLAR[0];
  ezanSes.addEventListener('error', () => {
    ezanIdx++;
    if(ezanIdx < EZAN_KAYNAKLAR.length) ezanSes.src = EZAN_KAYNAKLAR[ezanIdx];
  });

  beep = function beepFn(){
    try{
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, .35, .7].forEach((t,i) => {
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.connect(gn); gn.connect(ctx.destination);
        o.frequency.value = 660 + i*110; o.type = 'sine';
        gn.gain.setValueAtTime(.001, ctx.currentTime + t);
        gn.gain.exponentialRampToValueAtTime(.28, ctx.currentTime + t + .04);
        gn.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + t + .3);
        o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .32);
      });
    }catch(e){}
  };
  // Ezan tam okunsun diye HİÇBİR yerde erken durdurulmuyor — doğal bitişine kadar çalar.
  ezanCal = function ezanCalFn(){
    ezanSes.currentTime = 0;
    const p = ezanSes.play();
    if(p && p.catch) p.catch(() => beep()); // tarayıcı otomatik oynatmayı engellerse zil sesi yedeği
  };
  ezanDur = function ezanDurFn(){ ezanSes.pause(); ezanSes.currentTime = 0; };

  const sesBtn = $('sesBtn');
  if(sesli){ sesBtn.textContent = '🔔 Ezan sesi açık'; sesBtn.classList.add('acik'); }
  sesBtn.addEventListener('click', () => {
    sesli = !sesli;
    sesBtn.textContent = sesli ? '🔔 Ezan sesi açık' : '🔕 Ezan sesi kapalı';
    sesBtn.classList.toggle('acik', sesli);
    stateYaz({sesli: sesli});
    if(sesli){
      // Kısa önizleme: tarayıcının ses iznini bu kullanıcı etkileşiminde alıyoruz.
      // Not: gerçek vakit girişinde ezan KISALTILMADAN, tam okunur.
      ezanCal();
      setTimeout(() => { if(!ezanSes.paused && ezanSes.currentTime < 4 && ezanSes.currentTime > 0) ezanDur(); }, 4000);
      durum('Ezan sesi açık — vakit girdiğinde ezan baştan sona okunacak. Sekme açık kalmalı.');
      setTimeout(() => durum(''), 5000);
    } else {
      ezanDur();
    }
  });
});

function tik(){
  const simdi = new Date(), g = bugunKaydi(simdi);
  if(!g) return;
  const dkSimdi = simdi.getHours()*60 + simdi.getMinutes() + simdi.getSeconds()/60;
  let sonraki = null, onceki = null;
  for(const v of VAKITLER){
    const dk = dkParse(vakitAl(g, v.k));
    if(dk > dkSimdi && !sonraki) sonraki = {k:v.k, ad:v.ad, dk:dk, saat:temiz(vakitAl(g, v.k)), gun:0};
    if(dk <= dkSimdi) onceki = {k:v.k, ad:v.ad, dk:dk};
  }
  if(!sonraki){
    const yarin = new Date(simdi); yarin.setDate(yarin.getDate()+1);
    const gy = bugunKaydi(yarin);
    if(gy) sonraki = {k:"Imsak", ad:"İmsak", dk:dkParse(vakitAl(gy,"Imsak")) + 1440, saat:temiz(vakitAl(gy,"Imsak")), gun:1};
  }
  if(!sonraki) return;

  document.querySelectorAll('#liste .vakit').forEach(el => {
    el.classList.remove('aktif','gecti');
    const dk = dkParse(vakitAl(g, el.dataset.k));
    if(sonraki.gun === 0 && el.dataset.k === sonraki.k) el.classList.add('aktif');
    else if(dk <= dkSimdi) el.classList.add('gecti');
  });

  const kalanSn = Math.max(0, Math.round((sonraki.dk - dkSimdi) * 60));
  const s = Math.floor(kalanSn/3600), d = Math.floor((kalanSn%3600)/60), sn = kalanSn%60;
  const geriSayimEl = $('geriSayim');
  const yeniMetin = String(s).padStart(2,'0') + ':' + String(d).padStart(2,'0') + ':' + String(sn).padStart(2,'0');
  if(geriSayimEl.textContent !== yeniMetin){
    geriSayimEl.textContent = yeniMetin;
    geriSayimEl.classList.remove('nabiz'); void geriSayimEl.offsetWidth; geriSayimEl.classList.add('nabiz');
  }
  $('sonrakiAd').textContent = sonraki.ad + (sonraki.gun ? ' (yarın)' : '');
  $('sonrakiSaat').textContent = sonraki.saat;
  $('etiket').textContent = sonraki.k === 'Maghrib' ? 'Akşama / İftara Kalan' : 'Sonraki Vakit';

  const bas = onceki ? onceki.dk : Math.max(0, sonraki.dk - 720);
  $('bar').style.width = Math.min(100, Math.max(0, ((dkSimdi - bas)/(sonraki.dk - bas))*100)) + '%';

  const key = (onceki ? onceki.k : 'yok') + '|' + tarihStr(simdi);
  if(sonVakitKey && key !== sonVakitKey && onceki){
    if(sesli && onceki.k !== 'Sunrise') ezanCal(); // TAM ezan — hiçbir yerde kesilmez
    document.title = '🕌 ' + onceki.ad + ' vakti girdi!';
    setTimeout(() => { document.title = 'NurVakit'; }, 60000);
  }
  sonVakitKey = key;
}

bolum('aylik-tablo', () => {
  $('aylikBtn').addEventListener('click', () => {
    const w = $('tabloWrap'); w.classList.toggle('acik');
    $('aylikBtn').textContent = w.classList.contains('acik') ? '📅 Aylık İmsakiyeyi Gizle' : '📅 Aylık İmsakiyeyi Göster';
  });
});

/* ============ HADİS + NASİHAT ============ */
bolum('hadis-nasihat', () => {
  const HADISLER = [
    ["Amellerin Allah'a en sevimli olanı, az da olsa devamlı olanıdır.", "Buhârî, Müslim"],
    ["Kolaylaştırınız, zorlaştırmayınız; müjdeleyiniz, nefret ettirmeyiniz.", "Buhârî"],
    ["Müslüman, elinden ve dilinden insanların güvende olduğu kimsedir.", "Buhârî, Müslim"],
    ["Sizin en hayırlınız, ahlâkı en güzel olanınızdır.", "Buhârî"],
    ["Kim Allah'a ve ahiret gününe inanıyorsa ya hayır söylesin ya da sussun.", "Buhârî, Müslim"],
    ["Hiçbiriniz kendisi için istediğini kardeşi için de istemedikçe iman etmiş olmaz.", "Buhârî, Müslim"],
    ["Temizlik imanın yarısıdır.", "Müslim"],
    ["Güzel söz sadakadır.", "Buhârî, Müslim"],
    ["Kuvvetli kimse, güreşte rakibini yenen değil, öfke anında kendine hâkim olandır.", "Buhârî, Müslim"],
    ["Allah sizin suretlerinize ve mallarınıza bakmaz; kalplerinize ve amellerinize bakar.", "Müslim"],
    ["İnsanlara merhamet etmeyene Allah da merhamet etmez.", "Buhârî, Müslim"],
    ["Kim bir kardeşinin ihtiyacını giderirse, Allah da onun ihtiyacını giderir.", "Buhârî, Müslim"],
    ["Cennet annelerin ayakları altındadır.", "Nesâî"],
    ["Komşusu açken tok yatan bizden değildir.", "Hâkim"],
    ["İki nimet vardır ki insanların çoğu bunlarda aldanmıştır: Sağlık ve boş vakit.", "Buhârî"],
    ["Utanmadıktan sonra dilediğini yap.", "Buhârî"],
    ["Veren el, alan elden üstündür.", "Buhârî, Müslim"],
    ["Bir hurmanın yarısıyla da olsa ateşten korunun.", "Buhârî, Müslim"],
    ["Kim susarsa kurtulur.", "Tirmizî"],
    ["Kardeşine tebessüm etmen sadakadır.", "Tirmizî"]
  ];
  const NASIHATLER = [
    ["İnsanların en âcizi dua etmeyen, en cimrisi de selâm vermeyendir.", "Hz. Ali (r.a.)'a nisbet edilir"],
    ["Ya olduğun gibi görün ya göründüğün gibi ol.", "Mevlânâ"],
    ["Ne kadar bilirsen bil, söylediklerin karşındakinin anladığı kadardır.", "Mevlânâ"],
    ["Nefsini bilen, Rabbini bilir.", "Meşhur hikmetli söz"],
    ["Tedbirde kusur etme, takdire bahane bulma.", "İslam büyüklerinden"],
    ["Az yemek, az uyumak, az konuşmak; hikmetin başıdır.", "Tasavvuf büyüklerinden"],
    ["Dünya üç gündür: Dün geçti, yarın belli değil; öyleyse bugünün kıymetini bil.", "Hasan-ı Basrî'ye nisbet edilir"],
    ["Kanaat, bitmeyen bir hazinedir.", "İslam büyüklerinden"],
    ["En büyük zenginlik gönül zenginliğidir.", "Hadis-i şeriften mülhem"],
    ["Öfke ile kalkan, zarar ile oturur.", "Atasözü"],
    ["Sabır acıdır, meyvesi tatlıdır.", "İslam büyüklerinden"],
    ["İlim, Çin'de de olsa gidip alınız; ilim öğrenmek her Müslümana farzdır.", "Meşhur rivayet"],
    ["Kimsenin duasını küçümseme; belki kurtuluşun bir 'âmin'e bakıyordur.", "İslam büyüklerinden"],
    ["Tevazu, insanı yükselten en sağlam merdivendir.", "İslam büyüklerinden"],
    ["Bugünün işini yarına bırakma; ecel, erteleyenleri sevmez.", "İslam büyüklerinden"]
  ];
  let hadisIdx = typeof kayitli.hadisIdx === 'number' ? kayitli.hadisIdx : Math.floor(Date.now()/86400000) % HADISLER.length;
  let nasihatIdx = typeof kayitli.nasihatIdx === 'number' ? kayitli.nasihatIdx : Math.floor(Date.now()/86400000) % NASIHATLER.length;
  function hadisGoster(){
    $('hadisMetin').textContent = '"' + HADISLER[hadisIdx][0] + '"';
    $('hadisKaynak').textContent = '— Hadis-i Şerif (' + HADISLER[hadisIdx][1] + ')';
  }
  function nasihatGoster(){
    $('nasihatMetin').textContent = '"' + NASIHATLER[nasihatIdx][0] + '"';
    $('nasihatKaynak').textContent = '— ' + NASIHATLER[nasihatIdx][1];
  }
  $('hadisYenile').addEventListener('click', () => { hadisIdx = (hadisIdx + 1) % HADISLER.length; hadisGoster(); stateYaz({hadisIdx: hadisIdx}); });
  $('nasihatYenile').addEventListener('click', () => { nasihatIdx = (nasihatIdx + 1) % NASIHATLER.length; nasihatGoster(); stateYaz({nasihatIdx: nasihatIdx}); });
  hadisGoster(); nasihatGoster();
});

/* ============ KIBLE ============ */
bolum('kible', () => {
  const KABE = {lat: 21.4225, lon: 39.8262};
  let kibleAci = 0, heading = null, duzHeading = null, hizaTitresimVerildi = false;

  function kibleHesapla(){
    const f1 = lat*Math.PI/180, f2 = KABE.lat*Math.PI/180, dl = (KABE.lon - lon)*Math.PI/180;
    const b = Math.atan2(Math.sin(dl), Math.cos(f1)*Math.tan(f2) - Math.sin(f1)*Math.cos(dl)) * 180/Math.PI;
    kibleAci = (b + 360) % 360;
    $('kibleDerece').textContent = kibleAci.toFixed(1) + '°';
    $('kibleAlt').textContent = (konumSecildi ? yerAdi : 'Bulunduğun yer') + ' için kıble, kuzeyden saat yönünde ' + kibleAci.toFixed(0) + '° yönündedir.';
    igneGuncelle();
  }
  function igneGuncelle(){
    const h = heading === null ? 0 : heading;
    const don = ((kibleAci - h) % 360 + 360) % 360;
    $('igne').style.transform = 'rotate(' + don + 'deg)';
    const fark = Math.min(don, 360 - don);
    const hz = $('hizali');
    if(heading === null){ hz.textContent = ''; hz.className = 'hizali'; return; }
    if(fark < 5){
      hz.textContent = '✓ Kıbleye döndün — Allah kabul etsin';
      hz.className = 'hizali tam';
      if(!hizaTitresimVerildi && navigator.vibrate){ navigator.vibrate(35); hizaTitresimVerildi = true; }
    } else {
      hizaTitresimVerildi = false;
      if(fark < 20){ hz.textContent = 'Çok yaklaştın, biraz daha dön'; hz.className = 'hizali yakin'; }
      else { hz.textContent = ''; hz.className = 'hizali'; }
    }
  }
  function orientHandler(e){
    let h = null;
    if(typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
    else if(typeof e.alpha === 'number') h = (360 - e.alpha) % 360;
    if(h === null) return;
    if(duzHeading === null) duzHeading = h;
    let fark = h - duzHeading;
    if(fark > 180) fark -= 360;
    if(fark < -180) fark += 360;
    duzHeading = (duzHeading + fark * 0.25 + 360) % 360;
    heading = duzHeading;
    igneGuncelle();
  }
  function pusulaBaslat(){
    if('ondeviceorientationabsolute' in window) window.addEventListener('deviceorientationabsolute', orientHandler, true);
    else window.addEventListener('deviceorientation', orientHandler, true);
    setTimeout(() => {
      if(heading === null){
        $('kibleIpucu').textContent = 'Cihazında pusula sensörü algılanmadı (masaüstünde normaldir). Yukarıdaki dereceyi kullanarak telefonunun pusula uygulamasıyla yönü bulabilirsin: ' + kibleAci.toFixed(0) + '°.';
      }
    }, 3000);
  }
  if(typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    $('pusulaBtn').style.display = 'inline-block';
    $('pusulaBtn').addEventListener('click', async () => {
      try{
        const izin = await DeviceOrientationEvent.requestPermission();
        if(izin === 'granted'){ pusulaBaslat(); $('pusulaBtn').style.display = 'none'; }
        else $('kibleIpucu').textContent = 'Pusula izni verilmedi. Kıble açısını yukarıdaki dereceyle manuel bulabilirsin: telefonundaki pusula uygulamasını aç, ' + kibleAci.toFixed(0) + '° yönüne dön.';
      }catch(e){}
    });
  } else {
    pusulaBaslat();
  }
  kibleHesapla();
  window.__kibleHesapla = kibleHesapla; // konum değişince dışarıdan tekrar çağrılabilir
});

/* ============ ZİKİRMATİK ============ */
bolum('zikirmatik', () => {
  const zikirler = [
    {ad:"Sübhanallah", anlam:"Allah'ı tüm noksanlıklardan tenzih ederim.", hedef:33},
    {ad:"Elhamdülillah", anlam:"Hamd, âlemlerin Rabbi olan Allah'a mahsustur.", hedef:33},
    {ad:"Allahu Ekber", anlam:"Allah en büyüktür.", hedef:33},
    {ad:"Salavat", anlam:"Allahümme salli alâ seyyidinâ Muhammed.", hedef:100},
    {ad:"La ilahe illallah", anlam:"Allah'tan başka ilah yoktur.", hedef:100}
  ];
  const zk = kayitli.zikir || {};
  let aktifZ = typeof zk.aktifZ === 'number' ? zk.aktifZ : 0;
  let zSayac = typeof zk.zSayac === 'number' ? zk.zSayac : 0;
  let zTur = typeof zk.zTur === 'number' ? zk.zTur : 0;
  const CEVRE = 2*Math.PI*90, halka = $('halka');
  halka.style.strokeDasharray = CEVRE; halka.style.strokeDashoffset = CEVRE;

  function zKaydet(){ stateYaz({zikir: {aktifZ: aktifZ, zSayac: zSayac, zTur: zTur}}); }
  function zGuncelle(mesaj){
    const z = zikirler[aktifZ];
    $('zSayi').textContent = zSayac; $('zHedef').textContent = z.hedef; $('zTur').textContent = zTur;
    $('zikirAdi').textContent = z.ad; $('zikirAnlam').textContent = z.anlam;
    halka.style.strokeDashoffset = CEVRE * (1 - Math.min(zSayac/z.hedef, 1));
    $('tamamMsg').textContent = mesaj || '';
  }
  $('cekBtn').addEventListener('click', () => {
    zSayac++;
    if(navigator.vibrate) navigator.vibrate(12);
    const z = zikirler[aktifZ];
    if(zSayac >= z.hedef){
      zTur++; zSayac = 0;
      if(navigator.vibrate) navigator.vibrate([60,40,60]);
      zGuncelle('Maşallah, ' + z.hedef + ' tamamlandı ✦');
      zKaydet();
      konfetiPatlat();
      return;
    }
    zGuncelle(); zKaydet();
  });
  $('sifirla').addEventListener('click', () => { zSayac = 0; zTur = 0; zGuncelle(); zKaydet(); });
  document.querySelectorAll('.zikir-sec button').forEach((b, i) => {
    b.addEventListener('click', () => {
      const aktifOlan = document.querySelector('.zikir-sec .aktif');
      if(aktifOlan) aktifOlan.classList.remove('aktif');
      b.classList.add('aktif');
      aktifZ = +b.dataset.i; zSayac = 0; zTur = 0; zGuncelle(); zKaydet();
    });
    if(i === aktifZ){ document.querySelectorAll('.zikir-sec button').forEach(x=>x.classList.remove('aktif')); b.classList.add('aktif'); }
  });
  zGuncelle();
});

/* ============ ESMAÜL HÜSNA ============ */
bolum('esma', () => {
  const esmalar = [
    ["الرَّحْمَٰن","Er-Rahmân","Rahmeti bütün yaratılmışları kuşatan, esirgeyen."],
    ["الرَّحِيم","Er-Rahîm","Müminlere âhirette sonsuz merhamet eden."],
    ["الْمَلِك","El-Melik","Bütün kâinatın gerçek sahibi ve hükümdarı."],
    ["السَّلَام","Es-Selâm","Her türlü eksiklikten uzak, esenlik veren."],
    ["الْغَفَّار","El-Gaffâr","Günahları tekrar tekrar bağışlayan."],
    ["الرَّزَّاق","Er-Rezzâk","Bütün canlıların rızkını veren."],
    ["الْعَلِيم","El-Alîm","Her şeyi hakkıyla bilen."],
    ["السَّمِيع","Es-Semî'","Her şeyi işiten."],
    ["الْبَصِير","El-Basîr","Her şeyi gören."],
    ["الْحَلِيم","El-Halîm","Cezalandırmada acele etmeyen, yumuşak davranan."],
    ["الْعَظِيم","El-Azîm","Büyüklüğü akıl sınırlarını aşan."],
    ["الشَّكُور","Eş-Şekûr","Az iyiliğe çok mükâfat veren."],
    ["الْحَفِيظ","El-Hafîz","Her şeyi koruyup gözeten."],
    ["الْكَرِيم","El-Kerîm","Cömertliği sonsuz olan."],
    ["الْوَدُود","El-Vedûd","Kullarını çok seven, sevilmeye lâyık olan."],
    ["الصَّبُور","Es-Sabûr","Çok sabırlı olan."],
    ["النُّور","En-Nûr","Âlemleri nurlandıran."],
    ["الْهَادِي","El-Hâdî","Hidayete erdiren, doğru yolu gösteren."]
  ];
  let sonEsma = 0;
  $('esmaBtn').addEventListener('click', () => {
    let i;
    do { i = Math.floor(Math.random()*esmalar.length); } while(i === sonEsma);
    sonEsma = i;
    const kart = document.querySelector('.esma-kart');
    kart.style.transition = 'opacity .18s ease';
    kart.style.opacity = '0.15';
    setTimeout(() => {
      $('esmaArapca').textContent = esmalar[i][0];
      $('esmaIsim').textContent = esmalar[i][1];
      $('esmaAnlam').textContent = esmalar[i][2];
      kart.style.opacity = '1';
    }, 160);
  });
});

/* ============ PEYGAMBERLER (Kur'an'da adı geçen 25 nebi) ============ */
bolum('peygamberler', () => {
const NEBILER = [
{ad:"Hz. Âdem", ar:"آدَم", unvan:"Safiyyullah — İlk insan ve ilk peygamber", donem:"İnsanlığın başlangıcı", bolge:"Cennet'ten yeryüzüne indirildi", kitap:"10 sayfalık suhuf verildiği rivayet edilir", aile:"Eşi: Hz. Havvâ · Oğulları: Hâbil, Kâbil, Şît (a.s.) ve diğerleri", omur:"Rivayetlere göre 930–1000 yıl", kuran:"Kur'an'da 25 yerde anılır",
hayat:["Allah'ın topraktan yaratıp ruh üflediği ilk insan ve ilk peygamberdir. Allah ona bütün varlıkların isimlerini öğretti ve meleklerden ona secde etmelerini istedi; İblis kibirlenerek secde etmedi ve kovuldu.","Eşi Hz. Havvâ ile cennete yerleştirildi; yasak ağaca yaklaşmaları üzerine yeryüzüne indirildiler. Tövbe ettiler ve Allah tövbelerini kabul etti. Bu, insanlığa 'hata edilir ama tövbe kapısı açıktır' dersinin ilkidir.","Yeryüzünde nesli çoğaldı; oğulları Hâbil ile Kâbil arasında yaşanan olay, Kur'an'da anlatılan ilk kan dökme hadisesidir. İnsanlığa tevhidi, ibadeti ve helâl-haramı öğretti."]},
{ad:"Hz. İdrîs", ar:"إدريس", unvan:"Yüce bir makama yükseltilen nebi", donem:"Hz. Âdem ile Hz. Nûh arası", bolge:"Bâbil veya Mısır bölgesi (rivayet)", kitap:"30 sayfalık suhuf verildiği rivayet edilir", aile:"Kaynaklarda eş ve çocukları hakkında kesin bilgi yoktur", omur:"Rivayete göre 365 yıl yeryüzünde kaldı", kuran:"Kur'an'da 2 yerde anılır",
hayat:["Kur'an'da 'sıddîk (dosdoğru) bir nebi' olarak övülür ve 'Biz onu yüce bir makama yükselttik' buyrulur (Meryem 56-57).","Rivayetlere göre kalemle yazı yazan, elbise diken ve yıldızlar ilmiyle uğraşan ilk insandır; ondan önce insanlar hayvan derisi giyerdi. İnsanlara ilmi, sabrı ve ibadeti öğretti.","Çok zikir ve ibadet ehli olduğu, gündüzleri oruç tutup sanatıyla kazandığını ihtiyaç sahiplerine dağıttığı nakledilir."]},
{ad:"Hz. Nûh", ar:"نُوح", unvan:"Neciyyullah — Ülü'l-azm peygamberlerin ilki", donem:"Tufan öncesi dönem", bolge:"Mezopotamya (Irak bölgesi rivayeti)", kitap:"Kendisine kitap verilmedi, şeriatla gönderildi", aile:"Oğulları: Sâm, Hâm, Yâfes ve iman etmeyen oğlu (Kenan/Yam). Eşi de iman etmeyenlerdendi (Tahrîm 10)", omur:"Kavmi içinde 950 yıl davet etti (Ankebût 14)", kuran:"Kur'an'da 43 yerde anılır; Nûh Suresi onun adını taşır",
hayat:["Putlara tapan kavmini 950 yıl boyunca gece gündüz, gizli açık tevhide çağırdı; pek azı dışında kimse iman etmedi, alay ve eziyetle karşılaştı.","Allah'ın emriyle karada gemiyi inşa etti; kavmi onunla alay ediyordu. Tufan gelince her canlıdan birer çift ile müminleri gemiye aldı. İman etmeyen oğlu 'dağa sığınırım' diyerek gemiyi reddetti ve boğuldu — nesep değil iman kurtarır dersi burada verilir.","Tufandan sonra gemi Cûdî'ye oturdu ve insanlık onun soyundan yeniden çoğaldı; bu yüzden kendisine 'ikinci Âdem' de denir."]},
{ad:"Hz. Hûd", ar:"هُود", unvan:"Âd kavminin peygamberi", donem:"Hz. Nûh'tan sonra", bolge:"Ahkâf bölgesi — Yemen/Hadramut", kitap:"Kitap verilmedi", aile:"Kaynaklarda ailesi hakkında ayrıntılı bilgi yoktur", omur:"Rivayete göre 400 yıl civarı yaşadı", kuran:"Kur'an'da 7 yerde anılır; Hûd Suresi onun adını taşır",
hayat:["Yüksek sütunlu binalar kuran, güç ve zenginlikleriyle şımaran Âd kavmine gönderildi. Kavmi 'Bizden daha güçlü kim var?' diyerek büyükleniyordu.","Onları tevhide çağırdı, nimetleri hatırlatarak şükre davet etti; fakat 'Sen bize bir tek Allah'a kulluk edelim diye mi geldin?' diyerek inkâr ettiler.","Bunun üzerine kavmi, yedi gece sekiz gün süren dondurucu ve kökten söken bir kasırga ile helâk edildi; Hz. Hûd ve iman edenler kurtarıldı."]},
{ad:"Hz. Sâlih", ar:"صَالِح", unvan:"Semûd kavminin peygamberi", donem:"Hz. Hûd'dan sonra", bolge:"Hicr bölgesi (bugünkü Medâin-i Sâlih, Suudi Arabistan)", kitap:"Kitap verilmedi", aile:"Kaynaklarda ailesi hakkında ayrıntılı bilgi yoktur", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 9 yerde anılır",
hayat:["Dağları oyup evler yapan, taş işçiliğinde usta Semûd kavmine gönderildi. Kavmi ondan peygamberliğini ispat için mucize istedi.","Allah'ın mucizesi olarak kayadan bir dişi deve çıkarıldı; su içme hakkı bir gün devenin, bir gün kavmindi ve deveye dokunulmaması emredildi.","Azgınlar deveyi kesti ve 'Haydi azabı getir' diyerek meydan okudu. Üç gün sonra korkunç bir sarsıntı ve sayha (çığlık) ile helâk oldular; Hz. Sâlih ve müminler kurtuldu."]},
{ad:"Hz. İbrâhim", ar:"إِبْرَاهِيم", unvan:"Halîlullah (Allah'ın dostu) — Ülü'l-azm", donem:"MÖ 2000'ler civarı (yaklaşık)", bolge:"Bâbil'de doğdu; Harran, Filistin, Mısır ve Mekke'de bulundu", kitap:"10 sayfalık suhuf verildi", aile:"Babası (veya amcası) put yapımcısı Âzer · Eşleri: Hz. Sâre ve Hz. Hâcer · Oğulları: Hz. İsmâil ve Hz. İshâk", omur:"Rivayete göre 175 yıl; kabri el-Halil (Filistin) şehrindedir", kuran:"Kur'an'da 69 yerde anılır; İbrâhim Suresi onun adını taşır",
hayat:["Putperest bir toplumda tevhidi tek başına haykırdı; yıldız, ay ve güneş üzerinden kavmine 'batıp gidenler ilah olamaz' dersini verdi. Putları kırıp baltayı en büyüğünün boynuna astı ve kavmini akılla yüzleştirdi.","Nemrut onu dev bir ateşe attırdı; Allah 'Ey ateş, İbrâhim'e serin ve selâmet ol' buyurdu ve ateş onu yakmadı. Ardından Harran'a, oradan Filistin ve Mısır'a hicret etti.","Yaşlılığında verilen oğlu İsmâil'i kurban etme imtihanına baba-oğul birlikte teslim oldular; Allah fidye olarak büyük bir kurban gönderdi. Kurban Bayramı bu teslimiyetin hatırasıdır.","Oğlu İsmâil ile birlikte Kâbe'yi inşa etti ve insanları hacca çağırdı. 'Müslüman' ismini bize o koydu; Peygamber Efendimiz (s.a.v.) onun soyundan ve duasının meyvesidir."]},
{ad:"Hz. Lût", ar:"لُوط", unvan:"Sodom halkının peygamberi", donem:"Hz. İbrâhim ile aynı dönem (yeğenidir)", bolge:"Sodom ve Gomore — Lût Gölü (Ölü Deniz) çevresi", kitap:"Kitap verilmedi", aile:"Hz. İbrâhim'in yeğeni · Eşi iman etmeyip helâk olanlardan oldu · Kızları vardı", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 27 yerde anılır",
hayat:["Hz. İbrâhim'e ilk iman edenlerdendir ve onunla birlikte hicret etti. Allah onu, tarihte görülmemiş bir ahlaksızlığı işleyen Sodom halkına peygamber gönderdi.","Kavmini yıllarca iffete ve tevhide çağırdı; onlar ise 'Şu temiz kalmak isteyenleri ülkenizden çıkarın' diyerek alay ettiler.","Melekler misafir olarak geldiğinde kavmin azgınlığı son haddine vardı. Sabaha karşı şehir alt üst edildi ve üzerlerine taş yağdırıldı; Hz. Lût ve ailesi kurtarıldı, geride kalan eşi ise helâk olanlardan oldu."]},
{ad:"Hz. İsmâil", ar:"إِسْمَاعِيل", unvan:"Zebîhullah (Allah için kurban edilmek istenen)", donem:"Hz. İbrâhim'in oğlu", bolge:"Mekke", kitap:"Kitap verilmedi", aile:"Babası: Hz. İbrâhim · Annesi: Hz. Hâcer · Cürhüm kabilesinden evlendi · 12 oğlu olduğu rivayet edilir", omur:"Rivayete göre 137 yıl", kuran:"Kur'an'da 12 yerde anılır",
hayat:["Bebekken annesi Hz. Hâcer ile ıssız Mekke vadisine bırakıldı. Annesi Safâ ile Merve arasında su ararken ayağının dibinden Zemzem suyu fışkırdı; hacdaki sa'y ibadeti bu koşunun hatırasıdır.","Babası rüyasında onu kurban ettiğini görünce genç İsmâil 'Babacığım, emrolunduğun şeyi yap; inşallah beni sabredenlerden bulacaksın' dedi. Bu teslimiyete karşılık Allah fidye olarak bir kurban gönderdi.","Babasıyla birlikte Kâbe'nin temellerini yükseltti. 'Sadıku'l-va'd' (sözüne sadık) olarak övülür; Araplar'ın ve Peygamber Efendimiz'in (s.a.v.) atasıdır."]},
{ad:"Hz. İshâk", ar:"إِسْحَاق", unvan:"Müjdelenmiş nebi", donem:"Hz. İbrâhim'in oğlu", bolge:"Filistin (Ken'an diyarı)", kitap:"Kitap verilmedi", aile:"Babası: Hz. İbrâhim · Annesi: Hz. Sâre · Eşi: Refeka (rivayet) · Oğulları: Hz. Yâkub ve Îs (Esav)", omur:"Rivayete göre 180 yıl", kuran:"Kur'an'da 17 yerde anılır",
hayat:["Hz. Sâre'nin yaşlılığında melekler tarafından müjdelenen oğuldur; annesi bu müjdeye şaşırıp gülmüştü. Kur'an onu 'bilgin bir oğul' müjdesi olarak anar.","Babasının ardından Filistin bölgesinde peygamberlik yaptı; halkı tevhide çağırdı, bereketli bir nesle vesile oldu.","İsrâiloğulları'na gönderilen peygamberlerin tamamı onun soyundandır; oğlu Hz. Yâkub ve torunu Hz. Yûsuf da peygamberdir."]},
{ad:"Hz. Yâkub", ar:"يَعْقُوب", unvan:"İsrâîl — İsrâiloğulları'nın atası", donem:"Hz. İshâk'ın oğlu", bolge:"Ken'an diyarı (Filistin); ömrünün sonunda Mısır", kitap:"Kitap verilmedi", aile:"Babası: Hz. İshâk · 12 oğlu vardı; en sevdiği Hz. Yûsuf ve Bünyamin idi", omur:"Rivayete göre 147 yıl", kuran:"Kur'an'da 16 yerde anılır",
hayat:["Lakabı 'İsrâîl'dir; on iki oğlundan İsrâiloğulları'nın on iki kolu türemiştir.","Oğlu Yûsuf'u kaybettiğinde yıllarca 'güzel bir sabırla' sabretti; üzüntüden gözlerine perde indi ama 'Ben derdimi ve hüznümü yalnız Allah'a arz ederim' dedi. Sabrın ve tevekkülün sembolüdür.","Yûsuf'un gömleği yüzüne sürülünce gözleri açıldı ve ailesiyle Mısır'a göç etti. Ölüm döşeğinde evlatlarına 'Benden sonra kime kulluk edeceksiniz?' diye sorarak tevhid vasiyetiyle ayrıldı."]},
{ad:"Hz. Yûsuf", ar:"يُوسُف", unvan:"Sıddîk — Kıssası 'ahsenü'l-kasas' (kıssaların en güzeli)", donem:"Hz. Yâkub'un oğlu", bolge:"Ken'an'da doğdu, Mısır'da yaşadı", kitap:"Kitap verilmedi", aile:"Babası: Hz. Yâkub · Mısır'da evlendiği ve çocukları olduğu rivayet edilir", omur:"Rivayete göre 110 yıl", kuran:"Kur'an'da 27 yerde anılır; Yûsuf Suresi baştan sona onun kıssasıdır",
hayat:["Çocukken on bir yıldızın, güneşin ve ayın kendisine secde ettiğini rüyasında gördü. Kıskanan kardeşleri onu kuyuya attı; kervancılar bulup Mısır'da köle olarak sattı.","Mısır azizinin evinde büyüdü. Evin hanımının (Züleyha) çirkin teklifine 'Allah'a sığınırım' diyerek direndi; iftiraya uğrayıp yıllarca zindanda kaldı. Zindanda dahi tevhidi anlattı ve rüya tabir etti.","Kralın rüyasını (yedi bolluk, yedi kıtlık yılı) tabir etmesi üzerine zindandan çıkarılıp Mısır'ın hazine bakanı yapıldı. Kıtlık yıllarında ülkeyi yönetti.","Erzak için gelen kardeşlerini tanıdı, sonunda 'Bugün size kınama yok' diyerek hepsini affetti ve ailesini Mısır'a getirtti. Kıssası; iffetin, sabrın ve affetmenin zirvesidir."]},
{ad:"Hz. Eyyûb", ar:"أَيُّوب", unvan:"Sabır kahramanı", donem:"Hz. Yâkub'un torunlarından olduğu rivayet edilir", bolge:"Şam/Havran bölgesi (rivayet)", kitap:"Kitap verilmedi", aile:"Eşi: Rahime Hatun (rivayet) — hastalığında ona sadakatle baktı", omur:"Rivayete göre 90'ın üzerinde yaşadı", kuran:"Kur'an'da 4 yerde anılır",
hayat:["Büyük servet, evlat ve sağlık sahibiyken hepsiyle imtihan edildi: malı gitti, evlatlarını kaybetti ve yıllarca ağır bir hastalığa müptela oldu.","Bütün bunlara rağmen bir an bile isyan etmedi; 'Başıma bu dert geldi ama Sen merhametlilerin en merhametlisisin' diye dua etti. Eşi Rahime, en zor günlerinde ona sadakatle hizmet etti.","Allah 'Ayağını yere vur!' buyurdu; çıkan su ile yıkanınca şifa buldu. Malı ve evlatları kat kat geri verildi. 'Eyyûb sabrı' deyimi ondan kalmıştır."]},
{ad:"Hz. Şuayb", ar:"شُعَيْب", unvan:"Hatîbü'l-Enbiyâ (Peygamberlerin hatibi)", donem:"Hz. Mûsâ'dan hemen önce", bolge:"Medyen ve Eyke (Akabe Körfezi çevresi)", kitap:"Kitap verilmedi", aile:"Yaygın görüşe göre Hz. Mûsâ'nın kayınpederidir; kızlarından birini Mûsâ ile evlendirdi", omur:"Uzun yaşadığı rivayet edilir", kuran:"Kur'an'da 11 yerde anılır",
hayat:["Ticarette hile yapan, ölçü ve tartıda insanları aldatan Medyen halkına gönderildi. Etkili ve güzel konuşmasından dolayı 'Peygamberlerin Hatibi' diye anılır.","'Ölçüyü ve tartıyı adaletle tam yapın, insanların mallarını eksiltmeyin' diyerek hem imana hem ticaret ahlakına çağırdı; kavmi ise onu taşlamakla tehdit etti.","İnkârda direten kavmi korkunç bir sarsıntı ve gölge günü azabıyla helâk edildi. Mısır'dan kaçıp Medyen'e gelen genç Mûsâ'ya kucak açtı ve ona sekiz-on yıl çobanlık yaptırıp kızıyla evlendirdi."]},
{ad:"Hz. Mûsâ", ar:"مُوسَى", unvan:"Kelîmullah (Allah ile konuşan) — Ülü'l-azm", donem:"MÖ 13. yüzyıl civarı (yaklaşık)", bolge:"Mısır'da doğdu; Medyen, Sina ve Tîh çölü", kitap:"Tevrat", aile:"Annesi vahiyle onu Nil'e bıraktı · Kardeşi: Hz. Hârûn · Eşi: Hz. Şuayb'ın kızı (Safurâ olduğu rivayet edilir)", omur:"Rivayete göre 120 yıl", kuran:"Kur'an'da en çok anılan peygamberdir: yaklaşık 136 yer",
hayat:["Firavun'un erkek bebekleri öldürttüğü yıl doğdu; annesi vahiyle onu bir sandık içinde Nil'e bıraktı. Sandık Firavun'un sarayına ulaştı ve Mûsâ, düşmanının sarayında büyüdü.","Bir yanlışlık sonucu bir Kıptî'nin ölümüne sebep olunca Medyen'e kaçtı; orada Hz. Şuayb'ın yanında yıllarca çobanlık yaptı ve kızıyla evlendi. Dönüş yolunda Tûr dağında ateş gördü ve Allah onunla vasıtasız konuşarak peygamberlik verdi.","Kardeşi Hârûn ile Firavun'a gitti. Asâsının yılan olması ve elinin bembeyaz parlaması (yed-i beyzâ) mucizelerini gösterdi; sihirbazlar secdeye kapandı. Firavun zulmü artırınca İsrâiloğulları ile Mısır'dan çıktı — asâsıyla vurunca deniz yarıldı, Firavun ordusuyla boğuldu.","Tûr'da kırk gece sonunda Tevrat verildi; kavmi bu sırada buzağıya tapmıştı. Ömrü, nankör kavmini eğitmekle geçti. Azim, cesaret ve hak karşısında zalimden korkmamanın sembolüdür."]},
{ad:"Hz. Hârûn", ar:"هَارُون", unvan:"Hz. Mûsâ'nın veziri ve kardeşi", donem:"Hz. Mûsâ ile aynı dönem", bolge:"Mısır ve Sina", kitap:"Tevrat'ın tebliğinde Mûsâ'ya ortak oldu", aile:"Kardeşi: Hz. Mûsâ", omur:"Rivayete göre Mûsâ'dan önce vefat etti, 120'ye yakın yaşadı", kuran:"Kur'an'da 20 yerde anılır",
hayat:["Hz. Mûsâ'nın 'Dilimdeki düğümü çöz, kardeşim Hârûn'u bana yardımcı kıl' duası üzerine peygamberlikle görevlendirildi; fasih ve tatlı dilliydi.","Firavun'a karşı tebliğde Mûsâ'nın sağ kolu oldu. Mûsâ Tûr'a çıktığında kavmin başında kaldı; buzağıya tapmalarına yumuşaklıkla engel olmaya çalıştı ve topluluğu bölmemek için sabırla bekledi.","Hilm (yumuşak huyluluk) ve merhametin temsilcisidir; Peygamber Efendimiz (s.a.v.), Hz. Ali'ye 'Sen bana, Hârûn'un Mûsâ'ya olduğu konumdasın' buyurmuştur."]},
{ad:"Hz. Zülkifl", ar:"ذُو الْكِفْل", unvan:"Sabır ve salâh ehli nebi", donem:"Hz. Eyyûb'dan sonra (rivayet)", bolge:"Şam veya Irak bölgesi (rivayet)", kitap:"Kitap verilmedi", aile:"Bir rivayete göre Hz. Eyyûb'un oğlu Bişr'dir", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 2 yerde, sabredenler ve salihlerle birlikte anılır",
hayat:["Kur'an'da İsmâil ve İdrîs (a.s.) ile birlikte 'Hepsi sabredenlerdendi; onları rahmetimize soktuk, çünkü salihlerdendi' buyrularak övülür.","İsminin 'kefalet sahibi' anlamından hareketle; gündüz oruç tutmayı, gece ibadet etmeyi ve öfkelenmeden hükmetmeyi üstlendiği için bu adı aldığı rivayet edilir.","Hayatının ayrıntıları hakkında az bilgi ulaşmıştır; sözünde durmanın, sabrın ve adaletli yöneticiliğin örneği olarak anılır."]},
{ad:"Hz. Dâvûd", ar:"دَاوُد", unvan:"Halife-nebi — hem hükümdar hem peygamber", donem:"MÖ 10. yüzyıl civarı", bolge:"Kudüs merkezli İsrâiloğulları devleti", kitap:"Zebûr", aile:"Oğlu: Hz. Süleymân", omur:"Rivayete göre 100 yıl", kuran:"Kur'an'da 16 yerde anılır",
hayat:["Gençken, Tâlût'un ordusunda zalim komutan Câlût'u (Golyat) sapanıyla öldürdü; Allah ona hem hükümdarlık hem peygamberlik ve hikmet verdi.","Kendisine Zebûr indirildi. Sesi o kadar güzeldi ki tesbih ettiğinde dağlar ve kuşlar ona eşlik ederdi. Demir elinde yumuşatıldı; zırh yapıp elinin emeğiyle geçinir, devlet malı yemezdi.","Gündüz oruç tutar, gecenin bir kısmında ibadet ederdi; 'Dâvûd orucu' (bir gün tutup bir gün tutmama) Peygamberimizce 'orucun en faziletlisi' olarak övülmüştür. Adaletli yargılamanın sembolüdür."]},
{ad:"Hz. Süleymân", ar:"سُلَيْمَان", unvan:"Hem nebi hem muhteşem hükümdar", donem:"MÖ 10. yüzyıl civarı", bolge:"Kudüs merkezli büyük bir devlet", kitap:"Kitap verilmedi; Zebûr'un şeriatıyla hükmetti", aile:"Babası: Hz. Dâvûd", omur:"Rivayete göre 50-60 yıl civarı yaşadı", kuran:"Kur'an'da 17 yerde anılır",
hayat:["'Rabbim, bana benden sonra kimseye nasip olmayacak bir mülk ver' duası kabul edildi: rüzgâr emrine verildi, cinler onun için çalıştı, kuşların dilini bilirdi.","Ordusuyla giderken vadideki karıncanın 'Yuvalarınıza girin, Süleymân'ın ordusu sizi ezmesin' dediğini duydu ve tebessümle Allah'a şükretti. Hüdhüd kuşunun haberiyle güneşe tapan Sebe melikesi Belkıs'ı imana davet etti; tahtı göz açıp kapayıncaya kadar getirtildi ve Belkıs iman etti.","Bu muazzam saltanata rağmen 'Bu, Rabbimin lütfundandır; şükür mü yoksa nankörlük mü edeceğim diye beni sınıyor' derdi. Zenginliğin şükürle, gücün adaletle taşınabileceğinin örneğidir."]},
{ad:"Hz. İlyâs", ar:"إِلْيَاس", unvan:"Ba'l putuyla mücadele eden nebi", donem:"Hz. Süleymân'dan sonra", bolge:"Ba'lebek (Lübnan) çevresi", kitap:"Kitap verilmedi", aile:"Hz. Hârûn'un soyundan olduğu rivayet edilir", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 2 yerde anılır",
hayat:["İsrâiloğulları'nın 'Ba'l' adlı puta tapmaya başladığı dönemde gönderildi. 'Yaratanların en güzelini bırakıp Ba'l'e mi yalvarıyorsunuz?' diyerek kavmini uyardı.","Kavminin inkârı üzerine yıllarca kuraklıkla imtihan edildiler; İlyâs (a.s.) dua edince yağmur yağdı, fakat çoğu yine imana gelmedi.","Kur'an'da 'Selâm olsun İlyâs'a' buyrularak sonraki nesiller arasında güzel bir nam bırakıldığı bildirilir. Halk kültüründeki 'Hızır-İlyas' (Hıdırellez) anmaları onun ismiyle ilişkilendirilir."]},
{ad:"Hz. Elyesa", ar:"الْيَسَع", unvan:"Hz. İlyâs'ın halefi", donem:"Hz. İlyâs'tan sonra", bolge:"İsrâiloğulları arasında (Şam/Filistin bölgesi)", kitap:"Kitap verilmedi", aile:"Kaynaklarda ailesi hakkında kesin bilgi yoktur", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 2 yerde, 'hayırlılardan' olarak anılır",
hayat:["Hz. İlyâs'ın yetiştirdiği ve kendisinden sonra İsrâiloğulları'na peygamber olan zâttır.","Kur'an'da İsmâil ve Zülkifl (a.s.) ile birlikte anılır ve 'Hepsi hayırlı kimselerdendi' buyrulur.","Kavmini tevhid üzere tutmaya çalıştı; vefatından sonra İsrâiloğulları yeniden bozuldu ve bu bozulma sonraki peygamberlerin gönderilmesine zemin oldu."]},
{ad:"Hz. Yûnus", ar:"يُونُس", unvan:"Zünnûn (Balık sahibi)", donem:"MÖ 8. yüzyıl civarı (rivayet)", bolge:"Ninova (bugünkü Musul, Irak)", kitap:"Kitap verilmedi", aile:"Kaynaklarda ailesi hakkında kesin bilgi yoktur", omur:"Kesin bilgi yoktur", kuran:"Kur'an'da 4 yerde anılır; Yûnus Suresi onun adını taşır",
hayat:["Yüz bini aşkın nüfuslu Ninova halkına gönderildi. Uzun davetine rağmen iman etmeyince, ilahi izni beklemeden öfkeyle şehri terk edip bir gemiye bindi.","Fırtınada kura ona çıkınca denize atıldı ve büyük bir balık onu yuttu. Karanlıklar içinde 'Lâ ilâhe illâ ente sübhâneke innî küntü mine'z-zâlimîn' (Senden başka ilah yoktur, Seni tenzih ederim, ben zalimlerden oldum) diye dua etti — bu dua bugün de sıkıntı anlarının duasıdır.","Allah onu affedip sahile çıkardı. Bu arada Ninova halkı topluca tövbe etmişti; Kur'an'da azap gelmeden iman edip kurtulan tek kavim olarak anılırlar. Yûnus (a.s.) dönüp onlara yeniden rehberlik etti."]},
{ad:"Hz. Zekeriyyâ", ar:"زَكَرِيَّا", unvan:"Mihrap ehli, duası kabul edilen nebi", donem:"Hz. Îsâ'dan hemen önce", bolge:"Kudüs", kitap:"Kitap verilmedi; Tevrat ile hükmetti", aile:"Eşi: Elisa (rivayet) · Oğlu: Hz. Yahyâ · Hz. Meryem'in bakımını üstlendi", omur:"Rivayete göre 100 yaş civarında şehit edildi", kuran:"Kur'an'da 7 yerde anılır",
hayat:["Kudüs'te marangozluk yapar, elinin emeğiyle geçinirdi. Hz. Meryem'in bakımını üstlendi; onun yanına her girişinde mevsimsiz rızıklar görür, 'Bu sana nereden?' diye sorardı. Meryem 'Allah katından' deyince Rabbine yöneldi.","Saçları ağarmış, kemikleri zayıflamış hâlde 'Rabbim, beni tek başıma bırakma' diye gizlice dua etti. Yaşlı hâline ve eşinin kısırlığına rağmen kendisine Yahyâ müjdelendi — ümitsizliğe düşmeden dua etmenin sembolüdür.","Rivayete göre zalimler tarafından şehit edildi. Hayatı; helâl kazancın, hizmetin ve son nefese kadar duanın örneğidir."]},
{ad:"Hz. Yahyâ", ar:"يَحْيَى", unvan:"Hasûr (dünyaya değer vermeyen), çocukken hikmet verilen nebi", donem:"Hz. Îsâ ile aynı dönem", bolge:"Kudüs ve Ürdün çevresi", kitap:"Kitap verilmedi; Tevrat'ı tasdik etti", aile:"Babası: Hz. Zekeriyyâ", omur:"Genç yaşta şehit edildi (rivayete göre 30'lu yaşlarında)", kuran:"Kur'an'da 5 yerde anılır",
hayat:["Daha önce kimseye verilmemiş bir isimle, babası Zekeriyyâ'ya mucize olarak müjdelendi. Kur'an'da 'Ey Yahyâ, kitaba kuvvetle sarıl!' buyrulur ve kendisine daha çocukken hikmet verildiği bildirilir.","Son derece zâhid yaşadı; dünyaya hiç meyletmedi, anne babasına iyiliği ve gönül inceliğiyle övüldü. Hz. Îsâ'yı ilk tasdik edenlerdendir.","Zalim yöneticinin gayrimeşru bir nikâh isteğine hak adına karşı çıktığı için şehit edildi. Kur'an'da 'Doğduğu gün, öleceği gün ve diriltileceği gün ona selâm olsun' buyrulur."]},
{ad:"Hz. Îsâ", ar:"عِيسَى", unvan:"Rûhullah ve Kelimetullah — Ülü'l-azm", donem:"Miladi takvimin başlangıcı", bolge:"Filistin (Beytüllahim'de doğdu, Nâsıra'da yaşadı)", kitap:"İncil", aile:"Annesi: Hz. Meryem — babasız yaratıldı. Evlenmedi", omur:"33 yaşında göğe yükseltildiği rivayet edilir", kuran:"Kur'an'da 25 yerde anılır; annesi Meryem 34 yerde anılır ve bir sure onun adını taşır",
hayat:["İffet âbidesi Hz. Meryem'den babasız dünyaya geldi; Kur'an bu yaratılışı Hz. Âdem'in yaratılışına benzetir. Beşikteyken konuşarak 'Ben Allah'ın kuluyum; O bana kitap verdi ve beni peygamber yaptı' dedi ve annesini iftiralardan temize çıkardı.","Allah'ın izniyle büyük mucizeler gösterdi: çamurdan kuş yapıp üflediğinde canlanır, anadan doğma körü ve alaca hastasını iyileştirir, ölüleri diriltirdi. Havâriler ona destek oldu; kendisine İncil verildi.","İsrâiloğulları'nın azgınlarına karşı tevhidi savundu ve kendisinden sonra gelecek 'Ahmed' isimli peygamberi müjdeledi. Onu öldürmek istediler; fakat Kur'an'ın bildirdiğine göre 'onu öldüremediler ve asamadılar', Allah onu kendi katına yükseltti. Müslümanlar onu Allah'ın kulu ve elçisi olarak sever."]},
{ad:"Hz. Muhammed (s.a.v.)", ar:"مُحَمَّد ﷺ", unvan:"Hâtemü'l-Enbiyâ (Peygamberlerin sonuncusu), Habîbullah, Âlemlere rahmet", donem:"571 – 632 (Miladi)", bolge:"Mekke'de doğdu, Medine'ye hicret etti", kitap:"Kur'an-ı Kerim", aile:"Babası: Abdullah · Annesi: Âmine · Dedesi: Abdülmuttalib · İlk eşi: Hz. Hatice; sonra Hz. Sevde, Hz. Âişe, Hz. Hafsa, Hz. Zeyneb, Hz. Ümmü Seleme ve diğer validelerimiz · Çocukları: Kâsım, Abdullah, İbrâhim, Zeyneb, Rukıyye, Ümmü Gülsüm, Fâtıma (r.anhüm)", omur:"63 yıl (571-632); kabri Medine'de Mescid-i Nebevi içindedir", kuran:"Kur'an'da adıyla 4 yerde ('Ahmed' olarak 1 yerde) anılır; Muhammed Suresi onun adını taşır",
hayat:["571'de Mekke'de doğdu; doğmadan babasını, altı yaşında annesini kaybetti. Dedesi, sonra amcası Ebû Tâlib'in himayesinde büyüdü. Gençliğinde 'el-Emîn' (güvenilir) diye anıldı; 25 yaşında Hz. Hatice ile evlendi ve ona vefayla bağlı kaldı.","40 yaşında, Hira mağarasında Cebrâil (a.s.) 'Oku!' emriyle ilk vahyi getirdi. 13 yıl Mekke'de tevhidi tebliğ etti; işkence, boykot ve alaya sabretti. Tâif'te taşlandığında dahi beddua etmedi. Miraç mucizesiyle huzur-u ilahiye yükseldi ve beş vakit namaz bu gecede farz kılındı.","622'de Medine'ye hicret etti; İslam kardeşliğine dayanan bir toplum ve devlet kurdu. Bedir, Uhud ve Hendek'te müşriklerle mücadele etti; Hudeybiye barışı ve 630'daki Mekke fethinde 'Bugün size kınama yok, hepiniz serbestsiniz' diyerek eşsiz bir af örneği gösterdi.","632'de Veda Haccı'nda yüz binlerce sahabiye insan haklarının özeti sayılan Veda Hutbesi'ni okudu: 'Ey insanlar! Rabbiniz birdir, atanız birdir…' Aynı yıl Medine'de vefat etti. O; eşine, komşusuna, yetime, düşmanına bile merhametiyle 'üsve-i hasene' (en güzel örnek) olarak âlemlere rahmet gönderilmiştir. Allahümme salli alâ Muhammed."]}
];

  const nebiGrid = $('nebiGrid');
  NEBILER.forEach((n, i) => {
    const b = document.createElement('button');
    b.className = 'nebi-chip sirala-giris';
    b.style.animationDelay = Math.min(i * 0.02, 0.5) + 's';
    b.textContent = n.ad.replace('Hz. ','').replace(' (s.a.v.)',' ﷺ');
    b.addEventListener('click', () => nebiAc(i, b));
    nebiGrid.appendChild(b);
  });
  function nebiAc(i, chip){
    document.querySelectorAll('.nebi-chip').forEach(c => c.classList.remove('aktif'));
    chip.classList.add('aktif');
    const n = NEBILER[i];
    $('nArapca').textContent = n.ar;
    $('nAd').textContent = n.ad;
    $('nUnvan').textContent = n.unvan;
    $('nBilgi').innerHTML =
      '<div class="bilgi"><div class="b-ad">Dönemi</div><div class="b-deger">' + n.donem + '</div></div>' +
      '<div class="bilgi"><div class="b-ad">Bölgesi / Kavmi</div><div class="b-deger">' + n.bolge + '</div></div>' +
      '<div class="bilgi"><div class="b-ad">Kitabı</div><div class="b-deger">' + n.kitap + '</div></div>' +
      '<div class="bilgi"><div class="b-ad">Ömrü</div><div class="b-deger">' + n.omur + '</div></div>' +
      '<div class="bilgi genis"><div class="b-ad">Ailesi</div><div class="b-deger">' + n.aile + '</div></div>' +
      '<div class="bilgi genis"><div class="b-ad">Kur\'an\'da</div><div class="b-deger">' + n.kuran + '</div></div>';
    $('nHayat').innerHTML = n.hayat.map(p => '<p>' + p + '</p>').join('');
    const d = $('nebiDetay');
    d.classList.add('acik');
    d.classList.remove('sirala-giris'); void d.offsetWidth; d.classList.add('sirala-giris');
    d.scrollIntoView({behavior:'smooth', block:'start'});
  }
});

/* ============ DİNİ GÜNLER (Diyanet 2026) ============ */
bolum('dini-gunler', () => {
  const DINI_GUNLER = [
    {ad:"Miraç Kandili", t:"2026-01-15", g:"Perşembe"},
    {ad:"Berat Kandili", t:"2026-02-02", g:"Pazartesi"},
    {ad:"Ramazan Başlangıcı", t:"2026-02-19", g:"Perşembe"},
    {ad:"Kadir Gecesi", t:"2026-03-16", g:"Pazartesi"},
    {ad:"Ramazan Bayramı (1. Gün)", t:"2026-03-20", g:"Cuma"},
    {ad:"Kurban Bayramı Arefesi", t:"2026-05-26", g:"Salı"},
    {ad:"Kurban Bayramı (1. Gün)", t:"2026-05-27", g:"Çarşamba"},
    {ad:"Hicri Yılbaşı (1448)", t:"2026-06-16", g:"Salı"},
    {ad:"Aşure Günü", t:"2026-06-25", g:"Perşembe"},
    {ad:"Mevlid Kandili", t:"2026-08-24", g:"Pazartesi"},
    {ad:"Üç Ayların Başlangıcı", t:"2026-12-10", g:"Perşembe"},
    {ad:"Regaib Kandili", t:"2026-12-10", g:"Perşembe"}
  ];
  const bugun = new Date(); bugun.setHours(0,0,0,0);
  const liste = $('gunList');
  let ilkGelecek = true;
  const ay = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  DINI_GUNLER.forEach((dg, i) => {
    const t = new Date(dg.t + 'T00:00:00');
    const farkGun = Math.round((t - bugun)/86400000);
    const el = document.createElement('div');
    el.className = 'dgun sirala-giris' + (farkGun < 0 ? ' gecmis' : (ilkGelecek ? ' siradaki' : ''));
    el.style.animationDelay = (i * 0.05) + 's';
    if(farkGun >= 0) ilkGelecek = false;
    const sag = farkGun < 0 ? '✓<small>geçti</small>' : farkGun === 0 ? 'Bugün!<small>🌙</small>' : farkGun + '<small>gün kaldı</small>';
    el.innerHTML = '<div><div class="ad">' + dg.ad + '</div><div class="tarih">' + t.getDate() + ' ' + ay[t.getMonth()] + ' ' + t.getFullYear() + ', ' + dg.g + '</div></div><div class="kalan-gun">' + sag + '</div>';
    liste.appendChild(el);
  });
});

/* ============ RESİMLER (Wikimedia Commons — özgür lisanslı, gündüz+gece) ============ */
bolum('resimler', () => {
  const FOTOLAR = [
    {grup:"mekke", ad:"Kâbe — Hac Mevsimi (Gündüz)", dosya:"The Kaaba during Hajj.jpg"},
    {grup:"mekke", ad:"Kâbe — Mescid-i Haram", dosya:"Kaaba 111.jpg"},
    {grup:"mekke", ad:"Kâbe — Tavaf Anı", dosya:"Final circulation of the Kaaba.jpg"},
    {grup:"mekke", ad:"Kâbe — Yakın Görünüm", dosya:"Kaaba Mecca.jpg"},
    {grup:"mekke", ad:"Mescid-i Haram Avlusu", dosya:"Mecca Kaaba.JPG"},
    {grup:"mekke", ad:"Kâbe — Gece", dosya:"Kaaba at night.jpg"},
    {grup:"medine", ad:"Mescid-i Nebevi — Gündüz", dosya:"Al-Masjid an-Nabawi.jpg"},
    {grup:"medine", ad:"Mescid-i Nebevi — Gece", dosya:"Nabawi at night (2024).jpg"},
    {grup:"medine", ad:"Mescid-i Nebevi — Gece Görünümü", dosya:"Nabavi Mosque at Night.jpg"},
    {grup:"medine", ad:"Yeşil Kubbe (Kubbe-i Hadrâ)", dosya:"Rawdah (The Green Dome) front.jpg"},
    {grup:"medine", ad:"Yeşil Kubbe ve Minare", dosya:"The Green Dome, Masjid Nabawi, Madina.jpg"},
    {grup:"medine", ad:"Mescid-i Nebevi Şemsiyeleri", dosya:"Payung Tengah Masjid Nabawi.jpg"}
  ];

  async function indir(url, f, btn){
    const eski = btn.textContent;
    btn.disabled = true; btn.textContent = 'İniyor…';
    const dosyaAdi = 'nurvakit-' + f.ad.toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]+/g,'-').replace(/(^-|-$)/g,'') + '.jpg';
    try{
      const r = await fetch(url, {mode:'cors', cache:'no-store'});
      if(!r.ok) throw new Error('indirilemedi');
      const blob = await r.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = dosyaAdi;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click(); // izin istemeden doğrudan indirir — PC ve mobilde aynı davranış
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 8000);
      btn.textContent = '✓ İndirildi';
    }catch(e){
      const a = document.createElement('a');
      a.href = url; a.download = dosyaAdi; a.rel = 'noopener';
      document.body.appendChild(a); a.click(); a.remove();
      btn.textContent = '✓ İndirildi';
    }
    setTimeout(() => { btn.textContent = eski; btn.disabled = false; }, 2200);
  }

  const lb = $('lightbox');
  let lbFoto = null;
  function lightboxAc(kucuk, buyuk, f){
    lbFoto = {url: buyuk, f: f};
    $('lbImg').src = kucuk;
    const on = new Image();
    on.onload = () => { if(lbFoto && lbFoto.url === buyuk) $('lbImg').src = buyuk; };
    on.src = buyuk;
    lb.classList.add('acik');
  }
  $('lbKapat').addEventListener('click', () => lb.classList.remove('acik'));
  lb.addEventListener('click', e => { if(e.target === lb) lb.classList.remove('acik'); });
  $('lbIndir').addEventListener('click', e => { if(lbFoto) indir(lbFoto.url, lbFoto.f, e.target); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') lb.classList.remove('acik'); });

  async function galeriYukle(){
    const basliklar = FOTOLAR.map(f => 'File:' + f.dosya).join('|');
    let sozluk = {};
    try{
      const api = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*&titles=' + encodeURIComponent(basliklar);
      const r = await fetch(api);
      const j = await r.json();
      const pages = (j.query && j.query.pages) || {};
      Object.values(pages).forEach(p => {
        if(p.imageinfo && p.imageinfo[0]){
          sozluk[p.title.replace('File:','')] = {kucuk: p.imageinfo[0].thumburl, buyuk: p.imageinfo[0].url};
        }
      });
    }catch(e){ /* API başarısızsa Special:FilePath yedeği kullanılır */ }

    FOTOLAR.forEach((f, i) => {
      const cozum = sozluk[f.dosya];
      const yedek = 'https://commons.wikimedia.org/wiki/Special:FilePath/' + encodeURIComponent(f.dosya.replace(/ /g,'_'));
      const kucuk = cozum ? cozum.kucuk : yedek + '?width=900';
      const buyuk = cozum ? cozum.buyuk : yedek;
      const el = document.createElement('div');
      el.className = 'foto sirala-giris';
      el.style.animationDelay = (i * 0.05) + 's';
      el.innerHTML =
        '<div class="kutu"><img loading="lazy" alt="' + f.ad + '"></div>' +
        '<div class="alt"><div class="baslik">' + f.ad + '</div><button class="indir">⬇ İndir</button></div>';
      const img = el.querySelector('img');
      img.src = kucuk;
      img.onerror = () => { el.style.display = 'none'; };
      el.querySelector('.kutu').addEventListener('click', () => lightboxAc(kucuk, buyuk, f));
      el.querySelector('.indir').addEventListener('click', ev => { ev.stopPropagation(); indir(buyuk, f, ev.target); });
      const hedef = $(f.grup === 'mekke' ? 'galeriMekke' : 'galeriMedine');
      if(hedef) hedef.appendChild(el);
    });
  }
  galeriYukle();
});

/* ============ TANITIM VİDEOSU ============ */
bolum('tanitim-video', () => {
  const video = $('tanitimVideoEl');
  const yt = $('videoYerTutucu');
  if(!video) return;
  // Proje klasörüne "nurvakit-tanitim.mp4" eklenirse otomatik algılanır ve oynatılabilir hâle gelir.
  video.src = 'nurvakit-tanitim.mp4';
  video.addEventListener('loadeddata', () => {
    video.classList.add('hazir');
    if(yt) yt.classList.add('gizli');
  });
  video.addEventListener('error', () => {
    video.classList.remove('hazir');
    if(yt) yt.classList.remove('gizli');
  });
});

/* ============ PWA ============ */
bolum('pwa', () => {
  if('serviceWorker' in navigator && location.protocol.indexOf('http') === 0){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
});

/* Başlangıç: vakitleri yükle (kayıtlı konum varsa onunla, yoksa varsayılan İstanbul ile) */
bolum('vakit-baslangic', yukle);
