/* Browser-safe adapter for the live EMDI Travel Connect Supabase project. */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const BUSINESS_TABLE = 'business_applications';
const DIRECTORY_VIEW = 'published_provider_directory';
const APPOINTMENT_TABLE = 'appointment_requests';
const CATEGORY_TO_DB = {
  'Passport Agents': 'Passport Agent',
  'Visa Consultants': 'Visa Consultant',
  'Travel Agencies': 'Travel Agency',
  'Accommodation Providers': 'Hotel / Guesthouse',
  'Flight Booking & Ticketing Assistance': 'Flight Booking & Ticketing Assistance',
  'Airport Transfers & Transport': 'Airport Transfers & Transport',
  'Tourism & Tours': 'Tourism & Tour Operators'
};
const CATEGORY_FROM_DB = Object.fromEntries(Object.entries(CATEGORY_TO_DB).map(([ui, db]) => [db, ui]));
const STATUS_TO_DB = { Pending: 'pending', Approved: 'approved', Rejected: 'rejected', Suspended: 'suspended' };
const STATUS_FROM_DB = Object.fromEntries(Object.entries(STATUS_TO_DB).map(([ui, db]) => [db, ui]));
const SUBSCRIPTIONS = ['Free Trial', 'Active Subscription', 'Expired Subscription'];
const TIMES = ['Morning (8am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–6pm)'];

function required(value, field) { const v = String(value ?? '').trim(); if (!v) throw new Error(`${field} is required.`); return v; }
function email(value) { const v = required(value, 'Email address').toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(v)) throw new Error('Email address is invalid.'); return v; }
function mapStatus(status) { return STATUS_FROM_DB[status] || status || 'Pending'; }
function errorMessage(error) { if (!error) return; const e = new Error(error.code === '42501' ? 'You are not authorised for this action.' : error.message || 'Supabase request failed.'); e.code = error.code; throw e; }
function providerFromRow(row) { return { id: row.id, businessName: row.business_name, category: CATEGORY_FROM_DB[row.category] || row.category, contactName: row.contact_name, phone: row.mobile || row.phone || '', email: row.email, location: row.operating_location || row.location, services: row.services_offered || '', description: row.description, logo: row.logo_data_url || row.logo_url || '', status: mapStatus(row.status), subscription: row.subscription_status || 'Free Trial', plan: row.subscription_plan || row.plan || 'Basic', province: row.province || '', gallery: Array.isArray(row.gallery_data_urls) ? row.gallery_data_urls : [], detailedServices: row.detailed_services || '', subcategories: Array.isArray(row.subcategories) ? row.subcategories : [], extraCategories: Array.isArray(row.extra_categories) ? row.extra_categories : [], promotion: row.promotion || '', sample: false, createdAt: row.created_at, updatedAt: row.updated_at }; }

export function createEmdiSupabaseAdapter(config = {}) {
  if (!config.url || !config.anonKey) throw new Error('Supabase configuration is missing.');
  const client = createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  return {
    client,
    async createProviderApplication(input) {
      const contactEmail = email(input.email);
      const row = { business_name: required(input.businessName, 'Business name'), category: CATEGORY_TO_DB[input.category] || required(input.category, 'Business category'), contact_name: required(input.contactName, 'Contact person'), mobile: required(input.phone, 'Phone number'), email: contactEmail, owner_email: contactEmail, operating_location: required(input.location, 'Business location'), province: required(input.province || input.location, 'Province'), services_offered: required(input.services, 'Services offered'), description: required(input.description, 'Short business description'), logo_data_url: input.logo || null, subscription_plan: input.plan || 'Basic', gallery_data_urls: input.gallery || [], detailed_services: input.detailedServices || null, subcategories: input.subcategories || [], extra_categories: input.extraCategories || [], promotion: input.promotion || null };
      const { error } = await client.from(BUSINESS_TABLE).insert(row); errorMessage(error); // public visitors cannot read rows back, so no .select()
      return { ...input, id: 'pending-' + Date.now().toString(36), status: 'Pending', subscription: 'Free Trial', plan: row.subscription_plan };
    },
    async listPublishedProviders() {
      const { data, error } = await client.rpc('list_public_providers'); errorMessage(error);
      return (data || []).map(row => ({ ...providerFromRow(row), status: 'Approved', subscription: row.subscription_status || 'Active Subscription', sample: false, createdAt: row.published_at }));
    },
    async listProviderApplications() { const { data, error } = await client.from(BUSINESS_TABLE).select('*').order('created_at', { ascending: false }).limit(500); errorMessage(error); return (data || []).map(providerFromRow); },
    async updateProviderStatus(id, status) { const { data, error } = await client.from(BUSINESS_TABLE).update({ status: STATUS_TO_DB[status] || status }).eq('id', id).select().single(); errorMessage(error); return providerFromRow(data); },
    async updateProviderApplication(id, input) {
      const row = { business_name: required(input.businessName, 'Business name'), category: CATEGORY_TO_DB[input.category] || input.category, contact_name: required(input.contactName, 'Contact person'), mobile: required(input.phone, 'Phone number'), email: email(input.email), operating_location: required(input.location, 'Business location'), services_offered: required(input.services, 'Services offered'), description: required(input.description, 'Short business description'), status: STATUS_TO_DB[input.status] || input.status, subscription_status: input.subscription || 'Free Trial', subscription_plan: input.plan || 'Basic' };
      if (row.subscription_status === 'Active Subscription') {
        // Administrator verified the payment: record it, and start a one-month subscription unless one is already running.
        const { data: current } = await client.from(BUSINESS_TABLE).select('subscription_payment_verified_at,subscription_expires_at').eq('id', id).single();
        const running = current && current.subscription_payment_verified_at && current.subscription_expires_at && new Date(current.subscription_expires_at) > new Date();
        if (!running) { const { data: auth } = await client.auth.getUser(), now = new Date(), end = new Date(now); end.setMonth(end.getMonth() + 1); row.subscription_payment_verified_at = now.toISOString(); row.subscription_payment_verified_by = auth && auth.user ? auth.user.id : null; row.subscription_started_at = now.toISOString(); row.subscription_expires_at = end.toISOString(); }
      }
      const { data, error } = await client.from(BUSINESS_TABLE).update(row).eq('id', id).select().single(); errorMessage(error); return providerFromRow(data);
    },
    async isAdmin() { const { data, error } = await client.rpc('is_emdi_admin'); return !error && data === true; },
    async logProviderEvent(providerId, event) { try { await client.from('provider_events').insert({ provider_id: providerId, event }); } catch (e) { /* insights are best-effort */ } },
    async listProviderEvents() { try { const { data, error } = await client.from('provider_events').select('provider_id,event').limit(20000); return error ? [] : (data || []); } catch (e) { return []; } },
    async createAppointmentRequest(input) { const row = { provider_id: input.providerId || null, provider_name: required(input.providerName, 'Provider name'), appointment_date: required(input.appointmentDate, 'Preferred date'), preferred_time: TIMES.includes(input.preferredTime) ? input.preferredTime : required(input.preferredTime, 'Preferred time'), requester_name: required(input.requestName, 'Your name'), requester_email: email(input.requestEmail), requester_phone: required(input.requestPhone, 'Mobile number'), request_note: required(input.requestNote, 'Request details'), status: 'pending' }; const { data, error } = await client.from(APPOINTMENT_TABLE).insert(row); errorMessage(error); return row; },
    async signIn(emailAddress, password) { const { data, error } = await client.auth.signInWithPassword({ email: emailAddress, password }); errorMessage(error); return data; },
    async signOut() { const { error } = await client.auth.signOut(); errorMessage(error); },
    async currentUser() { const { data, error } = await client.auth.getUser(); errorMessage(error); return data.user; }
  };
}
