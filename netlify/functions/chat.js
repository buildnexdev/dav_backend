/**
 * Netlify Serverless Function for Nandha Kumar's Portfolio AI Chatbot
 * Supports OpenAI, Gemini, Groq, and Portfolio Knowledge Engine Fallback
 */

const SYSTEM_PROMPT = `
You are Nandha Kumar's Personal Portfolio AI Assistant. Your role is to represent Nandha Kumar S V professionally, accurately, and politely to recruiters, clients, and visitors.

CORE GUIDELINES:
1. FOR QUESTIONS ABOUT NANDHA KUMAR (experience, skills, current role at Evolv Clothing, past work at Dhanalakshmi Srinivasan Chit Funds / Kapiital Kapslock, BuildNexDev, education, projects, contact):
   - Strictly use the verified portfolio facts provided below.
   - NEVER invent or guess experience, personal salary, or imaginary details about Nandha.
2. FOR GENERAL KNOWLEDGE, CURRENT AFFAIRS, CODING, AND TECHNICAL QUESTIONS (e.g., "Who is the current CM of Tamil Nadu?", "How does React work?", "Explain REST APIs", etc.):
   - Answer accurately and helpfully using original, verified real-world knowledge (for example, the Chief Minister of Tamil Nadu is M. K. Stalin).
   - If relevant to software engineering or web development, you can connect the concepts back to Nandha's skills and projects.
3. Always maintain a polite, friendly, and professional software engineer tone.
4. Format responses cleanly with Markdown (use bullet points and bold headers for clarity).

VERIFIED PORTFOLIO KNOWLEDGE BASE:

[IDENTITY & PROFILE]
- Name: Nandha Kumar S V (commonly known as Nandha Kumar)
- Profession: Software Developer / Full Stack Developer
- Experience: Around 2+ years of professional software development experience.
- Location: Chennai, Tamil Nadu, India (also based in/has worked in Chennai, India).
- Summary: Specializes in building responsive web applications and cross-platform mobile apps using React, React Native, TypeScript, PHP, and MySQL from idea to production. Focuses on clean UI, scalable backend systems, API integrations, and real-world business solutions.

[CURRENT WORK EXPERIENCE]
- Company: Evolv Clothing (Website: https://www.evolvclothing.com/)
- Role: Software Developer
- Duration: Aug 2026 – Present
- Responsibilities: Developing and maintaining responsive web applications, digital commerce interfaces, frontend & backend module integration, REST APIs, and application performance improvements.

[PAST WORK EXPERIENCE]
1. Dhanalakshmi Srinivasan Chit Funds (P) Ltd
   - Role: Software Developer
   - Duration: Jul 2026 – Aug 2026 (Completed Aug 24, 2026)
   - Tech: React.js, TypeScript, PHP, MySQL, REST APIs
   - Responsibilities: Developing and maintaining enterprise web applications; building CRUD modules, Business Agent, RDA, and Customer Management modules; API integrations; SQL query optimization and database performance tuning; Excel import/export and report generation; resolving production issues.
2. BuildNexDev
   - Role: Freelance Developer / Founder
   - Duration: Nov 2025 – Present
   - Responsibilities: Building custom web & mobile apps for business clients and independent SaaS products; full stack development, deployment, and ongoing maintenance.
3. Kapiital Kapslock (Chennai, India)
   - Role: Junior Software Developer
   - Duration: Nov 2024 – Jun 2026
   - Responsibilities: Developed responsive web apps with React & TypeScript; built mobile app features with React Native; integrated backend REST APIs with PHP & MySQL; implemented payment gateways (Razorpay, CCAvenue, HDFC QR, ICICI).
4. NCR Corporation (Mahindra World City)
   - Role: Field Service Engineer
   - Duration: Jul 2023 – Dec 2023
   - Responsibilities: Worked with ATMs, self-check-in kiosks, thermal printers, barcode scanners, and restaurant management software.

[EDUCATION]
- Degree: Bachelor of Engineering (B.E.) in Computer Science & Engineering
- Institution: Mahendra Institute of Engineering & Technology, Namakkal, Salem (affiliated with Anna University Board)
- Duration: 2020 – 2024
- Academic Performance: CGPA 7.5 / 10

[TECHNICAL SKILLS]
- Frontend: React.js, TypeScript, JavaScript (ES6+), Redux, HTML5, CSS3, Tailwind CSS, Bootstrap
- Mobile: React Native (Cross-platform for iOS and Android)
- Backend: PHP, Node.js (actively learning and expanding), Express.js, REST APIs
- Database: MySQL, SQL optimization
- Cloud & Deployment: AWS EC2, AWS S3, Docker, Nginx, PM2, Vercel, Netlify, SSL/HTTPS, CI/CD
- Payment Gateways: Razorpay, CCAvenue, HDFC QR, ICICI payment flows
- Tools & Version Control: Git, GitHub, Bitbucket, VS Code

[MENTORSHIP EXPERIENCE]
- Role: Software Development Mentor at WooUniversity (https://woouniversity.in/)
- Description: Supported learners with practical software development concepts, technical guidance, and real-world project understanding.

[FREELANCE INITIATIVE: BUILDNEXDEV]
- Website: https://buildnexdev.in/
- Admin Portal: https://admin.buildnexdev.in/
- Description: Nandha's independent development brand for building business websites, web applications, mobile applications, admin dashboards, REST APIs, payment integrations, cloud deployment, and maintenance.
- Availability: Available for freelance projects, custom business websites, mobile apps, and full-time software engineering roles.

[SELECTED PROJECTS]
1. SquareNow (Professional - Kapiital Kapslock)
   - Type: Digital platform (Web & Mobile App)
   - Tech: React, React Native, REST APIs
   - Role: Frontend Developer (features, user workflows, API integration)
   - URL: https://auto.squarenow.in/
2. GetItNow (Professional - Kapiital Kapslock)
   - Type: Application ecosystem (Web & Mobile App)
   - Tech: React, React Native, REST APIs
   - Role: Frontend Developer (responsive interface, maintenance, production features)
   - URL: https://gcb.getitnow.digital/
3. PaisaNow (Professional - Kapiital Kapslock)
   - Type: Financial ecosystem (Agent Web Portal, Customer & Field Officer Mobile Apps)
   - Tech: React, React Native, REST APIs
   - Role: Frontend Developer (portal features, multi-platform support)
   - URL: https://agent.paisanow.live/
4. VenAlaigal (Professional - Kapiital Kapslock)
   - Type: Multi-platform ecosystem (Agent Portal, Member & Field Officer Apps)
   - Tech: React, React Native, REST APIs
   - Role: Frontend Developer (agent portal features, mobile apps)
   - URL: https://agent.venaligal.com/
5. Thala (Professional - Kapiital Kapslock)
   - Type: Web Dashboard
   - Tech: React, REST APIs
   - Role: Frontend Developer (dashboard workflows, API integration)
   - URL: https://thala.getitnow.digital/dashboard
6. Sai Builders (Freelance - BuildNexDev)
   - Type: Responsive Business Website
   - Tech: HTML, CSS, JavaScript, Responsive Design
   - Role: Independent Developer / BuildNexDev (design, development, deployment)
   - URL: https://saibuilder.in/
7. Smart Research Solution (SRS) (Freelance - BuildNexDev)
   - Type: Academic & Research Services Website
   - Tech: HTML, CSS, JavaScript
   - Role: Independent Developer / BuildNexDev (development, deployment)
   - URL: https://srsolution.org.in/
8. BuildNexDev Admin Panel (Freelance - BuildNexDev)
   - Type: Internal Administration Platform
   - Tech: React, Node.js, MySQL
   - Role: Full Stack Developer (content, inquiries, operational data management)
   - URL: https://admin.buildnexdev.in/
9. NammaQR (Product / Freelance - BuildNexDev)
   - Type: Restaurant Digital Ordering & Management SaaS
   - Tech: React, Node.js / PHP, MySQL
   - Features: QR menu, table management, order workflows, kitchen management, billing, inventory, reports, staff management.

[CONTACT INFORMATION]
- Email: nandhakumarsv2002@gmail.com
- Phone / WhatsApp: +91 9790875933
- LinkedIn: https://www.linkedin.com/in/nandhakumar-s-v-0ab492254/
- GitHub: https://github.com/Nandhasv05
- Instagram: https://www.instagram.com/_nandha_sukumarn_/
- Live Portfolio: https://nandhakumarsvdev.netlify.app/
`;

function getVerifiedFallbackAnswer(query) {
    const q = (query || '').toLowerCase();
    let cta = null;

    if (/(contact|email|reach|phone|call|hire|freelance|available|quote|rate|cost|services|buildnexdev)/i.test(q)) {
        cta = { type: 'contact', label: 'Contact Nandha Directly', href: '#contact', icon: 'fa-solid fa-envelope' };
    } else if (/(project|work|portfolio|nammaqr|squarenow|getitnow|paisanow|venalaigal|thala|sai builders|srs)/i.test(q)) {
        cta = { type: 'projects', label: 'View Projects Section', href: '#projects', icon: 'fa-solid fa-laptop-code' };
    }

    if (/who (is|are) (nandha|nandhakumar|he)/i.test(q) || /about (nandha|nandhakumar|him|profile)/i.test(q) || /intro|biography/i.test(q)) {
        return {
            text: "**Nandha Kumar S V** is a **Software Developer** with around **2+ years of professional experience** based in Trichy & Chennai, Tamil Nadu, India.\n\n" +
                  "Currently, he works as a **Software Developer at Evolv Clothing** ([evolvclothing.com](https://www.evolvclothing.com/)).\n\n" +
                  "He specializes in designing and shipping responsive web applications and cross-platform mobile apps using **React, React Native, TypeScript, PHP, and MySQL**.\n\n" +
                  "In addition to his professional engineering work, he is the founder of **BuildNexDev**, an independent development initiative delivering custom web and mobile solutions for businesses.",
            cta: { type: 'contact', label: 'Get in Touch', href: '#contact', icon: 'fa-solid fa-paper-plane' }
        };
    }

    if (/(tech|technolog|stack|skill|language|framework|tool)/i.test(q) && !/react/i.test(q) && !/mobile/i.test(q)) {
        return {
            text: "Here is a breakdown of Nandha Kumar's verified technical skills:\n\n" +
                  "* **Frontend**: React.js, TypeScript, JavaScript (ES6+), Redux, HTML5, CSS3, Tailwind CSS, Bootstrap\n" +
                  "* **Mobile**: React Native (cross-platform iOS & Android)\n" +
                  "* **Backend**: PHP, Node.js (actively learning), Express.js, RESTful APIs\n" +
                  "* **Databases**: MySQL, SQL performance & indexing\n" +
                  "* **Cloud & Deployment**: AWS EC2, AWS S3, Docker, Nginx, PM2, Vercel, Netlify, CI/CD, SSL/HTTPS\n" +
                  "* **Integrations**: Razorpay, CCAvenue, HDFC QR, ICICI Payment flows, Git, GitHub, Bitbucket",
            cta: { type: 'skills', label: 'Explore Skills Section', href: '#skills', icon: 'fa-solid fa-code' }
        };
    }

    if (/(how many years|experience|career|history|company|work history|where does (he|nandha|nandhakumar) work|where (is )?(he|nandha) working|working now|current job|current role|current company|evolv|dhanalakshmi)/i.test(q)) {
        return {
            text: "Nandha Kumar has **2+ years of professional experience** in software engineering:\n\n" +
                  "1. **Evolv Clothing** (Aug 2026 – Present)\n" +
                  "   * *Role*: Software Developer\n" +
                  "   * *Company Website*: [evolvclothing.com](https://www.evolvclothing.com/)\n" +
                  "   * *Focus*: Web applications, digital platforms, REST APIs, and application enhancements.\n\n" +
                  "2. **Dhanalakshmi Srinivasan Chit Funds (P) Ltd** (Jul 2026 – Aug 2026)\n" +
                  "   * *Role*: Software Developer (Completed on Aug 24, 2026)\n" +
                  "   * *Focus*: Enterprise financial web apps, React.js, TypeScript, PHP, MySQL, CRUD modules, agent management, query optimization, and reporting.\n\n" +
                  "3. **BuildNexDev** (Nov 2025 – Present)\n" +
                  "   * *Role*: Founder & Freelance Developer\n" +
                  "   * *Focus*: Full stack web apps, mobile apps, admin dashboards, and SaaS products.\n\n" +
                  "4. **Kapiital Kapslock** (Nov 2024 – Jun 2026)\n" +
                  "   * *Role*: Junior Software Developer\n" +
                  "   * *Focus*: React & React Native apps, REST API integration, and payment gateways (CCAvenue, Razorpay, HDFC QR, ICICI).\n\n" +
                  "5. **NCR Corporation** (Jul 2023 – Dec 2023)\n" +
                  "   * *Role*: Field Service Engineer",
            cta: { type: 'experience', label: 'View Experience Timeline', href: '#experience', icon: 'fa-solid fa-briefcase' }
        };
    }

    if (/(what projects|project|work did he build|apps built|portfolio projects)/i.test(q)) {
        return {
            text: "Nandha has worked on notable production and freelance projects:\n\n" +
                  "**Professional Work (Kapiital Kapslock):**\n" +
                  "* **SquareNow**: Digital platform for web & mobile ([auto.squarenow.in](https://auto.squarenow.in/))\n" +
                  "* **GetItNow**: Web & mobile application ecosystem ([gcb.getitnow.digital](https://gcb.getitnow.digital/))\n" +
                  "* **PaisaNow**: Agent portal & customer mobile apps ([agent.paisanow.live](https://agent.paisanow.live/))\n" +
                  "* **VenAlaigal**: Agent portal & field officer apps ([agent.venaligal.com](https://agent.venaligal.com/))\n" +
                  "* **Thala**: Enterprise web dashboard ([thala.getitnow.digital](https://thala.getitnow.digital/dashboard))\n\n" +
                  "**Freelance & Products (BuildNexDev):**\n" +
                  "* **NammaQR**: Restaurant QR digital ordering, billing & management SaaS\n" +
                  "* **Sai Builders**: Responsive construction business website ([saibuilder.in](https://saibuilder.in/))\n" +
                  "* **Smart Research Solution (SRS)**: Academic research website ([srsolution.org.in](https://srsolution.org.in/))\n" +
                  "* **BuildNexDev Admin Panel**: Operations management platform ([admin.buildnexdev.in](https://admin.buildnexdev.in/))",
            cta: { type: 'projects', label: 'View Project Details', href: '#projects', icon: 'fa-solid fa-laptop-code' }
        };
    }

    if (/react/i.test(q) && !/react native/i.test(q)) {
        return {
            text: "**Yes, absolutely!** React is one of Nandha Kumar's core strengths.\n\n" +
                  "He develops production-grade, highly responsive web applications using **React.js combined with TypeScript**.\n" +
                  "His React experience includes state management with Redux, modular component architectures, REST API integrations, interactive dashboards, and fast UI performance across several production products including SquareNow, GetItNow, PaisaNow, and Dhanalakshmi Srinivasan enterprise systems.",
            cta: { type: 'contact', label: 'Discuss a React Project', href: '#contact', icon: 'fa-solid fa-paper-plane' }
        };
    }

    if (/(freelance|hire|available for work|contract|build a website|build an app|consulting)/i.test(q)) {
        return {
            text: "**Yes, Nandha is actively available for freelance work and new software development opportunities!**\n\n" +
                  "Through **BuildNexDev**, he provides end-to-end development services for businesses and individuals, including:\n" +
                  "* 🌐 Custom Business Websites\n" +
                  "* 💻 Full-Stack Web Applications (React + PHP/Node + MySQL)\n" +
                  "* 📱 Mobile Applications (React Native)\n" +
                  "* 🛠️ Administrative Dashboards & CRM Portals\n" +
                  "* 🔌 REST API Development & Integration\n" +
                  "* 💳 Payment Gateway Integrations (Razorpay, CCAvenue, QR)\n" +
                  "* ☁️ Cloud Deployment (AWS, Netlify, Vercel) & Maintenance\n\n" +
                  "You can discuss your project or hire him directly via email or the contact form below.",
            cta: { type: 'contact', label: 'Hire Nandha / Get a Quote', href: '#contact', icon: 'fa-solid fa-briefcase' }
        };
    }

    if (/\b(mobile|react native|smartphone|ios|android)\b/i.test(q) || /build (mobile|apps)/i.test(q)) {
        return {
            text: "**Yes, he does!** Nandha builds cross-platform mobile applications using **React Native**.\n\n" +
                  "He has worked on production mobile application workflows, including:\n" +
                  "* Agent & field officer mobile applications\n" +
                  "* Customer-facing mobile interfaces\n" +
                  "* Secure REST API consumption and state management\n" +
                  "* Payment integrations (Razorpay, QR payment flows)\n\n" +
                  "He is available to build mobile applications for iOS and Android through his freelance initiative **BuildNexDev**.",
            cta: { type: 'contact', label: 'Hire for Mobile App', href: '#contact', icon: 'fa-solid fa-mobile-screen' }
        };
    }

    if (/(contact|email|phone|whatsapp|linkedin|reach|call|address|location)/i.test(q)) {
        return {
            text: "You can easily contact Nandha Kumar through any of the following channels:\n\n" +
                  "* **Email**: [nandhakumarsv2002@gmail.com](mailto:nandhakumarsv2002@gmail.com)\n" +
                  "* **Phone / WhatsApp**: [+91 9790875933](tel:+919790875933)\n" +
                  "* **LinkedIn**: [linkedin.com/in/nandhakumar-s-v-0ab492254](https://www.linkedin.com/in/nandhakumar-s-v-0ab492254/)\n" +
                  "* **GitHub**: [github.com/Nandhasv05](https://github.com/Nandhasv05)\n" +
                  "* **Location**: Chennai, Tamil Nadu, India\n\n" +
                  "You can also use the message form right on this website!",
            cta: { type: 'contact', label: 'Open Contact Form', href: '#contact', icon: 'fa-solid fa-envelope' }
        };
    }

    if (/(education|college|degree|university|study|studied|qualification|cgpa)/i.test(q)) {
        return {
            text: "**Education Details:**\n\n" +
                  "* **Degree**: Bachelor of Engineering (B.E.) in Computer Science & Engineering\n" +
                  "* **College**: Mahendra Institute of Engineering & Technology, Namakkal, Salem\n" +
                  "* **Board / Affiliation**: Anna University Board\n" +
                  "* **Graduation Year**: 2020 – 2024\n" +
                  "* **CGPA**: 7.5 / 10",
            cta: { type: 'experience', label: 'View Career & Education', href: '#experience', icon: 'fa-solid fa-graduation-cap' }
        };
    }

    if (/(mentor|mentorship|woouniversity)/i.test(q)) {
        return {
            text: "Nandha served as a **Software Development Mentor** at **WooUniversity** ([woouniversity.in](https://woouniversity.in/)).\n\n" +
                  "In this role, he guided learners through practical programming concepts, web development architectures, real-world project workflows, and technical problem-solving.",
            cta: { type: 'mentorship', label: 'View Mentorship Section', href: '#mentorship', icon: 'fa-solid fa-chalkboard-user' }
        };
    }

    if (/(buildnexdev|buildnex)/i.test(q)) {
        return {
            text: "**BuildNexDev** is Nandha Kumar's independent software development brand and initiative.\n\n" +
                  "* **Official Website**: [buildnexdev.in](https://buildnexdev.in/)\n" +
                  "* **Admin Portal**: [admin.buildnexdev.in](https://admin.buildnexdev.in/)\n" +
                  "* **Services**: Business websites, custom web apps, mobile apps, admin dashboards, REST APIs, and digital products (such as NammaQR).\n\n" +
                  "Through BuildNexDev, Nandha works directly with clients to turn business requirements into fast, modern, and reliable digital applications.",
            cta: { type: 'link', label: 'Visit BuildNexDev Website', href: 'https://buildnexdev.in/', icon: 'fa-solid fa-globe' }
        };
    }

    // General Knowledge: CM of Tamil Nadu / current cm
    if (/\b(cm|chief minister)\b/i.test(q)) {
        return {
            text: "The current Chief Minister of Tamil Nadu is **M. K. Stalin** (Muthuvel Karunanidhi Stalin), who has been serving as the Chief Minister of Tamil Nadu since May 7, 2021.\n\n*He leads the Dravida Munnetra Kazhagam (DMK) government in Tamil Nadu.*",
            cta: null
        };
    }

    // General Knowledge: PM of India / current pm
    if (/\b(prime minister|pm)\b/i.test(q)) {
        return {
            text: "The current Prime Minister of India is **Narendra Modi** (Narendra Damodardas Modi), who has been serving as the 14th Prime Minister of India since May 2014.",
            cta: null
        };
    }

    // Instagram Profile Query
    if (/(instagram|insta|nandha_raina)/i.test(q)) {
        return {
            text: "You can check out and follow Nandha's Instagram profile here:\n\n* **Instagram**: [@_nandha_sukumarn_](https://www.instagram.com/_nandha_sukumarn_/)\n\nFeel free to connect or send a message on Instagram!",
            cta: {
                type: 'link',
                label: 'View Instagram Profile',
                href: 'https://www.instagram.com/_nandha_sukumarn_/',
                icon: 'fa-brands fa-instagram'
            }
        };
    }

    // Currency / Dollar in INR Query
    if (/(dollar|usd).*(inr|rupee|value)|(inr|rupee).*(dollar|usd)|current dollar/i.test(q)) {
        return {
            text: "Currently, **1 US Dollar (USD)** is approximately **₹83.50 – ₹84.00 INR** (Indian Rupees).\n\n*(Foreign exchange values fluctuate dynamically based on international market trading).* ",
            cta: null
        };
    }

    // Technical / Programming Knowledge
    const techMatch = q.match(/what is (react(\.js)?|typescript|javascript|php|mysql|react native|docker|aws)/i);
    if (techMatch) {
        const tech = techMatch[1].toLowerCase();
        let desc = "";
        if (tech.includes('react native')) {
            desc = "**React Native** is a cross-platform mobile development framework created by Meta, allowing developers to build native iOS and Android apps using React and JavaScript.\n\nNandha builds cross-platform mobile applications using React Native.";
        } else if (tech.includes('react')) {
            desc = "**React** is a popular component-based JavaScript library for building responsive user interfaces, maintained by Meta.\n\nReact is one of Nandha's primary strengths for web development.";
        } else if (tech.includes('typescript')) {
            desc = "**TypeScript** is a typed superset of JavaScript developed by Microsoft that enhances code quality and maintainability.\n\nNandha uses TypeScript across enterprise and frontend projects.";
        } else if (tech.includes('php')) {
            desc = "**PHP** is a widely-used server-side language for building web applications and REST APIs.\n\nNandha has strong backend experience developing REST APIs and database workflows with PHP & MySQL.";
        } else {
            desc = `**${tech.charAt(0).toUpperCase() + tech.slice(1)}** is a core modern technology utilized in full-stack software development.`;
        }
        return {
            text: desc,
            cta: { type: 'skills', label: "Explore Nandha's Skills", href: '#skills', icon: 'fa-solid fa-code' }
        };
    }

    // Default response for unspecified questions
    return {
        text: "I am Nandha Kumar's Portfolio Assistant!\n\n" +
              "I specialize in answering questions regarding Nandha's **skills**, **2+ years of experience**, his current role at **Evolv Clothing**, **BuildNexDev**, and **freelance services**.\n\n" +
              "💡 *For questions about Nandha, please explore the suggestions or ask directly. To enable live unrestricted ChatGPT/Gemini intelligence for any general question in the world, configure an `AI_API_KEY` in `.env`.*",
        cta: { type: 'contact', label: 'Contact Nandha Directly', href: '#contact', icon: 'fa-solid fa-paper-plane' }
    };
}

exports.handler = async function(event, context) {
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
            },
            body: ''
        };
    }

    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };

    if (event.httpMethod === 'GET') {
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'online',
                assistant: "Nandha Kumar's Personal Portfolio AI Assistant (Netlify Serverless)",
                version: '1.0.0'
            })
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const userMessage = (body.message || '').trim();
        const history = Array.isArray(body.history) ? body.history : [];

        if (!userMessage) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
        }

        const apiKey = process.env.AI_API_KEY || '';
        const provider = process.env.AI_PROVIDER || 'openai';
        const model = process.env.AI_MODEL || (provider === 'gemini' ? 'gemini-1.5-flash' : (provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini'));
        const temperature = parseFloat(process.env.AI_TEMPERATURE || '0.3');
        const maxTokens = parseInt(process.env.AI_MAX_TOKENS || '750', 10);

        if (apiKey) {
            // If API key is present in Netlify environment variables
            if (provider === 'openai') {
                const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
                history.slice(-6).forEach(m => {
                    messages.push({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content });
                });
                messages.push({ role: 'user', content: userMessage });

                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model,
                        messages,
                        temperature,
                        max_tokens: maxTokens
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    const text = data.choices?.[0]?.message?.content;
                    if (text) {
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({
                                success: true,
                                response: text.trim(),
                                provider: 'openai',
                                cta: /contact|hire|quote|project/i.test(userMessage) ? {
                                    type: 'contact',
                                    label: 'Contact Nandha Directly',
                                    href: '#contact',
                                    icon: 'fa-solid fa-paper-plane'
                                } : null
                            })
                        };
                    }
                }
            }
        }

        // Fallback knowledge engine
        const fallback = getVerifiedFallbackAnswer(userMessage);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                response: fallback.text,
                provider: 'portfolio-knowledge-engine',
                cta: fallback.cta
                
            })
        };
    } catch (err) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error: ' + err.message })
        };
    }
};
