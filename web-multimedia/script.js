const audioAnimation = {
    canvas: document.querySelector('canvas#audio-visuals'),
    context: null,
    init(audioContext, audioSource) {
        this.context = this.canvas.getContext('2d');
        // Set up audio analyser (see Web Audio API)
        const analyser = new AnalyserNode(audioContext,
            { fftSize: 1024, smoothingTimeConstant: 0.7 });
        audioSource.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        // Style canvas so it matches with css
        let { width, height, color } = getComputedStyle(this.canvas);
        const [, r, g, b] = color.match(/rgb\((\d+), (\d+), (\d+)\)/);
        this.color = (opacity) => `rgba(${r}, ${g}, ${b}, ${opacity})`;
        this.canvas.width = width = parseInt(width);
        this.canvas.height = height = parseInt(height);
        // Define and start heatmap-like animation
        const halfWidth = width / 2;
        const animate = () => {
            analyser.getByteFrequencyData(data);
            this.context.clearRect(0, 0, width, height);
            this.drawHeatmap(data, halfWidth, 0, halfWidth, height);
            this.drawHeatmap(data, halfWidth, 0, -halfWidth, height);
            requestAnimationFrame(animate);
        };
        animate();
    },
    drawHeatmap(data, x, y, width, height) {
        const interval = width / data.length;
        const thickness = interval * 1.01;
        for (let i = 0; i < data.length; i++) {
            const offset = x + i * interval;
            const opacity = data[i] / 256;
            this.context.fillStyle = this.color(opacity);
            this.context.fillRect(offset, y, thickness, height);
        }
    },
    drawBars(data, x, y, width, height) {
        const interval = width / data.length;
        const thickness = interval * 1;
        const lengthUnit = height / 256;
        for (let i = 0; i < data.length; i++) {
            const offset = x + i * interval;
            const length = data[i] * lengthUnit;
            this.context.fillRect(offset, y, thickness, length);
        }
    },
};

const audioPlayback = {
    audio: null,
    init() {
        this.audio = new Audio();
        const context = new AudioContext();
        const source = context.createMediaElementSource(this.audio);
        source.connect(context.destination);
        audioAnimation.init(context, source);
    },
    play() { this.audio && this.audio.play(); },
    pause() { this.audio && this.audio.pause(); },
    reset() { this.audio && this.audio.fastSeek(0); },
    setup(url, autoplay = false) {
        if (!this.audio) { this.init(); }
        if (url === "") { this.audio.removeAttribute('src'); }
        else if (this.audio.src !== url) { this.audio.src = url; }
        if (autoplay) { this.play(); }
    },
};

const gallery = new class { // Use anonimous class because constructor is needed
    root = document.querySelector('#gallery');

    constructor() {
        this.figures = Array.from(this.root.querySelectorAll('figure'));
        const spacings = this.figures.map(f => f.getBoundingClientRect().left)
            .map((fig, i, arr) => (fig - arr[i - 1]) || 0).slice(1);
        if (!spacings.every((x, _, a) => x === a[0])) {
            console.warn('Irregular figures spacing', spacings);
        }
        this.figureSpacing = spacings.reduce((a, b) => a + b) / (spacings.length);
    }

    scrollToNthFigure(n, behavior = 'auto') {
        this.figures.at(n).scrollIntoView({ behavior });
    }

    scrollNFiguresAway(n, behavior = 'auto') {
        this.root.scrollBy({ left: n * this.figureSpacing, behavior });
    }

    isNthFigureVisible(n) {
        const bounds = this.root.getBoundingClientRect();
        const target = this.figures.at(n).getBoundingClientRect();
        return (
            (bounds.left <= target.left && target.left < bounds.right) ||
            (bounds.left < target.right && target.right <= bounds.right)
        );
    }

    scrollToAdjacentCyclically(step = 1, behavior = 'auto', edgeBehavior = null) {
        const targetEdge = step > 0 ? -1 : 0;
        if (this.isNthFigureVisible(targetEdge) &&
            !this.isNthFigureVisible(targetEdge - step)) {
            this.scrollToNthFigure(targetEdge + step, edgeBehavior || behavior);
        } else {
            this.scrollNFiguresAway(step, behavior);
        }
    }
};

const galleryHotkeyScroll = {
    enabled: true,
    inhibit(timeoutSeconds) {
        if (!this.enabled) { return; }
        this.enabled = false;
        setTimeout(() => { this.enabled = true; }, timeoutSeconds * 1000);
    },
    handleKeydown(event) {
        if (!this.enabled || !document.activeElement.contains(gallery.root)) {
            return;
        }
        const key = event.key;
        const digit = parseInt(key);
        if (!isNaN(digit) && 0 < digit && digit <= gallery.figures.length) {
            gallery.scrollToNthFigure(digit - 1);
        } else if (key === 'ArrowLeft') {
            gallery.scrollToAdjacentCyclically(-1);
        } else if (key === 'ArrowRight') {
            gallery.scrollToAdjacentCyclically(1);
        } else {
            return;
        }
        event.preventDefault();
    }
};

const galleryAutoscroll = {
    intervalId: null,
    intervalSeconds: null,
    stop() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    },
    start() {
        if (this.intervalSeconds === null || this.intervalId !== null) return;
        this.intervalId = setInterval(
            () => gallery.scrollToAdjacentCyclically(),
            this.intervalSeconds * 1000);
    },
    setup(intervalSeconds = null) {
        if (this.intervalId !== null) clearInterval(this.intervalId);
        this.intervalSeconds = intervalSeconds;
    }
};

const slideshowControl = {
    root: document.querySelector('#slideshow-control'),
    stop() {
        this.root.classList.remove('playing');
        audioPlayback.pause();
        galleryAutoscroll.stop();
    },
    start() {
        this.root.classList.add('playing');
        audioPlayback.play();
        galleryAutoscroll.start();
    },
    togglePlayback() {
        this.root.classList.contains('playing') ? this.stop() : this.start();
    },
    reset() {
        audioPlayback.reset();
        galleryAutoscroll.stop();
        gallery.scrollToNthFigure(0);
        galleryAutoscroll.start();
    }
};

const slideshowDetails = new class {
    dialog = document.querySelector('dialog#slideshow-details');
    form = document.querySelector('#slideshow-details form');

    constructor() {
        // Disable interval input for autoscroll when autoscroll is disabled 
        const autoscrollSwitch = this.form.querySelector('#autoscroll-switch');
        const autoscrollInterval = this.form.querySelector('#autoscroll-interval');
        autoscrollSwitch.addEventListener('change', (event) => {
            autoscrollInterval.disabled = !event.target.checked;
        });
        // Convert relative URLs of predefined audio options to absolute ones
        const audioOptions = this.form.querySelector('#audio-options');
        audioOptions.querySelectorAll('input[name="audio"]').forEach(option => {
            if (option.value !== "")
                option.value = new URL(option.value, document.location);
        });
        // Add uploaded files to available audio options list
        const customAudioOption = this.form.querySelector('#custom-audio-option');
        const customAudioInput = this.form.querySelector('#custom-audio-input');
        customAudioInput.addEventListener('change', () => {
            const file = customAudioInput.files[0];
            const option = customAudioOption.content.cloneNode(true);
            option.querySelector('input').value = URL.createObjectURL(file);
            option.querySelector('slot').replaceWith(file.name);
            audioOptions.appendChild(option);
        });
    }

    open() {
        slideshowControl.stop();
        this.dialog.showModal();
    }

    handleClick(event) {
        const { left, right, top, bottom } = this.dialog.getBoundingClientRect();
        if (event.clientX < left || right < event.clientX ||
            event.clientY < top || bottom < event.clientY) {
            this.dialog.close();
        }
    }

    process() {
        const data = new FormData(this.form);
        galleryAutoscroll.setup(data.get('autoscroll') === 'on' ?
            data.get('autoscroll-interval') : null);
        audioPlayback.setup(data.get('audio'));
        slideshowControl.start();
    }
};


