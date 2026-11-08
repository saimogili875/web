from django.contrib import admin
from .models import ContactInquiry, Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer_name', 'phone', 'model', 'color', 'storage', 'status', 'source', 'created_at')
    list_filter = ('model', 'color', 'storage', 'status', 'source', 'created_at')
    search_fields = ('order_id', 'customer_name', 'phone', 'delivery_address')
    readonly_fields = ('order_id', 'created_at')


@admin.register(ContactInquiry)
class ContactInquiryAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'service', 'created_at', 'is_contacted')
    list_filter = ('service', 'is_contacted', 'created_at')
    search_fields = ('name', 'phone', 'message')
    readonly_fields = ('created_at',)
