document.addEventListener("DOMContentLoaded", () => {
  // --- Header & Scroll Effects ---
  const header = document.querySelector("[data-header]");
  const year = document.querySelector("[data-year]");

  const updateHeader = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 24);
    }
  };

  if (year) {
    year.textContent = new Date().getFullYear().toString();
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  // --- Premium Audio Player Logic ---
  const audio = document.getElementById("main-audio");
  const playBtn = document.getElementById("play-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const playIcon = document.getElementById("play-icon");
  const pauseIcon = document.getElementById("pause-icon");
  const progressWrapper = document.getElementById("progress-wrapper");
  const progressFill = document.getElementById("progress-fill");
  const progressHandle = document.getElementById("progress-handle");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  
  const volumeBtn = document.getElementById("volume-btn");
  const volumeHighIcon = document.getElementById("volume-high");
  const volumeMuteIcon = document.getElementById("volume-mute");
  const volumeSlider = document.getElementById("volume-slider");
  
  const playerTrackTitle = document.getElementById("player-track-title");
  const playerTrackMeta = document.getElementById("player-track-meta");
  const playlistTracks = document.querySelectorAll(".playlist-track");
  const playerContainer = document.querySelector("[data-player]");
  const waveVisualizer = document.getElementById("wave-visualizer");
  const beatSelectDropdown = document.getElementById("beat-select");

  let currentTrackIndex = 0;
  let isPlaying = false;

  // Format time (seconds -> MM:SS)
  const formatTime = (secs) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Load a track by index
  const loadTrack = (index) => {
    if (index < 0 || index >= playlistTracks.length) return;
    
    // Remove active class from all tracks
    playlistTracks.forEach(t => t.classList.remove("active"));
    
    // Get active track element and data attributes
    const activeTrackEl = playlistTracks[index];
    activeTrackEl.classList.add("active");
    
    const trackSrc = activeTrackEl.getAttribute("data-src");
    const trackTitle = activeTrackEl.getAttribute("data-title");
    const trackGenre = activeTrackEl.getAttribute("data-genre");
    const trackBpm = activeTrackEl.getAttribute("data-bpm");

    // Load sources
    audio.src = trackSrc;
    audio.load();

    // Update UI elements
    playerTrackTitle.textContent = trackTitle;
    playerTrackMeta.textContent = `${trackGenre} • ${trackBpm} BPM`;
    currentTrackIndex = index;
    
    // Sync Select Dropdown in Booking Form to match the active track
    if (beatSelectDropdown) {
      const optionValue = trackTitle.toLowerCase().replace(/\s+/g, "-");
      const matchedOption = Array.from(beatSelectDropdown.options).find(opt => opt.value === optionValue);
      if (matchedOption) {
        beatSelectDropdown.value = optionValue;
      }
    }

    resetProgress();
  };

  // Play audio
  const playTrack = () => {
    if (!audio.src) return;
    isPlaying = true;
    audio.play()
      .then(() => {
        playIcon.classList.add("hidden");
        pauseIcon.classList.remove("hidden");
        playerContainer.classList.add("playing");
        waveVisualizer.classList.add("playing");
      })
      .catch(err => {
        console.error("Audio playback error: ", err);
        isPlaying = false;
      });
  };

  // Pause audio
  const pauseTrack = () => {
    isPlaying = false;
    audio.pause();
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
    playerContainer.classList.remove("playing");
    waveVisualizer.classList.remove("playing");
  };

  // Reset Progress UI
  const resetProgress = () => {
    progressFill.style.width = "0%";
    progressHandle.style.left = "0%";
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
  };

  // Toggle Play/Pause Button
  playBtn.addEventListener("click", () => {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  });

  // Previous Track Control
  prevBtn.addEventListener("click", () => {
    let prevIndex = currentTrackIndex - 1;
    if (prevIndex < 0) {
      prevIndex = playlistTracks.length - 1; // loop back to end
    }
    loadTrack(prevIndex);
    if (isPlaying) playTrack();
  });

  // Next Track Control
  nextBtn.addEventListener("click", () => {
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= playlistTracks.length) {
      nextIndex = 0; // loop back to start
    }
    loadTrack(nextIndex);
    if (isPlaying) playTrack();
  });

  // Audio Playback Events
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration) return;
    
    const percentage = (audio.currentTime / audio.duration) * 100;
    progressFill.style.width = `${percentage}%`;
    progressHandle.style.left = `${percentage}%`;
    
    currentTimeEl.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener("loadedmetadata", () => {
    durationEl.textContent = formatTime(audio.duration);
  });

  audio.addEventListener("ended", () => {
    // Automatically auto-advance to next beat
    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= playlistTracks.length) {
      nextIndex = 0;
    }
    loadTrack(nextIndex);
    playTrack();
  });

  // Custom Seek Controls
  const seek = (e) => {
    if (!audio.duration) return;
    const rect = progressWrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(1, clickX / width));
    
    audio.currentTime = percentage * audio.duration;
    
    progressFill.style.width = `${percentage * 100}%`;
    progressHandle.style.left = `${percentage * 100}%`;
  };

  progressWrapper.addEventListener("click", seek);

  // Drag seek functionality (Optional but premium)
  let isDragging = false;
  progressWrapper.addEventListener("mousedown", (e) => {
    isDragging = true;
    seek(e);
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) seek(e);
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // Playlist Track Click Select
  playlistTracks.forEach((track, index) => {
    track.addEventListener("click", () => {
      if (currentTrackIndex === index) {
        // Toggle play/pause if clicking the already active track
        if (isPlaying) {
          pauseTrack();
        } else {
          playTrack();
        }
      } else {
        loadTrack(index);
        playTrack();
      }
    });
  });

  // Volume Controls
  const updateVolume = (val) => {
    audio.volume = val;
    volumeSlider.value = val;
    
    if (val === 0) {
      volumeHighIcon.classList.add("hidden");
      volumeMuteIcon.classList.remove("hidden");
    } else {
      volumeHighIcon.classList.remove("hidden");
      volumeMuteIcon.classList.add("hidden");
    }
  };

  volumeSlider.addEventListener("input", (e) => {
    updateVolume(parseFloat(e.target.value));
  });

  volumeBtn.addEventListener("click", () => {
    if (audio.volume > 0) {
      audio.dataset.prevVolume = audio.volume;
      updateVolume(0);
    } else {
      const prevVol = audio.dataset.prevVolume ? parseFloat(audio.dataset.prevVolume) : 0.8;
      updateVolume(prevVol);
    }
  });

  // Sync back from Booking Form Select Dropdown
  if (beatSelectDropdown) {
    beatSelectDropdown.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "none" || val === "other-custom") return;
      
      const matchedIndex = Array.from(playlistTracks).findIndex(track => {
        return track.getAttribute("data-title").toLowerCase().replace(/\s+/g, "-") === val;
      });
      
      if (matchedIndex !== -1 && matchedIndex !== currentTrackIndex) {
        loadTrack(matchedIndex);
        playTrack();
      }
    });
  }

  // Initial Load (loads the first track without auto-playing)
  loadTrack(0);
});
