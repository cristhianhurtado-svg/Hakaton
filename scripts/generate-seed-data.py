#!/usr/bin/env python3
"""
============================================================
Conecta 2.0 — Seed Data Generator (Python + Faker)
Genera data dummy relacional para todos los módulos.

Contexto: Colombia (COP, NIT, CC, placas ABC-123)
PII: Cero datos reales
Edge Cases: ~20% datos con errores/estados anómalos

Uso:
  pip install faker
  python generate-seed-data.py

Output: db.json (listo para JSON Server o importación)
============================================================
"""

import json
import uuid
import random
from datetime import datetime, timedelta
from typing import Any

try:
    from faker import Faker
    fake = Faker('es_CO')
except ImportError:
    print("Instalando Faker...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'faker'])
    from faker import Faker
    fake = Faker('es_CO')

# ─── Helpers ─────────────────────────────────────────────────

def uid() -> str:
    return str(uuid.uuid4())

def pick(arr: list) -> Any:
    return random.choice(arr)

def random_cop(min_v: int, max_v: int) -> int:
    return round(random.randint(min_v, max_v) / 1000) * 1000

def random_plate() -> str:
    letters = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=3))
    return f"{letters}-{random.randint(100, 999)}"

def random_nit() -> str:
    return f"{random.randint(800, 999)}{random.randint(100000, 999999)}-{random.randint(0, 9)}"

def days_ago(d: int) -> str:
    return (datetime.now() - timedelta(days=d)).isoformat()

def days_from_now(d: int) -> str:
    return (datetime.now() + timedelta(days=d)).isoformat()

def hours_ago(h: int) -> str:
    return (datetime.now() - timedelta(hours=h)).isoformat()

# ─── Constants ───────────────────────────────────────────────

COMPANIES = [
    {"name": "Finaktiva S.A.S.", "type": "fintech"},
    {"name": "RappiPay Colombia", "type": "fintech"},
    {"name": "Addi Financial", "type": "fintech"},
    {"name": "Bold Pagos S.A.S.", "type": "fintech"},
    {"name": "Nequi (Bancolombia)", "type": "banco"},
    {"name": "Banco Davivienda S.A.", "type": "banco"},
    {"name": "Scotiabank Colpatria", "type": "banco"},
    {"name": "BBVA Colombia", "type": "banco"},
    {"name": "Banco de Bogota", "type": "banco"},
    {"name": "Lulo Bank S.A.", "type": "banco"},
    {"name": "Tyba Inversiones", "type": "fintech"},
    {"name": "Tributi S.A.S.", "type": "fintech"},
    {"name": "Habi Proptech", "type": "fintech"},
    {"name": "Tpaga S.A.S.", "type": "fintech"},
    {"name": "Autogermana Concesionario", "type": "concesionario"},
    {"name": "Casa Britanica Autos", "type": "concesionario"},
    {"name": "Derco Colombia S.A.", "type": "concesionario"},
    {"name": "Suramericana de Seguros", "type": "broker"},
    {"name": "Marsh McLennan Colombia", "type": "broker"},
    {"name": "AON Risk Solutions", "type": "broker"},
    {"name": "Willis Towers Watson CO", "type": "broker"},
    {"name": "Fasecolda Gremio", "type": "broker"},
    {"name": "MiPaquete.com S.A.S.", "type": "fintech"},
    {"name": "Siigo Nube S.A.S.", "type": "fintech"},
    {"name": "Alegra Software", "type": "fintech"},
]

CITIES = ["Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena",
          "Bucaramanga", "Pereira", "Manizales", "Santa Marta", "Ibague"]

CAR_BRANDS = ["Chevrolet Onix", "Renault Sandero", "Kia Picanto", "Mazda CX-5",
              "Toyota Corolla", "Nissan Versa", "Hyundai Tucson", "Suzuki Swift",
              "Ford Escape", "Volkswagen Gol", "BMW X3", "Mercedes-Benz GLC"]

PRODUCTS = [
    {"name": "Seguro de Autos", "ramo": "autos", "min_prima": 800000, "max_prima": 4500000, "min_cov": 30000000, "max_cov": 250000000},
    {"name": "Seguro de Vida", "ramo": "vida", "min_prima": 45000, "max_prima": 850000, "min_cov": 50000000, "max_cov": 500000000},
    {"name": "Seguro de Salud", "ramo": "salud", "min_prima": 41500, "max_prima": 650000, "min_cov": 100000000, "max_cov": 1000000000},
    {"name": "Seguro de Hogar", "ramo": "hogar", "min_prima": 35000, "max_prima": 280000, "min_cov": 80000000, "max_cov": 400000000},
]

CLAIM_TYPES = {
    "autos": ["Colision", "Robo total", "Dano por granizo", "Robo de accesorios", "Perdida total"],
    "vida": ["Fallecimiento", "Incapacidad permanente", "Enfermedad grave"],
    "salud": ["Hospitalizacion", "Cirugia programada", "Urgencia medica", "Tratamiento ambulatorio"],
    "hogar": ["Incendio", "Inundacion", "Robo", "Dano por terremoto"],
}

API_CATALOG = [
    {"name": "Cotizacion Autos", "slug": "cotizacion-autos", "category": "Cotizacion", "acord": True},
    {"name": "Cotizacion Vida", "slug": "cotizacion-vida", "category": "Cotizacion", "acord": True},
    {"name": "Cotizacion Salud", "slug": "cotizacion-salud", "category": "Cotizacion", "acord": False},
    {"name": "Emision Polizas", "slug": "emision-polizas", "category": "Emision", "acord": True},
    {"name": "Consulta Polizas", "slug": "consulta-polizas", "category": "Consultas", "acord": False},
    {"name": "Reporte Siniestros", "slug": "reporte-siniestros", "category": "Siniestros", "acord": True},
    {"name": "Recaudo Primas", "slug": "recaudo-primas", "category": "Recaudo", "acord": False},
    {"name": "SOAT Digital", "slug": "soat-digital", "category": "Emision", "acord": False},
    {"name": "Autenticacion OAuth", "slug": "autenticacion-oauth", "category": "Autenticacion", "acord": False},
    {"name": "Notificaciones Push", "slug": "notificaciones-push", "category": "Notificaciones", "acord": False},
]

# ─── Generate ────────────────────────────────────────────────

def generate():
    db = {
        "partners": [],
        "applications": [],
        "credentials": [],
        "api_definitions": [],
        "api_versions": [],
        "audit_logs": [],
        "admin_audit": [],
        "notifications": [],
        "quotes": [],
        "policies": [],
        "claims": [],
    }

    # 1. Partners (25)
    used = set()
    for i in range(25):
        idx = random.randint(0, len(COMPANIES) - 1)
        while idx in used:
            idx = random.randint(0, len(COMPANIES) - 1)
        used.add(idx)

        co = COMPANIES[idx]
        is_edge = i >= 20
        partner_id = uid()
        slug = co["name"].lower().replace(" ", "").replace(".", "")[:12]
        status = pick(["suspended", "revoked"]) if is_edge else random.choices(["active", "pending"], weights=[85, 15])[0]
        profile = "corporativo" if co["type"] in ("banco", "broker") else "agil"

        partner = {
            "id": partner_id,
            "company_name": co["name"],
            "email": f"api-{slug}@{slug}.com.co",
            "profile_type": profile,
            "status": status,
            "nit": random_nit(),
            "sector": co["type"],
            "city": pick(CITIES),
            "quota_monthly": 15000 if profile == "corporativo" else 10000,
            "quota_used": random.randint(0, 15000) if status == "active" else 0,
            "created_at": days_ago(random.randint(30, 365)),
        }
        db["partners"].append(partner)

        # Apps & Credentials
        if status in ("active", "pending"):
            for a in range(random.randint(1, 3)):
                app_id = uid()
                env = "sandbox" if a == 0 else pick(["sandbox", "production"])
                app = {
                    "id": app_id,
                    "partner_id": partner_id,
                    "name": f"{co['name'].split()[0]}-App-{env.capitalize()}-{a+1}",
                    "environment": env,
                    "status": "suspended" if is_edge else "active",
                    "created_at": days_ago(random.randint(10, 200)),
                }
                db["applications"].append(app)

                cred = {
                    "id": uid(),
                    "partner_id": partner_id,
                    "application_id": app_id,
                    "credential_type": "mtls" if profile == "corporativo" and env == "production" else "oauth2",
                    "client_id": f"cli_{uid().replace('-', '')[:24]}",
                    "client_secret": "***ofuscado***",
                    "status": pick(["revoked", "expired"]) if is_edge else random.choices(["active", "rotated"], weights=[80, 20])[0],
                    "expires_at": days_ago(random.randint(1, 30)) if is_edge else days_from_now(random.randint(30, 365)),
                    "created_at": days_ago(random.randint(10, 200)),
                }
                db["credentials"].append(cred)

    # 2. API Catalog & Versions
    for api in API_CATALOG:
        api_id = uid()
        db["api_definitions"].append({
            "id": api_id,
            "name": api["name"],
            "slug": api["slug"],
            "category": api["category"],
            "acord_compatible": api["acord"],
            "profile_support": "both",
            "created_at": days_ago(random.randint(90, 400)),
        })
        for v in range(random.randint(2, 4)):
            status = ["sunset", "deprecated", "active", "staging"][min(v, 3)]
            db["api_versions"].append({
                "id": uid(),
                "api_definition_id": api_id,
                "version_number": f"{max(1,v)}.{random.randint(0,5)}.0",
                "lifecycle_status": status,
                "published_at": days_ago(random.randint(5, 60)) if status == "active" else None,
                "created_at": days_ago(random.randint(30, 400)),
            })

    # 3. Audit Logs (500 — analytics)
    active_partners = [p for p in db["partners"] if p["status"] == "active"]
    endpoints = [f"/v1/api/{a['slug']}" for a in API_CATALOG]
    for i in range(500):
        partner = pick(active_partners) if active_partners else pick(db["partners"])
        is_edge = i >= 400
        status_code = pick([429, 500, 502, 503, 401]) if is_edge else random.choices(
            [200, 201, 400, 401, 404, 429, 500], weights=[60, 15, 5, 5, 3, 7, 5]
        )[0]
        latency = random.randint(500, 15000) if is_edge else (
            random.randint(100, 5000) if status_code >= 500 else random.randint(5, 45)
        )
        db["audit_logs"].append({
            "id": i + 1,
            "partner_id": partner["id"],
            "api_endpoint": pick(endpoints),
            "http_method": pick(["GET", "POST", "PUT", "DELETE"]),
            "response_status": status_code,
            "response_time_ms": latency,
            "correlation_id": uid(),
            "created_at": hours_ago(random.randint(0, 168)),
        })

    # 4. Notifications (40)
    templates = [
        {"type": "maintenance", "subject": "Ventana de mantenimiento programada — Cotizacion Autos"},
        {"type": "deprecation", "subject": "API Cotizacion Vida v1.0 sera deprecada"},
        {"type": "credential_expiry", "subject": "Sus credenciales OAuth expiran en 7 dias"},
        {"type": "access_change", "subject": "Acceso a produccion aprobado"},
        {"type": "new_version", "subject": "Nueva version: Emision Polizas v3.0"},
        {"type": "credential_expiry", "subject": "Cuota mensual al 90% — considere aumento"},
    ]
    for i in range(40):
        t = pick(templates)
        db["notifications"].append({
            "id": uid(),
            "type": t["type"],
            "subject": t["subject"],
            "target_partner_ids": [p["id"] for p in random.sample(active_partners, min(3, len(active_partners)))],
            "status": random.choices(["delivered", "pending", "failed"], weights=[75, 15, 10])[0],
            "created_at": days_ago(random.randint(0, 60)),
        })

    # 5. Quotes (100)
    for i in range(100):
        product = pick(PRODUCTS)
        partner = pick(active_partners) if active_partners else pick(db["partners"])
        is_edge = i >= 80
        prima = random_cop(product["min_prima"], product["max_prima"])
        quote_id = uid()

        quote = {
            "id": quote_id,
            "quote_number": f"QT-2026-{str(i+1).zfill(5)}",
            "partner_id": partner["id"],
            "product_name": product["name"],
            "ramo": product["ramo"],
            "status": pick(["expired", "rejected"]) if is_edge else random.choices(["accepted", "pending"], weights=[60, 40])[0],
            "premium_monthly_cop": prima,
            "premium_annual_cop": prima * 12,
            "coverage_amount_cop": random_cop(product["min_cov"], product["max_cov"]),
            "currency": "COP",
            "valid_until": days_ago(random.randint(1, 30)) if is_edge else days_from_now(30),
            "insured": {
                "name": f"***{fake.name()[3:]}***",
                "document_type": pick(["CC", "CC", "CC", "CE", "NIT"]),
                "document_number": "***masked***",
                "city": pick(CITIES),
            },
            "vehicle": {
                "brand": pick(CAR_BRANDS),
                "year": random.randint(2018, 2026),
                "plate": random_plate(),
                "value_cop": random_cop(30000000, 250000000),
            } if product["ramo"] == "autos" else None,
            "rejection_reason": pick([
                "Riesgo fuera de apetito de suscripcion",
                "Documentacion incompleta",
                "Vehiculo con mas de 10 anos",
            ]) if is_edge else None,
            "created_at": days_ago(random.randint(0, 90)),
        }
        db["quotes"].append(quote)

    # 6. Policies (80 — from accepted quotes)
    accepted = [q for q in db["quotes"] if q["status"] == "accepted"]
    for i, quote in enumerate(accepted[:80]):
        is_edge = i >= 64
        policy_id = uid()
        status = pick(["cancelled", "suspended", "expired"]) if is_edge else "active"

        policy = {
            "id": policy_id,
            "policy_number": f"POL-2026-{str(i+1).zfill(6)}",
            "quote_id": quote["id"],
            "partner_id": quote["partner_id"],
            "product_name": quote["product_name"],
            "ramo": quote["ramo"],
            "status": status,
            "premium_monthly_cop": quote["premium_monthly_cop"],
            "coverage_amount_cop": quote["coverage_amount_cop"],
            "currency": "COP",
            "start_date": days_ago(random.randint(0, 365)),
            "end_date": days_ago(random.randint(1, 30)) if status == "expired" else days_from_now(365),
            "holder": quote["insured"],
            "vehicle": quote["vehicle"],
            "cancellation_reason": pick([
                "Solicitud del asegurado",
                "No pago de prima",
                "Fraude detectado",
            ]) if status == "cancelled" else None,
            "created_at": days_ago(random.randint(0, 365)),
        }
        db["policies"].append(policy)

    # 7. Claims (50 — from active policies)
    active_policies = [p for p in db["policies"] if p["status"] == "active"]
    for i in range(50):
        policy = pick(active_policies) if active_policies else pick(db["policies"])
        ramo = policy["ramo"]
        types = CLAIM_TYPES.get(ramo, ["Otro"])
        is_edge = i >= 40
        estimated = random_cop(500000, int(policy["coverage_amount_cop"] * 0.3))

        claim_status = pick(["rejected", "fraud_investigation"]) if is_edge else random.choices(
            ["in_process", "approved", "paid", "pending_docs"], weights=[30, 25, 25, 20]
        )[0]

        claim = {
            "id": uid(),
            "claim_number": f"CLM-2026-{str(i+1).zfill(5)}",
            "policy_id": policy["id"],
            "policy_number": policy["policy_number"],
            "partner_id": policy["partner_id"],
            "ramo": ramo,
            "claim_type": pick(types),
            "status": claim_status,
            "estimated_amount_cop": estimated,
            "approved_amount_cop": round(estimated * random.uniform(0.6, 1.0)) if claim_status == "paid" else None,
            "currency": "COP",
            "report_date": days_ago(random.randint(0, 60)),
            "incident_date": days_ago(random.randint(1, 90)),
            "incident_city": pick(CITIES),
            "description": "Caso bajo investigacion por posible fraude" if is_edge else f"{pick(types)} reportado en {pick(CITIES)}",
            "rejection_reason": pick([
                "Siniestro no cubierto por la poliza",
                "Documentacion fraudulenta detectada",
                "Poliza no vigente al momento del siniestro",
            ]) if claim_status == "rejected" else None,
            "created_at": days_ago(random.randint(0, 60)),
        }
        db["claims"].append(claim)

    return db


# ─── Main ────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Generando data dummy relacional para Conecta 2.0...")
    data = generate()

    # Summary
    for key, val in data.items():
        print(f"  {key}: {len(val)} registros")

    # Export
    with open("db.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)

    print(f"\nArchivo generado: db.json ({sum(len(v) for v in data.values())} registros totales)")

    # ─── Sample: Registro cruzado completo ─────────────────────
    print("\n" + "=" * 60)
    print("EJEMPLO: Registro relacional cruzado completo")
    print("=" * 60)

    # Find a partner -> quote -> policy -> claim chain
    sample_claim = next((c for c in data["claims"] if c["status"] == "paid"), data["claims"][0])
    sample_policy = next((p for p in data["policies"] if p["id"] == sample_claim["policy_id"]), None)
    sample_quote = next((q for q in data["quotes"] if sample_policy and q["id"] == sample_policy["quote_id"]), None)
    sample_partner = next((p for p in data["partners"] if p["id"] == sample_claim["partner_id"]), None)
    sample_cred = next((c for c in data["credentials"] if c["partner_id"] == sample_claim["partner_id"]), None)

    cross_ref = {
        "partner": sample_partner,
        "credential": sample_cred,
        "quote": sample_quote,
        "policy": sample_policy,
        "claim": sample_claim,
    }

    print(json.dumps(cross_ref, ensure_ascii=False, indent=2, default=str))
