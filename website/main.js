// OpenMatrix Website JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Mobile menu toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      mobileMenuBtn.classList.toggle('active');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Navbar background on scroll
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(10, 22, 40, 0.98)';
    } else {
      navbar.style.background = 'rgba(10, 22, 40, 0.9)';
    }
  });

  // Animate elements on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.feature-card, .step').forEach(el => {
    observer.observe(el);
  });

  // ===== Share Feature =====
  initShareFeature();
});

// ===== Share Feature =====
function initShareFeature() {
  const shareFab = document.getElementById('shareFab');
  const shareOverlay = document.getElementById('shareOverlay');
  const shareModalClose = document.getElementById('shareModalClose');
  const shareWeChat = document.getElementById('shareWeChat');
  const shareCopy = document.getElementById('shareCopy');
  const shareNative = document.getElementById('shareNative');
  const shareQrSection = document.getElementById('shareQrSection');
  const shareQrImage = document.getElementById('shareQrImage');

  // Show Web Share API button if supported
  if (navigator.share) {
    shareNative.style.display = '';
  }

  // Open share modal
  shareFab.addEventListener('click', () => {
    shareOverlay.classList.add('active');
    shareQrSection.style.display = 'none'; // Reset QR section
    document.body.style.overflow = 'hidden';
  });

  // Close share modal
  function closeShareModal() {
    shareOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  shareModalClose.addEventListener('click', closeShareModal);

  shareOverlay.addEventListener('click', (e) => {
    if (e.target === shareOverlay) closeShareModal();
  });

  // WeChat: show QR code
  shareWeChat.addEventListener('click', () => {
    const pageUrl = window.location.href;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}&bgcolor=ffffff&color=0A1628`;
    shareQrImage.src = qrApiUrl;
    shareQrSection.style.display = 'block';
  });

  // Copy link
  shareCopy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast('链接已复制，可粘贴到微信分享');
      closeShareModal();
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = window.location.href;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('链接已复制，可粘贴到微信分享');
      closeShareModal();
    }
  });

  // Native share (Web Share API)
  shareNative.addEventListener('click', async () => {
    try {
      await navigator.share({
        title: 'OpenMatrix - AI 原生任务编排框架',
        text: 'TDD + 严格质量门禁 + 全自动执行的 AI 任务编排系统',
        url: window.location.href
      });
      closeShareModal();
    } catch (err) {
      // User cancelled or not supported, do nothing
    }
  });
}

// Toast notification
function showToast(message) {
  let toast = document.querySelector('.share-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'share-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => {
    toast.classList.remove('active');
  }, 2000);
}

// Terminal animation
function animateTerminal() {
  const lines = [
    { text: '$ npx openmatrix start', delay: 0 },
    { text: '✓ 初始化项目结构...', delay: 500, class: 'text-green' },
    { text: '✓ 检测到 3 个 Phase', delay: 800, class: 'text-green' },
    { text: '→ Phase 1: 设计阶段', delay: 1100, class: 'text-blue' },
    { text: '  ✓ TASK-001: 架构设计', delay: 1400, class: 'text-green' },
    { text: '  ✓ TASK-002: 数据模型', delay: 1700, class: 'text-green' },
    { text: '→ Phase 2: 开发阶段', delay: 2000, class: 'text-blue' },
    { text: '  ◉ TASK-003: API 接口 (进行中)', delay: 2300, class: 'text-orange' },
  ];

  // Animation is handled by CSS, this is for future enhancement
}

// Copy code functionality
function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock.querySelector('code').textContent;

  navigator.clipboard.writeText(code).then(() => {
    const originalText = button.textContent;
    button.textContent = '已复制!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  });
}

// Stats counter animation
function animateStats() {
  const stats = document.querySelectorAll('.stat-value');

  stats.forEach(stat => {
    const target = parseInt(stat.textContent.replace(/[^0-9]/g, ''));
    const suffix = stat.textContent.replace(/[0-9]/g, '');
    let current = 0;
    const increment = target / 50;
    const duration = 1500;
    const stepTime = duration / 50;

    const counter = setInterval(() => {
      current += increment;
      if (current >= target) {
        stat.textContent = target + suffix;
        clearInterval(counter);
      } else {
        stat.textContent = Math.floor(current) + suffix;
      }
    }, stepTime);
  });
}

// Initialize stats animation when in view
const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateStats();
      statsObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  statsObserver.observe(heroStats);
}
