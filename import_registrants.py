"""
Import registrants from Excel spreadsheet into the NUP convention database.
Generates placeholder emails for those without one.
"""
import openpyxl
import unicodedata
import re
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

DATABASE_URL = "postgresql://postgres:YmB5+SmHZ.,ZxSx@db.bbnpmgayezxteqckfncc.supabase.co:5432/postgres"

# Look for the Excel file next to this script, or pass a path as argument
if len(sys.argv) > 1:
    EXCEL_PATH = sys.argv[1]
else:
    EXCEL_PATH = os.path.join(SCRIPT_DIR, "Registered Delegates.xlsx")

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)


def slugify(name):
    """Convert name to email-safe slug."""
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
    name = re.sub(r'[^\w\s-]', '', name).strip().lower()
    name = re.sub(r'[\s]+', '.', name)
    return name


def parse_registrants():
    wb = openpyxl.load_workbook(EXCEL_PATH)

    # Sheet -> (state, country) mapping
    sheet_map = {
        'DMV':       ('DC/MD/VA', 'USA'),
        'Boston':    ('Massachusetts', 'USA'),
        'Minnesota': ('Minnesota', 'USA'),
        'California':('California', 'USA'),
        'Others':    (None, None),   # country comes from col C
    }

    registrants = []

    for sheet_name, (default_state, default_country) in sheet_map.items():
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))

        for row in rows:
            name = row[0]
            if not name or not isinstance(name, str):
                continue
            name = name.strip()
            # Skip header rows
            if name.upper() in ('NAME', 'NAME ', 'CONVETION REGISTRATION', 'CONVENTION REGISTRATION'):
                continue
            if not name:
                continue

            amount = row[1] if len(row) > 1 else None
            boat_amount = row[2] if len(row) > 2 else None

            # Manual name fixes
            if name == 'Mrs.Joseph Kavuma':
                name = 'Mrs Kawuma'
            if name.strip() == 'Eric Mduduzi Simelane' and sheet_name == 'Others':
                # country will be set below; override None
                pass

            # For 'Others' sheet, col C is country
            if sheet_name == 'Others':
                country = row[2] if len(row) > 2 and isinstance(row[2], str) else 'Uganda'
                state = None
                boat_amount = None
            else:
                country = default_country
                state = default_state
                # boat_amount is col C (index 2)
                boat_amount = row[2] if len(row) > 2 and isinstance(row[2], (int, float)) else None

            # Parse name
            parts = name.strip().split()
            if len(parts) == 0:
                continue
            elif len(parts) == 1:
                first_name = parts[0]
                last_name = ''
            else:
                first_name = parts[0]
                last_name = ' '.join(parts[1:])

            # Handle "Mrs.Joseph Kavuma" style
            if first_name.lower().startswith('mrs.') or first_name.lower().startswith('mr.'):
                # Treat entire name as last name for uniqueness
                last_name = name
                first_name = parts[0]

            convention_paid = isinstance(amount, (int, float)) and amount > 0
            boat_cruise_paid = isinstance(boat_amount, (int, float)) and boat_amount > 0

            slug = slugify(name)
            email = f"{slug}@nup2026.placeholder"

            registrants.append({
                'first_name': first_name,
                'last_name': last_name,
                'email': email,
                'state': state,
                'country': country,
                'convention': convention_paid,
                'boat_cruise': boat_cruise_paid,
                'convention_amount': str(amount) if convention_paid else None,
                'boat_amount': str(boat_amount) if boat_cruise_paid else None,
                'notes': f'Imported from {sheet_name} spreadsheet. Placeholder email — update with real email.',
            })

    return registrants


def import_to_db(registrants):
    session = Session()
    added = []
    skipped = []

    try:
        for r in registrants:
            # Check if already exists by email
            existing = session.execute(
                text("SELECT id FROM registrants WHERE email = :email"),
                {'email': r['email']}
            ).fetchone()

            if existing:
                skipped.append(r['email'])
                continue

            # Insert registrant
            result = session.execute(text("""
                INSERT INTO registrants
                    (first_name, last_name, email, state, country, convention, boat_cruise,
                     checked_in, boat_cruise_checked_in, age_group, entered_by, notes)
                VALUES
                    (:first_name, :last_name, :email, :state, :country, :convention, :boat_cruise,
                     false, false, 'adult', 'bulk_import', :notes)
                RETURNING id
            """), {
                'first_name': r['first_name'],
                'last_name': r['last_name'],
                'email': r['email'],
                'state': r['state'],
                'country': r['country'],
                'convention': r['convention'],
                'boat_cruise': r['boat_cruise'],
                'notes': r['notes'],
            })
            reg_id = result.fetchone()[0]

            # Insert payments
            if r['convention_amount']:
                session.execute(text("""
                    INSERT INTO payments (registrant_id, product_type, amount, notes)
                    VALUES (:reg_id, 'convention', :amount, 'Imported from spreadsheet')
                """), {'reg_id': reg_id, 'amount': r['convention_amount']})

            if r['boat_amount']:
                session.execute(text("""
                    INSERT INTO payments (registrant_id, product_type, amount, notes)
                    VALUES (:reg_id, 'boat_cruise', :amount, 'Imported from spreadsheet')
                """), {'reg_id': reg_id, 'amount': r['boat_amount']})

            added.append(f"{r['first_name']} {r['last_name']} ({r['email']})")

        session.commit()
        print(f"\n✅ Added {len(added)} registrants:")
        for a in added:
            print(f"   + {a}")

        if skipped:
            print(f"\n⚠️  Skipped {len(skipped)} (already in DB):")
            for s in skipped:
                print(f"   - {s}")

    except Exception as e:
        session.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        session.close()


if __name__ == '__main__':
    registrants = parse_registrants()
    print(f"Found {len(registrants)} registrants to import:")
    for r in registrants:
        boat = "🚢" if r['boat_cruise'] else "  "
        print(f"  {boat} {r['first_name']} {r['last_name']} | {r['state'] or r['country'] or 'International'} | ${r['convention_amount'] or 0}")

    print("\nImporting...")
    import_to_db(registrants)
