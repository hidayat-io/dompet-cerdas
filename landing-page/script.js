document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const navbar = document.querySelector('.navbar');

    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            // Simple toggle for demo purposes
            const isFlex = navLinks.style.display === 'flex';

            if (!isFlex) {
                navLinks.style.display = 'flex';
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.background = 'white';
                navLinks.style.padding = '20px';
                navLinks.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                navLinks.style.borderBottom = '1px solid #E5E7EB';
            } else {
                navLinks.style.display = ''; // Revert to CSS default
                navLinks.style.flexDirection = '';
                navLinks.style.position = '';
                navLinks.style.top = '';
                navLinks.style.width = '';
                navLinks.style.background = '';
                navLinks.style.padding = '';
                navLinks.style.boxShadow = '';
                navLinks.style.borderBottom = '';
            }
        });
    }

    // Smooth Scroll for Anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            // Close mobile menu if open
            if (window.innerWidth <= 900) {
                navLinks.style.display = '';
                navLinks.style.flexDirection = '';
                navLinks.style.position = '';
                navLinks.style.top = '';
                navLinks.style.width = '';
                navLinks.style.background = '';
                navLinks.style.padding = '';
                navLinks.style.boxShadow = '';
                navLinks.style.borderBottom = '';
            }

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Simple tilt effect for hero cards
    const heroCards = document.querySelectorAll('.floating-card');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.pageX) / 50;
        const y = (window.innerHeight / 2 - e.pageY) / 50;

        heroCards.forEach(card => {
            const speed = card.classList.contains('card-1') ? 1 : 2;
            card.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
        });
    });
});
