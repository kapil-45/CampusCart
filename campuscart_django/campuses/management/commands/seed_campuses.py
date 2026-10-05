"""
Management command: seed_campuses

Seeds the Campus table with a curated list of ~200 well-known Indian colleges
and universities grouped by state.  Run once after migrations:

    python manage.py seed_campuses

To wipe and re-seed, pass --reset:

    python manage.py seed_campuses --reset
"""

from django.core.management.base import BaseCommand
from campuses.models import Campus

# ---------------------------------------------------------------------------
# Seed data  (name, city, state, aicte_id)
# aicte_id is None for institutions that are not under AICTE
# (deemed/central universities, IITs, IIMs, etc.)
# ---------------------------------------------------------------------------
CAMPUSES = [
    # ── DELHI / NCR ──────────────────────────────────────────────────────
    ("University of Delhi", "New Delhi", "Delhi", None),
    ("Jawaharlal Nehru University", "New Delhi", "Delhi", None),
    ("Jamia Millia Islamia", "New Delhi", "Delhi", None),
    ("Delhi Technological University", "New Delhi", "Delhi", "1-354761"),
    ("Indraprastha Institute of Information Technology", "New Delhi", "Delhi", None),
    ("Netaji Subhas University of Technology", "New Delhi", "Delhi", None),
    ("Guru Gobind Singh Indraprastha University", "New Delhi", "Delhi", None),
    ("Lady Shri Ram College", "New Delhi", "Delhi", None),
    ("Miranda House", "New Delhi", "Delhi", None),
    ("St. Stephen's College", "New Delhi", "Delhi", None),
    ("Hansraj College", "New Delhi", "Delhi", None),
    ("Kirori Mal College", "New Delhi", "Delhi", None),
    ("IIT Delhi", "New Delhi", "Delhi", None),
    ("IIM Delhi (FMS)", "New Delhi", "Delhi", None),
    ("Amity University Noida", "Noida", "Uttar Pradesh", "1-2571"),
    ("Shiv Nadar University", "Greater Noida", "Uttar Pradesh", None),
    ("Bennett University", "Greater Noida", "Uttar Pradesh", None),
    ("Galgotias University", "Greater Noida", "Uttar Pradesh", "1-12819"),
    ("Ashoka University", "Sonepat", "Haryana", None),
    ("OP Jindal Global University", "Sonepat", "Haryana", None),
    ("SRM University Haryana", "Sonepat", "Haryana", None),
    ("World University of Design", "Sonepat", "Haryana", None),
    ("Amity University Gurugram", "Gurugram", "Haryana", None),
    ("Manav Rachna International Institute", "Faridabad", "Haryana", None),
    ("Chitkara University Himachal Pradesh", "Baddi", "Himachal Pradesh", None),

    # ── HARYANA ──────────────────────────────────────────────────────────
    ("Kurukshetra University", "Kurukshetra", "Haryana", None),
    ("Maharshi Dayanand University", "Rohtak", "Haryana", None),
    ("Guru Jambheshwar University of Science and Technology", "Hisar", "Haryana", None),
    ("National Institute of Technology Kurukshetra", "Kurukshetra", "Haryana", None),
    ("Deenbandhu Chhotu Ram University of Science and Technology", "Murthal", "Haryana", None),

    # ── MAHARASHTRA ──────────────────────────────────────────────────────
    ("IIT Bombay", "Mumbai", "Maharashtra", None),
    ("University of Mumbai", "Mumbai", "Maharashtra", None),
    ("TATA Institute of Social Sciences", "Mumbai", "Maharashtra", None),
    ("VJTI Mumbai", "Mumbai", "Maharashtra", None),
    ("K.J. Somaiya College of Engineering", "Mumbai", "Maharashtra", None),
    ("Sardar Patel Institute of Technology", "Mumbai", "Maharashtra", "1-21619"),
    ("Fr. Conceicao Rodrigues College of Engineering", "Mumbai", "Maharashtra", None),
    ("Dwarkadas J. Sanghvi College of Engineering", "Mumbai", "Maharashtra", None),
    ("Thadomal Shahani Engineering College", "Mumbai", "Maharashtra", None),
    ("St. Xavier's College Mumbai", "Mumbai", "Maharashtra", None),
    ("Mithibai College", "Mumbai", "Maharashtra", None),
    ("Jai Hind College", "Mumbai", "Maharashtra", None),
    ("Wilson College", "Mumbai", "Maharashtra", None),
    ("Sydenham College of Commerce and Economics", "Mumbai", "Maharashtra", None),
    ("Narsee Monjee Institute of Management Studies", "Mumbai", "Maharashtra", None),
    ("SP Jain School of Global Management", "Mumbai", "Maharashtra", None),
    ("IIT Bombay - Powai Campus", "Mumbai", "Maharashtra", None),
    ("College of Engineering Pune", "Pune", "Maharashtra", None),
    ("Symbiosis International University", "Pune", "Maharashtra", None),
    ("Savitribai Phule Pune University", "Pune", "Maharashtra", None),
    ("MIT College of Engineering Pune", "Pune", "Maharashtra", None),
    ("VIT Pune", "Pune", "Maharashtra", None),
    ("PICT Pune", "Pune", "Maharashtra", None),
    ("Zeal College of Engineering and Research", "Pune", "Maharashtra", None),
    ("Dr. DY Patil University", "Pune", "Maharashtra", None),
    ("Bharati Vidyapeeth University", "Pune", "Maharashtra", None),
    ("Fergusson College", "Pune", "Maharashtra", None),
    ("IIM Nagpur", "Nagpur", "Maharashtra", None),
    ("VNIT Nagpur", "Nagpur", "Maharashtra", None),
    ("Shri Ramdeobaba College of Engineering", "Nagpur", "Maharashtra", None),
    ("RTM Nagpur University", "Nagpur", "Maharashtra", None),

    # ── KARNATAKA ────────────────────────────────────────────────────────
    ("IISc Bangalore", "Bengaluru", "Karnataka", None),
    ("IIT Dharwad", "Dharwad", "Karnataka", None),
    ("NIT Karnataka Surathkal", "Mangaluru", "Karnataka", None),
    ("BITS Pilani - Goa Campus", "Sancoale", "Goa", None),
    ("RV College of Engineering", "Bengaluru", "Karnataka", None),
    ("BMS College of Engineering", "Bengaluru", "Karnataka", None),
    ("PES University", "Bengaluru", "Karnataka", None),
    ("MS Ramaiah Institute of Technology", "Bengaluru", "Karnataka", None),
    ("Visvesvaraya Technological University", "Belagavi", "Karnataka", None),
    ("Manipal Academy of Higher Education", "Manipal", "Karnataka", None),
    ("Christ University", "Bengaluru", "Karnataka", None),
    ("Jain University", "Bengaluru", "Karnataka", None),
    ("Bangalore University", "Bengaluru", "Karnataka", None),
    ("Dayananda Sagar College of Engineering", "Bengaluru", "Karnataka", None),
    ("Reva University", "Bengaluru", "Karnataka", None),
    ("NMAM Institute of Technology", "Nitte", "Karnataka", None),
    ("Siddaganga Institute of Technology", "Tumkur", "Karnataka", None),

    # ── TAMIL NADU ───────────────────────────────────────────────────────
    ("IIT Madras", "Chennai", "Tamil Nadu", None),
    ("Anna University", "Chennai", "Tamil Nadu", None),
    ("Madras Institute of Technology", "Chennai", "Tamil Nadu", None),
    ("SRM Institute of Science and Technology", "Chennai", "Tamil Nadu", None),
    ("Vellore Institute of Technology", "Vellore", "Tamil Nadu", None),
    ("NIT Trichy", "Tiruchirappalli", "Tamil Nadu", None),
    ("PSG College of Technology", "Coimbatore", "Tamil Nadu", None),
    ("Amrita Vishwa Vidyapeetham", "Coimbatore", "Tamil Nadu", None),
    ("Coimbatore Institute of Technology", "Coimbatore", "Tamil Nadu", None),
    ("Kongu Engineering College", "Erode", "Tamil Nadu", None),
    ("Thiagarajar College of Engineering", "Madurai", "Tamil Nadu", None),
    ("Madurai Kamaraj University", "Madurai", "Tamil Nadu", None),
    ("Sastra University", "Thanjavur", "Tamil Nadu", None),
    ("BITS Pilani Hyderabad Campus", "Hyderabad", "Telangana", None),

    # ── TELANGANA / ANDHRA PRADESH ───────────────────────────────────────
    ("IIT Hyderabad", "Hyderabad", "Telangana", None),
    ("University of Hyderabad", "Hyderabad", "Telangana", None),
    ("Osmania University", "Hyderabad", "Telangana", None),
    ("JNTU Hyderabad", "Hyderabad", "Telangana", None),
    ("Chaitanya Bharathi Institute of Technology", "Hyderabad", "Telangana", None),
    ("Vasavi College of Engineering", "Hyderabad", "Telangana", None),
    ("Muffakham Jah College of Engineering and Technology", "Hyderabad", "Telangana", None),
    ("NIT Warangal", "Warangal", "Telangana", None),
    ("Kakatiya University", "Warangal", "Telangana", None),
    ("SRM University AP", "Amaravati", "Andhra Pradesh", None),
    ("Andhra University", "Visakhapatnam", "Andhra Pradesh", None),
    ("GITAM University", "Visakhapatnam", "Andhra Pradesh", None),
    ("KL University", "Guntur", "Andhra Pradesh", None),
    ("Vignan's Foundation for Science Technology and Research", "Guntur", "Andhra Pradesh", None),

    # ── WEST BENGAL ──────────────────────────────────────────────────────
    ("IIT Kharagpur", "Kharagpur", "West Bengal", None),
    ("Jadavpur University", "Kolkata", "West Bengal", None),
    ("Calcutta University", "Kolkata", "West Bengal", None),
    ("Presidency University", "Kolkata", "West Bengal", None),
    ("Netaji Subhas Engineering College", "Kolkata", "West Bengal", None),
    ("Heritage Institute of Technology", "Kolkata", "West Bengal", None),
    ("Techno India University", "Kolkata", "West Bengal", None),
    ("Institute of Engineering and Management", "Kolkata", "West Bengal", None),
    ("St. Xavier's College Kolkata", "Kolkata", "West Bengal", None),
    ("Scottish Church College", "Kolkata", "West Bengal", None),

    # ── GUJARAT ──────────────────────────────────────────────────────────
    ("IIT Gandhinagar", "Gandhinagar", "Gujarat", None),
    ("Nirma University", "Ahmedabad", "Gujarat", None),
    ("CEPT University", "Ahmedabad", "Gujarat", None),
    ("Dhirubhai Ambani Institute of Information and Communication Technology", "Gandhinagar", "Gujarat", None),
    ("Gujarat Technological University", "Ahmedabad", "Gujarat", None),
    ("LD College of Engineering", "Ahmedabad", "Gujarat", None),
    ("Nirma Institute of Technology", "Ahmedabad", "Gujarat", None),
    ("Sardar Vallabhbhai National Institute of Technology", "Surat", "Gujarat", None),
    ("Charotar University of Science and Technology", "Anand", "Gujarat", None),
    ("Pandit Deendayal Energy University", "Gandhinagar", "Gujarat", None),

    # ── RAJASTHAN ────────────────────────────────────────────────────────
    ("BITS Pilani", "Pilani", "Rajasthan", None),
    ("IIT Jodhpur", "Jodhpur", "Rajasthan", None),
    ("MNIT Jaipur", "Jaipur", "Rajasthan", None),
    ("University of Rajasthan", "Jaipur", "Rajasthan", None),
    ("Manipal University Jaipur", "Jaipur", "Rajasthan", None),
    ("Banasthali Vidyapith", "Tonk", "Rajasthan", None),
    ("LNM Institute of Information Technology", "Jaipur", "Rajasthan", None),
    ("Malaviya National Institute of Technology", "Jaipur", "Rajasthan", None),
    ("Vivekananda Global University", "Jaipur", "Rajasthan", None),

    # ── MADHYA PRADESH ───────────────────────────────────────────────────
    ("IIT Indore", "Indore", "Madhya Pradesh", None),
    ("IIM Indore", "Indore", "Madhya Pradesh", None),
    ("Devi Ahilya Vishwavidyalaya", "Indore", "Madhya Pradesh", None),
    ("Symbiosis Institute of Technology", "Indore", "Madhya Pradesh", None),
    ("SAGE University", "Indore", "Madhya Pradesh", None),
    ("RGPV Bhopal", "Bhopal", "Madhya Pradesh", None),
    ("IIT Bhopal", "Bhopal", "Madhya Pradesh", None),
    ("MANIT Bhopal", "Bhopal", "Madhya Pradesh", None),
    ("Barkatullah University", "Bhopal", "Madhya Pradesh", None),

    # ── UTTAR PRADESH ────────────────────────────────────────────────────
    ("IIT Kanpur", "Kanpur", "Uttar Pradesh", None),
    ("IIT BHU Varanasi", "Varanasi", "Uttar Pradesh", None),
    ("IIM Lucknow", "Lucknow", "Uttar Pradesh", None),
    ("University of Lucknow", "Lucknow", "Uttar Pradesh", None),
    ("AKTU Lucknow", "Lucknow", "Uttar Pradesh", None),
    ("Harcourt Butler Technical University", "Kanpur", "Uttar Pradesh", None),
    ("MNNIT Allahabad", "Prayagraj", "Uttar Pradesh", None),
    ("Allahabad University", "Prayagraj", "Uttar Pradesh", None),
    ("Babu Banarasi Das University", "Lucknow", "Uttar Pradesh", None),
    ("Integral University", "Lucknow", "Uttar Pradesh", None),

    # ── BIHAR / JHARKHAND ────────────────────────────────────────────────
    ("IIT Patna", "Patna", "Bihar", None),
    ("Patna University", "Patna", "Bihar", None),
    ("NIT Patna", "Patna", "Bihar", None),
    ("IIT (ISM) Dhanbad", "Dhanbad", "Jharkhand", None),
    ("NIT Jamshedpur", "Jamshedpur", "Jharkhand", None),
    ("Birla Institute of Technology Mesra", "Ranchi", "Jharkhand", None),
    ("Ranchi University", "Ranchi", "Jharkhand", None),

    # ── ODISHA ───────────────────────────────────────────────────────────
    ("IIT Bhubaneswar", "Bhubaneswar", "Odisha", None),
    ("NIT Rourkela", "Rourkela", "Odisha", None),
    ("KIIT University", "Bhubaneswar", "Odisha", None),
    ("Utkal University", "Bhubaneswar", "Odisha", None),
    ("Siksha O Anusandhan University", "Bhubaneswar", "Odisha", None),

    # ── PUNJAB ───────────────────────────────────────────────────────────
    ("IIT Ropar", "Ropar", "Punjab", None),
    ("NIT Jalandhar", "Jalandhar", "Punjab", None),
    ("Thapar Institute of Engineering and Technology", "Patiala", "Punjab", None),
    ("Punjab University", "Chandigarh", "Punjab", None),
    ("Panjab University Chandigarh", "Chandigarh", "Punjab", None),
    ("Lovely Professional University", "Phagwara", "Punjab", None),
    ("Chandigarh University", "Mohali", "Punjab", None),
    ("Guru Nanak Dev University", "Amritsar", "Punjab", None),
    ("Punjab Agricultural University", "Ludhiana", "Punjab", None),

    # ── HIMACHAL PRADESH / J&K ───────────────────────────────────────────
    ("IIT Mandi", "Mandi", "Himachal Pradesh", None),
    ("Shoolini University", "Solan", "Himachal Pradesh", None),
    ("Himachal Pradesh University", "Shimla", "Himachal Pradesh", None),
    ("NIT Hamirpur", "Hamirpur", "Himachal Pradesh", None),
    ("IIT Jammu", "Jammu", "Jammu & Kashmir", None),
    ("NIT Srinagar", "Srinagar", "Jammu & Kashmir", None),
    ("University of Jammu", "Jammu", "Jammu & Kashmir", None),

    # ── NORTH-EAST ───────────────────────────────────────────────────────
    ("IIT Guwahati", "Guwahati", "Assam", None),
    ("Tezpur University", "Tezpur", "Assam", None),
    ("Gauhati University", "Guwahati", "Assam", None),
    ("NIT Silchar", "Silchar", "Assam", None),
    ("NIT Meghalaya", "Shillong", "Meghalaya", None),
    ("NERIST Arunachal Pradesh", "Itanagar", "Arunachal Pradesh", None),
    ("NIT Manipur", "Imphal", "Manipur", None),
    ("NIT Nagaland", "Dimapur", "Nagaland", None),
    ("NIT Mizoram", "Aizawl", "Mizoram", None),
    ("NIT Tripura", "Agartala", "Tripura", None),
    ("Sikkim Manipal University", "Gangtok", "Sikkim", None),

    # ── KERALA ───────────────────────────────────────────────────────────
    ("IIT Palakkad", "Palakkad", "Kerala", None),
    ("NIT Calicut", "Kozhikode", "Kerala", None),
    ("Kerala University", "Thiruvananthapuram", "Kerala", None),
    ("TKM College of Engineering", "Kollam", "Kerala", None),
    ("College of Engineering Thiruvananthapuram", "Thiruvananthapuram", "Kerala", None),
    ("Model Engineering College", "Kochi", "Kerala", None),
    ("Cochin University of Science and Technology", "Kochi", "Kerala", None),
    ("MES College of Engineering", "Kochi", "Kerala", None),
    ("Rajagiri School of Engineering and Technology", "Kochi", "Kerala", None),

    # ── GOA ──────────────────────────────────────────────────────────────
    ("NIT Goa", "Ponda", "Goa", None),
    ("Goa University", "Panaji", "Goa", None),
    ("Padre Conceicao College of Engineering", "Verna", "Goa", None),
]


class Command(BaseCommand):
    help = "Seed the Campus table with curated Indian colleges and universities."

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all existing campuses before seeding.',
        )

    def handle(self, *args, **options):
        if options['reset']:
            deleted, _ = Campus.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing campuses.'))

        created = 0
        skipped = 0
        for name, city, state, aicte_id in CAMPUSES:
            obj, was_created = Campus.objects.get_or_create(
                name=name,
                defaults={
                    'city': city,
                    'state': state,
                    'country': 'India',
                    'aicte_id': aicte_id,
                    'is_active': True,
                }
            )
            if was_created:
                created += 1
            else:
                skipped += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Created: {created}  |  Already existed (skipped): {skipped}'
            )
        )
