// --- Motion preference ---
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Page Loader ---
const pageLoader = document.getElementById('page-loader');
const hideLoader = () => {
    if (!pageLoader || pageLoader.classList.contains('hide')) return;
    pageLoader.classList.add('hide');
    pageLoader.setAttribute('aria-busy', 'false');
    setTimeout(() => {
        if (pageLoader.parentNode) pageLoader.parentNode.removeChild(pageLoader);
    }, 500);
};
if (document.readyState === 'complete') {
    setTimeout(hideLoader, isReducedMotion ? 0 : 400);
} else {
    window.addEventListener('load', () => {
        setTimeout(hideLoader, isReducedMotion ? 0 : 450);
    });
}
setTimeout(hideLoader, 4000);

// --- Smooth Role Text Transition ---
const roleElement = document.getElementById("role-text");
const roles = ["React & TypeScript", "React Native", "PHP & MySQL", "Full Stack Apps", "REST APIs", "Cloud Deployments"];
let roleIndex = 0;

function rotateRole() {
    roleIndex = (roleIndex + 1) % roles.length;
    roleElement.classList.remove('role-text-anim');
    void roleElement.offsetWidth;
    roleElement.textContent = roles[roleIndex];
    roleElement.classList.add('role-text-anim');
}

if (roleElement) {
    setInterval(rotateRole, 3500);
}

// --- Hero Entrance Animation ---
const heroTextContainer = document.getElementById('hero-text-container');
if (heroTextContainer) {
    const activateHero = () => {
        heroTextContainer.classList.add('active', 'hero-ready');
    };
    if (isReducedMotion) {
        activateHero();
    } else {
        requestAnimationFrame(() => {
            setTimeout(activateHero, 80);
        });
    }
}

// --- Cursor Interaction (Desktop Glow) ---
const cursorGlow = document.getElementById('cursor-glow');
if (cursorGlow && matchMedia('(pointer:fine)').matches) {
    let mouseX = 0, mouseY = 0, isMouseMoving = false;
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX; mouseY = e.clientY;
        if (!isMouseMoving) cursorGlow.style.opacity = '1';
        isMouseMoving = true;
    });
    function updateCursor() {
        if (isMouseMoving) cursorGlow.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
        requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);
    document.addEventListener('mouseleave', () => { cursorGlow.style.opacity = '0'; isMouseMoving = false; });
    document.addEventListener('mouseenter', () => { cursorGlow.style.opacity = '1'; });
}

// --- Scroll Progress Bar ---
const scrollProgress = document.getElementById('scroll-progress');
window.addEventListener('scroll', () => {
    if (scrollProgress) {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        scrollProgress.style.width = `${progress}%`;
    }
});

// --- Back to Top Button ---
const backToTopBtn = document.getElementById('back-to-top');
window.addEventListener('scroll', () => {
    if (backToTopBtn) {
        if (window.scrollY > 500) backToTopBtn.classList.add('show');
        else backToTopBtn.classList.remove('show');
    }
});
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// --- Mobile Navigation ---
const hamburger = document.getElementById('hamburger');
const navBar = document.getElementById('main-nav');
const navLinks = document.querySelectorAll('.nav-links');
if (hamburger && navBar) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navBar.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navBar.classList.remove('active');
            document.body.classList.remove('menu-open');
        });
    });
}

// --- Sticky Header & Active Link Highlighting ---
const header = document.getElementById('header');
const sections = document.querySelectorAll('section');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= (sectionTop - 200)) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) link.classList.add('active');
    });
});

// --- Theme Toggle ---
let lightMode = localStorage.getItem('lightMode');
const themeIcon = document.getElementById('theme-icon');
const enableLightTheme = () => {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.src = 'Assets/moon.png';
    localStorage.setItem('lightMode', 'enable');
}
const disableLightTheme = () => {
    document.body.classList.remove('light-theme');
    if (themeIcon) themeIcon.src = 'Assets/sun.png';
    localStorage.setItem('lightMode', 'disable');
}
if (lightMode === 'enable') enableLightTheme();
if (themeIcon) {
    themeIcon.addEventListener('click', () => {
        if (localStorage.getItem('lightMode') !== 'enable') enableLightTheme();
        else disableLightTheme();
    });
}

// --- Scroll Reveal Animations ---
if (!isReducedMotion) {
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (entry.target.classList.contains('about-stats') || entry.target.classList.contains('about-bento')) {
                    animateNumbers();
                }
                observer.unobserve(entry.target);
            }
        });
    };
    const revealOptions = { threshold: 0.12, rootMargin: "0px 0px -40px 0px" };
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.stagger-container').forEach(el => {
        if (el.id === 'hero-text-container') return;
        revealObserver.observe(el);
    });
} else {
    document.querySelectorAll('.reveal, .stagger-container').forEach(el => el.classList.add('active'));
}

// --- Number Animation ---
function animateNumbers() {
    document.querySelectorAll('.count-up').forEach(counter => {
        counter.innerText = '0';
        const target = +counter.getAttribute('data-target');
        const increment = target / 20;
        const updateCounter = () => {
            const c = +counter.innerText;
            if (c < target) {
                counter.innerText = `${Math.ceil(c + increment)}`;
                setTimeout(updateCounter, 40);
            } else {
                counter.innerText = target;
            }
        };
        updateCounter();
    });
}

// --- Contact Form Submission ---
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const btn = contactForm.querySelector('button[type="submit"]');
        if (btn.classList.contains('loading')) return;
        
        btn.classList.add('loading');
        
        const formData = new FormData(contactForm);
        
        fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        })
        .then(async (response) => {
            let json = await response.json();
            if (response.status == 200) {
                if (typeof swal !== 'undefined') {
                    swal("Message Sent!", "Thank you for reaching out. I'll get back to you soon.", "success");
                } else {
                    alert("Message Sent! Thank you for reaching out.");
                }
                contactForm.reset();
            } else {
                console.log(response);
                if (typeof swal !== 'undefined') {
                    swal("Error!", json.message || "Something went wrong. Please try again.", "error");
                } else {
                    alert("Error! Something went wrong.");
                }
            }
        })
        .catch(error => {
            console.log(error);
            if (typeof swal !== 'undefined') {
                swal("Error!", "Something went wrong. Please check your connection.", "error");
            } else {
                alert("Error! Something went wrong.");
            }
        })
        .finally(() => {
            btn.classList.remove('loading');
        });
    });
}

// --- PROJECT DATA STRUCTURE ---
const projectsData = [
    // PROFESSIONAL WORK
    {
        id: "squarenow",
        name: "SquareNow",
        type: "professional",
        company: "Kapiital Kapslock",
        description: "Contributed to the development and maintenance of the SquareNow digital platform, working on web and mobile application features, user workflows, API integrations, bug fixes, and ongoing enhancements.",
        role: "Frontend Developer",
        responsibilities: [
            "Contributed to digital platform development",
            "Worked on web and mobile application features",
            "User workflows and API integrations",
            "Bug fixes and ongoing enhancements"
        ],
        technologies: ["React", "React Native", "REST APIs"],
        platforms: ["Web App", "Mobile App"],
        image: "Assets/squareNow.png",
        links: [
            { label: "Web App", url: "https://auto.squarenow.in/", icon: "fa-solid fa-up-right-from-square" }
            // Mobile app verified URL is not available, so button omitted
        ],
        ownershipNote: "Contributed to this product as part of my professional role at Kapiital Kapslock."
    },
    {
        id: "getitnow",
        name: "GetItNow",
        type: "professional",
        company: "Kapiital Kapslock",
        description: "Contributed to the GetItNow web and mobile application ecosystem, working on application features, responsive interfaces, API integrations, maintenance, and production enhancements.",
        role: "Frontend Developer",
        responsibilities: [
            "Web and mobile application ecosystem contribution",
            "Application feature development",
            "Responsive interface implementation",
            "Maintenance and production enhancements"
        ],
        technologies: ["React", "React Native", "API Integration"],
        platforms: ["Web App", "Mobile App"],
        image: "Assets/GetInNow.png",
        links: [
            { label: "Web App", url: "https://gcb.getitnow.digital/", icon: "fa-solid fa-up-right-from-square" }
            // Mobile app verified URL is not available
        ],
        ownershipNote: "Contributed to this product as part of my professional role at Kapiital Kapslock."
    },
    {
        id: "paisanow",
        name: "PaisaNow",
        type: "professional",
        company: "Kapiital Kapslock",
        description: "Contributed to the PaisaNow multi-platform ecosystem consisting of an agent web portal and dedicated mobile applications for customers and field officers.",
        role: "Frontend Developer",
        responsibilities: [
            "Agent web portal development",
            "Dedicated mobile applications features",
            "Cross-platform ecosystem support"
        ],
        technologies: ["React", "React Native", "API Integration"],
        platforms: ["Web Portal", "Customer App", "Field Officer App"],
        image: "Assets/Paisanow.png",
        links: [
            { label: "Agent Portal", url: "https://agent.paisanow.live/", icon: "fa-solid fa-up-right-from-square" }
            // Customer/Field Officer app URLs not verified
        ],
        ownershipNote: "Contributed to this product as part of my professional role at Kapiital Kapslock."
    },
    {
        id: "venalaigal",
        name: "VenAlaigal",
        type: "professional",
        company: "Kapiital Kapslock",
        description: "Contributed to the VenAlaigal multi-platform ecosystem, including the agent web portal and dedicated mobile applications for members/customers and field officers.",
        role: "Frontend Developer",
        responsibilities: [
            "Agent web portal features",
            "Mobile applications for members and field officers",
            "Ecosystem maintenance and enhancements"
        ],
        technologies: ["React", "React Native", "API Integration"],
        platforms: ["Agent Portal", "Member App", "Field Officer App"],
        image: "Assets/venaligal.png",
        links: [
            { label: "Agent Portal", url: "https://agent.venaligal.com/", icon: "fa-solid fa-up-right-from-square" }
        ],
        ownershipNote: "Contributed to this product as part of my professional role at Kapiital Kapslock."
    },
    {
        id: "thala",
        name: "Thala",
        type: "professional",
        company: "Kapiital Kapslock",
        description: "Contributed to the development and maintenance of the Thala web dashboard, working on application workflows, frontend functionality, API integration, and production enhancements.",
        role: "Frontend Developer",
        responsibilities: [
            "Web dashboard development",
            "Application workflows",
            "Frontend functionality and API integration",
            "Production enhancements"
        ],
        technologies: ["React", "API Integration"],
        platforms: ["Web Dashboard"],
        image: "Assets/thala.png",
        links: [
            { label: "View Web App", url: "https://thala.getitnow.digital/dashboard", icon: "fa-solid fa-up-right-from-square" }
        ],
        ownershipNote: "Contributed to this product as part of my professional role at Kapiital Kapslock."
    },

    // FREELANCE WORK
    {
        id: "saibuilders",
        name: "Sai Builders",
        type: "freelance",
        company: "BuildNexDev",
        description: "Designed and developed a responsive business website for Sai Builders, creating a professional digital presence for the construction business.",
        role: "Independent Developer / BuildNexDev",
        responsibilities: [
            "Responsive business website design",
            "Digital presence creation",
            "Development and deployment"
        ],
        technologies: ["HTML", "CSS", "JavaScript", "Responsive Design"],
        platforms: ["Website"],
        image: "Assets/saibuilders.png",
        links: [
            { label: "View Live Website", url: "https://saibuilder.in/", icon: "fa-solid fa-globe" }
        ],
        ownershipNote: "Developed independently through BuildNexDev."
    },
    {
        id: "srs",
        name: "Smart Research Solution (SRS)",
        type: "freelance",
        company: "BuildNexDev",
        description: "Developed and deployed a professional website for Smart Research Solution, focused on presenting its services through a responsive and accessible web experience.",
        role: "Independent Developer / BuildNexDev",
        responsibilities: [
            "Professional website development",
            "Responsive and accessible web experience",
            "Deployment and configuration"
        ],
        technologies: ["HTML", "CSS", "JavaScript", "Deployment"],
        platforms: ["Website"],
        image: "Assets/srs.png",
        links: [
            { label: "View Live Website", url: "https://srsolution.org.in/", icon: "fa-solid fa-globe" }
        ],
        ownershipNote: "Developed independently through BuildNexDev."
    },
    {
        id: "buildnexdevadmin",
        name: "BuildNexDev Admin Panel",
        type: "freelance",
        company: "BuildNexDev",
        description: "Built a custom administration platform to manage website content, projects, enquiries, and other operational data for the BuildNexDev ecosystem.",
        role: "Full Stack Developer",
        responsibilities: [
            "Custom administration platform development",
            "Content and enquiry management",
            "Ecosystem operational data handling"
        ],
        technologies: ["React", "Node.js", "MySQL", "Admin Dashboard"],
        platforms: ["Internal Platform"],
        image: "Assets/BuildnexdevAdminPanel.png",
        links: [
            { label: "Private Admin Platform", url: "https://admin.buildnexdev.in/", icon: "fa-solid fa-lock" }
        ],
        ownershipNote: "Developed independently through BuildNexDev."
    },
    {
        id: "nammaqr",
        name: "NammaQR",
        type: "freelance",
        company: "BuildNexDev",
        description: "A QR-based restaurant ordering and management solution designed to support digital menus, table-based QR access, order workflows, billing, staff operations, and restaurant management.",
        role: "Product Developer / BuildNexDev",
        status: "Active", // Removed "In Development" as requested unless accurate
        responsibilities: [
            "QR-based ordering solution development",
            "Digital menus and table access",
            "Order workflows and billing integration"
        ],
        technologies: ["React", "Node.js", "MySQL"],
        platforms: ["Web App", "Mobile Interface"],
        image: "Assets/NammaQr.png",
        links: [],
        ownershipNote: "Developed independently through BuildNexDev."
    }
];

// --- Project Rendering & Filtering ---
const projectsContainer = document.getElementById('projects-container');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body');
const closeModal = document.querySelector('.close-modal');

function getBadgeHTML(type) {
    if (type === 'professional') return `<span class="project-badge badge-professional">Professional Work</span>`;
    if (type === 'freelance') return `<span class="project-badge badge-freelance">Freelance</span>`;
    return '';
}

function renderProjects(filter = 'all') {
    if (!projectsContainer) return;

    // Animate out
    projectsContainer.style.opacity = '0';
    projectsContainer.style.transform = 'translateY(10px)';

    setTimeout(() => {
        projectsContainer.innerHTML = '';

        let filteredProjects = [];
        if (filter === 'all') {
            // Ensure Professional first, then Freelance
            filteredProjects = [
                ...projectsData.filter(p => p.type === 'professional'),
                ...projectsData.filter(p => p.type === 'freelance')
            ];
        } else {
            filteredProjects = projectsData.filter(p => p.type === filter);
        }

        filteredProjects.forEach((project, index) => {
            const techTags = project.technologies.map(tech => `<span>${tech}</span>`).join('');
            const platformChips = (project.platforms || []).map(p => `<span class="platform-chip">[${p}]</span>`).join(' ');

            // Image handling (Placeholder logic)
            const imgSrc = project.image ? project.image : `https://placehold.co/600x400/0b1220/14b8a6?text=${encodeURIComponent(project.name)}`;

            const delay = index * 0.1; // Stagger

            const cardHTML = `
                <div class="project-card stagger-item" style="transition-delay: ${delay}s">
                    <div class="project-card-inner">
                        ${getBadgeHTML(project.type)}
                        <div class="project-img-wrapper">
                            <img src="${imgSrc}" alt="${project.name}" class="project-img">
                        </div>
                        <div class="project-info">
                            <h3 class="project-title">${project.name}</h3>
                            <div class="project-platforms" style="margin-bottom: 0.5rem;">${platformChips}</div>
                            <p class="project-desc">${project.description}</p>
                            <div class="project-tech">
                                ${techTags}
                            </div>
                            <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-color); padding-top: 1rem;">
                                <span style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-solid fa-user-astronaut"></i> ${project.role}</span>
                                <button class="btn btn-secondary btn-sm" onclick="openModal('${project.id}')" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">View Details <i class="fa-solid fa-arrow-right cta-arrow"></i></button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            projectsContainer.insertAdjacentHTML('beforeend', cardHTML);
        });

        // Trigger reflow & animate in
        void projectsContainer.offsetWidth;
        projectsContainer.style.opacity = '1';
        projectsContainer.style.transform = 'translateY(0)';
        projectsContainer.classList.add('active'); // For staggers

        // Initialize 3D Tilt Effect
        if (typeof VanillaTilt !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            VanillaTilt.init(document.querySelectorAll(".project-card"), {
                max: 12,
                speed: 400,
                glare: true,
                "max-glare": 0.15,
                scale: 1.02,
                easing: "cubic-bezier(.03,.98,.52,.99)"
            });
        }

    }, 300); // 300ms matches CSS transition
}

// Initial Render
if (projectsContainer) {
    projectsContainer.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    renderProjects();
}

// Filter Event Listeners
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderProjects(e.target.getAttribute('data-filter'));
    });
});

// --- Modal Logic ---
window.openModal = function (projectId) {
    const project = projectsData.find(p => p.id === projectId);
    if (!project) return;

    const techTags = project.technologies.map(tech => `<span>${tech}</span>`).join('');
    const platformChips = (project.platforms || []).map(p => `<span class="platform-chip">[${p}]</span>`).join(' ');

    const linksHTML = project.links.map(link =>
        `<a href="${link.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
            <i class="${link.icon}"></i> ${link.label}
        </a>`
    ).join('');

    const responsibilitiesHTML = project.responsibilities.map(res => `<li>${res}</li>`).join('');
    const imgSrc = project.image ? project.image : `https://placehold.co/800x400/0b1220/14b8a6?text=${encodeURIComponent(project.name)}`;

    const modalHTML = `
        <div class="modal-header">
            <img src="${imgSrc}" alt="${project.name}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 0.5rem; margin-bottom: 1.5rem; border: 1px solid var(--border-color);" />
            <h2 style="font-size: 2rem;">${project.name}</h2>
            <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1.5rem;">
                <span class="modal-category" style="margin: 0;">${project.type === 'professional' ? 'Professional Work' : 'Freelance'} | ${project.company}</span>
                <div class="project-platforms">${platformChips}</div>
            </div>
        </div>
        <div class="modal-body-content">
            <h3 class="modal-section-title">Overview</h3>
            <p>${project.description}</p>
            
            <h3 class="modal-section-title">My Contribution: ${project.role}</h3>
            <ul style="padding-left: 1.5rem; margin-bottom: 1.5rem; color: var(--text-secondary);">
                ${responsibilitiesHTML}
            </ul>
            
            <h3 class="modal-section-title">Technologies</h3>
            <div class="modal-tech-stack">
                ${techTags}
            </div>
            
            <div class="modal-buttons">
                ${linksHTML}
            </div>
            
            <div class="modal-ownership-note">
                <i class="fa-solid fa-circle-info" style="color: var(--primary-accent); margin-right: 0.5rem;"></i>
                ${project.ownershipNote}
            </div>
        </div>
    `;

    modalBody.innerHTML = modalHTML;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    });
}

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
});
