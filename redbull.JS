// 1. السكرول الناعم (Lenis)
const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
requestAnimationFrame(raf);

gsap.registerPlugin(ScrollTrigger);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0, 0);

// 2. تشتت العلب (الهيرو)
const heroTl = gsap.timeline({
    scrollTrigger: { trigger: ".hero-section", start: "top top", end: "+=150%", scrub: 1, pin: true }
});
heroTl.to(".can-yellow", { x: -600, y: -200, rotation: -45, scale: 0.5, opacity: 0 }, 0)
      .to(".can-red", { x: 600, y: -300, rotation: 60, scale: 0.5, opacity: 0 }, 0)
      .to(".can-white", { x: -500, y: 300, rotation: -80, scale: 0.5, opacity: 0 }, 0)
      .to(".can-green", { x: 500, y: 400, rotation: 45, scale: 0.5, opacity: 0 }, 0)
      .to(".main-can", { y: window.innerHeight * 1.5, scale: 1.5, rotation: 360, ease: "power2.inOut" }, 0); 

// 3. الأقسام الـ 6 الملونة
gsap.utils.toArray('.panel').forEach((panel) => {
    ScrollTrigger.create({ trigger: panel, start: "top top", pin: true, pinSpacing: false });
    const can = panel.querySelector('.panel-can');
    gsap.from(can, { scrollTrigger: { trigger: panel, start: "top 80%", end: "center center", scrub: 1 }, y: 400, rotation: -45, opacity: 0, scale: 0.8 });
});

// 4. فيديوهات التيك توك (التشغيل والأنيميشن)
const phoneCards = document.querySelectorAll('.phone-card');
phoneCards.forEach(card => {
    const vid = card.querySelector('video');
    if(vid) {
        vid.muted = true;
        card.addEventListener('mouseenter', () => {
            let playPromise = vid.play();
            if (playPromise !== undefined) { playPromise.catch(error => { console.log("جاهز"); }); }
        });
        card.addEventListener('mouseleave', () => { vid.pause(); });
    }
});

gsap.fromTo(".phone-card", 
    { y: 150, opacity: 0 }, 
    { scrollTrigger: { trigger: ".testimonials-section", start: "top 80%" }, y: 0, opacity: 1, duration: 0.8, stagger: 0.2, ease: "power2.out" }
);

// 5. زرار الفيديو الرئيسي في الأسفل والشاشة المنبثقة
gsap.from(".play-circle", { scrollTrigger: { trigger: ".action-video-section", start: "top 60%" }, scale: 0, opacity: 0, duration: 1, ease: "back.out(1.7)" });

const playCircle = document.querySelector('.play-circle');
const videoModal = document.querySelector('.video-modal');
const closeModal = document.querySelector('.close-modal');
const mainVideo = document.getElementById('mainVideo');

if(playCircle && videoModal) {
    playCircle.addEventListener('click', () => { videoModal.classList.add('active'); mainVideo.play(); });
    closeModal.addEventListener('click', () => { videoModal.classList.remove('active'); mainVideo.pause(); mainVideo.currentTime = 0; });
}

// 6. الفوتر والطرطشة
gsap.from(".footer-hashtag, .icon", { scrollTrigger: { trigger: ".site-footer", start: "top 70%" }, y: 100, opacity: 0, duration: 1, stagger: 0.1, ease: "back.out(1.5)" });
gsap.to(".splash-container", { scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: 1 }, y: -150, ease: "none" });