-- Spark Match Sales Coaching setup
insert into public.communities (name)
values ('Spark Match Sales Coaching')
on conflict (name) do nothing;

with c as (select id from public.communities where name = 'Spark Match Sales Coaching' limit 1)
insert into public.community_taxonomy (community_id, offers, needs, rooms)
select c.id, '["Discovery calls", "Objection handling", "Closing conversations", "Consultative selling", "Cold outreach", "Follow-up systems", "CRM discipline", "Pipeline review", "Pricing confidence", "Sales messaging", "Lead qualification", "Demo practice", "Storytelling", "Negotiation", "Accountability", "Mindset and confidence", "Founder-led sales", "Referral strategy"]'::jsonb, '["More qualified leads", "Better discovery questions", "Handle price objections", "Improve closing rate", "Consistent follow-up", "Clearer offer", "Shorter sales cycle", "Better pitch", "Practice role-play", "Confidence on calls", "CRM habits", "Convert free consults", "Niche clarity", "More referrals", "Webinar conversion", "Sales scripts", "Accountability partner", "Premium package selling"]'::jsonb, '["Discovery Call Practice Studio", "Price Objection Role-Play", "Closing Confidence Circle", "Pipeline Accountability Caf\u00e9", "Cold Outreach Lab", "Follow-Up Sprint Room", "Offer Clarity Hot Seat", "Demo Practice Room", "Referral Strategy Table", "Founder Sales Circle"]'::jsonb
from c
where not exists (select 1 from public.community_taxonomy t where t.community_id = c.id);

with c as (select id from public.communities where name = 'Spark Match Sales Coaching' limit 1)
update public.community_taxonomy t
set offers = '["Discovery calls", "Objection handling", "Closing conversations", "Consultative selling", "Cold outreach", "Follow-up systems", "CRM discipline", "Pipeline review", "Pricing confidence", "Sales messaging", "Lead qualification", "Demo practice", "Storytelling", "Negotiation", "Accountability", "Mindset and confidence", "Founder-led sales", "Referral strategy"]'::jsonb,
    needs = '["More qualified leads", "Better discovery questions", "Handle price objections", "Improve closing rate", "Consistent follow-up", "Clearer offer", "Shorter sales cycle", "Better pitch", "Practice role-play", "Confidence on calls", "CRM habits", "Convert free consults", "Niche clarity", "More referrals", "Webinar conversion", "Sales scripts", "Accountability partner", "Premium package selling"]'::jsonb,
    rooms = '["Discovery Call Practice Studio", "Price Objection Role-Play", "Closing Confidence Circle", "Pipeline Accountability Caf\u00e9", "Cold Outreach Lab", "Follow-Up Sprint Room", "Offer Clarity Hot Seat", "Demo Practice Room", "Referral Strategy Table", "Founder Sales Circle"]'::jsonb
from c
where t.community_id = c.id;
