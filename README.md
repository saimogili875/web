# Arkshar — Frontend Website

Clean, modern, mobile-first frontend for **Arkshar** (`arkshar.com`), an Indian software studio based in Hyderabad that builds ready-made websites, apps, and AI marketing workflows for small businesses, and publishes one working prototype every working day with an Instagram reel.

---

## 🚀 Tech Stack & Design System

- **Stack**: Semantic HTML5, CSS3 with custom properties, Vanilla JavaScript (ES6+). Zero frameworks, zero dependencies, no build steps.
- **Palette**:
  - Deep Navy (`#0F2747`, `#08172B`) — studio base and dark panels.
  - Pure White & Light Slate (`#FFFFFF`, `#F8FAFC`, `#E2E8F0`) — generous white space.
  - Warm Saffron (`#F59E0B`, hover `#D97706`) — primary buttons, highlights, badges.
  - WhatsApp Green (`#25D366`) — strictly used for WhatsApp action buttons.
- **Typography**: Plus Jakarta Sans via Google Fonts with local system fallbacks.
- **Mobile-First**: Tuned for Indian shop, clinic, restaurant, and college owners arriving from Instagram on Android phones and 4G connections.
- **Accessibility & Contrast**: WCAG AA compliant color contrast, keyboard-accessible skip links, focus traps on modal popups, and full `prefers-reduced-motion` support.

---

## 📁 Repository Structure

```
/
├── index.html              # Home page (Hero, Today's prototype, Who it's for, 4 lines, Real proof, How it works, Pricing preview, About preview, FAQ)
├── catalog.html            # Prototype catalog (Sort, filters, search, URL query state, slug hash routes, accessible quick-view)
├── solutions.html          # The 4 sectors (Lines 1 & 3 Available now, Lines 2 & 4 Coming soon)
├── pricing.html            # Transparent plans (Starter, Growth, Full - no fake numbers) & Monthly care
├── about.html              # Studio story, developer profile, Hyderabad location, live project placeholders
├── contact.html            # Honest quote form (validates and prepares WhatsApp pre-filled message + copy backup)
├── privacy.html            # Transparent privacy notice for contact form data handling
├── 404.html                # Friendly custom error page
├── robots.txt              # Search engine crawler instructions
├── sitemap.xml             # XML sitemap for https://arkshar.com/
├── favicon.svg             # Minimalist SVG monogram
├── css/
│   └── styles.css          # CSS custom properties, layout grids, components, skeletons, badges
├── js/
│   ├── config.js           # Central studio configuration (WhatsApp number, phone, email, Instagram)
│   ├── main.js             # Mobile nav drawer, dynamic home loaders, WhatsApp form handler, analytics tracker
│   ├── catalog.js          # Catalog filtering, sorting, search, URL query persistence, hash route modal
│   └── i18n/
│       ├── en.json         # English UI dictionary
│       ├── hi.json         # Hindi translation dictionary (starter)
│       └── te.json         # Telugu translation dictionary (starter)
├── data/
│   └── prototypes.json     # 10 prototypes with slug, date, status, sample flags
└── assets/
    ├── og.svg / og.png     # Social share open graph banners
    ├── about/
    │   └── me-fallback.svg # Fallback avatar when me.jpg is not yet added
    └── prototypes/         # Card thumbnails (salon, clinic, bakery, kirana, gym, etc.)
```

---

## ⚙️ Configuration (`js/config.js`)

All contact details and studio URLs are managed in a single file: `js/config.js`.

Open `js/config.js` and update:
```javascript
window.ARKSHAR_CONFIG = {
  // TODO: Replace placeholder with your real WhatsApp number with country code (e.g. "919876543210")
  WHATSAPP_NUMBER: "91XXXXXXXXXX",

  // Human-readable phone display
  PHONE_DISPLAY: "+91 XXXXX XXXXX",

  // Official email address
  EMAIL: "hello@arkshar.com",

  // Instagram profile or reel link
  INSTAGRAM_URL: "https://instagram.com/arkshar",

  // Canonical website URL
  SITE_URL: "https://arkshar.com",

  // Studio base city
  CITY: "Hyderabad, India"
};
```

When `WHATSAPP_NUMBER` is still `"91XXXXXXXXXX"`, a gentle developer warning is logged in the browser console (and never shown on the live UI).

---

## 📝 How to Add a New Prototype (`data/prototypes.json`)

Arkshar publishes **one prototype every working day**. To publish a new prototype, append a new JSON object to `data/prototypes.json`:

```json
{
  "id": "proto-11",
  "slug": "ayurcare-clinic",
  "name": "AyurCare Herbal Clinic OPD",
  "type": "Business site",
  "industry": "Healthcare",
  "description": "Herbal therapy appointment booking flow with dosha intake form and automated WhatsApp slot reminders.",
  "demoUrl": "https://demo.arkshar.com/ayurcare",
  "reelUrl": "https://instagram.com/reel/example123",
  "image": "assets/prototypes/clinic.svg",
  "date": "2026-11-04",
  "status": "live-demo",
  "sample": true
}
```

### Field Definitions:
- `id` *(string)*: Unique identifier (e.g. `proto-11`).
- `slug` *(string)*: URL-friendly identifier used for hash routing (e.g. `catalog.html#ayurcare-clinic` opens the quick-view popup directly from Instagram reel links).
- `name` *(string)*: Prototype title.
- `type` *(string)*: Must match one of: `"Business site"`, `"E-commerce"`, `"Institution portal"`, or `"SaaS"`.
- `industry` *(string)*: Category (e.g., `Healthcare`, `Food & Beverage`, `Salon & Beauty`, `Education`, `Fitness & Sports`, `Grocery & Retail`). The catalog's filter dropdown auto-populates from this!
- `description` *(string)*: 1–2 plain-English sentences explaining what the prototype does.
- `demoUrl` *(string)*: Direct link to the live demo app. If empty or `#`, the catalog hides the "View demo" button.
- `reelUrl` *(string)*: Instagram reel URL. If empty or `#`, the reel button is hidden.
- `image` *(string)*: Path to preview screenshot or SVG thumbnail.
- `date` *(string, YYYY-MM-DD)*: The release date.
  - Prototypes dated within the last 7 days automatically display a `"New"` badge.
  - The home page "Today's prototype" strip selects the item with the newest date not in the future.
- `status` *(string)*: One of:
  - `"live-demo"`: Displays green "Live demo" badge.
  - `"screenshot-only"`: Displays blue "Screenshot only" badge.
  - `"in-build"`: Displays orange "In build" badge.
- `sample` *(boolean)*:
  - `true`: When it is an illustrative sample concept built for demonstration. Displays the mandatory honest badge: `"Sample concept, not a real client"`.
  - `false`: Set to `false` ONLY when the prototype was built for an actual verified client with permission.

---

## 🐍 Moving into Django Templates

This repository is designed from scratch to be Django-ready with zero JavaScript build steps.

### Step 1: Copy Static Files
Copy the CSS, JS, data, and assets into your Django app's static directory:
```
my_django_project/
├── myapp/
│   ├── static/
│   │   └── arkshar/
│   │       ├── css/styles.css
│   │       ├── js/config.js
│   │       ├── js/main.js
│   │       ├── js/catalog.js
│   │       ├── data/prototypes.json
│   │       ├── assets/
│   │       └── favicon.svg
```

### Step 2: Create `base.html`
Extract the common `<head>`, `<header>`, mobile drawer, floating WhatsApp button, and `<footer>` into `templates/arkshar/base.html`:
```html
{% load static %}
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{% block title %}Arkshar — Your business online. Ready-made, live in days.{% endblock %}</title>
  <link rel="icon" type="image/svg+xml" href="{% static 'arkshar/favicon.svg' %}">
  <link rel="stylesheet" href="{% static 'arkshar/css/styles.css' %}">
  {% block extra_head %}{% endblock %}
</head>
<body>
  {% include 'arkshar/includes/header.html' %}

  <main id="main-content">
    {% block content %}{% endblock %}
  </main>

  {% include 'arkshar/includes/footer.html' %}
  {% include 'arkshar/includes/sticky_mobile_bar.html' %}

  <script src="{% static 'arkshar/js/config.js' %}"></script>
  <script src="{% static 'arkshar/js/main.js' %}"></script>
  {% block extra_scripts %}{% endblock %}
</body>
</html>
```

### Step 3: Wire Contact Form to Django View
In `contact.html`, connect the form to your Django backend view:
```html
<form id="quote-form" method="POST" action="{% url 'quote_request' %}">
  {% csrf_token %}
  <!-- Form fields -->
</form>
```
In `views.py`, handle the POST submission, send an email or WhatsApp notification to the studio, and redirect with a success message.

### Step 4: Optional Django Prototype Model
Instead of `prototypes.json`, you can define a Django Model:
```python
# models.py
class Prototype(models.Model):
    slug = models.SlugField(unique=True)
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=50)
    industry = models.CharField(max_length=100)
    description = models.TextField()
    demo_url = models.URLField(blank=True)
    reel_url = models.URLField(blank=True)
    image = models.ImageField(upload_to="prototypes/")
    date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ("live-demo", "Live Demo"),
        ("screenshot-only", "Screenshot Only"),
        ("in-build", "In Build"),
    ])
    sample = models.BooleanField(default=True)
```
And expose an API endpoint returning the same JSON schema to power `catalog.js` and `main.js`.

---

## 📋 Checklist of Remaining TODOs for Launch

1. **WhatsApp Number (`js/config.js`)**:
   - Replace `"91XXXXXXXXXX"` with your real studio WhatsApp number.
   - Replace `PHONE_DISPLAY` with your formatted phone number.
2. **Founder Photo & Name (`about.html`)**:
   - Add your square photo to `assets/about/me.jpg` (if omitted, the clean SVG fallback in `assets/about/me-fallback.svg` is used automatically).
   - Replace `[Your first name]` with your actual first name.
3. **Live Projects in About (`about.html`)**:
   - Replace the two placeholder cards in the "Live projects (with client permission)" section when your first verified client apps go live.
4. **Translations (`js/i18n/hi.json`, `js/i18n/te.json`)**:
   - Hindi and Telugu language files are ready with starter keys. Translate the strings when rolling out multilingual support.
5. **Backend Form Endpoint**:
   - Connect `contact.html` to a Django view or email webhook when deploying the backend. Currently, the form validates on the frontend and opens WhatsApp with a pre-filled quote message.

---

## 🛠️ Local Testing

To run the local server without any build tools:
```bash
python3 -m http.server 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
