<?php
/**
 * Nandha Kumar's Personal Portfolio AI Assistant Backend
 * Modular API endpoint supporting OpenAI, Google Gemini, Groq, or Local Fallback Engine.
 */

// Set headers for CORS and JSON response
header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Allow GET for simple health check
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'assistant' => "Nandha Kumar's Personal Portfolio AI Assistant",
        'version' => '1.0.0',
        'timestamp' => date('c')
    ]);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit(0);
}

// 1. Load environment variables from .env file
function loadEnv($path) {
    if (!file_exists($path)) return [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $env = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || strpos($line, '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $key = trim($key);
            $val = trim($val, " \t\n\r\0\x0B\"'");
            $env[$key] = $val;
            if (getenv($key) === false) {
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
    }
    return $env;
}

$envPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env';
$env = loadEnv($envPath);

$provider    = getenv('AI_PROVIDER') ?: ($env['AI_PROVIDER'] ?? 'openai');
$apiKey      = getenv('AI_API_KEY') ?: ($env['AI_API_KEY'] ?? '');
$model       = getenv('AI_MODEL') ?: ($env['AI_MODEL'] ?? '');
$temperature = floatval(getenv('AI_TEMPERATURE') ?: ($env['AI_TEMPERATURE'] ?? 0.3));
$maxTokens   = intval(getenv('AI_MAX_TOKENS') ?: ($env['AI_MAX_TOKENS'] ?? 750));

// Default model mapping if not explicitly set
if (empty($model)) {
    if ($provider === 'gemini') $model = 'gemini-1.5-flash';
    else if ($provider === 'groq') $model = 'llama-3.1-8b-instant';
    else $model = 'gpt-4o-mini';
}

// 2. Read incoming request body
$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true);

if (!$data || empty(trim($data['message'] ?? ''))) {
    http_response_code(400);
    echo json_encode(['error' => 'Message is required.']);
    exit(0);
}

$userMessage = trim($data['message']);
$history = is_array($data['history'] ?? null) ? $data['history'] : [];

// 3. System Prompt containing 100% verified portfolio facts
$systemPrompt = <<<EOT
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
EOT;

// 4. Fallback Knowledge Engine (Used if no API key is provided or if external API fails)
function getVerifiedFallbackAnswer($query) {
    $q = strtolower($query);
    $cta = null;

    // Contact / Hire / Freelance queries
    if (preg_match('/(contact|email|reach|phone|call|hire|freelance|available|quote|rate|cost|services|buildnexdev)/i', $q)) {
        $cta = [
            'type' => 'contact',
            'label' => 'Contact Nandha Directly',
            'href' => '#contact',
            'icon' => 'fa-solid fa-envelope'
        ];
    } elseif (preg_match('/(project|work|portfolio|nammaqr|squarenow|getitnow|paisanow|venalaigal|thala|sai builders|srs)/i', $q)) {
        $cta = [
            'type' => 'projects',
            'label' => 'View Projects Section',
            'href' => '#projects',
            'icon' => 'fa-solid fa-laptop-code'
        ];
    }

    // Question 1: Who is Nandha Kumar?
    if (preg_match('/who (is|are) (nandha|nandhakumar|he)/i', $q) || preg_match('/about (nandha|nandhakumar|him|profile)/i', $q) || preg_match('/intro|biography/i', $q)) {
        return [
            'text' => "**Nandha Kumar S V** is a **Software Developer** with around **2+ years of professional experience** based in Trichy & Chennai, Tamil Nadu, India.\n\n" .
                      "Currently, he works as a **Software Developer at Evolv Clothing** ([evolvclothing.com](https://www.evolvclothing.com/)).\n\n" .
                      "He specializes in designing and shipping responsive web applications and cross-platform mobile apps using **React, React Native, TypeScript, PHP, and MySQL**.\n\n" .
                      "In addition to his professional engineering work, he is the founder of **BuildNexDev**, an independent development initiative delivering custom web and mobile solutions for businesses.",
            'cta' => [
                'type' => 'contact',
                'label' => 'Get in Touch',
                'href' => '#contact',
                'icon' => 'fa-solid fa-paper-plane'
            ]
        ];
    }

    // Question 2: Technologies / Skills
    if (preg_match('/(tech|technolog|stack|skill|language|framework|tool)/i', $q) && !preg_match('/react/i', $q) && !preg_match('/mobile/i', $q)) {
        return [
            'text' => "Here is a breakdown of Nandha Kumar's verified technical skills:\n\n" .
                      "* **Frontend**: React.js, TypeScript, JavaScript (ES6+), Redux, HTML5, CSS3, Tailwind CSS, Bootstrap\n" .
                      "* **Mobile**: React Native (cross-platform iOS & Android)\n" .
                      "* **Backend**: PHP, Node.js (actively learning), Express.js, RESTful APIs\n" .
                      "* **Databases**: MySQL, SQL performance & indexing\n" .
                      "* **Cloud & Deployment**: AWS EC2, AWS S3, Docker, Nginx, PM2, Vercel, Netlify, CI/CD, SSL/HTTPS\n" .
                      "* **Integrations**: Razorpay, CCAvenue, HDFC QR, ICICI Payment flows, Git, GitHub, Bitbucket",
            'cta' => [
                'type' => 'skills',
                'label' => 'Explore Skills Section',
                'href' => '#skills',
                'icon' => 'fa-solid fa-code'
            ]
        ];
    }

    // Question 3: Years of Experience / Career
    if (preg_match('/(how many years|experience|career|history|company|work history|where does (he|nandha|nandhakumar) work|where (is )?(he|nandha) working|working now|current job|current role|current company|evolv|dhanalakshmi)/i', $q)) {
        return [
            'text' => "Nandha Kumar has **2+ years of professional experience** in software engineering:\n\n" .
                      "1. **Evolv Clothing** (Aug 2026 – Present)\n" .
                      "   * *Role*: Software Developer\n" .
                      "   * *Company Website*: [evolvclothing.com](https://www.evolvclothing.com/)\n" .
                      "   * *Focus*: Web applications, digital platforms, REST APIs, and application enhancements.\n\n" .
                      "2. **Dhanalakshmi Srinivasan Chit Funds (P) Ltd** (Jul 2026 – Aug 2026)\n" .
                      "   * *Role*: Software Developer (Completed on Aug 24, 2026)\n" .
                      "   * *Focus*: Enterprise financial web apps, React.js, TypeScript, PHP, MySQL, CRUD modules, agent management, query optimization, and reporting.\n\n" .
                      "3. **BuildNexDev** (Nov 2025 – Present)\n" .
                      "   * *Role*: Founder & Freelance Developer\n" .
                      "   * *Focus*: Full stack web apps, mobile apps, admin dashboards, and SaaS products.\n\n" .
                      "4. **Kapiital Kapslock** (Nov 2024 – Jun 2026)\n" .
                      "   * *Role*: Junior Software Developer\n" .
                      "   * *Focus*: React & React Native apps, REST API integration, and payment gateways (CCAvenue, Razorpay, HDFC QR, ICICI).\n\n" .
                      "5. **NCR Corporation** (Jul 2023 – Dec 2023)\n" .
                      "   * *Role*: Field Service Engineer",
            'cta' => [
                'type' => 'experience',
                'label' => 'View Experience Timeline',
                'href' => '#experience',
                'icon' => 'fa-solid fa-briefcase'
            ]
        ];
    }

    // Question 4: Projects
    if (preg_match('/(what projects|project|work did he build|apps built|portfolio projects)/i', $q)) {
        return [
            'text' => "Nandha has worked on notable production and freelance projects:\n\n" .
                      "**Professional Work (Kapiital Kapslock):**\n" .
                      "* **SquareNow**: Digital platform for web & mobile ([auto.squarenow.in](https://auto.squarenow.in/))\n" .
                      "* **GetItNow**: Web & mobile application ecosystem ([gcb.getitnow.digital](https://gcb.getitnow.digital/))\n" .
                      "* **PaisaNow**: Agent portal & customer mobile apps ([agent.paisanow.live](https://agent.paisanow.live/))\n" .
                      "* **VenAlaigal**: Agent portal & field officer apps ([agent.venaligal.com](https://agent.venaligal.com/))\n" .
                      "* **Thala**: Enterprise web dashboard ([thala.getitnow.digital](https://thala.getitnow.digital/dashboard))\n\n" .
                      "**Freelance & Products (BuildNexDev):**\n" .
                      "* **NammaQR**: Restaurant QR digital ordering, billing & management SaaS\n" .
                      "* **Sai Builders**: Responsive construction business website ([saibuilder.in](https://saibuilder.in/))\n" .
                      "* **Smart Research Solution (SRS)**: Academic research website ([srsolution.org.in](https://srsolution.org.in/))\n" .
                      "* **BuildNexDev Admin Panel**: Operations management platform ([admin.buildnexdev.in](https://admin.buildnexdev.in/))",
            'cta' => [
                'type' => 'projects',
                'label' => 'View Project Details',
                'href' => '#projects',
                'icon' => 'fa-solid fa-laptop-code'
            ]
        ];
    }

    // Question 5: Does he work with React?
    if (preg_match('/react/i', $q) && !preg_match('/react native/i', $q)) {
        return [
            'text' => "**Yes, absolutely!** React is one of Nandha Kumar's core strengths.\n\n" .
                      "He develops production-grade, highly responsive web applications using **React.js combined with TypeScript**.\n" .
                      "His React experience includes state management with Redux, modular component architectures, REST API integrations, interactive dashboards, and fast UI performance across several production products including SquareNow, GetItNow, PaisaNow, and Dhanalakshmi Srinivasan enterprise systems.",
            'cta' => [
                'type' => 'contact',
                'label' => 'Discuss a React Project',
                'href' => '#contact',
                'icon' => 'fa-solid fa-paper-plane'
            ]
        ];
    }

    // Question 6: Is he available for freelance work? / Can I hire him?
    if (preg_match('/(freelance|hire|available for work|contract|build a website|build an app|consulting)/i', $q)) {
        return [
            'text' => "**Yes, Nandha is actively available for freelance work and new software development opportunities!**\n\n" .
                      "Through **BuildNexDev**, he provides end-to-end development services for businesses and individuals, including:\n" .
                      "* 🌐 Custom Business Websites\n" .
                      "* 💻 Full-Stack Web Applications (React + PHP/Node + MySQL)\n" .
                      "* 📱 Mobile Applications (React Native)\n" .
                      "* 🛠️ Administrative Dashboards & CRM Portals\n" .
                      "* 🔌 REST API Development & Integration\n" .
                      "* 💳 Payment Gateway Integrations (Razorpay, CCAvenue, QR)\n" .
                      "* ☁️ Cloud Deployment (AWS, Netlify, Vercel) & Maintenance\n\n" .
                      "You can discuss your project or hire him directly via email or the contact form below.",
            'cta' => [
                'type' => 'contact',
                'label' => 'Hire Nandha / Get a Quote',
                'href' => '#contact',
                'icon' => 'fa-solid fa-briefcase'
            ]
        ];
    }

    // Question 7: Does he build mobile applications?
    if (preg_match('/\b(mobile|react native|smartphone|ios|android)\b/i', $q) || preg_match('/build (mobile|apps)/i', $q)) {
        return [
            'text' => "**Yes, he does!** Nandha builds cross-platform mobile applications using **React Native**.\n\n" .
                      "He has worked on production mobile application workflows, including:\n" .
                      "* Agent & field officer mobile applications\n" .
                      "* Customer-facing mobile interfaces\n" .
                      "* Secure REST API consumption and state management\n" .
                      "* Payment integrations (Razorpay, QR payment flows)\n\n" .
                      "He is available to build mobile applications for iOS and Android through his freelance initiative **BuildNexDev**.",
            'cta' => [
                'type' => 'contact',
                'label' => 'Hire for Mobile App',
                'href' => '#contact',
                'icon' => 'fa-solid fa-mobile-screen'
            ]
        ];
    }

    // Question 8: How can I contact him?
    if (preg_match('/(contact|email|phone|whatsapp|linkedin|reach|call|address|location)/i', $q)) {
        return [
            'text' => "You can easily contact Nandha Kumar through any of the following channels:\n\n" .
                      "* **Email**: [nandhakumarsv2002@gmail.com](mailto:nandhakumarsv2002@gmail.com)\n" .
                      "* **Phone / WhatsApp**: [+91 9790875933](tel:+919790875933)\n" .
                      "* **LinkedIn**: [linkedin.com/in/nandhakumar-s-v-0ab492254](https://www.linkedin.com/in/nandhakumar-s-v-0ab492254/)\n" .
                      "* **GitHub**: [github.com/Nandhasv05](https://github.com/Nandhasv05)\n" .
                      "* **Location**: Chennai, Tamil Nadu, India\n\n" .
                      "You can also use the message form right on this website!",
            'cta' => [
                'type' => 'contact',
                'label' => 'Open Contact Form',
                'href' => '#contact',
                'icon' => 'fa-solid fa-envelope'
            ]
        ];
    }

    // Question 9: Education / College / Degree
    if (preg_match('/(education|college|degree|university|study|studied|qualification|cgpa)/i', $q)) {
        return [
            'text' => "**Education Details:**\n\n" .
                      "* **Degree**: Bachelor of Engineering (B.E.) in Computer Science & Engineering\n" .
                      "* **College**: Mahendra Institute of Engineering & Technology, Namakkal, Salem\n" .
                      "* **Board / Affiliation**: Anna University Board\n" .
                      "* **Graduation Year**: 2020 – 2024\n" .
                      "* **CGPA**: 7.5 / 10",
            'cta' => [
                'type' => 'experience',
                'label' => 'View Career & Education',
                'href' => '#experience',
                'icon' => 'fa-solid fa-graduation-cap'
            ]
        ];
    }

    // Question 10: Mentorship / WooUniversity
    if (preg_match('/(mentor|mentorship|woouniversity)/i', $q)) {
        return [
            'text' => "Nandha served as a **Software Development Mentor** at **WooUniversity** ([woouniversity.in](https://woouniversity.in/)).\n\n" .
                      "In this role, he guided learners through practical programming concepts, web development architectures, real-world project workflows, and technical problem-solving.",
            'cta' => [
                'type' => 'mentorship',
                'label' => 'View Mentorship Section',
                'href' => '#mentorship',
                'icon' => 'fa-solid fa-chalkboard-user'
            ]
        ];
    }

    // Question 11: BuildNexDev
    if (preg_match('/(buildnexdev|buildnex)/i', $q)) {
        return [
            'text' => "**BuildNexDev** is Nandha Kumar's independent software development brand and initiative.\n\n" .
                      "* **Official Website**: [buildnexdev.in](https://buildnexdev.in/)\n" .
                      "* **Admin Portal**: [admin.buildnexdev.in](https://admin.buildnexdev.in/)\n" .
                      "* **Services**: Business websites, custom web apps, mobile apps, admin dashboards, REST APIs, and digital products (such as NammaQR).\n\n" .
                      "Through BuildNexDev, Nandha works directly with clients to turn business requirements into fast, modern, and reliable digital applications.",
            'cta' => [
                'type' => 'link',
                'label' => 'Visit BuildNexDev Website',
                'href' => 'https://buildnexdev.in/',
                'icon' => 'fa-solid fa-globe'
            ]
        ];
    }

    // General Knowledge: CM of Tamil Nadu / current cm
    if (preg_match('/\b(cm|chief minister)\b/i', $q)) {
        return [
            'text' => "The current Chief Minister of Tamil Nadu is **THALAPTHY VIJAY (TVK)** who has been serving as the Chief Minister of Tamil Nadu since May 10
            , 2026.\n\n*He leads the Tamil Nadu government in Tamil Nadu.*",
            'cta' => null
        ];
    }

    // General Knowledge: PM of India / current pm
    if (preg_match('/\b(prime minister|pm)\b/i', $q)) {
        return [
            'text' => "The current Prime Minister of India is **Narendra Modi** (Narendra Damodardas Modi), who has been serving as the 14th Prime Minister of India since May 2014.",
            'cta' => null
        ];
    }

    // Instagram Profile Query
    if (preg_match('/(instagram|insta|nandha_raina)/i', $q)) {
        return [
            'text' => "You can check out and follow Nandha's Instagram profile here:\n\n* **Instagram**: [@_nandha_sukumarn_](https://www.instagram.com/_nandha_sukumarn_/)\n\nFeel free to connect or send a message on Instagram!",
            'cta' => [
                'type' => 'link',
                'label' => 'View Instagram Profile',
                'href' => 'https://www.instagram.com/_nandha_sukumarn_/',
                'icon' => 'fa-brands fa-instagram'
            ]
        ];
    }

    // Currency / Dollar in INR Query
    if (preg_match('/(dollar|usd).*(inr|rupee|value)|(inr|rupee).*(dollar|usd)|current dollar/i', $q)) {
        return [
            'text' => "Currently, **1 US Dollar (USD)** is approximately **₹83.50 – ₹84.00 INR** (Indian Rupees).\n\n*(Foreign exchange values fluctuate dynamically based on international market trading).* ",
            'cta' => null
        ];
    }

    // Technical / Programming Knowledge
    if (preg_match('/what is (react(\.js)?|typescript|javascript|php|mysql|react native|docker|aws)/i', $q, $matches)) {
        $tech = strtolower($matches[1]);
        $desc = "";
        if (strpos($tech, 'react native') !== false) {
            $desc = "**React Native** is a cross-platform mobile app development framework created by Meta, allowing developers to build native iOS and Android apps using React and JavaScript.\n\nNandha builds cross-platform mobile applications using React Native.";
        } elseif (strpos($tech, 'react') !== false) {
            $desc = "**React** is a popular component-based JavaScript library for building responsive user interfaces, maintained by Meta.\n\nReact is one of Nandha's primary strengths for web development.";
        } elseif (strpos($tech, 'typescript') !== false) {
            $desc = "**TypeScript** is a typed superset of JavaScript developed by Microsoft that enhances code quality and maintainability.\n\nNandha uses TypeScript across enterprise and frontend projects.";
        } elseif (strpos($tech, 'php') !== false) {
            $desc = "**PHP** is a widely-used server-side language for building web applications and REST APIs.\n\nNandha has strong backend experience developing REST APIs and database workflows with PHP & MySQL.";
        } else {
            $desc = "**" . ucfirst($tech) . "** is a core modern technology utilized in full-stack software development.";
        }
        return [
            'text' => $desc,
            'cta' => [
                'type' => 'skills',
                'label' => "Explore Nandha's Skills",
                'href' => '#skills',
                'icon' => 'fa-solid fa-code'
            ]
        ];
    }

    // Default response for unspecified questions
    return [
        'is_default' => true,
        'text' => "I am Nandha Kumar's Portfolio Assistant!\n\n" .
                  "I specialize in answering questions regarding Nandha's **skills**, **2+ years of experience**, his current role at **Evolv Clothing**, **BuildNexDev**, and **freelance services**.\n\n" .
                  "💡 *For questions about Nandha, please explore the suggestions or ask directly. To enable live unrestricted ChatGPT/Gemini intelligence for any general question in the world, configure an `AI_API_KEY` in `.env`.*",
        'cta' => [
            'type' => 'contact',
            'label' => 'Contact Nandha Directly',
            'href' => '#contact',
            'icon' => 'fa-solid fa-paper-plane'
        ]
    ];
}

// 5. External AI Provider Call Functions

function callOpenAI($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens) {
    $messages = [['role' => 'system', 'content' => $systemPrompt]];

    // Add recent history for conversational context (up to last 6 messages)
    $recentHistory = array_slice($history, -6);
    foreach ($recentHistory as $msg) {
        if (!empty($msg['role']) && !empty($msg['content'])) {
            $role = ($msg['role'] === 'assistant' || $msg['role'] === 'model') ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => $msg['content']];
        }
    }

    $messages[] = ['role' => 'user', 'content' => $userMessage];

    $payload = [
        'model' => $model,
        'messages' => $messages,
        'temperature' => $temperature,
        'max_tokens' => $maxTokens
    ];

    $ch = curl_init('https://api.openai.com/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || $httpCode !== 200) {
        $resData = json_decode($response, true);
        if ($httpCode === 429 && ($resData['error']['code'] ?? '') === 'credit_balance_exhausted') {
            return ['error' => 'credit_balance_exhausted'];
        }
        error_log("OpenAI API Error ($httpCode): $curlError | Response: $response");
        return null;
    }

    $resData = json_decode($response, true);
    return $resData['choices'][0]['message']['content'] ?? null;
}

function callGroq($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens) {
    $messages = [['role' => 'system', 'content' => $systemPrompt]];

    $recentHistory = array_slice($history, -6);
    foreach ($recentHistory as $msg) {
        if (!empty($msg['role']) && !empty($msg['content'])) {
            $role = ($msg['role'] === 'assistant' || $msg['role'] === 'model') ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => $msg['content']];
        }
    }

    $messages[] = ['role' => 'user', 'content' => $userMessage];

    $payload = [
        'model' => $model,
        'messages' => $messages,
        'temperature' => $temperature,
        'max_tokens' => $maxTokens
    ];

    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey
        ],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || $httpCode !== 200) {
        error_log("Groq API Error ($httpCode): $curlError | Response: $response");
        return null;
    }

    $resData = json_decode($response, true);
    return $resData['choices'][0]['message']['content'] ?? null;
}

function callGemini($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens) {
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);

    $contents = [];
    $recentHistory = array_slice($history, -6);
    foreach ($recentHistory as $msg) {
        if (!empty($msg['role']) && !empty($msg['content'])) {
            $role = ($msg['role'] === 'assistant' || $msg['role'] === 'model') ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [['text' => $msg['content']]]
            ];
        }
    }

    $contents[] = [
        'role' => 'user',
        'parts' => [['text' => $userMessage]]
    ];

    $payload = [
        'contents' => $contents,
        'systemInstruction' => [
            'parts' => [['text' => $systemPrompt]]
        ],
        'generationConfig' => [
            'temperature' => $temperature,
            'maxOutputTokens' => $maxTokens
        ]
    ];

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_TIMEOUT => 25,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError || $httpCode !== 200) {
        error_log("Gemini API Error ($httpCode): $curlError | Response: $response");
        return null;
    }

    $resData = json_decode($response, true);
    return $resData['candidates'][0]['content']['parts'][0]['text'] ?? null;
}

// 6. Execute Provider or Fallback
$aiResponseText = null;
$activeProvider = $provider;

if (!empty($apiKey)) {
    if ($provider === 'gemini') {
        $aiResponseText = callGemini($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens);
    } elseif ($provider === 'groq') {
        $aiResponseText = callGroq($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens);
    } else {
        $aiResponseText = callOpenAI($apiKey, $model, $systemPrompt, $userMessage, $history, $temperature, $maxTokens);
    }
}

// Determine Smart CTA based on user intent
$cta = null;
$qLower = strtolower($userMessage);
if (preg_match('/(contact|hire|email|freelance|reach|phone|quote|discuss|website|app|buildnexdev)/i', $qLower)) {
    $cta = [
        'type' => 'contact',
        'label' => 'Contact Nandha Directly',
        'href' => '#contact',
        'icon' => 'fa-solid fa-paper-plane'
    ];
} elseif (preg_match('/(project|work|portfolio|squarenow|getitnow|paisanow|venalaigal|thala|nammaqr)/i', $qLower)) {
    $cta = [
        'type' => 'projects',
        'label' => 'View Projects in Portfolio',
        'href' => '#projects',
        'icon' => 'fa-solid fa-laptop-code'
    ];
}

// Handle OpenAI billing exhaustion gracefully
if (is_array($aiResponseText) && ($aiResponseText['error'] ?? '') === 'credit_balance_exhausted') {
    $fallbackResult = getVerifiedFallbackAnswer($userMessage);
    if (empty($fallbackResult['is_default'])) {
        echo json_encode([
            'success' => true,
            'response' => $fallbackResult['text'],
            'provider' => 'portfolio-knowledge-engine',
            'cta' => $fallbackResult['cta'] ?? $cta
        ]);
        exit(0);
    }

    echo json_encode([
        'success' => true,
        'response' => "⚠️ **OpenAI Quota Notice**: Your OpenAI account has **$0 credits remaining** (`credit_balance_exhausted`).\n\nOpenAI requires adding API billing credits at [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing).\n\n💡 **100% Free Alternative (No Credit Card Needed)**:\nYou can switch to **Google Gemini** in your `.env` for free! Generate a free key at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) and update `.env`:\n```env\nAI_PROVIDER=gemini\nAI_API_KEY=your_gemini_key_here\nAI_MODEL=gemini-1.5-flash\n```",
        'provider' => 'openai-quota-notice',
        'cta' => null
    ]);
    exit(0);
}

// If AI response was returned by external provider, use it!
if ($aiResponseText !== null && is_string($aiResponseText) && trim($aiResponseText) !== '') {
    echo json_encode([
        'success' => true,
        'response' => trim($aiResponseText),
        'provider' => $activeProvider,
        'cta' => $cta
    ]);
    exit(0);
}

// Otherwise, use the verified portfolio knowledge-base fallback!
$fallbackResult = getVerifiedFallbackAnswer($userMessage);

echo json_encode([
    'success' => true,
    'response' => $fallbackResult['text'],
    'provider' => 'portfolio-knowledge-engine',
    'cta' => $fallbackResult['cta'] ?? $cta
]);
