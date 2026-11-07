from django.conf import settings
import urllib.parse

CATEGORIES_DATA = [
    {
        'id': 'websites-apps',
        'number': '1',
        'title': 'Customized Websites and Apps',
        'short_title': 'Websites & Apps',
        'subtext': 'High-performance digital storefronts and web solutions tailored for growing enterprises.',
        'color': '#A855F7',
        'color_dark': '#7928CA',
        'icon': 'i-cat1',
        'sub_services': [
            {'num': '1.1', 'title': 'Business sites', 'count': 18, 'desc': 'Show your services, address, timings and a direct phone button.', 'icon': 'i-globe', 'tags': ['Fast on mobile', 'Phone button']},
            {'num': '1.2', 'title': 'E-commerce and ordering', 'count': 7, 'desc': 'Product catalog with a basket and instant WhatsApp order send.', 'icon': 'i-cart', 'tags': ['Catalog', 'WhatsApp order']},
            {'num': '1.3', 'title': 'Institution portals', 'count': 7, 'desc': 'Admission inquiries, fee details and a notice board for colleges and schools.', 'icon': 'i-school', 'tags': ['Admissions', 'Fees']},
            {'num': '1.4', 'title': 'SaaS products', 'count': 7, 'desc': 'Simple online software for client dashboards, billing and real-time reports.', 'icon': 'i-layers', 'tags': ['Dashboards', 'Reports']},
        ]
    },
    {
        'id': 'erp',
        'number': '2',
        'title': 'Odoo-style ERP',
        'short_title': 'ERP Systems',
        'subtext': 'Comprehensive business management suites designed for seamless workflows.',
        'color': '#3B82F6',
        'color_dark': '#1D4ED8',
        'icon': 'i-cat2',
        'sub_services': [
            {'num': '2.1', 'title': 'Sales and CRM', 'count': 4, 'desc': 'Manage pipelines, leads, and customer interactions efficiently.', 'icon': 'i-users', 'tags': ['Pipeline', 'Leads']},
            {'num': '2.2', 'title': 'Accounting', 'count': 3, 'desc': 'Invoicing, ledgers, and financial tracking in real-time.', 'icon': 'i-calc', 'tags': ['Invoices', 'Ledgers']},
            {'num': '2.3', 'title': 'Inventory and Purchase', 'count': 4, 'desc': 'Stock control, purchase orders, and supplier management.', 'icon': 'i-box', 'tags': ['Stock', 'Purchases']},
            {'num': '2.4', 'title': 'POS', 'count': 4, 'desc': 'Fast point of sale terminals for retail shops and multi-branch outlets.', 'icon': 'i-card', 'tags': ['Retail', 'Billing']},
            {'num': '2.5', 'title': 'HR', 'count': 4, 'desc': 'Employee management, biometric attendance, and payroll tracking.', 'icon': 'i-brief', 'tags': ['Attendance', 'Payroll']},
            {'num': '2.6', 'title': 'Operations', 'count': 5, 'desc': 'Streamline internal business operations and project logistics.', 'icon': 'i-flow', 'tags': ['Logistics', 'Workflows']},
            {'num': '2.7', 'title': 'Delivery and multi-vendor', 'count': 3, 'desc': 'Vendor management, dispatch tracking, and fulfillment logistics.', 'icon': 'i-truck', 'tags': ['Vendors', 'Fulfillment']},
            {'num': '2.8', 'title': 'Industry ERPs', 'count': 5, 'desc': 'Specialized ERP configurations tailored for specific industry verticals.', 'icon': 'i-factory', 'tags': ['Specialized', 'Custom']},
        ]
    },
    {
        'id': 'ai-marketing',
        'number': '3',
        'title': 'AI Marketing and Business Analysis',
        'short_title': 'AI Marketing',
        'subtext': 'Intelligent marketing automation and data-driven business insights.',
        'color': '#EC4899',
        'color_dark': '#BE185D',
        'icon': 'i-cat3',
        'sub_services': [
            {'num': '3.1', 'title': 'Business analysis', 'count': 3, 'desc': 'Advanced data evaluation and strategic business performance insights.', 'icon': 'i-chart', 'tags': ['Analytics', 'Strategy']},
            {'num': '3.2', 'title': 'Content and social', 'count': 4, 'desc': 'AI-generated content and social media campaign automation.', 'icon': 'i-mega', 'tags': ['Content', 'Social']},
            {'num': '3.3', 'title': 'SEO and local SEO', 'count': 3, 'desc': 'Search engine optimization to rank higher on Google Maps and search.', 'icon': 'i-search', 'tags': ['SEO', 'Ranking']},
            {'num': '3.4', 'title': 'Lead generation', 'count': 3, 'desc': 'Targeted acquisition campaigns to capture high-intent local leads.', 'icon': 'i-target', 'tags': ['Leads', 'Acquisition']},
            {'num': '3.5', 'title': 'Lead follow-up', 'count': 3, 'desc': 'Automated follow-ups on WhatsApp and SMS to nurture prospects.', 'icon': 'i-send', 'tags': ['WhatsApp', 'Automation']},
            {'num': '3.6', 'title': 'AI calling agent', 'count': 3, 'desc': 'Autonomous AI voice agents for appointment booking and customer outreach.', 'icon': 'i-phone', 'tags': ['Voice AI', 'Bookings']},
            {'num': '3.7', 'title': 'Reporting', 'count': 3, 'desc': 'Real-time dashboards tracking marketing ROAS and growth metrics.', 'icon': 'i-trend', 'tags': ['Metrics', 'ROAS']},
        ]
    },
    {
        'id': 'ai-agents',
        'number': '4',
        'title': 'Domain AI Agents',
        'short_title': 'AI Agents',
        'subtext': 'Specialized vertical AI agents designed for automated industry tasks.',
        'color': '#10B981',
        'color_dark': '#047857',
        'icon': 'i-cat4',
        'sub_services': [
            {'num': '4.1', 'title': 'Exam agents', 'count': 3, 'desc': 'Automated question paper generation, instant scoring, and student analytics.', 'icon': 'i-grad', 'tags': ['EdTech', 'Analytics']},
            {'num': '4.2', 'title': 'Institution agent', 'count': 3, 'desc': 'Campus automation, student inquiries, and administrative support bots.', 'icon': 'i-school', 'tags': ['Campus', 'Admin']},
            {'num': '4.3', 'title': 'HR agent', 'count': 3, 'desc': 'Candidate screening, interview scheduling, and employee onboarding.', 'icon': 'i-users', 'tags': ['Recruitment', 'HR']},
            {'num': '4.4', 'title': 'Finance agent', 'count': 4, 'desc': 'Automated invoice processing, expense categorization, and audit assistance.', 'icon': 'i-wallet', 'tags': ['Finance', 'Audits']},
            {'num': '4.5', 'title': 'Healthcare agent', 'count': 3, 'desc': 'Patient intake, doctor scheduling, and clinic WhatsApp coordination.', 'icon': 'i-pulse', 'tags': ['Clinic', 'Support']},
            {'num': '4.6', 'title': 'Support agent', 'count': 2, 'desc': 'Intelligent 24/7 customer service, inquiry resolution, and ticket routing.', 'icon': 'i-headset', 'tags': ['Support', 'Tickets']},
        ]
    }
]

def studio_context(request):
    whatsapp_clean = settings.WHATSAPP_NUMBER.replace('+', '').replace(' ', '')
    default_wa_msg = urllib.parse.quote("Hi GuhaTech! I would like to discuss a project.")
    default_wa_url = f"https://wa.me/{whatsapp_clean}?text={default_wa_msg}"

    return {
        'STUDIO_PHONE': settings.STUDIO_PHONE,
        'WHATSAPP_NUMBER': settings.WHATSAPP_NUMBER,
        'STUDIO_EMAIL': settings.STUDIO_EMAIL,
        'STUDIO_ADDRESS': settings.STUDIO_ADDRESS,
        'DEFAULT_WA_URL': default_wa_url,
        'CATEGORIES': CATEGORIES_DATA,
    }

