document.addEventListener("DOMContentLoaded", () => {

  // ==========================================
  // 1. PARTICLE CANVAS
  // ==========================================
  const canvas = document.getElementById("particle-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let particles = [];
    let mouse = { x: null, y: null, radius: 120 };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    // Track mouse position for interactive star flow
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener("mouseleave", () => {
      mouse.x = null;
      mouse.y = null;
    }, { passive: true });

    // Cosmic colors: Gold, amber, white, and subtle purple/pink highlights
    const COLORS = [
      "rgba(255, 213, 79, ",   // Gold
      "rgba(251, 191, 36, ",   // Amber
      "rgba(255, 255, 255, ",  // White
      "rgba(168, 85, 247, ",   // Purple
      "rgba(236, 72, 153, "    // Pink
    ];

    const spawn = (isInit = false) => {
      const depth = Math.random(); // 0 (far/slow) to 1 (near/fast)
      return {
        x: Math.random() * canvas.width,
        y: isInit ? Math.random() * canvas.height : canvas.height + 10,
        baseVx: (Math.random() - 0.5) * 0.2 * (depth + 0.2),
        baseVy: -(Math.random() * 0.4 + 0.1) * (depth + 0.2),
        vx: 0,
        vy: 0,
        r: Math.random() * 1.5 * (depth + 0.3) + 0.4,
        alpha: Math.random() * 0.5 + 0.2,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.02 + 0.005,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        depth: depth,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: Math.random() * 0.01 - 0.005
      };
    };

    const maxParticles = 85;
    for (let i = 0; i < maxParticles; i++) {
      particles.push(spawn(true));
    }

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      while (particles.length < maxParticles) {
        particles.push(spawn(false));
      }

      particles = particles.filter(p => p.y > -20 && p.x > -20 && p.x < canvas.width + 20);

      particles.forEach(p => {
        p.phase += p.phaseSpeed;
        p.angle += p.angleSpeed;

        const currentAlpha = Math.max(0.05, p.alpha + Math.sin(p.phase) * 0.15);

        let targetVx = p.baseVx + Math.sin(p.angle) * 0.08;
        let targetVy = p.baseVy;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius) {
            const force = (mouse.radius - dist) / mouse.radius;
            const angle = Math.atan2(dy, dx);
            targetVx += Math.cos(angle) * force * 1.2 * (p.depth + 0.5);
            targetVy += Math.sin(angle) * force * 1.2 * (p.depth + 0.5);
          }
        }

        p.vx += (targetVx - p.vx) * 0.08;
        p.vy += (targetVy - p.vy) * 0.08;

        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        
        if (p.depth > 0.7) {
          ctx.fillStyle = `${p.color}${currentAlpha * 0.45})`;
          ctx.fill();
          
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${currentAlpha})`;
        } else {
          ctx.fillStyle = `${p.color}${currentAlpha})`;
        }
        ctx.fill();
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
    title: "Electric Power Hoe (Preview)",
    genre: "Single · R&B / Hip-Hop · 2026",
    art: "assets/electric-power-hoe.png"
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
    title: "Electric Power Hoe (Preview)",
    genre: "Single · R&B / Hip-Hop · 2026",
    art: "assets/electric-power-hoe.png"
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

  const fmt = s => {
    if (!s || isNaN(s)) return "0:00";
    const m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return `${m}:${ss < 10 ? "0" : ""}${ss}`;
  };
  const show = el => el?.classList.remove("hidden");
  const hide = el => el?.classList.add("hidden");

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
  };

  const loadTrack = (indexOrTrack, autoPlay = false) => {
    let t;
    if (typeof indexOrTrack === "number") {
      if (indexOrTrack < 0 || indexOrTrack >= tracks.length) return;
      current = indexOrTrack;
      t = tracks[indexOrTrack];

      // Highlight active row
      plRows.forEach(r => r.classList.remove("active"));
      plRows[indexOrTrack]?.classList.add("active");
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
    [pDuration, spDuration].forEach(el => { if (el) el.textContent = "0:00"; });

    if (autoPlay) doPlay();
    else syncUI(false);
  };

  const doPlay = () => {
    if (!audio.src || audio.src === window.location.href) return; // Phase 1: no src
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

  // Unified Dropdown system for all "Listen Now" buttons
  const rMenu = document.getElementById("release-dropdown-menu");
  let activeBtn = null;

  const toggleDropdown = (btn, e) => {
    e.stopPropagation();
    if (activeBtn === btn) {
      closeDropdown();
      return;
    }
    closeDropdown();

    activeBtn = btn;
    btn.classList.add("open");
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
    rMenu?.classList.remove("open");
  };

  const mainReleaseBtn = document.getElementById("release-play-btn");
  const featuredAudio = document.getElementById("featured-audio");
  const featuredPlayText = document.getElementById("featured-play-text");

  if (featuredAudio) {
    featuredAudio.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  if (mainReleaseBtn && featuredAudio) {
    mainReleaseBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (featuredAudio.paused) {
        featuredAudio.play();
        if (featuredPlayText) featuredPlayText.textContent = "Pause";
        mainReleaseBtn.classList.add("playing");
      } else {
        featuredAudio.pause();
        if (featuredPlayText) featuredPlayText.textContent = "Listen Now";
        mainReleaseBtn.classList.remove("playing");
      }
    });
  } else if (mainReleaseBtn && rMenu) {
    mainReleaseBtn.addEventListener("click", (e) => {
      toggleDropdown(mainReleaseBtn, e);
    });
  }

  document.querySelectorAll(".mini-listen-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      toggleDropdown(btn, e);
    });
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

  // Playlist row clicks
  plRows.forEach((row, i) => row.addEventListener("click", () => {
    if (current === i) toggle(); else loadTrack(i, true);
  }));

  // Mini card play buttons
  document.querySelectorAll(".mini-play-btn").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const idx = Math.min(parseInt(btn.dataset.index) || 0, tracks.length - 1);
      if (current === idx) toggle(); else loadTrack(idx, true);
    });
  });

  // Coming soon preview buttons (only those with data-index)
  document.querySelectorAll(".uc-preview-btn[data-index]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Math.min(parseInt(btn.dataset.index) || 0, tracks.length - 1);
      if (current === idx) toggle(); else loadTrack(idx, true);
    });
  });

  // Card 1 preview snippet player (with secure closure source playback)
  if (cardPreviewBtn) {
    cardPreviewBtn.addEventListener("click", () => {
      if (decodedCardSrc) {
        const isThisLoaded = audio.src && audio.src.includes(decodedCardSrc);
        if (isThisLoaded) {
          toggle();
        } else {
          loadTrack(cardTrack, true);
        }
      }
    });
  }

  // Banner preview snippet player (with secure closure source playback)
  if (bannerPreviewBtn) {
    bannerPreviewBtn.addEventListener("click", () => {
      if (decodedBannerSrc) {
        const isThisLoaded = audio.src && audio.src.includes(decodedBannerSrc);
        if (isThisLoaded) {
          toggle();
        } else {
          loadTrack(bannerTrack, true);
        }
      }
    });
  }

  // Audio events
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    if (ppFill)   ppFill.style.width    = `${pct}%`;
    if (ppHandle) ppHandle.style.left   = `${pct}%`;
    if (pCurrent) pCurrent.textContent  = fmt(audio.currentTime);
    if (spFill)   spFill.style.width    = `${pct}%`;
    if (spCurrent)spCurrent.textContent = fmt(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    const d = fmt(audio.duration);
    if (pDuration)  pDuration.textContent  = d;
    if (spDuration) spDuration.textContent = d;
  });

  audio.addEventListener("ended", next);

  // Seek
  const seek = (e, wrapper) => {
    if (!audio.duration) return;
    const r = wrapper.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * audio.duration;
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

  // Portrait Blend Mode Toggle
  const modeButtons = document.querySelectorAll(".mode-btn");
  const portraitSpacer = document.querySelector(".about-portrait-spacer");
  const portraitBg = document.querySelector(".about-portrait-bg");
  if (modeButtons.length > 0 && portraitSpacer && portraitBg) {
    modeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        modeButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const mode = btn.getAttribute("data-mode");
        
        // Remove existing mode classes
        portraitSpacer.className = "about-portrait-spacer";
        portraitBg.className = "about-portrait-bg";
        
        // Add new mode class
        portraitSpacer.classList.add(`mode-${mode}`);
        portraitBg.classList.add(`mode-${mode}`);
      });
    });
  }

});
