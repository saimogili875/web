from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib import messages
from django.core.mail import send_mail
from django.conf import settings
from .models import ContactInquiry
from .context_processors import CATEGORIES_DATA
import json
import urllib.parse
import os

try:
    import anthropic
except ImportError:
    anthropic = None

def home(request):
    """Homepage rendering with hero, clickable stack cards, results, FAQs and contact."""
    faqs = [
        {
            'question': 'How quickly can our website or app go live?',
            'answer': 'Because we maintain ready-made architectural prototypes for shops, clinics, restaurants, and schools, core setups can go live in 2 to 5 working days with your branding, domain, and catalog.'
        },
        {
            'question': 'How does WhatsApp ordering and lead capture work?',
            'answer': 'Customers browse products or services on your website and tap one button to generate a structured, pre-filled order or inquiry directly into your studio WhatsApp number. Zero commission, zero delays.'
        },
        {
            'question': 'Can we customize features, designs, and integrations?',
            'answer': 'Yes. Everything is built on clean HTML5, CSS3, vanilla JavaScript, Python, and Django—not bloated page builders. You can customize workflows, database schema, payment gateways, and POS.'
        },
        {
            'question': 'What are Domain AI Agents and AI Calling Agents?',
            'answer': 'Domain AI Agents are specialized chatbots and voice agents trained for specific industry workflows like student test analytics, patient clinic intake, customer ticket routing, and automated calling.'
        },
        {
            'question': 'Do you provide hosting, domain, and maintenance support?',
            'answer': 'Yes. We offer fully managed cloud hosting (on fast servers with SSL, CDN, and automated backups), monthly feature updates, bug fixes, and continuous technical support.'
        }
    ]

    results = [
        {'stat': '100%', 'label': 'Mobile-First Design', 'desc': 'Engineered for fast loading on Android devices and 4G networks.'},
        {'stat': '2-5 Days', 'label': 'Rapid Turnaround', 'desc': 'Ready-made functional prototypes deployed with your branding in days.'},
        {'stat': '0% Take', 'label': 'Zero Platform Commissions', 'desc': 'Orders & leads go directly to your WhatsApp and phone.'},
        {'stat': '24/7 Live', 'label': 'Smart AI Automation', 'desc': 'Automated response agents and lead triage working around the clock.'}
    ]

    selected_service = request.GET.get('service', 'websites-apps')

    context = {
        'faqs': faqs,
        'results': results,
        'selected_service': selected_service,
        'meta_title': 'GuhaTech — Ready-Made Business Websites, ERP & AI Solutions in Hyderabad',
        'meta_description': 'GuhaTech builds customized websites, Odoo-style ERP systems, AI marketing, and domain AI agents for small businesses in India. Live in days.',
    }
    return render(request, 'index.html', context)

def category_detail(request, slug):
    """Individual category page with its own hero, sub-services list, quote button, and back link."""
    cat = next((c for c in CATEGORIES_DATA if c['id'] == slug), None)
    if not cat:
        return redirect('home')

    whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    wa_msg = urllib.parse.quote(f"Hi GuhaTech! I would like to get a quote for {cat['title']}.")
    cat_wa_url = f"https://wa.me/{whatsapp_clean}?text={wa_msg}"

    context = {
        'category': cat,
        'cat_wa_url': cat_wa_url,
        'meta_title': f"{cat['title']} — GuhaTech Studio Solutions",
        'meta_description': f"Explore {cat['title']} by GuhaTech: {cat['subtext']} Ready-made for Indian businesses.",
    }
    template_name = f"categories/{slug.replace('-', '_')}.html"
    return render(request, template_name, context)

def contact_submit(request):
    """Processes contact form submissions (AJAX or standard POST)."""
    if request.method == 'POST':
        name = request.POST.get('name', '').strip()
        phone = request.POST.get('phone', '').strip()
        service = request.POST.get('service', 'websites-apps').strip()
        message = request.POST.get('message', '').strip()

        is_ajax = request.headers.get('x-requested-with') == 'XMLHttpRequest' or request.content_type == 'application/json'

        if not name or not phone:
            err_msg = "Please provide both your name and contact phone number."
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': err_msg}, status=400)
            messages.error(request, err_msg)
            return redirect('home')

        # Save to database (PostgreSQL in production, SQLite locally)
        try:
            inquiry = ContactInquiry.objects.create(
                name=name,
                phone=phone,
                service=service,
                message=message
            )
            service_display = inquiry.get_service_display()
        except Exception as e:
            inquiry = None
            service_display = service

        # Send email notification
        try:
            subject = f"New Quote Request from {name} - GuhaTech"
            body = (
                f"New inquiry received on GuhaTech website:\n\n"
                f"Name: {name}\n"
                f"Phone: {phone}\n"
                f"Service: {service_display}\n"
                f"Message:\n{message}\n"
            )
            send_mail(
                subject=subject,
                message=body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.STUDIO_EMAIL],
                fail_silently=True,
            )
        except Exception as e:
            pass

        # Build WhatsApp link for direct instant continuation
        whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
        wa_text = f"Hi GuhaTech! I submitted a quote request.\nName: {name}\nPhone: {phone}\nService: {service_display}\nNote: {message}"
        wa_url = f"https://wa.me/{whatsapp_clean}?text={urllib.parse.quote(wa_text)}"

        success_msg = f"Thank you, {name}! Your quote request has been received. We will contact you shortly."

        if is_ajax:
            return JsonResponse({
                'status': 'success',
                'message': success_msg,
                'whatsapp_url': wa_url
            })

        messages.success(request, success_msg)
        return redirect('home')

    return redirect('home')

@csrf_exempt
@require_http_methods(["POST"])
def chat_api(request):
    """
    Floating Chatbot AI Endpoint:
    Uses Claude API if ANTHROPIC_API_KEY is configured in environment,
    with an intelligent fallback knowledge engine for seamless testing.
    """
    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'error': 'Invalid JSON body'}, status=400)

    user_msg = data.get('message', '').strip()
    history = data.get('history', [])

    if not user_msg:
        return JsonResponse({'error': 'Message cannot be empty'}, status=400)

    api_key = getattr(settings, 'ANTHROPIC_API_KEY', '') or os.environ.get('ANTHROPIC_API_KEY', '')

    system_prompt = (
        "You are the intelligent assistant for GuhaTech (guhatech.com), a software studio in Hyderabad, India. "
        "GuhaTech builds four core solutions for small businesses:\n"
        "1. Customized Websites and Apps (business sites, e-commerce ordering, institution portals, SaaS)\n"
        "2. Odoo-style ERP (Sales/CRM, Accounting, Inventory/Purchase, POS, HR, Operations, Multi-vendor, Industry ERPs)\n"
        "3. AI Marketing and Business Analysis (local SEO, content/social, lead gen, WhatsApp follow-ups, AI voice calling agents)\n"
        "4. Domain AI Agents (Exam evaluation, campus bots, HR recruitment, finance/invoicing, healthcare clinic triage, support)\n\n"
        "Studio guidelines:\n"
        "- Tone: Concise, professional, humble, warm, practical. Avoid buzzwords.\n"
        "- Tech: Django, Python, PostgreSQL, vanilla JS, HTML5.\n"
        "- Speed: Ready-made working prototypes deployed in 2-5 days.\n"
        "- Location: Hyderabad, India.\n"
        "- Always encourage the user to share their name, phone, and business type for a tailored quote.\n"
        "- Mention that they can chat directly with our founder on WhatsApp for immediate pricing."
    )

    bot_reply = None
    suggested_category = None

    # Detect category interest
    lower_msg = user_msg.lower()
    if any(k in lower_msg for k in ['website', 'web', 'site', 'ecommerce', 'e-commerce', 'store', 'shop', 'portal', 'saas']):
        suggested_category = 'websites-apps'
    elif any(k in lower_msg for k in ['erp', 'odoo', 'inventory', 'pos', 'accounting', 'billing', 'crm', 'hr', 'payroll']):
        suggested_category = 'erp'
    elif any(k in lower_msg for k in ['marketing', 'seo', 'lead', 'leads', 'social', 'calling', 'voice agent', 'ads']):
        suggested_category = 'ai-marketing'
    elif any(k in lower_msg for k in ['agent', 'exam', 'clinic', 'hospital', 'doctor', 'student', 'finance agent', 'support bot']):
        suggested_category = 'ai-agents'

    # 1. Try Claude API if configured
    if api_key and anthropic:
        try:
            client = anthropic.Anthropic(api_key=api_key)
            messages_payload = []
            for h in history[-6:]:
                role = 'user' if h.get('sender') == 'user' else 'assistant'
                content = h.get('text', '')
                if content:
                    messages_payload.append({'role': role, 'content': content})

            messages_payload.append({'role': 'user', 'content': user_msg})

            response = client.messages.create(
                model="claude-3-5-haiku-20241022",
                max_tokens=300,
                system=system_prompt,
                messages=messages_payload,
            )
            bot_reply = response.content[0].text
        except Exception as e:
            # Fallback will handle it
            bot_reply = None

    # 2. Intelligent fallback engine when API key is unset or network error occurs
    if not bot_reply:
        if any(g in lower_msg for g in ['hi', 'hello', 'hey', 'namaste', 'start']):
            bot_reply = "Hello! Welcome to GuhaTech Studio. We build ready-made business websites, Odoo-style ERP systems, and AI automation tools in Hyderabad. Which service are you interested in today?"
        elif any(k in lower_msg for k in ['price', 'cost', 'quote', 'charges', 'rate', 'how much']):
            bot_reply = "Our projects are priced transparently based on your exact business needs—whether it's a fast mobile website, an ERP system, or an AI marketing pipeline. Could you share your name, phone number, and business type? Or tap the WhatsApp button below to get an instant quote."
        elif any(k in lower_msg for k in ['time', 'duration', 'fast', 'quick', 'days', 'how long']):
            bot_reply = "Because we maintain architectural prototypes for Indian shops, clinics, schools, and offices, most ready-made solutions go live within 2 to 5 business days."
        elif suggested_category == 'websites-apps':
            bot_reply = "We craft fast, mobile-first websites and web applications—including business showcase sites, WhatsApp ordering catalogs, college/school portals, and SaaS dashboards. Would you like a demo or quote for your business?"
        elif suggested_category == 'erp':
            bot_reply = "Our Odoo-style ERP solutions include Sales & CRM, GST Accounting, Stock & Inventory, Retail POS billing, HR & Payroll, and custom logistics modules. Which module does your business need?"
        elif suggested_category == 'ai-marketing':
            bot_reply = "Our AI Marketing tools automate Google local SEO, social content publishing, high-intent lead generation, automated WhatsApp follow-ups, and AI voice calling agents for bookings."
        elif suggested_category == 'ai-agents':
            bot_reply = "Our Domain AI Agents are automated assistants built for specific industry workflows—like exam evaluation for schools, patient booking for clinics, resume screening for HR, and 24/7 support tickets."
        else:
            bot_reply = "Thank you for asking! GuhaTech specializes in websites, ERP systems, AI marketing, and custom domain agents built on Django & PostgreSQL. Tell me a bit about your business, or connect with us on WhatsApp for a quick consultation."

    whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    wa_prompt = urllib.parse.quote(f"Hi GuhaTech! I chatted with your website AI about {suggested_category or 'a business project'}. Can we discuss?")
    wa_url = f"https://wa.me/{whatsapp_clean}?text={wa_prompt}"

    return JsonResponse({
        'reply': bot_reply,
        'category': suggested_category,
        'whatsapp_url': wa_url
    })
