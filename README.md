# EMDI Travel & Passport Connect

A responsive multi-page prototype for EMDI Digital Technologies in Papua New Guinea. It keeps the existing EMDI charcoal, ivory and gold branding and provides focused discovery, registration, provider directory and management pages.

## Pages

- `index.html` — Home: existing branded hero and compact category navigation only. Detailed content is routed to dedicated pages.
- `services.html` — Services: the existing service cards and how-it-works content, moved without redesign.
- `about.html` — About: the existing audience, about, benefits and contact content, moved without redesign.
- `providers.html` — Providers: service categories, advanced search, location filters, approved provider directory and provider profile detail modal.
- `register.html` — Register: business provider application form (travellers browse without an account).
- `management.html` — Provider Management: provider dashboard and protected admin registration management.

All pages reuse the same navigation, footer, assets, `styles.css` and `script.js`.

## Provider directory

The Providers page includes a client-side filter layer over approved records:

- Keyword search across business name, category, location, services and description.
- Provider category filter.
- Province/location filter.
- Sort by newest, business name, category or location.
- Clear filters action and live approved-provider count.
- Map-style PNG region filter buttons for Western Highlands, Madang, National Capital District, Morobe, Eastern Highlands, Oro and East New Britain.
- Responsive layout for mobile screens.
- Clickable provider cards and **View profile** actions open an accessible native profile dialog.
- Provider profile dialog shows the approved provider's logo/initials, category, location, description, services, contact person, subscription status, phone action and email action.
- Dialog can be closed with the close button, Escape key or clicking the backdrop.

The location panel is intentionally implemented without a paid map provider or external dependency. It filters the same approved provider data used by the public directory.

## Run locally

```sh
python3 -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Supabase connection

This redesign is connected to the active **EMDI Travel Connect** Supabase project. The browser uses only the publishable key in `supabase-config.js`; no service-role key is included.

- Business applications write to `public.business_applications`.
- Approved public listings read from `public.published_provider_directory`.
- Appointment requests write to `public.appointment_requests`.
- Admin management signs in through Supabase Auth and reads/updates records only through the existing `is_emdi_admin()` RLS policies.
- Public inserts are restricted by RLS to pending registrations/applications; public visitors cannot read submitted contact details.

An administrator must have a Supabase Auth account whose email is included in the project's active EMDI admin allowlist. Use the Management page's Supabase email/password sign-in. Do not enter passport scans, passport numbers, financial information or other sensitive documents.

## Scope

No payment gateway, passport application processing, faster-approval promise or unrelated feature has been added. The realistic sample PNG businesses are retained for demonstration. All registration and provider-management forms use the existing validation and status workflows.

## Design refresh (v3)

- `styles.css` rewritten as a single design system (charcoal / ivory / gold, Manrope + DM Sans, consistent radii, shadows, buttons, inline SVG icons).
- Homepage: new hero, quick-find category bar, service cards, how-it-works, provider panel, trust section, founding-provider benefits, multi-column footer.
- Providers: search/filter toolbar, region chips, richer provider cards, redesigned profile dialog with appointment request.
- Register: clearer provider form and success/error states.
- Management: sidebar dashboard layout, stat cards, table-style registration lists.
- Fixes: added the missing admin "Edit provider" dialog markup to `management.html`; homepage category links now open `providers.html?category=...` (the directory reads `category`, `location` and `q` query parameters).
- Placeholder email/WhatsApp in the contact section and footer still need real details before launch.
