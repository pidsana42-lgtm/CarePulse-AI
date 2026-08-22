from typing import Any, Dict, List

from app.services.data_loader import data_loader

# occupation_status (assessment input) -> scheme key used in hospitals.jsonl
OCCUPATION_TO_SCHEME = {
    "gov_employee": "csmb",
    "private_employee": "sss",
    "sso_m33": "sss",
    "sso_m39": "sss",
}
DEFAULT_SCHEME = "uc_gold_card"


def resolve_scheme_key(occupation_status: str) -> str:
    return OCCUPATION_TO_SCHEME.get(occupation_status, DEFAULT_SCHEME)


def _hospitals_for_scheme(scheme_key: str, province: str) -> List[Dict[str, Any]]:
    in_province = [
        h for h in data_loader.find_hospitals_by_province(province)
        if scheme_key in h.get("schemes", [])
    ]
    if in_province:
        return in_province
    # No registered hospital in the citizen's own province for this scheme —
    # fall back to the nationwide network so the estimate still reflects real data.
    return [h for h in data_loader.get_all_hospitals() if scheme_key in h.get("schemes", [])]


def compute_cost_planning(
    registered_province: str,
    occupation_status: str,
    extra_equipment_count: int,
    participating_agencies: List[str],
) -> Dict[str, Any]:
    """
    Grounds the cost estimate in hospitals.jsonl instead of a static hardcoded range:
    looks up which registered hospitals cover the citizen's scheme, and whether
    that hospital charges a copay override (private hospitals under UC gold card).
    """
    scheme_key = resolve_scheme_key(occupation_status)
    matched = _hospitals_for_scheme(scheme_key, registered_province)

    free_hospitals: List[str] = []
    copay_hospitals: List[Dict[str, Any]] = []
    for h in matched:
        override = h.get("copay_overrides", {}).get(scheme_key)
        if override:
            copay_hospitals.append({"name": h["name"], **override})
        else:
            free_hospitals.append(h["name"])

    if free_hospitals:
        out_of_pocket = f"0 บาท ที่เครือข่ายหลักตามสิทธิ ({', '.join(free_hospitals[:3])})"
    elif copay_hospitals:
        c = copay_hospitals[0]
        out_of_pocket = (
            f"ไม่มี รพ. ในเครือข่ายฟรีในพื้นที่ที่ลงทะเบียน — หากเข้ารักษาที่ {c['name']} "
            f"มีส่วนเกิน OPD {c.get('opd_baht', 0):,} บาท/ครั้ง และ IP {c.get('ip_baht_per_day', 0):,} บาท/วัน"
        )
    else:
        out_of_pocket = "ไม่พบข้อมูลโรงพยาบาลที่รองรับสิทธินี้ในพื้นที่ที่ลงทะเบียน กรุณาติดต่อสายด่วนของหน่วยงานที่รับผิดชอบ"

    copay_note = ""
    if free_hospitals and copay_hospitals:
        c = copay_hospitals[0]
        copay_note = (
            f" (หากเลือกเข้า {c['name']} แทนซึ่งอยู่นอกเครือข่ายหลัก จะมีส่วนเกิน "
            f"OPD {c.get('opd_baht', 0):,} บาท/ครั้ง, IP {c.get('ip_baht_per_day', 0):,} บาท/วัน)"
        )

    hospital_names = free_hospitals + [c["name"] for c in copay_hospitals]

    return {
        "total_estimated_benefit_value": (
            f"คุ้มครองเต็มจำนวนตามสิทธิใน {len(free_hospitals)} รพ./คลินิกเครือข่ายหลัก "
            f"และกายอุปกรณ์เพิ่มเติมอีก {extra_equipment_count} รายการ จาก {len(participating_agencies)} หน่วยงาน"
        ),
        "estimated_out_of_pocket": out_of_pocket + copay_note,
        "hospital_network_names": hospital_names,
        "matched_hospital_count": len(matched),
    }
