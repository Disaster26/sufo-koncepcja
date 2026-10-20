/* menu mobilne */
(function(){
  const h=document.querySelector('.ham'), p=document.getElementById('panel');
  if(!h||!p)return;
  const ustaw=o=>{h.setAttribute('aria-expanded',o);p.classList.toggle('otwarte',o);document.body.style.overflow=o?'hidden':''};
  h.addEventListener('click',()=>ustaw(h.getAttribute('aria-expanded')!=='true'));
  p.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>ustaw(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')ustaw(false)});
  matchMedia('(min-width:1061px)').addEventListener('change',e=>{if(e.matches)ustaw(false)});
})();

/* pojawianie sie sekcji */
(function(){
  const el=document.querySelectorAll('.wejscie');
  if(!('IntersectionObserver' in window)){el.forEach(e=>e.classList.add('widac'));return}
  const io=new IntersectionObserver(w=>w.forEach(x=>{if(x.isIntersecting){x.target.classList.add('widac');io.unobserve(x.target)}}),{rootMargin:'0px 0px -8% 0px'});
  el.forEach(e=>io.observe(e));
})();

/* mapa i czas dojazdu: adres przez Nominatim (OpenStreetMap), trasa przez OSRM */
(function(){
  const box=document.getElementById('mapa'); if(!box||!window.L)return;
  const BAZA=[54.60398,18.21371];
  const mapa=L.map(box,{zoomControl:false,scrollWheelZoom:false,tap:false}).setView([54.585,18.3],10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(mapa);
  L.control.zoom({position:'bottomright'}).addTo(mapa);
  L.marker(BAZA,{icon:L.divIcon({className:'',html:'<div class="ik-baza"></div>',iconSize:[20,20],iconAnchor:[10,10]})}).addTo(mapa).bindTooltip('Baza SUFO, Wejherowo',{direction:'top'});
  let trasa=null,cel=null;
  const min=document.getElementById('minuty'),opis=document.getElementById('opis'),karta=document.querySelector('.mapa-karta');
  async function sprawdz(adres){
    adres=(adres||'').trim(); if(!adres)return;
    min.innerHTML='…<small>min</small>'; opis.textContent='Szukam adresu…';
    if(innerWidth<1061&&karta) karta.scrollIntoView({behavior:'smooth',block:'center'});
    try{
      const g=await (await fetch('https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=pl&limit=1&q='+encodeURIComponent(adres+', pomorskie'))).json();
      if(!g.length){min.innerHTML='-<small>min</small>';opis.textContent='Nie znaleziono adresu. Wpisz miejscowość i ulicę.';return}
      const C=[+g[0].lat,+g[0].lon];
      const r=await (await fetch('https://router.project-osrm.org/route/v1/driving/'+BAZA[1]+','+BAZA[0]+';'+C[1]+','+C[0]+'?overview=full&geometries=geojson')).json();
      if(!r.routes||!r.routes.length)throw 0;
      const t=r.routes[0],km=(t.distance/1000).toFixed(1).replace('.',','),m=Math.max(1,Math.round(t.duration/60));
      if(trasa)mapa.removeLayer(trasa); if(cel)mapa.removeLayer(cel);
      trasa=L.geoJSON(t.geometry,{style:{color:'#d7191f',weight:5,opacity:.9,lineCap:'round'}}).addTo(mapa);
      cel=L.marker(C,{icon:L.divIcon({className:'',html:'<div class="ik-cel"></div>',iconSize:[18,18],iconAnchor:[9,9]})}).addTo(mapa);
      mapa.fitBounds(trasa.getBounds(),{padding:[34,34]});
      const a=g[0].address||{}, nazwa=[a.road,a.city||a.town||a.village||a.municipality].filter(Boolean).join(', ')||g[0].display_name.split(',')[0];
      min.innerHTML=m+'<small>min</small>';
      opis.innerHTML='<b>'+km+' km</b> z bazy w Wejherowie do: <b>'+nazwa.replace(/</g,'')+'</b>. Czas orientacyjny według mapy dróg.';
    }catch(e){min.innerHTML='-<small>min</small>';opis.textContent='Nie udało się policzyć trasy. Spróbuj ponownie za chwilę.'}
  }
  const f=document.getElementById('szukaj'),inp=document.getElementById('adres');
  if(f)f.addEventListener('submit',e=>{e.preventDefault();sprawdz(inp.value)});
  document.querySelectorAll('.chipy button').forEach(b=>b.addEventListener('click',()=>{inp.value=b.dataset.a;sprawdz(b.dataset.a)}));
})();

/* konfigurator ochrony domu (ceny z cennika SUFO) */
(function(){
  const lista=document.getElementById('zestaw'); if(!lista)return;
  const st={obiekt:'dom',kamery:'2',monitoring:'1',wejscia:2}, we=document.getElementById('wejscia');
  function rysuj(){
    const czujki=st.wejscia+(st.obiekt==='mieszkanie'?1:2);
    const poz=[['Centrala alarmowa z powiadomieniem w telefonie','1 szt.'],['Czujki ruchu',czujki+' szt.'],['Czujniki otwarcia drzwi i bramy',st.wejscia+' szt.']];
    if(st.obiekt!=='mieszkanie')poz.push(['Sygnalizator zewnętrzny','1 szt.']);
    if(st.kamery!=='0')poz.push(['Kamery z podglądem w telefonie',st.kamery+' szt.']);
    poz.push(st.monitoring==='1'?['Monitoring 24/7 i dojazd grupy interwencyjnej','abonament']:['Powiadomienia tylko do Ciebie','bez abonamentu']);
    lista.innerHTML=poz.map(p=>'<li><span>'+p[0]+'</span><b>'+p[1]+'</b></li>').join('');
    we.textContent=st.wejscia;
  }
  document.querySelectorAll('.opcje').forEach(g=>g.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b));st[g.dataset.p]=b.dataset.v;rysuj()}));
  document.querySelectorAll('.licz button').forEach(b=>b.addEventListener('click',()=>{st.wejscia=Math.min(8,Math.max(1,st.wejscia+ +b.dataset.d));rysuj()}));
  rysuj();
})();

/* dolny pasek na telefonie dopiero po przewinieciu za wyszukiwarke z naglowka (bez dublowania na 1. ekranie) */
(function(){
  const m=document.querySelector('.mob'), t=document.querySelector('#szukaj')||document.querySelector('.art-tlo');
  if(!m)return; if(!t||!('IntersectionObserver' in window)){m.classList.add('widac');return}
  new IntersectionObserver(w=>w.forEach(x=>m.classList.toggle('widac',!x.isIntersecting&&x.boundingClientRect.top<0)),{threshold:0}).observe(t);
})();
