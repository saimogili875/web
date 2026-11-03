from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('websites-apps/', views.category_detail, {'slug': 'websites-apps'}, name='websites_apps'),
    path('erp/', views.category_detail, {'slug': 'erp'}, name='erp'),
    path('ai-marketing/', views.category_detail, {'slug': 'ai-marketing'}, name='ai_marketing'),
    path('ai-agents/', views.category_detail, {'slug': 'ai-agents'}, name='ai_agents'),
    path('contact/', views.contact_submit, name='contact_submit'),
    path('api/chat/', views.chat_api, name='chat_api'),
]

