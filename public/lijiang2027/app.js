(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const sections = [...document.querySelectorAll('.scene')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  const go = index => sections[index].scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth', block: 'start'});
  sections[0].classList.add('seen');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('seen');
          current = sections.indexOf(entry.target);
          document.querySelector('#position').textContent = `${String(current+1).padStart(2,'0')} / 08`;
          document.querySelector('#next').textContent = current === 7 ? '回到首页 ↑' : '下一章 ↑';
          document.querySelector('#next').setAttribute('aria-label',current === 7 ? '回到首页' : '下一章节');
        }
      });
    }, {rootMargin:'-25% 0px -35% 0px',threshold:0});
    sections.forEach(s => observer.observe(s));
  } else sections.forEach(s=>s.classList.add('seen'));
  document.querySelector('#next').addEventListener('click',()=>go((current+1)%sections.length));
  const menu = document.querySelector('#menu');
  const share = document.querySelector('#share-dialog');
  document.querySelector('#contents').addEventListener('click',()=>menu.showModal());
  document.querySelector('#share').addEventListener('click',()=>share.showModal());
  document.querySelectorAll('dialog .close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const target = document.querySelector(a.getAttribute('href'));if(!target)return;e.preventDefault();menu.close();target.scrollIntoView({behavior:reduced.matches?'auto':'smooth'});
  }));
  const tabs=[...document.querySelectorAll('[role="tab"]')];
  function activate(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;activate(tabs[next]);tabs[next].focus();}});});
  document.querySelector('#copy-link').addEventListener('click',async()=>{
    const url=location.href.split('#')[0];
    try{await navigator.clipboard.writeText(url);document.querySelector('#copy-status').textContent='邀请链接已复制';}
    catch{const status=document.querySelector('#copy-status');status.textContent='请长按复制链接：'+url;status.style.overflowWrap='anywhere';}
  });
  let context, master, timer, active=false, notes=0;
  const sound=document.querySelector('#sound');
  function chime(){if(!active||!context)return;const pitches=[261.63,329.63,392,523.25,440,392,329.63,293.66];const o=context.createOscillator(),g=context.createGain();o.type='sine';o.frequency.value=pitches[notes++%pitches.length];g.gain.setValueAtTime(0,context.currentTime);g.gain.linearRampToValueAtTime(.11,context.currentTime+.3);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+3.3);o.connect(g);g.connect(master);o.start();o.stop(context.currentTime+3.5);o.onended=()=>{o.disconnect();g.disconnect();};}
  async function stopSound(){active=false;clearInterval(timer);sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','开启音乐');if(context)await context.suspend();}
  sound.addEventListener('click',async()=>{if(active){await stopSound();return;}try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('unsupported');if(!context){context=new Audio();master=context.createGain();master.gain.value=.28;master.connect(context.destination);}await context.resume();active=true;sound.setAttribute('aria-pressed','true');sound.setAttribute('aria-label','关闭音乐');chime();timer=setInterval(chime,2100);}catch{const toast=document.querySelector('#toast');toast.textContent='当前浏览器暂不支持播放音乐';toast.hidden=false;setTimeout(()=>toast.hidden=true,3000);}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stopSound();});
  window.addEventListener('pagehide',()=>{clearInterval(timer);if(context)context.close();});
})();
