/* ============================================================
   vor-status.js  —  Shared status / type metadata + date helpers
   ------------------------------------------------------------
   Single source of truth for how a VOR report's STATUS and TYPE
   are labelled and toned across the whole portal:

     • Reporter "Track status" page (index.html)
     • Officer console (officer.html)

   The reporter Track page reads window.STATUS_META and
   window.fmtDateTime to render Safety-Team updates, and the
   officer console writes timeline entries using the same keys —
   so both ends stay in lock-step.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Workflow states a report moves through ---- */
  const STATUS_META = {
    "under-review": { th: "กำลังตรวจสอบ", en: "Under review",  tone: "warning" },
    "needs-info":   { th: "รอข้อมูลเพิ่มเติม", en: "Awaiting info", tone: "info" },
    "closed":       { th: "ปิดเคส",        en: "Closed",        tone: "success" },
    /* timeline-only action — a free-text message to the reporter */
    "reply":        { th: "ข้อความจากทีม",  en: "Reply",         tone: "info" },
    /* timeline-only action — officer assigned an ADREP occurrence category */
    "classified":   { th: "จัดประเภท ADREP", en: "ADREP coded",   tone: "info" },
  };

  /* Ordered list the officer can move a report through */
  const STATUS_ORDER = ["under-review", "needs-info", "closed"];

  /* ---- Report categories (matches OccurrenceForm type values) ---- */
  const TYPE_META = {
    hazard:     { th: "สภาวะอันตราย", en: "Hazard",     cls: "type-hazard" },
    occurrence: { th: "อุบัติการณ์",   en: "Occurrence", cls: "type-occurrence" },
    error:      { th: "ข้อผิดพลาด",    en: "Error",      cls: "type-error" },
  };

  /* ---- Reporter role labels (matches OccurrenceForm role values) ---- */
  const ROLE_META = {
    operations:  { th: "ฝ่ายปฏิบัติการบิน", en: "Flight operations" },
    cabin:       { th: "ลูกเรือ",          en: "Cabin crew" },
    maintenance: { th: "ฝ่ายซ่อมบำรุง",     en: "Maintenance" },
    atc:         { th: "เจ้าหน้าที่ควบคุมจราจร", en: "ATC" },
    ground:      { th: "ภาคพื้น",          en: "Ground handling" },
    other:       { th: "อื่น ๆ",           en: "Other" },
  };

  /* ---- Contributing-factor labels (matches OccurrenceForm chips) ---- */
  const FACTOR_META = {
    fatigue:       { th: "ความเหนื่อยล้า",        en: "Fatigue" },
    communication: { th: "การสื่อสาร",            en: "Communication" },
    procedure:     { th: "ขั้นตอนปฏิบัติ / SOP",  en: "Procedure / SOP" },
    weather:       { th: "สภาพอากาศ",             en: "Weather" },
    technical:     { th: "เทคนิค / อุปกรณ์",       en: "Technical / equipment" },
    workload:      { th: "ภาระงาน",               en: "Workload" },
    training:      { th: "การฝึกอบรม",            en: "Training" },
    environment:   { th: "สภาพแวดล้อม",           en: "Environment" },
  };

  const THAI_MONTHS = ["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."];
  const pad = (n) => String(n).padStart(2, "0");

  /* Buddhist-era date + time, e.g. "29 พ.ค. 2568, 14:05" */
  function fmtDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return `${pad(d.getDate())} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  /* Date only, e.g. "29 พ.ค. 2568" */
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    return `${pad(d.getDate())} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
  }

  /* Relative age, e.g. "3 วันที่แล้ว" / "วันนี้" — for triage urgency */
  function fmtAge(iso) {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (isNaN(then)) return "—";
    const days = Math.floor((Date.now() - then) / 86400000);
    if (days <= 0) return "วันนี้";
    if (days === 1) return "เมื่อวาน";
    return `${days} วันที่แล้ว`;
  }

  Object.assign(window, {
    STATUS_META,
    STATUS_ORDER,
    TYPE_META,
    ROLE_META,
    FACTOR_META,
    fmtDateTime,
    fmtDate,
    fmtAge,
  });
})();
