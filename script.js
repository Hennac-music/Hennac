document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // 1. PARTICLE CANVAS (DEEP-SPACE GALAXY & METEORS)
  // ==========================================
  const canvas = document.getElementById("particle-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let meteors = [];
    let mouse = { x: null, y: null, radius: 120 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    }, { passive: true });

    // Cosmic palettes for stars
    const COLORS = [
      "rgba(255, 220, 120, ",  // Warm Gold/Amber
      "rgba(255, 255, 255, ",  // Pure white
      "rgba(160, 210, 255, ",  // Cyan/Light Blue
      "rgba(240, 160, 255, "   // Soft Pink/Magenta
    ];

    // Drifting space nebulae
    let nebulae = [
      {
        x: canvas.width * 0.25,
        y: canvas.height * 0.3,
        r: Math.max(300, canvas.width * 0.35),
        vx: 0.02,
        vy: 0.015,
        color1: "rgba(168, 85, 247, 0.05)",  // Purple
        color2: "rgba(236, 72, 153, 0.015)", // Pink
        scrollFactor: 0.05
      },
      {
        x: canvas.width * 0.75,
        y: canvas.height * 0.65,
        r: Math.max(400, canvas.width * 0.45),
        vx: -0.015,
        vy: 0.03,
        color1: "rgba(201, 123, 69, 0.05)",   // Amber/Copper
        color2: "rgba(135, 116, 255, 0.015)", // Indigo
        scrollFactor: 0.12
      }
    ];

    // Star generator
    const spawnStar = (isInit = false) => {
      const depth = Math.random(); // 0 (distant/slow) to 1 (near/fast)
      
      let layer = 0; // background
      let scrollFactor = 0.05;
      let alpha = Math.random() * 0.25 + 0.15;
      let baseSpeed = 0.015;
      let sz = Math.random() * 0.6 + 0.4; // 0.4px - 1.0px

      if (depth > 0.4 && depth <= 0.82) { // midground
        layer = 1;
        scrollFactor = 0.15;
        alpha = Math.random() * 0.45 + 0.25;
        baseSpeed = 0.04;
        sz = Math.random() * 0.8 + 0.8; // 0.8px - 1.6px
      } else if (depth > 0.82) { // foreground
        layer = 2;
        scrollFactor = 0.32;
        alpha = Math.random() * 0.45 + 0.45;
        baseSpeed = 0.09;
        sz = Math.random() * 1.2 + 1.4; // 1.4px - 2.6px
      }

      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseVx: (Math.random() - 0.5) * baseSpeed * 0.5,
        baseVy: -(Math.random() * baseSpeed + baseSpeed * 0.3),
        vx: 0,
        vy: 0,
        r: sz,
        alpha: alpha,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.015 + 0.005,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        depth: depth,
        layer: layer,
        scrollFactor: scrollFactor,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: Math.random() * 0.008 - 0.004
      };
    };

    const maxParticles = 120;
    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawnStar(true));
    }

    // Curved Meteor Physics
    class Meteor {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * (canvas.width * 0.6) + (canvas.width * 0.4);
        this.y = Math.random() * -100 - 50;
        this.speed = Math.random() * 10 + 12;
        this.angle = Math.PI * 0.84 + (Math.random() - 0.5) * 0.08; // curve down-left (~151 deg)
        this.vx = Math.cos(this.angle) * this.speed;
        this.vy = Math.sin(this.angle) * this.speed;
        
        // Curved trajectory: pull down-left gently (natural gravitational swoop)
        this.ax = -0.06 - Math.random() * 0.04;
        this.ay = 0.14 + Math.random() * 0.06;
        
        this.history = [];
        this.maxHistory = Math.floor(Math.random() * 10) + 12; // Length of the tail
        this.opacity = 1.0;
        this.fadeSpeed = Math.random() * 0.018 + 0.012;
        this.size = Math.random() * 2.2 + 1.2;
        
        const tailColors = [
          "rgba(110, 210, 255, ", // Cyan-Blue
          "rgba(255, 130, 220, ", // Neon Pink
          "rgba(245, 160, 90, "   // Warm Gold
        ];
        this.tailColor = tailColors[Math.floor(Math.random() * tailColors.length)];
        this.active = true;
      }

      update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) {
          this.history.shift();
        }
        
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        
        this.opacity -= this.fadeSpeed;
        if (this.opacity <= 0 || this.x < -100 || this.y > canvas.height + 100) {
          this.active = false;
        }
      }

      draw() {
        if (this.history.length < 2) return;
        
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        
        // Fading tail gradient along the history path
        ctx.beginPath();
        ctx.moveTo(this.history[0].x, this.history[0].y);
        for (let i = 1; i < this.history.length; i++) {
          ctx.lineTo(this.history[i].x, this.history[i].y);
        }
        
        const lastIdx = this.history.length - 1;
        const grad = ctx.createLinearGradient(
          this.history[0].x, this.history[0].y,
          this.history[lastIdx].x, this.history[lastIdx].y
        );
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, `${this.tailColor}${this.opacity * 0.4})`);
        grad.addColorStop(1, `${this.tailColor}${this.opacity * 0.95})`);
        
        ctx.strokeStyle = grad;
        ctx.lineWidth = this.size;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
        
        // Glowing head
        const headX = this.x;
        const headY = this.y;
        
        const headGrad = ctx.createRadialGradient(
          headX, headY, 0,
          headX, headY, this.size * 6.5
        );
        headGrad.addColorStop(0, "rgba(255, 255, 255, 1)");
        headGrad.addColorStop(0.2, `${this.tailColor}${this.opacity * 0.95})`);
        headGrad.addColorStop(0.5, `${this.tailColor}${this.opacity * 0.35})`);
        headGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.fillStyle = headGrad;
        ctx.beginPath();
        ctx.arc(headX, headY, this.size * 6.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bright central bead
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(headX, headY, this.size * 0.75, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const scrollY = window.scrollY;

      // 1. Draw drifting space nebulae
      nebulae.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        
        if (n.x < -n.r) n.x = canvas.width + n.r;
        if (n.x > canvas.width + n.r) n.x = -n.r;
        if (n.y < -n.r) n.y = canvas.height + n.r;
        if (n.y > canvas.height + n.r) n.y = -n.r;

        let renderNy = (n.y - (scrollY * n.scrollFactor)) % canvas.height;
        if (renderNy < 0) renderNy += canvas.height;

        const grad = ctx.createRadialGradient(n.x, renderNy, 0, n.x, renderNy, n.r);
        grad.addColorStop(0, n.color1);
        grad.addColorStop(0.5, n.color2);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");
        
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(n.x, renderNy, n.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 2. Draw stars with parallax and wrapping
      particles.forEach(p => {
        p.phase += p.phaseSpeed;
        p.angle += p.angleSpeed;

        const currentAlpha = Math.max(0.06, p.alpha + Math.sin(p.phase) * 0.18);

        let renderX = p.x % canvas.width;
        if (renderX < 0) renderX += canvas.width;
        let renderY = (p.y - (scrollY * p.scrollFactor)) % canvas.height;
        if (renderY < 0) renderY += canvas.height;

        let targetVx = p.baseVx + Math.sin(p.angle) * 0.06;
        let targetVy = p.baseVy;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = renderX - mouse.x;
          const dy = renderY - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            targetVx += Math.cos(angle) * force * 0.9 * (p.depth + 0.4);
            targetVy += Math.sin(angle) * force * 0.9 * (p.depth + 0.4);
          }
        }

        p.vx += (targetVx - p.vx) * 0.08;
        p.vy += (targetVy - p.vy) * 0.08;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(renderX, renderY, p.r, 0, Math.PI * 2);
        
        if (p.layer === 2) { // Glowing foreground stars
          ctx.fillStyle = `${p.color}${currentAlpha * 0.35})`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(renderX, renderY, p.r * 0.5, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${currentAlpha})`;
        } else {
          ctx.fillStyle = `${p.color}${currentAlpha})`;
        }
        ctx.fill();
      });

      // 3. Spontaneous meteors (approx. once every 7-10 seconds, max 2 simultaneously)
      if (Math.random() < 0.0018 && meteors.length < 2) {
        meteors.push(new Meteor());
      }

      meteors = meteors.filter(m => m.active);
      meteors.forEach(m => {
        m.update();
        m.draw();
      });

      requestAnimationFrame(tick);
    };
    tick();
  }

  // ==========================================
  // 2. CURSOR GLOW
  // ==========================================
  const cursorGlow = document.getElementById("cursor-glow");
  if (cursorGlow) {
    document.addEventListener("mousemove", e => {
      cursorGlow.style.left = `${e.clientX}px`;
      cursorGlow.style.top  = `${e.clientY}px`;
      cursorGlow.style.opacity = "1";
    }, { passive: true });
    document.addEventListener("mouseleave", () => cursorGlow.style.opacity = "0");
  }

  // Spotlight hover tracker
  document.querySelectorAll(".spotlight").forEach(el => {
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }, { passive: true });
  });

  // ==========================================
  // 3. HEADER & SCROLL PROGRESS
  // ==========================================
  const header = document.querySelector("[data-header]");
  const progressBar = document.getElementById("scroll-progress-bar");
  const scrollCue = document.querySelector(".scroll-cue");

  const onScroll = () => {
    const sY = window.scrollY || window.pageYOffset;
    header?.classList.toggle("scrolled", sY > 40);
    
    // Fade out scroll cue in hero section when user scrolls down
    if (scrollCue) {
      scrollCue.classList.toggle("scrolled", sY > 60);
    }

    // Update scroll progress bar
    if (progressBar) {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (sY / totalHeight) * 100 : 0;
      progressBar.style.width = `${progress}%`;
    }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Footer year
  const yr = document.querySelector("[data-year]");
  if (yr) yr.textContent = new Date().getFullYear();

  // ==========================================
  // 4. MOBILE DRAWER
  // ==========================================
  const hamburger = document.getElementById("hamburger");
  const drawer    = document.getElementById("mobile-drawer");
  const toggleMenu = () => {
    const open = hamburger.classList.toggle("open");
    drawer.classList.toggle("open", open);
    drawer.setAttribute("aria-hidden", !open);
    hamburger.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  hamburger?.addEventListener("click", toggleMenu);
  drawer?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
    if (drawer.classList.contains("open")) toggleMenu();
  }));

  // ==========================================
  // 5. SCROLL REVEAL
  // ==========================================
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add("visible"), i * 80);
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(el => obs.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("visible"));
  }

  // ==========================================
  // 6. COUNTDOWN TIMERS
  // ==========================================
  document.querySelectorAll(".countdown").forEach(cd => {
    const dateStr = cd.getAttribute("data-date");
    if (!dateStr || dateStr.trim() === "") {
      cd.style.display = "none";
      return;
    }
    const target = new Date(dateStr).getTime();
    if (isNaN(target)) {
      cd.style.display = "none";
      return;
    }
    const pad = n => String(Math.floor(n)).padStart(2, "0");
    const tick = () => {
      const diff = target - Date.now();
      const days = cd.querySelector("[data-days]");
      const hrs  = cd.querySelector("[data-hours]");
      const mins = cd.querySelector("[data-minutes]");
      const secs = cd.querySelector("[data-seconds]");
      if (diff < 0) { [days,hrs,mins,secs].forEach(el => el && (el.textContent = "00")); return; }
      if (days) days.textContent = pad(diff / 86400000);
      if (hrs)  hrs.textContent  = pad((diff % 86400000) / 3600000);
      if (mins) mins.textContent = pad((diff % 3600000) / 60000);
      if (secs) secs.textContent = pad((diff % 60000) / 1000);
    };
    tick(); setInterval(tick, 1000);
  });



  // ==========================================
  // 7. GALLERY LIGHTBOX
  // ==========================================
  const lightbox = document.getElementById("lightbox");
  const lbImg    = document.getElementById("lb-img");
  const lbCap    = document.getElementById("lb-caption");
  const lbClose  = document.getElementById("lb-close");

  const openLB = (src, cap) => {
    lbImg.src = src; lbImg.alt = cap || "";
    lbCap.textContent = cap || "";
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
  };
  const closeLB = () => {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
    setTimeout(() => lbImg.src = "", 400);
  };

  document.querySelectorAll(".gallery-item").forEach(item =>
    item.addEventListener("click", () => openLB(
      item.dataset.image, item.dataset.caption
    ))
  );
  lbClose?.addEventListener("click", closeLB);
  lightbox?.addEventListener("click", e => { if (e.target === lightbox) closeLB(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && lightbox?.classList.contains("open")) closeLB(); });

  // Reuse the hero platform logo pucks inside stream menus.
  const platformMatchers = [
    ["spotify", "spotify"],
    ["apple", "apple"],
    ["youtube", "youtube"],
    ["amazon", "amazon"],
    ["tidal", "tidal"],
    ["deezer", "deezer"],
    ["audiomack", "audiomack"],
    ["iheart", "iheart"]
  ];
  document.querySelectorAll(".rc-dropdown-menu .dropdown-item").forEach(item => {
    const key = platformMatchers.find(([needle]) => {
      const haystack = `${item.href || ""} ${item.textContent || ""}`.toLowerCase();
      return haystack.includes(needle);
    })?.[1];
    if (key) item.dataset.platform = key;
    item.dataset.defaultHref = item.href || "";

    const sourceLogo = key ? document.querySelector(`#platform-${key} .pc-logo`) : null;
    const currentIcon = item.querySelector("svg");
    if (!sourceLogo || !currentIcon) return;

    const logo = sourceLogo.cloneNode(true);
    logo.classList.add("dropdown-logo");
    currentIcon.replaceWith(logo);
  });

  // ==========================================
  // 8. MUSIC PLAYER (Phase 1 — placeholder safe)
  // ==========================================
  const audio = document.getElementById("main-audio");
  if (!audio) return;

  // DOM refs — main player
  const playBtn   = document.getElementById("play-btn");
  const prevBtn   = document.getElementById("prev-btn");
  const nextBtn   = document.getElementById("next-btn");
  const playIcon  = document.getElementById("play-icon");
  const pauseIcon = document.getElementById("pause-icon");
  const ppFill    = document.getElementById("pp-fill");
  const ppHandle  = document.getElementById("pp-handle");
  const pCurrent  = document.getElementById("p-current");
  const pDuration = document.getElementById("p-duration");
  const pProgress = document.getElementById("player-progress");
  const volBtn    = document.getElementById("vol-btn");
  const volHigh   = document.getElementById("vol-high");
  const volMute   = document.getElementById("vol-mute");
  const volSlider = document.getElementById("vol-slider");
  const pTitle    = document.getElementById("player-title");
  const pMeta     = document.getElementById("player-meta");
  const pArtImg   = document.getElementById("player-art-img");
  const pArtPh    = document.getElementById("player-art-placeholder");
  const waveViz   = document.getElementById("wave-viz");
  const playerShell = document.getElementById("player-shell");

  // DOM refs — sticky player
  const stickyPlayer = document.getElementById("sticky-player");
  const spPlay    = document.getElementById("sp-play");
  const spPrev    = document.getElementById("sp-prev");
  const spNext    = document.getElementById("sp-next");
  const spPlayI   = document.getElementById("sp-play-icon");
  const spPauseI  = document.getElementById("sp-pause-icon");
  const spFill    = document.getElementById("sp-fill");
  const spCurrent = document.getElementById("sp-current");
  const spDuration= document.getElementById("sp-duration");
  const spProgress= document.getElementById("sp-progress");
  const spVolBtn  = document.getElementById("sp-vol-btn");
  const spVolHigh = document.getElementById("sp-vol-high");
  const spVolMute = document.getElementById("sp-vol-mute");
  const spVolSlider=document.getElementById("sp-vol-slider");
  const spTitle   = document.getElementById("sp-title");
  const spArtImg  = document.getElementById("sp-art-img");
  const spArtPh   = document.getElementById("sp-art-placeholder");
  const spEq      = document.getElementById("sp-eq");

  // Build track list from playlist rows (supporting base64 path obfuscation)
  const plRows = document.querySelectorAll(".pl-row");
  const tracks  = [];
  plRows.forEach(row => {
    const rawSrc = row.dataset.src || "";
    let src = "";
    if (rawSrc) {
      try {
        // Decode base64 if it does not contain standard file slashes
        src = rawSrc.includes("/") ? rawSrc : atob(rawSrc);
      } catch (e) {
        console.error("Error decoding track source:", e);
        src = rawSrc;
      }
    }
    tracks.push({
      src:   src,
      title: row.dataset.title || "[ Track Title ]",
      genre: row.dataset.genre || "",
      art:   row.dataset.art   || ""
    });
    // Strip data-src from the DOM element immediately to obfuscate it
    row.removeAttribute("data-src");
  });

  // Decode and strip banner preview source immediately on page load (security lock)
  const bannerPreviewBtn = document.getElementById("banner-preview-btn");
  let decodedBannerSrc = "";
  if (bannerPreviewBtn) {
    const rawSrc = bannerPreviewBtn.dataset.src || "";
    if (rawSrc) {
      try {
        decodedBannerSrc = rawSrc.includes("/") ? rawSrc : atob(rawSrc);
      } catch (e) {
        console.error("Error decoding banner preview source:", e);
        decodedBannerSrc = rawSrc;
      }
    }
    bannerPreviewBtn.removeAttribute("data-src");
  }

  const bannerTrack = {
    src: "",
    title: "The Dusty Hoe Project (Teaser)",
    genre: "Album · 14 Tracks · Dropping Sept 4, 2026",
    art: "assets/the-dusty-hoe-project.png"
  };
  bannerTrack.src = decodedBannerSrc;

  const syncBannerPreviewBtn = (isPlaying) => {
    if (!bannerPreviewBtn) return;
    const isThisPlaying = isPlaying && audio.src && audio.src.includes(decodedBannerSrc);
    if (isThisPlaying) {
      bannerPreviewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right: 6px; vertical-align: middle;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        Pause Preview
      `;
    } else {
      bannerPreviewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right: 6px; vertical-align: middle;"><path d="M8 5.14v14l11-7-11-7z"/></svg>
        Preview Snippet
      `;
    }
  };

  // Decode and strip card 1 preview source immediately on page load (security lock)
  const cardPreviewBtn = document.getElementById("electric-power-hoe-preview-btn");
  let decodedCardSrc = "";
  if (cardPreviewBtn) {
    const rawSrc = cardPreviewBtn.dataset.src || "";
    if (rawSrc) {
      try {
        decodedCardSrc = rawSrc.includes("/") ? rawSrc : atob(rawSrc);
      } catch (e) {
        console.error("Error decoding card preview source:", e);
        decodedCardSrc = rawSrc;
      }
    }
    cardPreviewBtn.removeAttribute("data-src");
  }

  const cardTrack = {
    src: "",
    title: "Frequency Shift (Preview)",
    genre: "Pop / Dance · 2026",
    art: "assets/frequency-shift.png"
  };
  cardTrack.src = decodedCardSrc;

  const syncCardPreviewBtn = (isPlaying) => {
    if (!cardPreviewBtn) return;
    const isThisPlaying = isPlaying && audio.src && audio.src.includes(decodedCardSrc);
    if (isThisPlaying) {
      cardPreviewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right: 6px; vertical-align: middle;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        Pause
      `;
    } else {
      cardPreviewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12" style="margin-right: 6px; vertical-align: middle;"><path d="M8 5.14v14l11-7-11-7z"/></svg>
        Preview
      `;
    }
  };

  let current  = 0;
  let playing  = false;
  let stickyActivated = false;
  const PREVIEW_SECONDS = 30;

  const fmt = s => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  };
  const show = el => el?.classList.remove("hidden");
  const hide = el => el?.classList.add("hidden");
  const getPreviewDuration = () => {
    const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : PREVIEW_SECONDS;
    return Math.min(PREVIEW_SECONDS, duration);
  };
  const syncProgress = () => {
    const previewDuration = getPreviewDuration();
    const currentTime = Math.min(audio.currentTime || 0, previewDuration);
    const pct = previewDuration ? (currentTime / previewDuration) * 100 : 0;

    if (ppFill)   ppFill.style.width    = `${pct}%`;
    if (ppHandle) ppHandle.style.left   = `${pct}%`;
    if (pCurrent) pCurrent.textContent  = fmt(currentTime);
    if (spFill)   spFill.style.width    = `${pct}%`;
    if (spCurrent)spCurrent.textContent = fmt(currentTime);
    if (pDuration)  pDuration.textContent  = fmt(previewDuration);
    if (spDuration) spDuration.textContent = fmt(previewDuration);
  };

  const syncUI = (isPlaying) => {
    playing = isPlaying;

    // Main player
    isPlaying ? hide(playIcon)  : show(playIcon);
    isPlaying ? show(pauseIcon) : hide(pauseIcon);
    playBtn?.classList.toggle("playing", isPlaying);
    waveViz?.classList.toggle("playing", isPlaying);
    playerShell?.classList.toggle("playing", isPlaying);

    // Sticky player
    isPlaying ? hide(spPlayI)  : show(spPlayI);
    isPlaying ? show(spPauseI) : hide(spPauseI);
    stickyPlayer?.classList.toggle("playing", isPlaying);
    spEq?.classList.toggle("playing", isPlaying);

    // Release play button (Out Now section) is now handled as a dropdown toggle.

    // Reveal sticky player on first play
    if (isPlaying && !stickyActivated && stickyPlayer) {
      stickyPlayer.classList.add("active");
      stickyActivated = true;
    }

    // Sync banner preview button state
    syncBannerPreviewBtn(isPlaying);

    // Sync card preview button state
    syncCardPreviewBtn(isPlaying);

    // Sync dropdown preview button state
    syncDropdownPreviewBtn(isPlaying);

    // Sync upcoming cards preview buttons
    document.querySelectorAll(".uc-preview-btn:not(.disabled)").forEach(btn => {
      const btnSrc = btn.dataset.src;
      const isThisPlaying = isPlaying && audio.src && btnSrc && audio.src.includes(btnSrc);
      if (isThisPlaying) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right:6px; vertical-align: middle;"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause Preview</span>`;
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" style="margin-right:6px; vertical-align: middle;"><path d="M8 5.14v14l11-7-11-7z"/></svg><span>Play Preview</span>`;
      }
    });

    // Sync mini card play buttons
    document.querySelectorAll(".mini-play-btn, .single-play-btn").forEach(btn => {
      const idx = getTargetTrackIndex(btn, -1);
      const isThisPlaying = isPlaying && current === idx;
      if (isThisPlaying) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
        btn.classList.add("playing");
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>`;
        btn.classList.remove("playing");
      }
    });

    // Sync album trilogy play pill buttons
    document.querySelectorAll(".at-play-pill").forEach(btn => {
      const idx = getTargetTrackIndex(btn, 0);
      const isThisPlaying = isPlaying && current === idx;
      if (isThisPlaying) {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg><span>Pause</span>`;
        btn.classList.add("playing");
      } else {
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5.14v14l11-7-11-7z"/></svg><span>Play</span>`;
        btn.classList.remove("playing");
      }
    });
  };

  const loadTrack = (indexOrTrack, autoPlay = false) => {
    let t;
    if (typeof indexOrTrack === "number") {
      if (indexOrTrack < 0 || indexOrTrack >= tracks.length) return;
      current = indexOrTrack;
      t = tracks[indexOrTrack];

      // Highlight active row
      plRows.forEach(r => r.classList.remove("active"));
      if (plRows[indexOrTrack]) {
        plRows[indexOrTrack].classList.add("active");
        if (autoPlay) {
          plRows[indexOrTrack].scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    } else {
      current = -1; // Special index for external/banner tracks
      t = indexOrTrack;

      // Clear active row highlight
      plRows.forEach(r => r.classList.remove("active"));
    }

    // Audio — skip if no src (Phase 1 placeholder)
    if (t.src && t.src.trim() !== "") {
      audio.src = t.src;
      audio.load();
    } else {
      audio.removeAttribute("src");
    }

    // Update titles
    if (pTitle) pTitle.textContent = t.title;
    if (pMeta)  pMeta.textContent  = t.genre;
    if (spTitle) spTitle.textContent = t.title;

    // Toggle art placeholder vs real image — main player
    if (t.art && t.art.trim() !== "") {
      if (pArtImg)  { pArtImg.src = t.art; show(pArtImg); }
      if (pArtPh)   pArtPh.style.display = "none";
      if (spArtImg) { spArtImg.src = t.art; show(spArtImg); }
      if (spArtPh)  spArtPh.style.display = "none";
    } else {
      if (pArtImg)  { pArtImg.src = ""; hide(pArtImg); }
      if (pArtPh)   pArtPh.style.display = "";
      if (spArtImg) { spArtImg.src = ""; hide(spArtImg); }
      if (spArtPh)  spArtPh.style.display = "";
    }

    // Reset progress
    [ppFill, spFill].forEach(el => { if (el) el.style.width = "0%"; });
    if (ppHandle) ppHandle.style.left = "0%";
    [pCurrent, spCurrent].forEach(el => { if (el) el.textContent = "0:00"; });
    const durationLabel = t.src && t.src.trim() !== "" ? fmt(PREVIEW_SECONDS) : "0:00";
    [pDuration, spDuration].forEach(el => { if (el) el.textContent = durationLabel; });

    if (autoPlay) doPlay();
    else syncUI(false);
  };

  const doPlay = () => {
    if (!audio.src || audio.src === window.location.href) return; // Phase 1: no src
    if (audio.currentTime >= getPreviewDuration() - 0.05) audio.currentTime = 0;
    audio.play().then(() => syncUI(true)).catch(err => { console.warn("Play error:", err); syncUI(false); });
  };
  const doPause = () => { audio.pause(); syncUI(false); };
  const toggle  = () => playing ? doPause() : doPlay();
  const prev    = () => loadTrack((current - 1 + tracks.length) % tracks.length, playing);
  const next    = () => loadTrack((current + 1) % tracks.length, playing);

  // Bind controls
  playBtn?.addEventListener("click", toggle);
  prevBtn?.addEventListener("click", prev);
  nextBtn?.addEventListener("click", next);
  spPlay?.addEventListener("click", toggle);
  spPrev?.addEventListener("click", prev);
  spNext?.addEventListener("click", next);

  // Unified Dropdown system for all stream buttons
  const rMenu = document.getElementById("release-dropdown-menu");
  let activeBtn = null;
  let dropdownPreviewTrack = null;
  let dropdownPreviewTracks = [];
  const platformSearchUrls = {
    spotify: query => `https://open.spotify.com/search/${encodeURIComponent(query)}`,
    apple: query => `https://music.apple.com/us/search?term=${encodeURIComponent(query)}`,
    youtube: query => `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
    amazon: query => `https://music.amazon.com/search/${encodeURIComponent(query)}`,
    tidal: query => `https://tidal.com/search?q=${encodeURIComponent(query)}`,
    deezer: query => `https://www.deezer.com/search/${encodeURIComponent(query)}`,
    audiomack: query => `https://audiomack.com/search?q=${encodeURIComponent(query)}`,
    soundcloud: query => `https://soundcloud.com/search?q=${encodeURIComponent(query)}`,
    iheart: query => `https://www.iheart.com/artist/henna-c-50618415`
  };

  const cleanTrackTitle = value => (value || "").replace(/\s*\(Preview\)\s*/gi, "").trim();
  const normalizeTrackTitle = value => cleanTrackTitle(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const findTrackByTitle = title => {
    const normalized = normalizeTrackTitle(title);
    if (!normalized) return null;
    return tracks.find(track => {
      const tNorm = normalizeTrackTitle(track.title);
      if (normalized.includes("big body") && tNorm.includes("big body")) return true;
      return tNorm === normalized || tNorm.includes(normalized) || normalized.includes(tNorm);
    }) || null;
  };
  const getTriggerTrackTitle = (btn) => {
    const rowTitle = btn?.closest(".pl-row")?.dataset.title;
    const cardTitle = btn?.closest(".recent-single-card, .mini-card")?.querySelector(".single-title, .mini-title")?.textContent;
    const releaseTitle = btn?.closest(".release-card")?.querySelector(".rc-title")?.textContent;
    return cleanTrackTitle(rowTitle || cardTitle || releaseTitle || "");
  };
  const getTriggerTrack = (btn, trackTitle = "") => {
    const row = btn?.closest(".pl-row");
    if (row) {
      const rowIndex = Array.from(plRows).indexOf(row);
      if (rowIndex >= 0) return tracks[rowIndex] || null;
    }
    return findTrackByTitle(trackTitle || getTriggerTrackTitle(btn));
  };

  const ensureDropdownTitle = () => {
    if (!rMenu) return null;
    let titleEl = rMenu.querySelector(".dropdown-track-title");
    if (!titleEl) {
      titleEl = document.createElement("div");
      titleEl.className = "dropdown-track-title";
      rMenu.prepend(titleEl);
    }
    return titleEl;
  };

  const ensureDropdownPreviewSection = () => {
    if (!rMenu) return null;
    let previewSection = rMenu.querySelector(".dropdown-preview-section");
    if (!previewSection) {
      previewSection = document.createElement("div");
      previewSection.className = "dropdown-preview-section";

      const divider = document.createElement("div");
      divider.className = "dropdown-divider";

      const firstPlatformLink = rMenu.querySelector(".dropdown-item");
      rMenu.insertBefore(previewSection, firstPlatformLink);
      rMenu.insertBefore(divider, firstPlatformLink);
    }
    return previewSection;
  };

  const syncDropdownPreviewBtn = (isPlaying = playing) => {
    if (!rMenu) return;
    const previewSection = ensureDropdownPreviewSection();
    if (!previewSection) return;

    // Check if multi-track album (e.g. Frequency Shift trilogy)
    if (dropdownPreviewTracks && dropdownPreviewTracks.length > 1) {
      previewSection.querySelectorAll(".dropdown-track-pill").forEach(pill => {
        const idx = parseInt(pill.dataset.index, 10);
        const trk = tracks[idx];
        const isThisPlaying = isPlaying && ((current === idx) || (audio.src && trk?.src && audio.src.includes(trk.src)));
        pill.classList.toggle("playing", isThisPlaying);
        const actionEl = pill.querySelector(".dtp-action");
        if (actionEl) {
          actionEl.innerHTML = isThisPlaying ? `
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
            <span>Pause</span>
          ` : `
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>
            <span>Preview</span>
          `;
        }
      });
      return;
    }

    // Single track preview button
    const previewBtn = previewSection.querySelector(".dropdown-preview-btn");
    if (!previewBtn) return;

    const hasPreview = Boolean(dropdownPreviewTrack?.src);
    previewBtn.disabled = !hasPreview;
    previewBtn.classList.toggle("disabled", !hasPreview);

    if (!hasPreview) {
      previewBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2zm1 15h-2v-2h2zm0-4h-2V7h2z"/></svg>
        Preview Coming Soon
      `;
      return;
    }

    const isThisPreviewPlaying = isPlaying && audio.src && audio.src.includes(dropdownPreviewTrack.src);
    previewBtn.innerHTML = isThisPreviewPlaying ? `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
      Pause Preview
    ` : `
      <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5.14v14l11-7-11-7z"/></svg>
      Play 30 Sec Preview
    `;
  };

  const renderDropdownPreviewSection = (isAlbumTrilogy) => {
    const previewSection = ensureDropdownPreviewSection();
    if (!previewSection) return;
    previewSection.innerHTML = "";

    if (isAlbumTrilogy) {
      const header = document.createElement("div");
      header.className = "dropdown-preview-header";
      header.textContent = "Select Track To Preview";
      previewSection.appendChild(header);

      const list = document.createElement("div");
      list.className = "dropdown-preview-list";

      const trilogyTracks = [
        { label: "TRACK 1", title: "The Realization", index: 0 },
        { label: "TRACK 2", title: "The Consequence", index: 1 },
        { label: "TRACK 3", title: "The Resolution", index: 2 }
      ];

      trilogyTracks.forEach(t => {
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = "dropdown-track-pill";
        pill.dataset.index = t.index;
        pill.innerHTML = `
          <div class="dtp-label">
            <span class="dtp-badge">${t.label}</span>
            <span class="dtp-title">${t.title}</span>
          </div>
          <div class="dtp-action">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>
            <span>Preview</span>
          </div>
        `;
        pill.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (current === t.index) {
            toggle();
          } else {
            loadTrack(t.index, true);
          }
        });
        list.appendChild(pill);
      });

      previewSection.appendChild(list);
    } else {
      const previewBtn = document.createElement("button");
      previewBtn.type = "button";
      previewBtn.className = "dropdown-preview-btn";
      previewBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropdownPreviewTrack?.src) return;

        const isThisLoaded = audio.src && audio.src.includes(dropdownPreviewTrack.src);
        if (isThisLoaded) {
          toggle();
        } else {
          loadTrack(dropdownPreviewTrack, true);
        }
      });
      previewSection.appendChild(previewBtn);
    }
  };

  const setDropdownContext = (trackTitle = "", triggerBtn = null) => {
    if (!rMenu) return;
    const title = cleanTrackTitle(trackTitle);
    const titleEl = ensureDropdownTitle();
    
    const isFrequencyShiftAlbum = title.toLowerCase().includes("frequency shift") || triggerBtn?.id === "release-play-btn" || Boolean(triggerBtn?.closest("#featured-release"));

    if (isFrequencyShiftAlbum) {
      dropdownPreviewTracks = [tracks[0], tracks[1], tracks[2]];
      dropdownPreviewTrack = tracks[0];
      renderDropdownPreviewSection(true);
    } else {
      dropdownPreviewTracks = [];
      dropdownPreviewTrack = getTriggerTrack(triggerBtn, title);
      renderDropdownPreviewSection(false);
    }

    if (titleEl) titleEl.textContent = title ? `Find ${title}` : "Stream On Your Platform";
    syncDropdownPreviewBtn(playing);

    rMenu.querySelectorAll(".dropdown-item").forEach(item => {
      const defaultHref = item.dataset.defaultHref || item.href;
      const platform = item.dataset.platform;
      const query = title ? `Henna C ${title}` : "";
      item.href = query && platformSearchUrls[platform] ? platformSearchUrls[platform](query) : defaultHref;
    });
  };

  const toggleDropdown = (btn, e, trackTitle = "") => {
    if (!rMenu) return;
    e?.preventDefault();
    e?.stopPropagation();
    if (activeBtn === btn) {
      closeDropdown();
      return;
    }
    closeDropdown();

    activeBtn = btn;
    btn.classList.add("open");
    btn.closest(".pl-actions")?.classList.add("open");
    setDropdownContext(trackTitle || getTriggerTrackTitle(btn), btn);
    rMenu.classList.add("open");

    const rect = btn.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    let leftPos = rect.left + scrollLeft;
    if (rect.left + 220 > window.innerWidth) {
      leftPos = rect.right + scrollLeft - 220;
    }

    rMenu.style.position = "absolute";
    rMenu.style.left = `${Math.max(10, leftPos)}px`;
    rMenu.style.top = `${rect.bottom + scrollTop + 8}px`;
    rMenu.style.zIndex = "9999";
    
    if (rMenu.parentElement !== document.body) {
      document.body.appendChild(rMenu);
    }
  };

  const closeDropdown = () => {
    if (activeBtn) {
      activeBtn.classList.remove("open");
      activeBtn = null;
    }
    document.querySelectorAll(".pl-actions.open").forEach(el => el.classList.remove("open"));
    rMenu?.classList.remove("open");
  };

  const mainReleaseBtn = document.getElementById("release-play-btn");
  const featuredAudio = document.getElementById("featured-audio");
  const featuredPlayText = document.getElementById("featured-play-text");

  if (featuredAudio) {
    featuredAudio.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  if (mainReleaseBtn && rMenu) {
    mainReleaseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleDropdown(mainReleaseBtn, e);
    });
  } else if (mainReleaseBtn && featuredAudio) {
    mainReleaseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      featuredAudio.paused ? featuredAudio.play() : featuredAudio.pause();
    });
  }
  // ──────────────────────────────────────────
  // RECENT SINGLES CATALOG (Rolling Top 3 System)
  // ──────────────────────────────────────────
  const RECENT_SINGLES_CATALOG = [
    {
      id: "dwm",
      title: "Dance With Me",
      genre: "Pop / Dance",
      meta: "Pop / Dance · Out Now",
      kicker: "New Single · Out Now",
      badge: "LATEST SINGLE",
      art: "assets/dance-with-me.jpg",
      src: "assets/audio/dance-with-me.wav",
      itunes: "https://music.apple.com/us/album/dance-with-me/6800257565?i=6800257566",
      releaseDate: "2026-08-15"
    },
    {
      id: "tamn",
      title: "That Ain't My Name",
      genre: "Hip-Hop / R&B",
      meta: "Hip-Hop / R&B · Out Now",
      kicker: "New Single · Out Now",
      badge: "LATEST SINGLE",
      art: "assets/that-aint-my-name.jpg",
      src: "assets/audio/that-aint-my-name.wav",
      itunes: "https://music.apple.com/us/album/that-aint-my-name/6800203966?i=6800203967",
      releaseDate: "2026-08-12"
    },
    {
      id: "bbe",
      title: "Big Body Energy",
      genre: "Hip-Hop / Rap",
      meta: "Hip-Hop / Rap · Out Now",
      kicker: "New Single · Out Now",
      badge: "LATEST SINGLE",
      art: "assets/big-body-energy.png",
      src: "assets/audio/big-body-cadillacs.wav",
      itunes: "https://music.apple.com/us/album/big-body-energy/6799845497?i=6799845498",
      releaseDate: "2026-08-10"
    },
    {
      id: "omt",
      title: "One More Time",
      genre: "Pop / Dance",
      meta: "Pop / Dance · Out Now",
      kicker: "Single · Out Now",
      badge: "SINGLE",
      art: "assets/one-more-time.png",
      src: "assets/audio/one-more-time.wav",
      itunes: "https://music.apple.com/us/album/one-more-time/6799821062?i=6799821063",
      releaseDate: "2026-07-28"
    },
    {
      id: "ltn",
      title: "Lose The Night",
      genre: "Pop / Dance",
      meta: "Pop / Dance · Out Now",
      kicker: "Single · Out Now",
      badge: "SINGLE",
      art: "assets/lose-the-night.png",
      src: "assets/audio/lose-the-night.wav",
      itunes: "https://music.apple.com/us/album/lose-the-night/6797718277?i=6797718278",
      releaseDate: "2026-07-20"
    },
    {
      id: "og",
      title: "OUTTA GAS",
      genre: "Hip-Hop / Rap",
      meta: "Hip-Hop / Rap · Out Now",
      kicker: "Single · Out Now",
      badge: "SINGLE",
      art: "assets/outta-gas.png",
      src: "assets/audio/outta-gas.wav",
      itunes: "https://music.apple.com/us/album/outta-gas/6798104030?i=6798104031",
      releaseDate: "2026-07-10"
    },
    {
      id: "inv",
      title: "Invisible",
      genre: "Punk / Hip-Hop",
      meta: "Punk / Hip-Hop · Out Now",
      kicker: "Single · Out Now",
      badge: "SINGLE",
      art: "assets/invisible.png",
      src: "assets/audio/invisible.wav",
      itunes: "https://music.apple.com/us/album/invisible/6798500865?i=6798500866",
      releaseDate: "2026-06-25"
    }
  ];

  function renderRecentSingles() {
    const miniGrid = document.getElementById("mini-grid");
    if (!miniGrid) return;

    // Sort by releaseDate descending, take exactly the top 4
    const sorted = [...RECENT_SINGLES_CATALOG].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    const topFour = sorted.slice(0, 4);

    miniGrid.innerHTML = topFour.map(single => {
      const isAvail = Boolean(single.itunes && !single.itunes.includes("artist/henna-c"));
      return `
      <div class="mini-card visible" id="mini-card-${single.id}">
        <div class="mini-art-wrap">
          <img src="${single.art}" alt="${single.title} artwork" loading="lazy">
          <button class="mini-play-btn" data-title="${single.title}" aria-label="Play ${single.title}">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.14v14l11-7-11-7z"/></svg>
          </button>
        </div>
        <div class="mini-text">
          <span class="mini-kicker">${single.kicker || "New Single · Out Now"}</span>
          <h4 class="mini-title">${single.title}</h4>
          <p class="mini-genre">${single.meta || single.genre + " · Out Now"}</p>
          <div class="mini-actions">
            <button class="mini-listen-btn" data-title="${single.title}">Listen Now ➔</button>
            <a href="${isAvail ? single.itunes : 'javascript:void(0)'}" ${isAvail ? 'target="_blank" rel="noopener noreferrer"' : 'aria-disabled="true"'} class="mini-itunes-btn ${isAvail ? '' : 'itunes-coming-soon'}" title="${isAvail ? `Purchase ${single.title} on iTunes` : `${single.title} - Coming Soon to iTunes`}">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.61 2.96-1.42"/></svg>
              <span>Purchase on iTunes</span>
            </a>
          </div>
        </div>
      </div>
    `;}).join("");

    // Bind playback and dropdown listeners to mini cards
    miniGrid.querySelectorAll(".mini-play-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const idx = getTargetTrackIndex(btn, 0);
        if (current === idx) toggle(); else loadTrack(idx, true);
      });
    });

    miniGrid.querySelectorAll(".mini-listen-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        toggleDropdown(btn, e);
      });
    });

    syncUI(playing);
  }

  // Public helper to release a new single on a rolling basis
  window.releaseNewSingle = function(single) {
    if (!single) return;
    if (!single.releaseDate) single.releaseDate = new Date().toISOString();
    if (!single.id) single.id = "single-" + Date.now();
    RECENT_SINGLES_CATALOG.unshift(single);
    renderRecentSingles();
  };

  // Initial render of the 4 most recent singles
  renderRecentSingles();

  document.querySelectorAll(".mini-listen-btn, .single-listen-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      toggleDropdown(btn, e);
    });
  });

  plRows.forEach(row => {
    if (row.querySelector(".pl-actions")) return;
    const title = cleanTrackTitle(row.dataset.title || row.querySelector(".pl-name")?.textContent || "");
    const itunesUrl = (row.dataset.itunes || "").trim();
    const isAvail = Boolean(itunesUrl && !itunesUrl.includes("artist/henna-c"));

    const actionGroup = document.createElement("div");
    actionGroup.className = "pl-actions";

    const itunesBtn = document.createElement("a");
    if (isAvail) {
      itunesBtn.href = itunesUrl;
      itunesBtn.target = "_blank";
      itunesBtn.rel = "noopener noreferrer";
      itunesBtn.className = "pl-itunes-btn";
      itunesBtn.setAttribute("aria-label", title ? `Purchase ${title} on iTunes` : "Purchase on iTunes");
      itunesBtn.title = title ? `Purchase ${title} on iTunes` : "Purchase on iTunes";
    } else {
      itunesBtn.href = "javascript:void(0)";
      itunesBtn.className = "pl-itunes-btn itunes-coming-soon";
      itunesBtn.setAttribute("aria-label", title ? `${title} - Coming Soon to iTunes` : "Coming Soon to iTunes");
      itunesBtn.title = title ? `${title} - Coming Soon to iTunes` : "Coming Soon to iTunes";
      itunesBtn.setAttribute("aria-disabled", "true");
    }

    itunesBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.61 2.96-1.42"/></svg>
      <span class="itunes-btn-text">Purchase on iTunes</span>
    `;
    itunesBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!isAvail) {
        e.preventDefault();
      }
    });

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pl-stream-btn";
    btn.textContent = "Listen Now";
    btn.setAttribute("aria-label", title ? `Find ${title} on your platform` : "Find this track on your platform");
    btn.addEventListener("click", (e) => toggleDropdown(btn, e, title));

    actionGroup.appendChild(itunesBtn);
    actionGroup.appendChild(btn);
    row.appendChild(actionGroup);
  });

  document.addEventListener("click", (e) => {
    if (activeBtn && !activeBtn.contains(e.target) && rMenu && !rMenu.contains(e.target)) {
      closeDropdown();
    }
  });

  window.addEventListener("resize", closeDropdown);
  window.addEventListener("scroll", closeDropdown);
  document.getElementById("mini-grid")?.addEventListener("scroll", closeDropdown);

  // Carousel scroll controls
  const miniGrid = document.getElementById("mini-grid");
  const prevBtnCarousel = document.getElementById("carousel-prev");
  const nextBtnCarousel = document.getElementById("carousel-next");
  if (miniGrid && prevBtnCarousel && nextBtnCarousel) {
    const scrollAmount = 338;
    prevBtnCarousel.addEventListener("click", () => {
      miniGrid.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    });
    nextBtnCarousel.addEventListener("click", () => {
      miniGrid.scrollBy({ left: scrollAmount, behavior: "smooth" });
    });
  }

  // Helper to find exact track index by element title, card text, or dataset index
  function getTargetTrackIndex(element, defaultIdx = 0) {
    const card = element.closest(".recent-single-card, .mini-card, .album-track-card, .upcoming-card, .pl-row, .featured-release-card");
    const rawTitle = element.dataset.title || card?.querySelector(".single-title, .mini-title, .at-title, .uc-name, .pl-name, .rc-title")?.textContent || "";
    if (rawTitle) {
      const clean = rawTitle.replace(/\(.*?\)/g, "").trim().toLowerCase();
      const matchIdx = tracks.findIndex(t => {
        const tClean = t.title.toLowerCase();
        if (clean.includes("big body") && tClean.includes("big body")) return true;
        return tClean === clean || tClean.includes(clean) || clean.includes(tClean);
      });
      if (matchIdx !== -1) return matchIdx;
    }
    const idxAttr = parseInt(element.dataset.index);
    return !isNaN(idxAttr) ? Math.min(Math.max(0, idxAttr), tracks.length - 1) : defaultIdx;
  }

  // Playlist row clicks
  plRows.forEach((row, i) => row.addEventListener("click", () => {
    if (current === i) toggle(); else loadTrack(i, true);
  }));

  // Single card & mini card play buttons & Listen Now buttons
  document.querySelectorAll(".single-play-btn, .mini-play-btn, .single-listen-btn, .mini-listen-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const idx = getTargetTrackIndex(btn, 0);
      if (current === idx) toggle(); else loadTrack(idx, true);
    });
  });

  // Album tracklist item clicks in Featured Release card
  document.querySelectorAll(".album-track-card, .at-play-pill").forEach(item => {
    item.addEventListener("click", e => {
      e.stopPropagation();
      const idx = getTargetTrackIndex(item, 0);
      if (current === idx) toggle(); else loadTrack(idx, true);
    });
  });

  // Coming soon card preview buttons (supports data-src, data-title, data-art, data-index)
  document.querySelectorAll(".uc-preview-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const src = btn.dataset.src;
      const title = btn.dataset.title || "Preview Track";
      const art = btn.dataset.art || "assets/henna-c-logo-square.jpg";
      if (src && src.trim() !== "") {
        const isThisLoaded = audio.src && audio.src.includes(src);
        if (isThisLoaded) {
          toggle();
        } else {
          loadTrack({ src: src, title: title + " (Preview)", genre: "Upcoming Single Preview", art: art }, true);
        }
      } else {
        const idx = getTargetTrackIndex(btn, 0);
        if (current === idx) toggle(); else loadTrack(idx, true);
      }
    });
  });

  // Banner preview snippet player
  const activeBannerBtn = document.getElementById("banner-preview-btn");
  if (activeBannerBtn) {
    activeBannerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const bannerSrc = activeBannerBtn.dataset.src || decodedBannerSrc || "assets/audio/the-realization.wav";
      const isThisLoaded = audio.src && audio.src.includes(bannerSrc);
      if (isThisLoaded) {
        toggle();
      } else {
        loadTrack({
          src: bannerSrc,
          title: "The Dusty Hoe Project (Teaser)",
          genre: "Upcoming Album · 14 Tracks · Dropping Sept 4, 2026",
          art: "assets/the-dusty-hoe-project.png"
        }, true);
      }
    });
  }

  // Audio events
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const previewDuration = getPreviewDuration();
    if (audio.duration > PREVIEW_SECONDS && audio.currentTime >= PREVIEW_SECONDS) {
      if (Math.abs(audio.currentTime - PREVIEW_SECONDS) > 0.05) audio.currentTime = PREVIEW_SECONDS;
      syncProgress();
      doPause();
      return;
    }
    if (audio.currentTime > previewDuration) audio.currentTime = previewDuration;
    syncProgress();
  });

  audio.addEventListener("loadedmetadata", () => {
    syncProgress();
  });

  audio.addEventListener("ended", next);

  // Seek
  const seek = (e, wrapper) => {
    if (!audio.duration) return;
    const r = wrapper.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * getPreviewDuration();
    syncProgress();
  };
  pProgress?.addEventListener("click", e => seek(e, pProgress));
  spProgress?.addEventListener("click", e => seek(e, spProgress));

  // Volume
  const setVol = v => {
    audio.volume = v;
    if (volSlider)   volSlider.value   = v;
    if (spVolSlider) spVolSlider.value = v;
    const muted = v === 0;
    muted ? hide(volHigh)  : show(volHigh);
    muted ? show(volMute)  : hide(volMute);
    muted ? hide(spVolHigh): show(spVolHigh);
    muted ? show(spVolMute): hide(spVolMute);
  };
  const muteTog = () => {
    if (audio.volume > 0) { audio.dataset.pv = audio.volume; setVol(0); }
    else setVol(parseFloat(audio.dataset.pv || "0.8"));
  };
  volSlider?.addEventListener("input",   e => setVol(parseFloat(e.target.value)));
  spVolSlider?.addEventListener("input", e => setVol(parseFloat(e.target.value)));
  volBtn?.addEventListener("click",   muteTog);
  spVolBtn?.addEventListener("click", muteTog);

  // Init (no autoplay)
  loadTrack(0);

  // ==========================================
  // 9. SMOOTH ANCHOR SCROLL
  // ==========================================
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener("click", function(e) {
      const id = this.getAttribute("href");
      if (id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    });
  });

  // ==========================================
  // 10. CLIENT-SIDE SECURITY HARDENING
  // ==========================================
  
  // Disable right-click context menu on key music players/elements to deter audio downloads
  const protectedElements = [
    document.getElementById("playlist"),
    document.getElementById("player-shell"),
    document.getElementById("sticky-player"),
    document.querySelector(".artwork-area"),
    document.querySelector(".album-cover")
  ];
  protectedElements.forEach(el => {
    if (el) {
      el.addEventListener("contextmenu", e => e.preventDefault());
    }
  });

  // Deter dragging of media (images/audio elements) to prevent quick extraction
  document.querySelectorAll("img, audio").forEach(el => {
    el.addEventListener("dragstart", e => e.preventDefault());
  });

  // Disable common developer inspector & page saving shortcuts
  window.addEventListener("keydown", e => {
    // 1. Disable Ctrl+S / Cmd+S (Save Page)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
    }
    // 2. Disable Ctrl+U / Cmd+Option+U (View Source)
    if ((e.ctrlKey && e.key.toLowerCase() === "u") || ((e.metaKey && e.altKey) && e.key.toLowerCase() === "u")) {
      e.preventDefault();
    }
    // 3. Disable Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
    if (((e.ctrlKey && e.shiftKey) || (e.metaKey && e.altKey)) && e.key.toLowerCase() === "i") {
      e.preventDefault();
    }
    // 4. Disable Ctrl+Shift+J / Cmd+Option+J (Developer Console)
    if (((e.ctrlKey && e.shiftKey) || (e.metaKey && e.altKey)) && e.key.toLowerCase() === "j") {
      e.preventDefault();
    }
    // 5. Disable Ctrl+Shift+C / Cmd+Option+C (Elements selector)
    if (((e.ctrlKey && e.shiftKey) || (e.metaKey && e.altKey)) && e.key.toLowerCase() === "c") {
      e.preventDefault();
    }
    // 6. Disable F12 (Inspect Element)
    if (e.key === "F12") {
      e.preventDefault();
    }
  });

  // ==========================================
  // 11. TOP HEADER SHARE DROPDOWN LOGIC
  // ==========================================
  const shareBtnDesktop = document.getElementById("share-btn-desktop");
  const shareDropdown = document.getElementById("share-dropdown");
  const shareUrlInput = document.getElementById("share-url-input");
  const shareCopyBtn = document.getElementById("share-copy-btn");
  const shareToast = document.getElementById("share-toast");

  const getCanonicalShareUrl = () => {
    return "https://hcmusic.live/";
  };

  const setupShareSocialLinks = (url) => {
    const title = "Henna C | Music Artist & Producer";
    const text = "Experience the latest releases, visuals, and audio from Henna C:";
    
    const xLink = document.getElementById("share-x");
    if (xLink) xLink.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

    const fbLink = document.getElementById("share-facebook");
    if (fbLink) fbLink.href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

    const waLink = document.getElementById("share-whatsapp");
    if (waLink) waLink.href = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + " " + url)}`;

    const mailLink = document.getElementById("share-email");
    if (mailLink) mailLink.href = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + url)}`;
  };

  const toggleShareDropdown = () => {
    if (!shareDropdown) return;
    const isOpen = shareDropdown.classList.contains("open");
    if (isOpen) {
      closeShareDropdown();
    } else {
      openShareDropdown();
    }
  };

  const openShareDropdown = () => {
    const targetUrl = getCanonicalShareUrl();
    if (shareUrlInput) shareUrlInput.value = targetUrl;
    setupShareSocialLinks(targetUrl);

    if (shareDropdown) {
      shareDropdown.classList.add("open");
      shareDropdown.setAttribute("aria-hidden", "false");
    }
    if (shareBtnDesktop) {
      shareBtnDesktop.classList.add("active");
      shareBtnDesktop.setAttribute("aria-expanded", "true");
    }
  };

  const closeShareDropdown = () => {
    if (shareDropdown) {
      shareDropdown.classList.remove("open");
      shareDropdown.setAttribute("aria-hidden", "true");
    }
    if (shareBtnDesktop) {
      shareBtnDesktop.classList.remove("active");
      shareBtnDesktop.setAttribute("aria-expanded", "false");
    }
  };

  if (shareBtnDesktop) {
    shareBtnDesktop.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleShareDropdown();
    });
  }

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (shareDropdown && shareDropdown.classList.contains("open")) {
      if (!shareDropdown.contains(e.target) && e.target !== shareBtnDesktop && !shareBtnDesktop.contains(e.target)) {
        closeShareDropdown();
      }
    }
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && shareDropdown && shareDropdown.classList.contains("open")) {
      closeShareDropdown();
    }
  });

  // Copy to Clipboard logic
  if (shareCopyBtn && shareUrlInput) {
    let resetTimer = null;
    shareCopyBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const textToCopy = shareUrlInput.value;
      try {
        await navigator.clipboard.writeText(textToCopy);
      } catch (err) {
        shareUrlInput.select();
        document.execCommand("copy");
      }

      // Visual feedback
      const copyIcon = shareCopyBtn.querySelector(".copy-icon");
      const checkIcon = shareCopyBtn.querySelector(".check-icon");
      const copyText = shareCopyBtn.querySelector(".copy-text");

      shareCopyBtn.classList.add("copied");
      if (copyIcon) copyIcon.classList.add("hidden");
      if (checkIcon) checkIcon.classList.remove("hidden");
      if (copyText) copyText.textContent = "Copied";
      if (shareToast) shareToast.classList.add("show");

      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        shareCopyBtn.classList.remove("copied");
        if (copyIcon) copyIcon.classList.remove("hidden");
        if (checkIcon) checkIcon.classList.add("hidden");
        if (copyText) copyText.textContent = "Copy";
        if (shareToast) shareToast.classList.remove("show");
      }, 2500);
    });
  }

  // ==========================================
  // 12. HERO MORE PLATFORMS DROPDOWN
  // ==========================================
  const platformMoreBtn = document.getElementById("platform-more-btn");
  const morePlatformsDropdown = document.getElementById("more-platforms-dropdown");

  if (platformMoreBtn && morePlatformsDropdown) {
    platformMoreBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = morePlatformsDropdown.classList.contains("open");
      if (isOpen) {
        morePlatformsDropdown.classList.remove("open");
        morePlatformsDropdown.setAttribute("aria-hidden", "true");
        platformMoreBtn.classList.remove("active");
        platformMoreBtn.setAttribute("aria-expanded", "false");
      } else {
        morePlatformsDropdown.classList.add("open");
        morePlatformsDropdown.setAttribute("aria-hidden", "false");
        platformMoreBtn.classList.add("active");
        platformMoreBtn.setAttribute("aria-expanded", "true");

        // Smoothly position button 80px from top of screen so the entire box displays with a generous gap on all sides
        setTimeout(() => {
          const btnRect = platformMoreBtn.getBoundingClientRect();
          const currentScroll = window.scrollY || window.pageYOffset;
          const targetY = currentScroll + btnRect.top - 80;
          window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }, 50);
      }
    });

    morePlatformsDropdown.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (link) {
        const href = link.getAttribute("href");
        if (href && href.startsWith("#")) {
          e.preventDefault();
          const targetEl = document.querySelector(href);
          morePlatformsDropdown.classList.remove("open");
          morePlatformsDropdown.setAttribute("aria-hidden", "true");
          platformMoreBtn.classList.remove("active");
          platformMoreBtn.setAttribute("aria-expanded", "false");
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }
    });

    document.addEventListener("click", (e) => {
      if (morePlatformsDropdown.classList.contains("open")) {
        if (!morePlatformsDropdown.contains(e.target) && e.target !== platformMoreBtn && !platformMoreBtn.contains(e.target)) {
          morePlatformsDropdown.classList.remove("open");
          morePlatformsDropdown.setAttribute("aria-hidden", "true");
          platformMoreBtn.classList.remove("active");
          platformMoreBtn.setAttribute("aria-expanded", "false");
        }
      }
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && morePlatformsDropdown.classList.contains("open")) {
        morePlatformsDropdown.classList.remove("open");
        morePlatformsDropdown.setAttribute("aria-hidden", "true");
        platformMoreBtn.classList.remove("active");
        platformMoreBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

});

