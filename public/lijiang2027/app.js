(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const sections = [...document.querySelectorAll('.scene')];
  const total = sections.length;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let navigationTarget = null;
  let settleTimer;
  const position = document.querySelector('#position');
  const next = document.querySelector('#next');
  function activateScene(index) {
    current = index;
    sections.forEach((section, i) => section.classList.toggle('seen', i === index));
    position.textContent = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
    next.textContent = index === total - 1 ? '回到首页 ↑' : '下一章 ↓';
    next.setAttribute('aria-label', index === total - 1 ? '回到首页' : '下一章节');
    document.documentElement.style.setProperty('--progress', `${(index + 1) / total * 100}%`);
  }
  const go = index => {
    navigationTarget = index;
    sections[index].scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth', block: 'start'});
  };
  activateScene(0);
  if ('IntersectionObserver' in window) {
    // Only the scene crossing the middle of the screen is active. Leaving it
    // removes the animation class, so returning plays the entrance again.
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (!visible.length) return;
      const index = sections.indexOf(visible[visible.length - 1].target);
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        activateScene(index);
        navigationTarget = null;
      }, reduced.matches ? 0 : 100);
    }, {rootMargin: '-45% 0px -45% 0px', threshold: 0});
    sections.forEach(section => observer.observe(section));
  } else {
    // An older browser still shows every page and updates navigation accurately.
    document.documentElement.classList.remove('js');
    window.addEventListener('scroll', () => {
      const middle = innerHeight / 2;
      const index = sections.findIndex(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= middle && rect.bottom > middle;
      });
      if (index >= 0) activateScene(index);
    }, {passive:true});
  }
  next.addEventListener('click', () => go(((navigationTarget ?? current) + 1) % total));
  const menu = document.querySelector('#menu');
  const share = document.querySelector('#share-dialog');
  document.querySelector('#contents').addEventListener('click',()=>menu.showModal());
  document.querySelector('#share').addEventListener('click',()=>share.showModal());
  document.querySelectorAll('dialog .close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
    const target = document.querySelector(a.getAttribute('href'));if(!target)return;e.preventDefault();menu.close();go(sections.indexOf(target));
  }));
  const tabs=[...document.querySelectorAll('[role="tab"]')];
  function activate(tab){tabs.forEach(t=>{const selected=t===tab;t.setAttribute('aria-selected',String(selected));t.tabIndex=selected?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!selected;});}
  tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>activate(tab));tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?1:1-i;activate(tabs[next]);tabs[next].focus();}});});
  document.querySelector('#copy-link').addEventListener('click',async()=>{
    const url=location.href.split('#')[0];
    try{await navigator.clipboard.writeText(url);document.querySelector('#copy-status').textContent='邀请链接已复制';}
    catch{const status=document.querySelector('#copy-status');status.textContent='请长按复制链接：'+url;status.style.overflowWrap='anywhere';}
  });

  /* User-supplied MP3. Load only after interaction; one player for all pages. */
  const music = document.querySelector('#bg-music');
  const sound = document.querySelector('#sound');
  const hint = document.querySelector('#music-hint');
  const toast = document.querySelector('#toast');
  let wantsMusic = false;
  let userMuted = false;
  let playVersion = 0;
  let toastTimer;
  function musicState(playing) {
    sound.setAttribute('aria-pressed', String(playing));
    sound.setAttribute('aria-label', playing ? '关闭音乐' : '开启音乐');
    sound.classList.toggle('playing', playing);
    if (playing && hint) hint.classList.add('hide');
  }
  function playbackError(error) {
    if (error && error.name === 'AbortError') return;
    wantsMusic = false;
    musicState(false);
    if (hint) {
      hint.textContent = '点击右上角 ♪ 开启音乐';
      hint.classList.remove('hide');
    }
    toast.textContent = music.error ? '音乐暂未加载成功，请检查网络后再点 ♪' : '请点击右上角 ♪ 播放音乐';
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
  }
  function startSound() {
    wantsMusic = true;
    const version = ++playVersion;
    if (!music.getAttribute('src')) music.src = music.dataset.src;
    if (music.error) music.load();
    sound.setAttribute('aria-busy', 'true');
    Promise.resolve(music.play())
      .then(() => { if (version === playVersion && (!wantsMusic || document.hidden)) music.pause(); })
      .catch(error => { if (version === playVersion) playbackError(error); })
      .finally(() => { if (version === playVersion) sound.removeAttribute('aria-busy'); });
  }
  function stopSound() {
    wantsMusic = false;
    playVersion++;
    sound.removeAttribute('aria-busy');
    music.pause();
    musicState(false);
  }
  music.addEventListener('playing', () => {
    if (!wantsMusic || document.hidden) { music.pause(); return; }
    musicState(true);
  });
  music.addEventListener('pause', () => musicState(false));
  music.addEventListener('error', () => {
    if (wantsMusic) playbackError(music.error);
  });
  sound.addEventListener('click', () => {
    if (wantsMusic) { userMuted = true; stopSound(); }
    else { userMuted = false; startSound(); }
  });
  function unlock(event) {
    // Do not race the music button's own click, or restart after manual mute.
    if (userMuted || wantsMusic || event.target.closest('#sound')) return;
    startSound();
  }
  document.addEventListener('pointerdown', unlock, {passive:true});
  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') unlock(event);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopSound();
  });
  window.addEventListener('pagehide', stopSound);
})();
