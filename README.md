# Spark Match | Sales Coaching Community

English version of the Sparkco matching app for a sales coaching community.

Includes:
- Product name changed from Braindates to Spark Match
- English interface
- Sales coaching default taxonomy
- Separate Supabase community: `Spark Match Sales Coaching`
- Profile photos saved to Supabase Storage
- Additional save button at the bottom of the profile form

Setup:
1. Run `supabase_spark_match_sales_setup.sql` in Supabase SQL Editor.
2. If profile photo storage was not already set up, run `supabase_storage_setup.sql`.
3. Upload the files to GitHub Pages.
4. Open with a cache buster, for example `?v=sales1`.

Important:
This is still an MVP. Current RLS policies are permissive for testing. Before using with real users and real contact details, add Supabase Auth and stricter row-level policies.
