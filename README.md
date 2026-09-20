<<<<<<< HEAD
# Portfolio Node.js Backend

Express API base for the MyPortfolio site.

## Setup

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

Server starts at `http://localhost:5000`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | API index |
| GET | `/api/health` | Health check |
| GET | `/api/chat` | Chat service status |
| POST | `/api/chat` | `{ "message": "...", "history": [] }` |
| POST | `/api/contact` | `{ "name", "email", "message" }` |

Chat uses OpenAI, Gemini, or Groq when `AI_API_KEY` is set. Without a key it uses the local portfolio knowledge fallback.

## Frontend

Point the chatbot to:

```
http://localhost:5000/api/chat
```
=======
# 🌐 Nandhakumar S V — Developer Portfolio

### 🚀 Personal Portfolio Website

A modern and responsive personal portfolio website showcasing my **skills, projects, development experience and freelance work**.

The portfolio highlights my journey as a **Full Stack Developer** and my freelance development initiative **BuildNexDev**.

---

## 🌐 Live Website

<div align="center">

<a href="https://nandhakumarsvdev.netlify.app/">
<img src="https://img.shields.io/badge/🌐_LIVE_PORTFOLIO-Visit_Website-00C7FF?style=for-the-badge" />
</a>

<br/><br/>

### 🔗 https://nandhakumarsvdev.netlify.app/

</div>

---

# ✨ About The Portfolio

This website was created to provide a central place to showcase:

* 👨‍💻 Professional Profile
* 🛠️ Technical Skills
* 🚀 Projects
* 💼 Development Experience
* 📱 Web & Mobile Development
* 💳 Payment Gateway Experience
* ☁️ Cloud & Deployment Experience
* 💼 Freelance Services
* 📫 Contact Information

---

# 🛠️ Technologies Used

<p align="center">

<img src="https://skillicons.dev/icons?i=html,css,js,git,github" />

</p>

### Frontend

* HTML5
* CSS3
* JavaScript
* Responsive Web Design
* CSS Animations
* Interactive UI Components

### Libraries / Tools

* Swiper.js
* JavaScript DOM Manipulation
* Git
* GitHub

### Deployment

* Netlify

---

# 🎨 Website Features

## 🏠 Home

A developer-focused introduction with:

* Professional headline
* Developer summary
* Call-to-action
* Social links

---

## 👨‍💻 About Me

Highlights:

* Development experience
* Technical background
* Career journey
* Areas of expertise

---

## 🛠️ Skills

The portfolio showcases experience with technologies such as:

```text
⚛️ React
📱 React Native
🔷 TypeScript
🟨 JavaScript
🐘 PHP
🟢 Node.js
🗄️ MySQL
🔌 REST APIs
💳 Payment Gateways
☁️ AWS
🐳 Docker
```

---

# 🚀 Featured Projects

## 🍽️ NammaQR

Restaurant management and digital ordering SaaS platform.

### Features

* QR Menu
* Table Management
* Order Management
* Kitchen Management
* Billing
* Inventory
* Reports
* Staff Management

**Technology:** React · TypeScript · PHP · MySQL

---

## 💰 ChitCare / RD Fund Management

Financial management applications for managing:

* Customers
* Agents
* Branches
* Collections
* Payments
* Reports
* Transactions

**Technology:** React · TypeScript · PHP · MySQL

---

## 📊 Admin Management Systems

Custom administrative dashboards for managing business operations and application data.

**Technology:** React · TypeScript · PHP · MySQL

---

# 💼 Freelance — BuildNexDev

Alongside my software development career, I work on freelance projects through **BuildNexDev**.

### 🌐 Website

<a href="https://buildnexdev.in/">
https://buildnexdev.in/
</a>

### Services

```text
🌐 Business Websites
💻 Web Applications
📱 Mobile Applications
🛠️ Admin Dashboards
🔌 REST API Development
💳 Payment Gateway Integration
☁️ Cloud Deployment
🔧 Application Maintenance
```

---

# 💳 Payment Integration Experience

Experience working with:

```text
💳 Razorpay
💳 CCAvenue
💳 HDFC QR Payment
💳 ICICI Payment Integration
```

---

# ☁️ Cloud & Deployment

Experience / learning in:

```text
☁️ AWS EC2
🗂️ AWS S3
🐳 Docker
🌐 Nginx
⚙️ PM2
🔄 CI/CD
🔐 SSL / HTTPS
```

---

# 📱 Web & Mobile Development

I work across both web and mobile application development.

```text
             Nandhakumar
                  │
       ┌──────────┴──────────┐
       │                     │
     WEB                  MOBILE
       │                     │
       ▼                     ▼
   React.js             React Native
   TypeScript           TypeScript
   PHP                  REST APIs
   MySQL                Redux
   REST API             Payment Integration
```

---

# 📁 Project Structure

```text
MyPortfolio/
│
├── Assets/
│   ├── Images
│   ├── Icons
│   └── Fonts
│
├── index.html
├── style.css
├── media.css
├── script.js
├── swiper-bundle.min.css
├── swiper-bundle.min.js
└── README.md
```

---

# 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Nandhasv05/MyPortfolio.git
```

### 2. Navigate to the project

```bash
cd MyPortfolio
```

### 3. Open the project

You can simply open:

```text
index.html
```

in your browser.

Or use **VS Code Live Server** for development.

---

# 🌐 Deployment

The portfolio is deployed using **Netlify**.

```text
GitHub Repository
       │
       ▼
     Netlify
       │
       ▼
Live Portfolio
       │
       ▼
nandhakumarsvdev.netlify.app
```

---

# 📈 Future Improvements

* [ ] Add blog section
* [ ] Add project case studies
* [ ] Add dark / light mode
* [ ] Add contact form
* [ ] Add animations
* [ ] Add project filtering
* [ ] Add downloadable resume
* [ ] Improve accessibility
* [ ] Improve SEO
* [ ] Add Google Analytics

---

# 👨‍💻 About Me

## Nandhakumar S V

**Full Stack Developer | React | React Native | TypeScript | PHP**

I build modern web and mobile applications with a focus on clean UI, scalable backend systems, API integrations and real-world business solutions.

### Core Skills

```text
Frontend
├── React
├── React Native
├── TypeScript
├── JavaScript
├── HTML
└── CSS

Backend
├── PHP
├── Node.js
├── Express.js
└── REST APIs

Database
└── MySQL

DevOps / Cloud
├── AWS
├── Docker
├── Nginx
├── PM2
└── CI/CD

Other
├── Redux
├── Git
├── GitHub
└── Payment Gateways
```

---

# 🔗 Connect With Me

<div align="center">

<a href="https://nandhakumarsvdev.netlify.app/">
<img src="https://img.shields.io/badge/🌐_Portfolio-00C7FF?style=for-the-badge" />
</a>

<a href="https://buildnexdev.in/">
<img src="https://img.shields.io/badge/💼_BuildNexDev-F59E0B?style=for-the-badge" />
</a>

<a href="https://www.linkedin.com/in/nandhakumar-s-v-0ab492254">
<img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
</a>

<a href="mailto:nandhakumarsv2002@gmail.com">
<img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
</a>

</div>

---

<div align="center">

### 🚀 Build. Learn. Create. Repeat.

**Built by Nandhakumar S V**

⭐ If you like this portfolio, consider giving the repository a star!

</div>
>>>>>>> 45b5435fe3e5c19e510c61f7e02b9843401f9f5c
