export function getVerifiedFallbackAnswer(query) {
  const q = String(query || '').toLowerCase();

  if (/who (is|are) (nandha|nandhakumar|he)/i.test(q) || /about (nandha|nandhakumar|him|profile)/i.test(q) || /intro|biography/i.test(q)) {
    return {
      text:
        "**Nandha Kumar S V** is a **Software Developer** with around **2+ years of professional experience** based in Chennai, Tamil Nadu, India.\n\n" +
        "Currently, he works as a **Software Developer at Evolv Clothing** ([evolvclothing.com](https://www.evolvclothing.com/)).\n\n" +
        "He specializes in responsive web and cross-platform mobile apps using **React, React Native, TypeScript, PHP, and MySQL**, and is the founder of **BuildNexDev**.",
      cta: { type: 'contact', label: 'Get in Touch', href: '#contact', icon: 'fa-solid fa-paper-plane' }
    };
  }

  if (/(tech|technolog|stack|skill|language|framework|tool)/i.test(q)) {
    return {
      text:
        "Here is a breakdown of Nandha Kumar's verified technical skills:\n\n" +
        "* **Frontend**: React.js, TypeScript, JavaScript (ES6+), Redux, HTML5, CSS3, Tailwind CSS, Bootstrap\n" +
        "* **Mobile**: React Native (iOS & Android)\n" +
        "* **Backend**: PHP, Node.js, Express.js, REST APIs\n" +
        "* **Databases**: MySQL\n" +
        "* **Cloud & Deployment**: AWS EC2, AWS S3, Docker, Nginx, PM2, Vercel, Netlify, CI/CD",
      cta: { type: 'skills', label: 'Explore Skills Section', href: '#skills', icon: 'fa-solid fa-code' }
    };
  }

  if (/(experience|career|current (job|role|company)|where.*work|evolv|dhanalakshmi)/i.test(q)) {
    return {
      text:
        "Nandha Kumar has **2+ years of professional experience**:\n\n" +
        "1. **Evolv Clothing** (Aug 2026 – Present) — Software Developer\n" +
        "2. **Dhanalakshmi Srinivasan Chit Funds (P) Ltd** (Jul 2026 – Aug 2026) — Software Developer\n" +
        "3. **BuildNexDev** (Nov 2025 – Present) — Founder & Freelance Developer\n" +
        "4. **Kapiital Kapslock** (Nov 2024 – Jun 2026) — Junior Software Developer\n" +
        "5. **NCR Corporation** (Jul 2023 – Dec 2023) — Field Service Engineer",
      cta: { type: 'experience', label: 'View Experience Timeline', href: '#experience', icon: 'fa-solid fa-briefcase' }
    };
  }

  if (/(project|apps built|portfolio)/i.test(q)) {
    return {
      text:
        "Selected projects:\n\n" +
        "**Professional:** SquareNow, GetItNow, PaisaNow, VenAlaigal, Thala\n\n" +
        "**Freelance / BuildNexDev:** Sai Builders, Smart Research Solution, BuildNexDev Admin Panel, NammaQR",
      cta: { type: 'projects', label: 'View Projects Section', href: '#projects', icon: 'fa-solid fa-laptop-code' }
    };
  }

  if (/(contact|email|phone|whatsapp|linkedin|github|hire|freelance)/i.test(q)) {
    return {
      text:
        "You can reach Nandha here:\n\n" +
        "* **Email**: nandhakumarsv2002@gmail.com\n" +
        "* **WhatsApp**: +91 9790875933\n" +
        "* **LinkedIn**: [nandhakumar-s-v](https://www.linkedin.com/in/nandhakumar-s-v-0ab492254/)\n" +
        "* **GitHub**: [Nandhasv05](https://github.com/Nandhasv05)",
      cta: { type: 'contact', label: 'Open Contact Section', href: '#contact', icon: 'fa-solid fa-envelope' }
    };
  }

  return {
    text:
      "I am Nandha Kumar's Portfolio Assistant. Ask about his **skills**, **experience**, **projects**, or **freelance availability**.\n\n" +
      "To enable live AI answers, set `AI_API_KEY` in the backend `.env` file.",
    cta: { type: 'contact', label: 'Contact Nandha Directly', href: '#contact', icon: 'fa-solid fa-paper-plane' }
  };
}
