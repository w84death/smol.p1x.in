document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            window.scrollTo({
                top: targetSection.offsetTop - 80,
                behavior: 'smooth'
            });
        });
    });

    // Add animation class to project cards when they come into view
    const projectCards = document.querySelectorAll('.project-card');
    const resourceItems = document.querySelectorAll('.resource-item');
    
    // Simple function to check if element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    // Function to add animation class when elements come into view
    function checkVisibility() {
        projectCards.forEach(card => {
            if (isInViewport(card)) {
                card.classList.add('visible');
            }
        });
        
        resourceItems.forEach(item => {
            if (isInViewport(item)) {
                item.classList.add('visible');
            }
        });
    }
    
    // Check visibility on load and scroll
    checkVisibility();
    window.addEventListener('scroll', checkVisibility);

    // Matrix rain effect
    const canvas = document.getElementById('matrix-rain');
    const ctx = canvas.getContext('2d');

    // Set canvas size to window size
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Characters to be used in matrix rain
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"\'#&_(),.;:?!|{}[]<>^~`\\';
    
    // Font size, number of columns
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    
    // An array of drops - one per column
    const drops = [];
    
    // Initialize all drops to start at random position
    for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * canvas.height);
    }

    // Drawing the characters
    function drawMatrix() {
        // Set semi-transparent black background to create trail effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set font and color for matrix characters
        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px Fira Code';
        
        // Loop over drops
        for (let i = 0; i < drops.length; i++) {
            // Get a random character
            const char = characters.charAt(Math.floor(Math.random() * characters.length));
            
            // x = i * fontSize, y = drops[i] * fontSize
            ctx.fillText(char, i * fontSize, drops[i] * fontSize);
            
            // Add randomness to the reset to make it look more natural
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            
            // Increment y coordinate
            drops[i]++;
        }
    }
    
    // Set interval to draw matrix effect
    setInterval(drawMatrix, 40);

    // Resize canvas on window resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });

    // Terminal typing effect for headers
    function typeWriterEffect() {
        const typingElements = document.querySelectorAll('.cursor');
        
        typingElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 100);
        });
    }
    
    // Start typing effect after 1 second
    setTimeout(typeWriterEffect, 1000);
});