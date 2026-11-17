(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const sections = [...document.querySelectorAll('.scene')];
  const total = sections.length;
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
          document.querySelector('#position').textContent = `${String(current+1).padStart(2,'0')} / ${String(total).padStart(2,'0')}`;
          document.querySelector('#next').textContent = current === total - 1 ? '回到首页 ↑' : '下一章 ↑';
          document.querySelector('#next').setAttribute('aria-label',current === total - 1 ? '回到首页' : '下一章节');
          document.documentElement.style.setProperty('--progress', ((current + 1) / total * 100).toFixed(1) + '%');
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

  /* —— 首屏视差：滚动时雪山缓慢下沉（写入 CSS 变量）—— */
  const landscape = document.querySelector('.hero-landscape');
  if (landscape && !reduced.matches) {
    let ticking = false;
    const apply = () => {
      const y = Math.min(window.innerHeight, window.scrollY || 0);
      landscape.style.setProperty('--parallax', String(y * 0.22));
      ticking = false;
    };
    window.addEventListener('scroll', () => {
      if (!ticking) { ticking = true; requestAnimationFrame(apply); }
    }, { passive: true });
  }

  /* —— 背景音乐：柔和的和弦分解 + 低音铺底，首次触摸自动开启 —— */
  let context, master, timer, active=false, step=0;
  const sound=document.querySelector('#sound');
  const hint=document.querySelector('#music-hint');
  // A 小调五声上行的分解和弦，配一个低八度长音铺底
  const melody=[220,261.63,329.63,440,523.25,440,329.63,261.63];
  const pads=[110,146.83];
  function note(freq, when, dur, vol, type){
    const o=context.createOscillator(), g=context.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when+0.35);
    g.gain.exponentialRampToValueAtTime(0.0008, when+dur);
    o.connect(g); g.connect(master);
    o.start(when); o.stop(when+dur+0.1);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function bar(){
    if(!active||!context) return;
    const t=context.currentTime+0.05;
    note(melody[step%melody.length], t, 3.6, 0.085, 'sine');
    note(melody[step%melody.length]*2, t, 2.6, 0.02, 'sine');
    if(step%2===0) note(pads[(step>>1)%pads.length], t, 5.2, 0.05, 'triangle');
    step++;
  }
  async function startSound(){
    try{
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio) throw Error('unsupported');
      if(!context){context=new Audio();master=context.createGain();master.gain.value=.3;master.connect(context.destination);}
      await context.resume();active=true;
      sound.setAttribute('aria-pressed','true');sound.setAttribute('aria-label','关闭音乐');
      bar();timer=setInterval(bar,2400);
      if(hint) hint.classList.add('hide');
    }catch{
      const toast=document.querySelector('#toast');toast.textContent='当前浏览器暂不支持播放音乐';toast.hidden=false;setTimeout(()=>toast.hidden=true,3000);
    }
  }
  async function stopSound(){active=false;clearInterval(timer);sound.setAttribute('aria-pressed','false');sound.setAttribute('aria-label','开启音乐');if(context)await context.suspend();}
  sound.addEventListener('click',()=>{active?stopSound():startSound();});
  // 首次触摸即开启音乐（浏览器禁止自动播放，所以绑定在第一次交互上）
  const unlock=()=>{startSound();document.removeEventListener('pointerdown',unlock);};
  document.addEventListener('pointerdown',unlock,{once:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&active)stopSound();});
  window.addEventListener('pagehide',()=>{clearInterval(timer);if(context)context.close();});
})();
