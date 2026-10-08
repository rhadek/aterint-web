(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  let revealObserver;
  function reveal() {
    revealObserver?.disconnect();
    if (reduced.matches) return;
    revealObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        revealObserver.unobserve(entry.target);
        if (typeof entry.target.animate !== 'function') continue;
        if (entry.target.hasAttribute?.('data-contact-reveal')) {
          entry.target.style.setProperty('--contact-line', '1');
          entry.target.animate([{ transform: 'translateY(18px)' }, { transform: 'translateY(0)' }],
            { duration: 900, easing: 'cubic-bezier(.16,1,.3,1)' });
          continue;
        }
        entry.target.animate([
          { opacity: 0, transform: 'translateY(24px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 800, delay: Math.min(Number(entry.target.dataset.sequence || 0) * 90, 270), easing: 'cubic-bezier(.18,1,.25,1)' });
      }
    }, { threshold: 0.08 });
    document.querySelectorAll('[data-reveal], [data-contact-reveal]').forEach(element => revealObserver.observe(element));
  }
  reveal();
  if (!document.querySelector || !window.requestAnimationFrame) {
    reduced.addEventListener('change', event => {
      if (event.matches) {
        revealObserver?.disconnect();
        document.getAnimations().forEach(animation => animation.finish());
      }
    });
    return;
  }
  const body = document.body;
  const hero = document.querySelector('.hero-home');
  const intro = document.querySelector('.intro-screen');
  let introDelay = 0;
  if (hero && intro && !reduced.matches) {
    intro.hidden = false;
    introDelay = 820;
    setTimeout(() => { intro.hidden = true; }, 1450);
  }
  function dismissIntro() { if (intro) intro.hidden = true; }
  const light = document.querySelector('.hero-light');
  const object = document.querySelector('.hero-object');
  const parallax = document.querySelector('[data-parallax]');
  const orbit = document.querySelector('.technical-orbit');
  const progress = document.querySelector('.reading-progress');
  const band = document.querySelector('.activity-band');
  const pause = document.querySelector('.band-toggle');
  const serviceFolds = [...document.querySelectorAll('.service-fold')];
  const serviceSummaries = serviceFolds.map(fold => fold.querySelector('summary'));
  const foldAnimations = new Map();
  const serviceWindow = document.querySelector('.service-window');
  const servicePhotos = [...document.querySelectorAll('.service-window-photo')];
  const serviceCaption = document.querySelector('.service-window-name');
  const serviceCounter = document.querySelector('.service-window-counter');
  const guide = document.querySelector('.guide-section');
  const guideTrack = document.querySelector('.information-grid');
  const guideViewport = document.querySelector('.guide-viewport');
  const guideControls = document.querySelector('.guide-controls');
  const guideCounter = document.querySelector('.guide-position');
  const guidePrev = document.querySelector('[data-guide-prev]');
  const guideNext = document.querySelector('[data-guide-next]');
  const guidePanels = guide ? [...guide.querySelectorAll('.information-grid article')] : [];
  const guideStops = guide ? [...guide.querySelectorAll('.guide-stop')] : [];
  const footer = document.querySelector('.technical-footer');
  const signature = document.querySelector('.footer-signature');
  const contact = document.querySelector('.contact');
  const film = document.querySelector('[data-ambient-video]');
  const filmScene = document.querySelector('.cinema-section');
  const filmMotionToggle = document.querySelector('.cinema-motion-toggle');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
  const css = (element, name, value) => element?.style.setProperty(name, value);
  const number = n => String(n).padStart(2, '0');
  let pending = 0, needsMeasure = true, horizontal = false, guideActive = -1;
  let guideTop = 0, guideDistance = 1, guideTravel = 0;
  let heroTop = 0, heroHeight = 1, footerTop = 0, footerHeight = 1, contactTop = 0, pageTravel = 1;
  let aims = [0, 0], position = [0, 0], lightAim = [0, 0], lightPosition = [0, 0];
  let pointerInside = false, heroRect;
  let filmVisible = false, filmUserPaused = false, filmAutoPausing = false, filmStarting = false;
  let serviceActive = -1, serviceManualY = null;
  let guideSnapTimer, guideSnapTarget = null, guideGestureStart = null, guideTouch = null;
  let touchScrolling = false;
  let scrollLastY = window.scrollY, scrollDirection = 0;

  // Preserve real text nodes and line breaks. All text is visible without JavaScript.
  let textObserver;
  const textHeadings = [...document.querySelectorAll('[data-text-reveal]')];
  function splitText(node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3 && child.textContent.trim()) {
        const fragment = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part.trim()) { fragment.appendChild(document.createTextNode(part)); continue; }
          const mask = document.createElement('span'), word = document.createElement('span');
          mask.className = 'text-mask'; word.className = 'text-word'; word.textContent = part;
          mask.appendChild(word); fragment.appendChild(mask);
        }
        node.replaceChild(fragment, child);
      } else if (child.nodeType === 1 && !child.classList.contains('heading-dot')) splitText(child);
    }
  }
  if (document.createDocumentFragment) textHeadings.forEach(splitText);
  function revealText() {
    textObserver?.disconnect();
    if (reduced.matches) return;
    textObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        textObserver.unobserve(entry.target);
        entry.target.querySelectorAll('.text-word').forEach((word, index) => {
          word.animate([{ transform: 'translateY(108%) rotate(3deg)' }, { transform: 'translateY(0) rotate(0)' }],
            { duration: 850, delay: index * 55, fill: 'backwards', easing: 'cubic-bezier(.16,1,.3,1)' });
        });
      }
    }, { threshold: .25 });
    textHeadings.forEach(heading => textObserver.observe(heading));
  }
  revealText();

  function schedule() {
    if (!pending && !document.hidden) pending = window.requestAnimationFrame(render);
  }
  function measure() {
    needsMeasure = false;
    const scroll = window.scrollY;
    if (hero) {
      hero.classList.remove('hero-overflow');
      const copy = hero.querySelector?.('.hero-copy');
      if (copy && band && copy.getBoundingClientRect().bottom > band.getBoundingClientRect().top - 8) hero.classList.toggle('hero-overflow', true);
      const rect = hero.getBoundingClientRect();
      heroTop = rect.top + scroll; heroHeight = rect.height; heroRect = rect;
      if (!pointerInside) {
        lightAim = [rect.width * .72 - 350, rect.height * .35 - 350];
        lightPosition = [...lightAim];
      }
    }
    if (guide && guideControls && guidePanels.length) {
      horizontal = !reduced.matches;
      guide.classList.toggle('guide-slider', horizontal);
      guideControls.hidden = !horizontal;
      // The same chapters work at every width. Exceptionally large text can
      // scroll inside its chapter instead of being clipped or hidden.
      guidePanels.forEach(panel => {
        const overflowing = horizontal && panel.scrollHeight > panel.clientHeight + 2;
        panel.classList.toggle('is-scrollable', overflowing);
        panel.removeAttribute('tabindex');
      });
      if (!horizontal) {
        css(guideTrack, '--guide-offset', '0px');
        guidePanels.forEach(panel => { css(panel, '--guide-scale', '1'); css(panel, '--guide-copy-y', '0px'); });
      }
      guideActive = -1;
    }
    document.documentElement.classList.toggle('guide-snap', horizontal && !reduced.matches);
    document.documentElement.classList.toggle('film-snap', !!film && !reduced.matches);
    if (horizontal) {
      guideTop = guide.getBoundingClientRect().top + scroll;
      guideDistance = Math.max(1, guide.offsetHeight - window.innerHeight);
      guideTravel = guideViewport.clientWidth * (guidePanels.length - 1);
      guideStops.forEach((stop, i) => css(stop, '--snap-y', (i / (guidePanels.length - 1) * guideDistance).toFixed(2) + 'px'));
    }
    if (footer) { const rect = footer.getBoundingClientRect(); footerTop = rect.top + scroll; footerHeight = rect.height; }
    if (contact) contactTop = contact.getBoundingClientRect().top + scroll;
    pageTravel = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }
  function render() {
    pending = 0;
    if (needsMeasure) measure();
    const y = window.scrollY, motion = !reduced.matches;
    followServices(y);
    css(progress, '--read-progress', motion ? clamp(y / pageTravel) : 0);
    if (horizontal) {
      const fraction = clamp((y - guideTop) / guideDistance), phase = fraction * (guidePanels.length - 1);
      const current = Math.round(phase);
      css(guideTrack, '--guide-offset', (-guideTravel * fraction).toFixed(2) + 'px');
      guidePanels.forEach((panel, i) => {
        const away = clamp(Math.abs(phase - i));
        css(panel, '--guide-scale', (1 - away * .065).toFixed(3));
        css(panel, '--guide-radius', (away * 20).toFixed(2) + 'px');
        css(panel, '--guide-copy-y', ((i - phase) * 20).toFixed(2) + 'px');
      });
      if (current !== guideActive) {
        guideActive = current;
        guideCounter.textContent = number(current + 1) + ' / ' + number(guidePanels.length);
        guidePrev.disabled = current === 0; guideNext.disabled = current === guidePanels.length - 1;
        guidePanels.forEach((panel, index) => {
          if (index === current && panel.classList.contains('is-scrollable')) panel.setAttribute('tabindex', '0');
          else panel.removeAttribute('tabindex');
        });
      }
    }
    if (signature) {
      const fill = motion ? clamp((y + window.innerHeight - footerTop) / Math.max(1, footerHeight)) : 1;
      css(signature, '--signature-cut', ((1 - fill) * 100).toFixed(2) + '%');
    }
    if (contact) {
      const entered = clamp((y + window.innerHeight - contactTop) / window.innerHeight);
      css(contact, '--contact-angle', (motion ? -16 + entered * 16 : 0).toFixed(2) + 'deg');
      if (!motion) css(contact, '--contact-line', '1');
    }
    if (hero && motion && y < heroTop + heroHeight && y + window.innerHeight > heroTop) {
      const fraction = clamp((y - heroTop) / heroHeight);
      css(hero, '--hero-scale', (1 - fraction * .045).toFixed(3));
      css(hero, '--hero-radius', (fraction * 36).toFixed(2) + 'px');
      css(parallax, '--parallax-y', (fraction * 100).toFixed(2) + 'px');
      css(orbit, '--orbit-scale', (1 + fraction * .22).toFixed(3));
      const strength = pointer.matches ? 1 : 0;
      let settling = false;
      for (let i = 0; i < 2; i++) {
        position[i] += (aims[i] * strength - position[i]) * .1;
        lightPosition[i] += (lightAim[i] - lightPosition[i]) * .08;
        if (Math.abs(aims[i] * strength - position[i]) > .005 || Math.abs(lightAim[i] - lightPosition[i]) > .2) settling = true;
      }
      css(object, '--tilt-x', (-position[1] * 9).toFixed(3) + 'deg');
      css(object, '--tilt-y', (position[0] * 12).toFixed(3) + 'deg');
      css(object, '--object-x', (position[0] * 12).toFixed(2) + 'px');
      css(light, '--light-x', lightPosition[0].toFixed(2) + 'px');
      css(light, '--light-y', lightPosition[1].toFixed(2) + 'px');
      if (settling) schedule();
    }
  }
  function configure() {
    body.classList.toggle('motion-ready', !reduced.matches);
    if (filmMotionToggle) filmMotionToggle.hidden = reduced.matches;
    if (pause) pause.hidden = reduced.matches;
    if (reduced.matches) {
      cancelGuideSnap();
      if (intro) intro.hidden = true;
      css(hero, '--hero-scale', '1'); css(hero, '--hero-radius', '0px');
      revealObserver?.disconnect(); textObserver?.disconnect();
      document.getAnimations().forEach(animation => animation.cancel());
      css(parallax, '--parallax-y', '0px');
      css(object, '--tilt-x', '0deg'); css(object, '--tilt-y', '0deg'); css(object, '--object-x', '0px');
      pauseFilm();
    }
    needsMeasure = true; schedule();
  }
  // Details open only through deliberate activation and remain native without JS.
  function setFold(fold, opening) {
    const previous = foldAnimations.get(fold);
    if ((previous ? previous.opening : fold.open) === opening) return;
    const start = fold.getBoundingClientRect().height;
    previous?.animation.cancel();
    if (reduced.matches || typeof fold.animate !== 'function') {
      fold.open = opening; needsMeasure = true; schedule(); return;
    }
    fold.open = true;
    const end = opening ? fold.getBoundingClientRect().height : fold.querySelector('summary').getBoundingClientRect().height + 1;
    fold.style.setProperty('overflow', 'hidden');
    const animation = fold.animate([{ height: start + 'px' }, { height: end + 'px' }],
      { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' });
    const state = { animation, opening };
    foldAnimations.set(fold, state);
    const complete = () => {
      if (foldAnimations.get(fold) !== state) return;
      fold.open = opening;
      fold.style.removeProperty('overflow');
      foldAnimations.delete(fold);
      needsMeasure = true; schedule();
    };
    animation.onfinish = complete;
    animation.oncancel = complete;
  }
  function selectService(index) {
    if (index === serviceActive || !serviceFolds[index]) return;
    serviceActive = index;
    const photo = Number(serviceFolds[index].dataset.photo || 0);
    serviceFolds.forEach((fold, i) => fold.classList.toggle('is-reading', i === index));
    servicePhotos.forEach((image, i) => image.classList.toggle('is-current', i === photo));
    if (serviceCaption && servicePhotos[photo]) serviceCaption.textContent = servicePhotos[photo].dataset.caption;
    if (serviceCounter) serviceCounter.textContent = number(index + 1) + ' / ' + number(serviceFolds.length);
  }
  function followServices(y) {
    if (!serviceFolds.length || !serviceWindow) return;
    if (serviceManualY !== null && Math.abs(y - serviceManualY) < 60) return;
    const rects = serviceSummaries.map(summary => summary.getBoundingClientRect());
    if (rects[0].top > window.innerHeight || serviceFolds.at(-1).getBoundingClientRect().bottom < 0) return;
    const line = window.innerWidth < 900
      ? Math.min(window.innerHeight * .7, serviceWindow.getBoundingClientRect().bottom + 80)
      : window.innerHeight * .42;
    let next = 0;
    rects.forEach((rect, index) => { if (rect.top <= line) next = index; });
    // A small threshold prevents flicker around a row boundary. Only the image
    // and reading marker change; scrolling never modifies a details open state.
    if (next > serviceActive && rects[next].top > line - 18) return;
    if (next < serviceActive && rects[serviceActive].top < line + 18) return;
    selectService(next);
    css(serviceWindow, '--service-drift', reduced.matches ? '0px' : (clamp((line - rects[next].top) / window.innerHeight) * -2).toFixed(2) + 'px');
  }
  selectService(0);
  serviceFolds.forEach((fold, index) => {
    const summary = serviceSummaries[index];
    fold.addEventListener('toggle', () => { needsMeasure = true; schedule(); });
    fold.addEventListener('focusin', () => { serviceManualY = window.scrollY; selectService(index); });
    summary.addEventListener('click', event => {
      selectService(index);
      serviceManualY = window.scrollY;
      if (reduced.matches || typeof fold.animate !== 'function') return;
      event.preventDefault();
      const previous = foldAnimations.get(fold);
      const opening = previous ? !previous.opening : !fold.open;
      setFold(fold, opening);
    });
  });
  function cancelGuideSnap() {
    clearTimeout(guideSnapTimer);
    guideSnapTarget = null; guideGestureStart = null;
  }
  function settleGuide() {
    if (!horizontal || reduced.matches || document.hidden || guideTouch || touchScrolling || guideSnapTarget !== null) return;
    const y = window.scrollY;
    // No wheel/touch interception and no snapping outside these four chapters.
    if (y < guideTop || y > guideTop + guideDistance) { guideGestureStart = null; return; }
    const step = guideDistance / (guidePanels.length - 1);
    const phase = (y - guideTop) / step;
    let target = Math.round(phase);
    if (guideGestureStart !== null) {
      const startPhase = (guideGestureStart - guideTop) / step;
      const startIndex = Math.round(startPhase);
      if (Math.abs(startPhase - startIndex) < .025 && Math.abs(y - guideGestureStart) > 28 && target === startIndex) {
        target += scrollDirection;
      }
    }
    guideGestureStart = null;
    const top = guideTop + clamp(target, 0, guidePanels.length - 1) * step;
    if (Math.abs(y - top) > 1) {
      guideSnapTarget = top;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }
  function queueGuideSnap(delay = 160) {
    clearTimeout(guideSnapTimer);
    if (!horizontal || guideSnapTarget !== null || guideTouch || touchScrolling) return;
    guideSnapTimer = setTimeout(settleGuide, delay);
  }
  function seekGuide(index) {
    if (!horizontal) return;
    cancelGuideSnap();
    const target = clamp(index, 0, guidePanels.length - 1);
    guideSnapTarget = guideTop + target / (guidePanels.length - 1) * guideDistance;
    window.scrollTo({ top: guideSnapTarget, behavior: 'smooth' });
  }
  guidePrev?.addEventListener('click', () => seekGuide(guideActive - 1));
  guideNext?.addEventListener('click', () => seekGuide(guideActive + 1));
  guideControls?.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); seekGuide(guideActive + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });
  guideViewport?.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    cancelGuideSnap();
    guideTouch = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  guideViewport?.addEventListener('pointerup', event => {
    if (!guideTouch) return;
    const dx = event.clientX - guideTouch.x, dy = event.clientY - guideTouch.y;
    guideTouch = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) seekGuide(guideActive + (dx < 0 ? 1 : -1));
    else queueGuideSnap();
  }, { passive: true });
  guideViewport?.addEventListener('pointercancel', () => { guideTouch = null; queueGuideSnap(); }, { passive: true });
  hero?.addEventListener('pointermove', event => {
    if (reduced.matches || !pointer.matches || event.pointerType === 'touch') return;
    heroRect = hero.getBoundingClientRect(); pointerInside = true;
    const x = event.clientX - heroRect.left, y = event.clientY - heroRect.top;
    aims = [clamp(x / heroRect.width * 2 - 1, -1, 1), clamp(y / heroRect.height * 2 - 1, -1, 1)];
    lightAim = [x - 350, y - 350]; schedule();
  }, { passive: true });
  hero?.addEventListener('pointerleave', () => { pointerInside = false; aims = [0, 0]; schedule(); });
  pause?.addEventListener('click', () => {
    const paused = band.classList.toggle('is-paused');
    body.classList.toggle('decorations-paused', paused);
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Spustit pohyb pásu' : 'Pozastavit pohyb pásu');
    pause.textContent = paused ? '▶' : 'Ⅱ';
  });
  // Start the muted film only when it enters the viewport. A visitor's pause stays respected.
  filmMotionToggle?.addEventListener('click', () => {
    const paused = filmScene.classList.toggle('cinema-paused');
    filmMotionToggle.setAttribute('aria-pressed', String(paused));
    filmMotionToggle.setAttribute('aria-label', paused ? 'Spustit pohyb pozadí' : 'Pozastavit pohyb pozadí');
    filmMotionToggle.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
  });
  function pauseFilm() {
    if (!film || film.paused) return;
    filmAutoPausing = true;
    film.pause();
  }
  function playFilm() {
    if (!film || !filmVisible || document.hidden || reduced.matches || filmUserPaused || !film.paused || filmStarting) return;
    filmStarting = true;
    Promise.resolve(film.play()).catch(() => {
      // Native controls remain available if autoplay is blocked by the browser.
    }).finally(() => {
      filmStarting = false;
      if (!filmVisible || document.hidden || reduced.matches) pauseFilm();
    });
  }
  if (film) {
    film.muted = true;
    film.addEventListener('pause', () => {
      if (filmAutoPausing) { filmAutoPausing = false; return; }
      if (filmVisible && !document.hidden) filmUserPaused = true;
    });
    film.addEventListener('play', () => { filmUserPaused = false; });
    new IntersectionObserver(entries => {
      for (const entry of entries) {
        filmVisible = entry.isIntersecting && entry.intersectionRatio >= .35;
        filmScene?.classList.toggle('cinema-in-view', filmVisible);
        if (filmVisible) playFilm(); else pauseFilm();
      }
    }, { threshold: [0, .35] }).observe(film);
  }
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (Math.abs(y - scrollLastY) > .5) scrollDirection = Math.sign(y - scrollLastY);
    if (guideSnapTarget !== null && Math.abs(y - guideSnapTarget) < 2) guideSnapTarget = null;
    if (guideGestureStart === null && guideSnapTarget === null) guideGestureStart = scrollLastY;
    scrollLastY = y;
    schedule(); queueGuideSnap();
  }, { passive: true });
  window.addEventListener('scrollend', () => {
    guideSnapTarget = null; queueGuideSnap(0);
  }, { passive: true });
  // A new gesture always interrupts automatic settling immediately.
  window.addEventListener('wheel', () => { dismissIntro(); if (guideSnapTarget !== null) cancelGuideSnap(); }, { passive: true });
  window.addEventListener('touchstart', () => { dismissIntro(); touchScrolling = true; cancelGuideSnap(); }, { passive: true });
  window.addEventListener('touchend', () => { touchScrolling = false; queueGuideSnap(); }, { passive: true });
  window.addEventListener('touchcancel', () => { touchScrolling = false; queueGuideSnap(); }, { passive: true });
  document.addEventListener('click', event => {
    // Anchor navigation has its own destination. Never pull it back into a chapter.
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor) return;
    dismissIntro();
    const hash = anchor.getAttribute('href');
    if (!hash || hash === '#') return;
    const destination = document.querySelector(hash);
    if (!destination) return;
    cancelGuideSnap();
    guideSnapTarget = window.scrollY + destination.getBoundingClientRect().top;
  });
  window.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) { dismissIntro(); cancelGuideSnap(); }
  });
  window.addEventListener('resize', () => { cancelGuideSnap(); needsMeasure = true; schedule(); queueGuideSnap(); }, { passive: true });
  window.addEventListener('pageshow', () => { needsMeasure = true; schedule(); queueGuideSnap(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseFilm();
    else { playFilm(); schedule(); }
  });
  reduced.addEventListener('change', () => { reveal(); revealText(); configure(); if (!reduced.matches) playFilm(); });
  document.fonts?.ready.then(() => { needsMeasure = true; schedule(); });
  configure();
  if (hero && !reduced.matches) {
    hero.querySelectorAll('.headline-line').forEach((line, index) => {
      line.animate([{ transform: 'translateY(44px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }],
        { duration: 1100, delay: introDelay + 100 + index * 120, easing: 'cubic-bezier(.16,1,.3,1)' });
    });
  }
})();
