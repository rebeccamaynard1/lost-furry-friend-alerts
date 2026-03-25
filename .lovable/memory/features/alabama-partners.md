Alabama Partners table and CSV import system for bulk-loading AL organizations.

## Table: alabama_partners
- Fields: name, type, county, email, phone, website
- Types: rescue, vet, shelter, hospital, animal control, foster group, rural partner
- RLS: public read, admin-only insert/update/delete

## Edge Function: notify-alabama-partners
- Triggered from ReportLostPage when address contains "alabama", ", al", or AL zip
- Queries all partners with email, logs alert

## Route: /alabama-partners
- CSV import (admin only), search, type filter, delete
