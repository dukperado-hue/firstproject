/* ============================================================
   vor-adrep.js  —  ADREP / ECCAIRS occurrence-category taxonomy
   ------------------------------------------------------------
   Reporters describe what they saw in plain language and often
   don't know aviation taxonomy. The SAFETY OFFICER maps each
   report to an ICAO ADREP / CICTT *occurrence category* — the
   industry-standard code that ECCAIRS and ICAO iSTARS roll up.

   This file is the single source of truth for:
     • window.ADREP_META   — code → { code, th, en, group }
     • window.ADREP_GROUPS — group → { th, en, tone }
     • window.ADREP_ORDER  — display order for pickers/charts
     • window.adrepOf(report)   — code (falls back to "UNK")
     • window.adrepLabel(code)  — { code, th, en, group }
     • window.airportOf(report) — { icao, th, en } from location
     • window.fmtHours(ms)      — "18 ชม." / "2.5 วัน" helper

   Loaded by:  officer.html (classify) · analytics.html (roll-up)
   Pipeline:   analytics.html exports JSON/CSV keyed by ADREP code
               — a drop-in feed for an ECCAIRS-5 ingestion pipeline.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Occurrence-category GROUPS (for colour + sectioning) ---- */
  const ADREP_GROUPS = {
    wildlife:  { th: "สัตว์ / นก",            en: "Wildlife",            tone: "success" },
    runway:    { th: "ทางวิ่ง",               en: "Runway safety",       tone: "danger"  },
    ground:    { th: "ภาคพื้น / ลานจอด",      en: "Ground operations",   tone: "warning" },
    aerodrome: { th: "สนามบิน / สิ่งอำนวยฯ",  en: "Aerodrome",           tone: "info"    },
    atm:       { th: "การจราจรทางอากาศ",      en: "ATM / airspace",      tone: "info"    },
    weather:   { th: "สภาพอากาศ",             en: "Weather",             tone: "warning" },
    technical: { th: "เทคนิค / อากาศยาน",     en: "Aircraft / technical",tone: "neutral" },
    flight:    { th: "ระหว่างทำการบิน",       en: "In-flight",           tone: "danger"  },
    other:     { th: "อื่น ๆ",                en: "Other",               tone: "neutral" },
    unknown:   { th: "ยังไม่จัดประเภท",       en: "Unclassified",        tone: "neutral" },
  };

  /* ---- ADREP / CICTT occurrence categories (curated for TH ops) ---- */
  const ADREP_META = {
    BIRD:    { code: "BIRD",   th: "นกชน",                       en: "Birdstrike",                       group: "wildlife"  },
    WILD:    { code: "WILD",   th: "สัตว์ในเขตการบิน",            en: "Wildlife (excl. birds)",           group: "wildlife"  },
    RI:      { code: "RI",     th: "การล่วงล้ำทางวิ่ง",           en: "Runway incursion",                 group: "runway"    },
    RE:      { code: "RE",     th: "การไถลออกนอกทางวิ่ง",         en: "Runway excursion",                 group: "runway"    },
    ARC:     { code: "ARC",    th: "การสัมผัสทางวิ่งผิดปกติ",      en: "Abnormal runway contact",          group: "runway"    },
    RAMP:    { code: "RAMP",   th: "การบริการภาคพื้น",            en: "Ground handling",                  group: "ground"    },
    GCOL:    { code: "GCOL",   th: "การชนกันภาคพื้น",             en: "Ground collision",                 group: "ground"    },
    ADRM:    { code: "ADRM",   th: "สนามบิน / สิ่งอำนวยความสะดวก", en: "Aerodrome",                        group: "aerodrome" },
    ATM:     { code: "ATM",    th: "การจราจรทางอากาศ / CNS",      en: "ATM / CNS",                        group: "atm"       },
    MAC:     { code: "MAC",    th: "ระยะห่างไม่ปลอดภัย",          en: "Airprox / loss of separation",     group: "atm"       },
    WSTRW:   { code: "WSTRW",  th: "วินด์เชียร์ / พายุฝนฟ้าคะนอง", en: "Windshear / thunderstorm",         group: "weather"   },
    TURB:    { code: "TURB",   th: "สภาพอากาศปั่นป่วน",            en: "Turbulence encounter",             group: "weather"   },
    ICE:     { code: "ICE",    th: "น้ำแข็งเกาะ",                 en: "Icing",                            group: "weather"   },
    "SCF-NP":{ code: "SCF-NP", th: "ระบบ/อุปกรณ์ขัดข้อง",         en: "System/component failure (non-PP)",group: "technical" },
    "SCF-PP":{ code: "SCF-PP", th: "เครื่องยนต์ขัดข้อง",          en: "Powerplant failure",               group: "technical" },
    "LOC-I": { code: "LOC-I",  th: "สูญเสียการควบคุมขณะบิน",      en: "Loss of control – inflight",       group: "flight"    },
    CFIT:    { code: "CFIT",   th: "บินเข้าหาภูมิประเทศ",          en: "Controlled flight into terrain",   group: "flight"    },
    "F-NI":  { code: "F-NI",   th: "ไฟ / ควัน (ไม่กระแทก)",       en: "Fire / smoke (non-impact)",        group: "technical" },
    SEC:     { code: "SEC",    th: "การรักษาความปลอดภัย",         en: "Security related",                 group: "other"     },
    MED:     { code: "MED",    th: "เหตุทางการแพทย์",             en: "Medical",                          group: "other"     },
    CABIN:   { code: "CABIN",  th: "ความปลอดภัยในห้องโดยสาร",     en: "Cabin safety",                     group: "other"     },
    OTHR:    { code: "OTHR",   th: "อื่น ๆ",                      en: "Other",                            group: "other"     },
    UNK:     { code: "UNK",    th: "ยังไม่จัดประเภท",             en: "Not yet classified",               group: "unknown"   },
  };

  /* Display / picker order — grouped, UNK last */
  const ADREP_ORDER = [
    "BIRD", "WILD",
    "RI", "RE", "ARC",
    "RAMP", "GCOL",
    "ADRM",
    "ATM", "MAC",
    "WSTRW", "TURB", "ICE",
    "SCF-NP", "SCF-PP", "F-NI",
    "LOC-I", "CFIT",
    "SEC", "MED", "CABIN",
    "OTHR", "UNK",
  ];

  /* ---- Thai aerodromes (ICAO → bilingual name) ---- */
  const AIRPORTS = {
    VTBS: { th: "สุวรรณภูมิ",   en: "Suvarnabhumi" },
    VTBD: { th: "ดอนเมือง",     en: "Don Mueang" },
    VTCC: { th: "เชียงใหม่",     en: "Chiang Mai" },
    VTSP: { th: "ภูเก็ต",        en: "Phuket" },
    VTUD: { th: "อุดรธานี",      en: "Udon Thani" },
    VTSG: { th: "กระบี่",        en: "Krabi" },
    VTSS: { th: "หาดใหญ่",       en: "Hat Yai" },
    VTUU: { th: "อุบลราชธานี",   en: "Ubon Ratchathani" },
  };

  /* ---- accessors ---- */
  function adrepOf(report) {
    const c = report && report.adrep;
    return c && ADREP_META[c] ? c : "UNK";
  }
  function adrepLabel(code) {
    return ADREP_META[code] || ADREP_META.UNK;
  }
  function airportOf(report) {
    const loc = (report && report.location) || "";
    const m = loc.match(/\b(VT[A-Z]{2})\b/);
    const icao = m ? m[1] : "OTHER";
    const a = AIRPORTS[icao];
    return a ? { icao, th: a.th, en: a.en } : { icao: "OTHER", th: "อื่น ๆ / ไม่ระบุ", en: "Other / unspecified" };
  }

  /* ---- duration helper: ms → "18 ชม." or "2.4 วัน" ---- */
  function fmtHours(ms) {
    if (ms == null || isNaN(ms)) return "—";
    const h = ms / 3600000;
    if (h < 1) return "< 1 ชม.";
    if (h < 48) return `${Math.round(h)} ชม.`;
    return `${(h / 24).toFixed(1)} วัน`;
  }

  Object.assign(window, {
    ADREP_META, ADREP_GROUPS, ADREP_ORDER, AIRPORTS,
    adrepOf, adrepLabel, airportOf, fmtHours,
  });
})();
