-- =============================================================================
-- morganbarber.me — seed data
-- =============================================================================
-- Run AFTER supabase/schema.sql. Idempotent: re-running updates rows in place
-- rather than duplicating them.
--
--   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
--
-- Every row is inserted with published = true. Content authored later defaults
-- to published = false and stays invisible until you flip the flag, so drafts
-- are never exposed by accident.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- Blog posts
-- -----------------------------------------------------------------------------

insert into public.blog_posts (slug, title, summary, content, date, tag, published, reading_minutes)
values
(
  'advanced-persistent-threats-iot',
  'ADVANCED PERSISTENT THREATS IN INDUSTRIAL IoT',
  'Investigating the propagation vectors of the latest malware strains targeting SCADA systems and critical infrastructure.',
  'Industrial Internet of Things (IIoT) devices are becoming increasingly targeted by advanced persistent threats (APTs). This research explores the vulnerabilities inherent in legacy SCADA systems, which were designed decades before network connectivity was a design consideration.

Most SCADA deployments assume a trusted network. Protocols such as Modbus and DNP3 carry no authentication and no encryption: any host that can reach the bus can issue commands. Bridging that bus to a corporate network — usually for reporting convenience — converts a physically isolated control system into an internet-reachable one.

The propagation pattern is consistent across incidents. Initial access is rarely against the control system itself; it is against an engineering workstation, typically through a phishing payload or an unpatched remote-access tool. From there the attacker pivots laterally, maps the control network passively, and waits. Dwell times measured in months are normal.

Defensively, the highest-value control is segmentation that is actually enforced rather than assumed. A unidirectional gateway between the control network and the business network removes the return path an attacker needs. Where that is impractical, protocol-aware monitoring on the control segment at least turns a silent compromise into a detectable one.',
  '2026.01.16',
  'RESEARCH',
  true,
  6
),
(
  'zero-trust-architecture',
  'ZERO TRUST ARCHITECTURE: IMPLEMENTATION STRATEGIES',
  'A deep dive into transitioning legacy network perimeters to a modern Identity-Aware Proxy model.',
  'The perimeter is dead. With the rise of remote work and cloud services, the traditional castle-and-moat security model is no longer effective. Zero trust replaces "inside the network is trusted" with "every request is authenticated and authorised on its own merits".

The practical starting point is inventory, not technology. You cannot write per-request policy for services you have not enumerated. Most migrations stall here, because the inventory reveals undocumented east-west traffic that nobody owns.

From there the sequence that tends to work is: strong identity first (phishing-resistant MFA, no exceptions for administrators), then device posture, then an identity-aware proxy in front of one low-risk internal application. Proving the pattern on a single app builds the operational muscle — certificate rotation, policy review, break-glass access — before it is applied to anything critical.

The failure mode to watch for is a zero-trust proxy deployed in front of applications that still trust any authenticated caller. If the app behind the proxy has no internal authorisation, the proxy has moved the perimeter rather than removed it.',
  '2026.01.10',
  'ANALYSIS',
  true,
  7
),
(
  'automating-threat-intelligence-python',
  'AUTOMATING THREAT INTELLIGENCE WITH PYTHON',
  'Building a custom scraper to aggregate and analyze IOCs from multiple open-source feeds.',
  'Threat intelligence is key to proactive defense. In this guide, we build a Python tool that aggregates Indicators of Compromise (IOCs) from several open-source feeds and normalises them into a single queryable store.

The interesting engineering problem is not fetching the feeds — it is deduplication and decay. The same IP address appears in a dozen feeds with different confidence levels and different first-seen dates. Treating each occurrence as an independent signal inflates confidence in exactly the wrong direction.

A workable model assigns each indicator a score that decays over time and is boosted by independent corroboration, where "independent" means feeds that do not share an upstream source. Mapping that provenance graph is manual work, done once, and it is what separates a useful feed from a noisy one.

Finally, resist the urge to wire the output straight into a blocklist. Open-source feeds carry false positives, and an automated block on a CDN address range is an outage you caused yourself. Alert first, block after you have measured the false-positive rate for your own environment.',
  '2026.01.05',
  'TUTORIAL',
  true,
  5
)
on conflict (slug) do update set
  title           = excluded.title,
  summary         = excluded.summary,
  content         = excluded.content,
  date            = excluded.date,
  tag             = excluded.tag,
  published       = excluded.published,
  reading_minutes = excluded.reading_minutes;

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------

insert into public.projects (id, title, description, category, status, content, tags, link, published, sort_order)
values
(
  '01',
  'PROJECT ORION',
  'A network intrusion detection system built with Python and Scapy.',
  'NETWORK SECURITY',
  'COMPLETED',
  'Project Orion is a lightweight Network Intrusion Detection System (NIDS) designed to identify potential threats in real-time. Built using Python and the Scapy library, it monitors network traffic for suspicious patterns such as port scanning, SYN floods, and other common attack vectors. The system features a modular architecture allowing for easy addition of new detection rules and integrates with a simple dashboard for alert visualization.',
  array['PYTHON', 'SCAPY', 'NIDS', 'NETWORK SECURITY'],
  'https://github.com/morganbarber/project-orion',
  true,
  10
),
(
  '02',
  'SECURE CHAT',
  'End-to-end encrypted messaging application using Signal Protocol.',
  'CRYPTOGRAPHY',
  'IN PROGRESS',
  'Secure Chat is a privacy-focused messaging application that implements the Signal Protocol for true end-to-end encryption. It ensures that messages can only be read by the intended recipient. Features include persistent identity keys, forward secrecy, and a modern UI built with Next.js. Currently working on implementing group chat functionality and file sharing capabilities.',
  array['CRYPTOGRAPHY', 'NEXT.JS', 'SIGNAL PROTOCOL', 'PRIVACY'],
  'https://github.com/morganbarber/secure-chat',
  true,
  20
),
(
  '03',
  'VULNERABILITY SCANNER',
  'Automated tool for identifying common web application vulnerabilities.',
  'PENETRATION TESTING',
  'COMPLETED',
  'A custom automated vulnerability scanner designed to detect common web application security flaws such as SQL Injection, XSS, and CSRF. The tool crawls the target website, analyzes input vectors, and performs fuzzing to identify potential weaknesses. It generates detailed reports recommending remediation steps, making it a valuable tool for initial security assessments.',
  array['PYTHON', 'WEB SECURITY', 'PENETRATION TESTING', 'AUTOMATION'],
  'https://github.com/morganbarber/vuln-scanner',
  true,
  30
)
on conflict (id) do update set
  title       = excluded.title,
  description = excluded.description,
  category    = excluded.category,
  status      = excluded.status,
  content     = excluded.content,
  tags        = excluded.tags,
  link        = excluded.link,
  published   = excluded.published,
  sort_order  = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Certifications
-- -----------------------------------------------------------------------------
-- No natural key existed on this table, so a partial unique index on name makes
-- the insert below idempotent.

create unique index if not exists certifications_name_key on public.certifications (name);

insert into public.certifications (name, file_url, issuer, published, sort_order)
values
  ('CompTIA Security+',                               '/certifications/security-plus.pdf',                    'CompTIA',   true, 10),
  ('CompTIA Network+',                                '/certifications/network-plus.pdf',                     'CompTIA',   true, 20),
  ('CompTIA A+',                                      '/certifications/a-plus.pdf',                           'CompTIA',   true, 30),
  ('CompTIA IT Operations Specialist',                '/certifications/it-operations-specialist.pdf',         'CompTIA',   true, 40),
  ('CompTIA Secure Infrastructure Specialist',        '/certifications/secure-infrastructure-specialist.pdf', 'CompTIA',   true, 50),
  ('Microsoft Office Specialist (Word/PowerPoint)',   '/certifications/mos.pdf',                              'Microsoft', true, 60),
  ('PCEP - Certified Entry-Level Python Programmer',  '/certifications/pcep.pdf',                             'Python Institute', true, 70)
on conflict (name) do update set
  file_url   = excluded.file_url,
  issuer     = excluded.issuer,
  published  = excluded.published,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Experience
-- -----------------------------------------------------------------------------

create unique index if not exists experience_role_company_key on public.experience (role, company);

insert into public.experience (period, role, company, description, published, sort_order)
values
(
  '2024 - 2025',
  'STUDENT WORKER',
  'ST. VRAIN VALLEY SCHOOL DISTRICT',
  'Developed and maintained a computer vision based system for identifying fish and fish habitats in underwater footage.',
  true,
  10
)
on conflict (role, company) do update set
  period      = excluded.period,
  description = excluded.description,
  published   = excluded.published,
  sort_order  = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- Education
-- -----------------------------------------------------------------------------

create unique index if not exists education_degree_school_key on public.education (degree, school);

insert into public.education (degree, period, school, details, published, sort_order)
values
(
  'CYBERSECURITY PATHWAY',
  '2023 - 2026',
  'SVVSD INNOVATION CENTER',
  'Hands-on cybersecurity program covering network defense, system hardening, threat analysis and incident response, delivered alongside industry certification tracks.',
  true,
  10
),
(
  'HIGH SCHOOL DIPLOMA',
  '2022 - 2026',
  'ST. VRAIN VALLEY SCHOOL DISTRICT',
  'Concurrent enrollment coursework with a focus on computer science, mathematics and information technology.',
  true,
  20
)
on conflict (degree, school) do update set
  period     = excluded.period,
  details    = excluded.details,
  published  = excluded.published,
  sort_order = excluded.sort_order;

commit;
