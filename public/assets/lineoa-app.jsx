// LineOA.jsx — น้องสำลี LINE Official Account · interactive Web VOR intake
// ----------------------------------------------------------------------
// A working mock of the LINE intake channel. A reporter chats with the
// bot (type → place → time → narrative); the report is FILED into the
// shared store (vor-api.js) de-identified, status "under-review", with
// NO ADREP code — because the reporter speaks plain language and the
// Safety officer assigns the ADREP category later. The same report then
// appears in the officer queue, analytics roll-up, and exports.
//
// "🔍 ติดตามสถานะ" reads a report back by reference and shows the team's
// latest status + reply — closing the loop on LINE.
//
// Depends on: ios-frame.jsx, vor-api.js, vor-status.js, vor-adrep.js
// ----------------------------------------------------------------------

const { useState, useRef, useEffect } = React;

const LINE_GREEN = '#06C755';
const LINE_BG = '#8DA9C4';
const pad2 = (n) => String(n).padStart(2, '0');
const nowHM = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

// ──────────────────────────────────────────────────────────────
// Mascot avatar — น้องสำลี
// ──────────────────────────────────────────────────────────────
function NongSamleeAvatar({ size = 36 }) {
  const src = (window.__resources && window.__resources.samlee) || '../../assets/samlee.gif';
  return (
    <img
      src={src}
      alt="น้องสำลี"
      style={{
        width: size, height: size, borderRadius: '50%', objectFit: 'cover',
        background: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
        border: '1.5px solid #fff', flexShrink: 0, display: 'block',
      }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// LINE chat header
// ──────────────────────────────────────────────────────────────
function LineHeader() {
  return (
    <div style={{
      background: LINE_GREEN, color: '#fff', padding: '14px 14px 12px',
      paddingTop: 'calc(14px + env(safe-area-inset-top, 0px))',
      display: 'flex', alignItems: 'center', gap: 10, position: 'relative', flexShrink: 0,
    }}>
      <svg width="11" height="18" viewBox="0 0 11 18" fill="none" style={{ marginRight: 4 }}>
        <path d="M9.5 1L1.5 9l8 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <NongSamleeAvatar size={32} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.2, whiteSpace: 'nowrap', flexShrink: 0 }}>น้องสำลี</div>
          <span style={{ flexShrink: 0, fontSize: 9, fontWeight: 700, background: '#fff', color: LINE_GREEN, borderRadius: 3, padding: '1px 4px', letterSpacing: '0.02em' }}>OA</span>
        </div>
        <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Web VOR · ตอบกลับอัตโนมัติ · ไม่เปิดเผยตัวตน</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.37 1.9.72 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.35 1.85.59 2.81.72A2 2 0 0122 16.92z" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
        <circle cx="5" cy="12" r="1.5" fill="#fff"/><circle cx="12" cy="12" r="1.5" fill="#fff"/><circle cx="19" cy="12" r="1.5" fill="#fff"/>
      </svg>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Bubbles
// ──────────────────────────────────────────────────────────────
function BotRow({ children, showAvatar = false, time }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 6 }}>
      <div style={{ width: 36, flexShrink: 0 }}>{showAvatar && <NongSamleeAvatar size={36} />}</div>
      <div style={{ maxWidth: '76%' }}>{children}</div>
      {time && <div style={{ fontSize: 10, color: '#48515c', alignSelf: 'flex-end', paddingBottom: 4 }}>{time}</div>}
    </div>
  );
}
function UserRow({ children, time, read }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 6, justifyContent: 'flex-end' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', alignSelf: 'flex-end', paddingBottom: 4, lineHeight: 1.25 }}>
        {read && <span style={{ fontSize: 9.5, color: '#5e7a4f', fontWeight: 600 }}>อ่านแล้ว</span>}
        {time && <span style={{ fontSize: 10, color: '#48515c' }}>{time}</span>}
      </div>
      <div style={{ maxWidth: '76%' }}>{children}</div>
    </div>
  );
}

// Sent-photo bubble (placeholder thumbnail — user drops a real photo in prod)
function PhotoBubble() {
  return (
    <div style={{
      width: 168, height: 120, borderRadius: 14, borderTopRightRadius: 4, overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(0,0,0,0.12)', position: 'relative',
      background: 'repeating-linear-gradient(135deg, #cfd8e2 0 10px, #c4cdd8 10px 20px)',
    }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#5a6776' }}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#5a6776" strokeWidth="1.6"/><circle cx="8.5" cy="10" r="1.8" stroke="#5a6776" strokeWidth="1.4"/><path d="M5 17l4.5-4 3 2.5L16 11l3 3.5" stroke="#5a6776" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9.5, letterSpacing: '0.02em' }}>รูปจุดเกิดเหตุ</span>
      </div>
    </div>
  );
}

// iOS-style heads-up push notification (LINE delivers status updates here)
function PushBanner({ data, onClose }) {
  const src = (window.__resources && window.__resources.samlee) || '../../assets/samlee.gif';
  return (
    <div style={{ position: 'absolute', top: 54, left: 10, right: 10, zIndex: 80, cursor: 'pointer', animation: 'samleePush 0.5s cubic-bezier(.2,.9,.3,1.15)' }} onClick={onClose}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px',
        background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(18px) saturate(160%)',
        WebkitBackdropFilter: 'blur(18px) saturate(160%)', borderRadius: 22,
        boxShadow: '0 10px 34px rgba(0,0,0,0.24), 0 0 0 0.5px rgba(0,0,0,0.06)',
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', background: LINE_GREEN, flexShrink: 0 }}>
          <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f1820', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.title}</span>
            <span style={{ fontSize: 11, color: '#6e7d8c', flexShrink: 0 }}>ตอนนี้</span>
          </div>
          <div style={{ fontSize: 12.5, color: '#283541', lineHeight: 1.35, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.body}</div>
        </div>
      </div>
    </div>
  );
}
function BotBubble({ children, style }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, borderTopLeftRadius: 4, padding: '8px 12px',
      fontSize: 14, lineHeight: 1.45, color: '#1f2a36', boxShadow: '0 1px 1px rgba(0,0,0,0.06)', ...style,
    }}>{children}</div>
  );
}
function UserBubble({ children }) {
  return (
    <div style={{
      background: '#85d063', borderRadius: 14, borderTopRightRadius: 4, padding: '8px 12px',
      fontSize: 14, lineHeight: 1.45, color: '#0f1820', boxShadow: '0 1px 1px rgba(0,0,0,0.06)',
    }}>{children}</div>
  );
}

// Clickable quick-reply chips
function QuickReplies({ items, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '2px 12px 10px 48px' }}>
      {items.map((it, i) => (
        <button key={i} onClick={() => onPick(it)} style={{
          flexShrink: 0, background: '#fff', color: LINE_GREEN, border: `1.5px solid ${LINE_GREEN}`,
          padding: '6px 13px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Sarabun, sans-serif',
        }}>{it.label}</button>
      ))}
    </div>
  );
}

function FlexCard({ children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      border: '1px solid rgba(0,0,0,0.04)', width: 248,
    }}>{children}</div>
  );
}
function Row({ k, v, accent }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0' }}>
      <span style={{ color: '#6e7d8c', fontSize: 12 }}>{k}</span>
      <span style={{ fontWeight: 600, color: accent || '#1f2a36', fontSize: 12, textAlign: 'right' }}>{v}</span>
    </div>
  );
}

function DayLabel() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 14px' }}>
      <div style={{ background: 'rgba(255,255,255,0.55)', color: '#1f2a36', padding: '3px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>วันนี้</div>
    </div>
  );
}

// Typing indicator
function Typing() {
  return (
    <BotRow showAvatar>
      <BotBubble style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 7, height: 7, borderRadius: '50%', background: '#b8c2cc',
              animation: `samleeBlink 1s ${i * 0.15}s infinite`,
            }} />
          ))}
        </div>
      </BotBubble>
    </BotRow>
  );
}

// ──────────────────────────────────────────────────────────────
// Footer: interactive input bar + decorative rich menu
// ──────────────────────────────────────────────────────────────
function ChatFooter({ active, value, onChange, onSend, placeholder, onAction }) {
  const cell = (icon, label, action) => (
    <div
      onClick={() => onAction && onAction(action)}
      style={{
        flex: 1, padding: '9px 6px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.18)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#fff', fontSize: 11, fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div>{label}</div>
    </div>
  );
  const ic = (d) => <svg width="15" height="15" viewBox="0 0 24 24" fill="none">{d}</svg>;

  return (
    <div style={{ background: '#fff', borderTop: '1px solid #e2e8ee', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="#5a6470" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
        <input
          value={value}
          disabled={!active}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) onSend(); }}
          placeholder={active ? placeholder : 'Aa'}
          style={{
            flex: 1, background: active ? '#fff' : '#f1f4f7', borderRadius: 16,
            border: active ? `1.5px solid ${LINE_GREEN}` : '1.5px solid transparent',
            padding: '8px 14px', color: '#1f2a36', fontSize: 13.5, fontFamily: 'Sarabun, sans-serif',
            outline: 'none', minWidth: 0,
          }}
        />
        {active && value.trim() ? (
          <button onClick={onSend} style={{
            width: 34, height: 34, borderRadius: '50%', border: 0, background: LINE_GREEN,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11l18-8-8 18-2-7-8-3z" fill="#fff"/></svg>
          </button>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
            <path d="M12 14a3 3 0 003-3V6a3 3 0 00-6 0v5a3 3 0 003 3zM19 11a7 7 0 01-14 0M12 18v3" stroke="#5a6470" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div style={{ background: '#236595', display: 'flex' }}>
        {cell(ic(<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/><path d="M14 2v6h6" stroke="#fff" strokeWidth="2"/></>), 'รายงานเหตุการณ์', 'report')}
        {cell(ic(<><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/><path d="M12 7v5l3 2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></>), 'ตรวจสอบสถานะ', 'track')}
        {cell(ic(<path d="M4 4.5A2.5 2.5 0 016.5 2H20v16H6.5a2.5 2.5 0 000 5H20" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/>), 'คู่มือ', 'guide')}
        {cell(ic(<><circle cx="12" cy="12" r="9" stroke="#fff" strokeWidth="2"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.5-2.5 2-2.5 3.5M12 17h.01" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></>), 'ช่วยเหลือ', 'help')}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Conversation data
// ──────────────────────────────────────────────────────────────
const TYPE_CHOICES = [
  { label: '⚠️ สภาวะอันตราย', value: 'hazard' },
  { label: '📋 อุบัติการณ์', value: 'occurrence' },
  { label: '✏️ ข้อผิดพลาด', value: 'error' },
];
const SEVERITY_CHOICES = [
  { label: '🟢 เล็กน้อย', value: 'minor' },
  { label: '🟡 ปานกลาง', value: 'moderate' },
  { label: '🔴 รุนแรง / เกือบเกิดเหตุ', value: 'severe' },
];
const SEVERITY_META = {
  minor:    { th: 'เล็กน้อย', tone: '#2f8a4d' },
  moderate: { th: 'ปานกลาง', tone: '#c47c14' },
  severe:   { th: 'รุนแรง / เกือบเกิดเหตุ', tone: '#c0392b' },
};
const PLACE_CHOICES = [
  { label: '🛫 สุวรรณภูมิ (VTBS)', value: 'VTBS — สุวรรณภูมิ' },
  { label: 'ดอนเมือง (VTBD)', value: 'VTBD — ดอนเมือง' },
  { label: 'เชียงใหม่ (VTCC)', value: 'VTCC — เชียงใหม่' },
  { label: 'ภูเก็ต (VTSP)', value: 'VTSP — ภูเก็ต' },
  { label: '✍️ อื่น ๆ', value: '__custom__' },
];
function isoDate(offset) { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); }
const WHEN_CHOICES = [
  { label: 'วันนี้', value: isoDate(0) },
  { label: 'เมื่อวาน', value: isoDate(-1) },
  { label: 'ไม่แน่ใจ', value: isoDate(0) },
];

// ──────────────────────────────────────────────────────────────
// Main interactive chat
// ──────────────────────────────────────────────────────────────
function LineOA() {
  const [msgs, setMsgs] = useState([]);
  const [qr, setQr] = useState(null);
  const [typing, setTyping] = useState(false);
  const [inputActive, setInputActive] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('Aa');
  const [notif, setNotif] = useState(null);

  const idRef = useRef(0);
  const draftRef = useRef({});
  const textHandlerRef = useRef(null);
  const scrollRef = useRef(null);
  const pushedRef = useRef(false);

  const nid = () => ++idRef.current;
  const addBot = (body, opts = {}) => setMsgs((m) => [...m, { id: nid(), from: 'bot', body, time: nowHM(), avatar: opts.avatar !== false }]);
  const addUser = (text) => setMsgs((m) => [...m, { id: nid(), from: 'user', body: text, time: nowHM() }]);

  // bot "types" then says
  const botSay = (body, opts) => {
    setTyping(true);
    setQr(null);
    setTimeout(() => { setTyping(false); addBot(body, opts); if (opts && opts.then) opts.then(); }, opts && opts.delay != null ? opts.delay : 600);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, qr, typing]);

  // ---- flow ----
  useEffect(() => { startWelcome(); /* eslint-disable-next-line */ }, []);

  function startWelcome() {
    addBot(
      <div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>สวัสดีค่ะ น้องสำลีเองนะคะ 🛫</div>
        <div>สายด่วนรายงานความปลอดภัยภาคสมัครใจ <b>(Voluntary Occurrence Report)</b> ของ CAAT</div>
        <div style={{ marginTop: 6, fontSize: 13, color: '#4f5e6d' }}>ทุกรายงาน <u>ไม่เปิดเผยตัวตน</u> และคุ้มครองตาม CAB ฉบับที่ 32 · ไม่ใช้เพื่อการลงโทษ</div>
      </div>
    );
    botSay('ต้องการทำรายการอะไรดีคะ?', {
      then: () => setQr({
        items: [{ label: '📝 รายงานใหม่', value: 'new' }, { label: '🔍 ติดตามสถานะ', value: 'track' }],
        onPick: (it) => { addUser(it.label); it.value === 'new' ? askType() : askTrack(); },
      }),
    });
  }

  function askType() {
    draftRef.current = {};
    botSay('เรื่องที่จะรายงานเป็นแบบใดคะ?', {
      then: () => setQr({
        items: TYPE_CHOICES,
        onPick: (it) => { addUser(it.label); draftRef.current.type = it.value; askSeverity(); },
      }),
    });
  }

  function askSeverity() {
    botSay('เหตุการณ์รุนแรงแค่ไหนคะ? ประเมินคร่าว ๆ ได้เลยค่ะ', {
      then: () => setQr({
        items: SEVERITY_CHOICES,
        onPick: (it) => { addUser(it.label); draftRef.current.severity = it.value; askPlace(); },
      }),
    });
  }

  function askPlace() {
    botSay('เกิดเหตุที่สนามบินใดคะ?', {
      then: () => setQr({
        items: PLACE_CHOICES,
        onPick: (it) => {
          addUser(it.label);
          if (it.value === '__custom__') {
            botSay('พิมพ์ชื่อสถานที่ได้เลยค่ะ (เช่น สนามบิน หรือบริเวณที่เกิดเหตุ)', {
              then: () => enableText('เช่น VTUD — อุดรธานี · gate 2', (t) => { draftRef.current.location = t; askWhen(); }),
            });
          } else { draftRef.current.location = it.value; askWhen(); }
        },
      }),
    });
  }

  function askWhen() {
    botSay('เกิดขึ้นเมื่อไหร่คะ?', {
      then: () => setQr({
        items: WHEN_CHOICES,
        onPick: (it) => { addUser(it.label); draftRef.current.date = it.value; askNarrative(); },
      }),
    });
  }

  function askNarrative() {
    botSay(
      <div>
        เล่าเหตุการณ์โดยย่อได้เลยค่ะ
        <div style={{ fontSize: 12, color: '#6e7d8c', marginTop: 4 }}>สิ่งที่สังเกตเห็น · เวลาโดยประมาณ · ไม่ต้องระบุชื่อ-นามสกุล</div>
      </div>,
      { then: () => enableText('พิมพ์เล่าเหตุการณ์ที่นี่…', (t) => { draftRef.current.description = t; askPhoto(); }) }
    );
  }

  function askPhoto() {
    botSay('มีรูปภาพประกอบไหมคะ? (เช่น ภาพจุดเกิดเหตุ) จะช่วยให้ทีมเข้าใจมากขึ้นค่ะ', {
      then: () => setQr({
        items: [{ label: '📷 แนบรูป', value: 'add' }, { label: 'ข้ามไปก่อน', value: 'skip' }],
        onPick: (it) => {
          addUser(it.label);
          if (it.value === 'add') {
            setMsgs((m) => [...m, { id: nid(), from: 'user', kind: 'photo', time: nowHM() }]);
            draftRef.current.attachments = [{ name: 'line-photo-01.jpg', size: 0, type: 'image/jpeg', dataUrl: '' }];
            botSay('ได้รับรูปแล้วค่ะ ขอบคุณนะคะ 📎', { delay: 750, then: () => askContact() });
          } else { askContact(); }
        },
      }),
    });
  }

  function askContact() {
    botSay(
      <div>
        ต้องการให้ทีมติดต่อกลับไหมคะ?
        <div style={{ fontSize: 12, color: '#6e7d8c', marginTop: 4 }}>โดยปริยายรายงานนี้ <b>ไม่เปิดเผยตัวตน</b> · ฝากช่องทางไว้เฉพาะกรณีต้องการให้ติดต่อกลับ</div>
      </div>,
      { then: () => setQr({
        items: [{ label: '🔒 ไม่ระบุตัวตน', value: 'anon' }, { label: '📞 ฝากช่องทางติดต่อ', value: 'contact' }],
        onPick: (it) => {
          addUser(it.label);
          if (it.value === 'contact') {
            botSay('พิมพ์เบอร์โทรหรืออีเมลที่สะดวกให้ติดต่อกลับค่ะ (เห็นเฉพาะทีมคุ้มครองข้อมูล)', {
              then: () => enableText('เช่น 08x-xxx-xxxx หรืออีเมล', (t) => { draftRef.current.contact = t; draftRef.current.anonymous = false; fileReport(); }),
            });
          } else { draftRef.current.anonymous = true; fileReport(); }
        },
      }) }
    );
  }

  function fileReport() {
    disableText();
    const d = draftRef.current;
    const ref = window.newReference ? window.newReference() : `VOR-${Date.now()}`;
    const rec = {
      ref, filedAt: new Date().toISOString(), status: 'under-review',
      type: d.type || 'hazard', date: d.date || isoDate(0), timeUtc: '',
      location: d.location || '', flight: '', operator: '', phase: '',
      description: d.description || '', factors: [], suggestion: '', attachments: d.attachments || [],
      severity: d.severity || '',
      anonymous: d.anonymous !== false, name: '', role: 'other', contact: d.contact || '', confirm: true,
      timeline: [], channel: 'line',
    };
    if (window.vorApi && window.vorApi.create) window.vorApi.create(rec);

    const typeM = (window.TYPE_META && window.TYPE_META[rec.type]) || { th: rec.type };
    botSay(
      <div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: LINE_GREEN, fontWeight: 700, marginBottom: 4 }}>✅ รับรายงานเรียบร้อย</div>
        <div style={{ fontSize: 13 }}>ส่งต่อให้ทีม Safety Analysis แล้วค่ะ ทีมจะ<b>จัดประเภทตามมาตรฐาน ADREP</b>และติดต่อกลับผ่านช่องนี้</div>
      </div>,
      { delay: 900, then: () => {
        addBot(
          <FlexCard>
            <div style={{ background: '#236595', color: '#fff', padding: '10px 14px', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>ใบรับรายงาน</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{rec.ref}</span>
            </div>
            <div style={{ padding: '12px 14px' }}>
              <Row k="ประเภท" v={typeM.th} />
              {rec.severity && <Row k="ความรุนแรง" v={(SEVERITY_META[rec.severity] || {}).th || rec.severity} accent={(SEVERITY_META[rec.severity] || {}).tone} />}
              <Row k="สถานที่" v={rec.location || '—'} />
              {rec.attachments && rec.attachments.length > 0 && <Row k="ไฟล์แนบ" v={`📎 ${rec.attachments.length} ไฟล์`} />}
              <Row k="ADREP" v="รอเจ้าหน้าที่จัดประเภท" accent="#6e7d8c" />
              <Row k="สถานะ" v="กำลังตรวจสอบ" accent="#c47c14" />
              <Row k="ผู้รายงาน" v={rec.anonymous ? 'ไม่เปิดเผย (de-identified)' : 'ฝากช่องทางติดต่อไว้'} accent={rec.anonymous ? undefined : '#236595'} />
            </div>
            <div style={{ padding: '8px 14px 12px', fontSize: 11, color: '#4f5e6d', lineHeight: 1.5, borderTop: '1px solid #eef2f6' }}>
              เก็บเลขอ้างอิงไว้เพื่อ <b>ติดตามสถานะ</b> · ทีมจะตอบกลับภายใน 72 ชม.
            </div>
          </FlexCard>, { avatar: false }
        );
        botSay('ขอบคุณที่ช่วยเสริมความปลอดภัยทางการบินค่ะ 💚', {
          delay: 700,
          then: () => { schedulePush(rec.ref); setQr({
            items: [{ label: '🔍 ติดตามสถานะ', value: 'track' }, { label: '📝 รายงานใหม่', value: 'new' }],
            onPick: (it) => { addUser(it.label); it.value === 'new' ? askType() : askTrack(rec.ref); },
          }); },
        });
      } }
    );
  }

  // Simulate the Safety team picking up the report ~4.5s later, pushing a
  // LINE status update: store changes, an iOS heads-up banner appears, and a
  // bot message lands in the chat. Fires once per session.
  function schedulePush(ref) {
    if (pushedRef.current) return;
    pushedRef.current = true;
    setTimeout(() => {
      const cur = window.vorApiSync ? window.vorApiSync.get(ref) : null;
      const note = 'ทีม Safety เริ่มตรวจสอบรายงานของคุณแล้ว ขอบคุณที่ช่วยรายงานค่ะ';
      if (window.vorApi && window.vorApi.update) {
        const tl = (cur && cur.timeline) ? cur.timeline.slice() : [];
        tl.push({ who: 'Safety Team', action: 'investigating', at: new Date().toISOString(), note });
        window.vorApi.update(ref, { status: 'investigating', assignee: 'SIU-04 · Surapong K.', timeline: tl });
      }
      setNotif({ title: 'น้องสำลี · Web VOR', body: `${ref} · ทีมเริ่มตรวจสอบแล้ว` });
      setTimeout(() => setNotif(null), 5200);
      setTimeout(() => {
        addBot(
          <div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#236595', fontWeight: 700, marginBottom: 4 }}>🔔 อัปเดตสถานะ</div>
            <div style={{ fontSize: 13.5 }}>ทีม Safety Analysis <b>เริ่มตรวจสอบ</b>รายงานของคุณแล้วค่ะ — สถานะตอนนี้ “กำลังตรวจสอบ”</div>
            <div style={{ fontSize: 12, color: '#6e7d8c', marginTop: 4 }}>กดปุ่ม “🔍 ติดตามสถานะ” เพื่อดูรายละเอียดได้ตลอดเวลาค่ะ</div>
          </div>
        );
      }, 950);
    }, 4500);
  }

  function askTrack(prefill) {
    botSay('พิมพ์เลขอ้างอิงที่ต้องการติดตามค่ะ (เช่น VOR-2568-05-0205)', {
      then: () => enableText(prefill || 'VOR-…', (t) => lookup(t), prefill),
    });
  }

  function lookup(text) {
    disableText();
    const ref = (text || '').trim().toUpperCase();
    const r = window.vorApiSync ? window.vorApiSync.get(ref) : null;
    if (!r) {
      botSay('ไม่พบเลขอ้างอิงนี้ค่ะ ลองตรวจสอบอีกครั้งนะคะ', {
        then: () => setQr({
          items: [{ label: '🔍 ลองใหม่', value: 'track' }, { label: '📝 รายงานใหม่', value: 'new' }],
          onPick: (it) => { addUser(it.label); it.value === 'new' ? askType() : askTrack(); },
        }),
      });
      return;
    }
    const statusM = (window.STATUS_META && window.STATUS_META[r.status]) || { th: r.status };
    const adrep = window.adrepOf ? window.adrepOf(r) : 'UNK';
    const adrepM = window.adrepLabel ? window.adrepLabel(adrep) : { code: adrep, th: '' };
    const reply = (r.timeline || []).slice().reverse().find((t) => t.who === 'Safety Team' && t.note);
    const tone = { success: '#2f8a4d', warning: '#c47c14', info: '#236595', danger: '#c0392b', neutral: '#6e7d8c' }[statusM.tone] || '#c47c14';

    botSay(
      <FlexCard>
        <div style={{ background: '#236595', color: '#fff', padding: '10px 14px', fontSize: 12, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          <span>สถานะรายงาน</span>
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 }}>{r.ref}</span>
        </div>
        <div style={{ padding: '12px 14px' }}>
          <Row k="สถานะ" v={statusM.th} accent={tone} />
          <Row k="ADREP" v={adrep === 'UNK' ? 'รอจัดประเภท' : `${adrepM.code} · ${adrepM.th}`} accent={adrep === 'UNK' ? '#6e7d8c' : '#236595'} />
          <Row k="ประเภท" v={(window.TYPE_META && window.TYPE_META[r.type] && window.TYPE_META[r.type].th) || r.type} />
        </div>
        {reply ? (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #eef2f6', background: '#f1f9e4' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#5e8728', marginBottom: 3 }}>💬 ข้อความจากทีม Safety</div>
            <div style={{ fontSize: 12.5, color: '#1f2a36', lineHeight: 1.5 }}>{reply.note}</div>
          </div>
        ) : (
          <div style={{ padding: '10px 14px', borderTop: '1px solid #eef2f6', fontSize: 12, color: '#6e7d8c' }}>ยังไม่มีข้อความจากทีม — อยู่ระหว่างตรวจสอบค่ะ</div>
        )}
      </FlexCard>,
      { then: () => setQr({
        items: [{ label: '🔍 ติดตามอีกครั้ง', value: 'track' }, { label: '📝 รายงานใหม่', value: 'new' }],
        onPick: (it) => { addUser(it.label); it.value === 'new' ? askType() : askTrack(); },
      }) }
    );
  }

  // ---- text input helpers ----
  function enableText(ph, handler, prefill) {
    textHandlerRef.current = handler;
    setPlaceholder(ph);
    setInputActive(true);
    setInputValue(prefill && prefill.startsWith('VOR') ? prefill : '');
  }
  function disableText() { setInputActive(false); setInputValue(''); textHandlerRef.current = null; }
  function sendText() {
    const t = inputValue.trim();
    if (!t) return;
    addUser(t);
    const h = textHandlerRef.current;
    setInputValue('');
    setInputActive(false);
    if (h) h(t);
  }

  const lastUserId = (() => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].from === 'user') return msgs[i].id; return null; })();

  function handleMenuAction(action) {
    setQr(null);
    disableText();
    if (action === 'report') { addUser('📝 รายงานเหตุการณ์'); askType(); }
    else if (action === 'track') { addUser('🔍 ตรวจสอบสถานะ'); askTrack(); }
    else if (action === 'guide') {
      addUser('คู่มือ');
      botSay('การรายงานทุกครั้งไม่เปิดเผยตัวตนและไม่ใช้เพื่อการลงโทษค่ะ พิมพ์หรือเลือกตัวเลือกที่บอทเสนอเพื่อกรอกรายงานทีละขั้นตอนได้เลยนะคะ');
    } else if (action === 'help') {
      addUser('ช่วยเหลือ');
      botSay('หากต้องการความช่วยเหลือเพิ่มเติม ติดต่อทีม Safety ของ CAAT ได้โดยตรง หรือกด "🔍 ติดตามสถานะ" เพื่อดูความคืบหน้ารายงานที่ส่งไปแล้วค่ะ');
    }
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <style>{`@keyframes samleeBlink{0%,80%,100%{opacity:.25;transform:translateY(0)}40%{opacity:1;transform:translateY(-2px)}}@keyframes samleePush{0%{opacity:0;transform:translateY(-18px) scale(.98)}100%{opacity:1;transform:translateY(0) scale(1)}}`}</style>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Sarabun, sans-serif', position: 'relative' }}>
        {notif && <PushBanner data={notif} onClose={() => setNotif(null)} />}
        <LineHeader />
        <div ref={scrollRef} style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          background: LINE_BG,
          backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.04) 100%)',
          padding: '12px 12px 8px',
        }}>
          <DayLabel />
          {msgs.map((m) => (
            m.from === 'bot'
              ? <BotRow key={m.id} showAvatar={m.avatar} time={m.time}>{typeof m.body === 'string' ? <BotBubble>{m.body}</BotBubble> : (React.isValidElement(m.body) && m.body.type === FlexCard ? m.body : <BotBubble>{m.body}</BotBubble>)}</BotRow>
              : <UserRow key={m.id} time={m.time} read={m.id === lastUserId}>{m.kind === 'photo' ? <PhotoBubble /> : <UserBubble>{m.body}</UserBubble>}</UserRow>
          ))}
          {typing && <Typing />}
          {qr && !typing && <QuickReplies items={qr.items} onPick={qr.onPick} />}
        </div>
        <ChatFooter active={inputActive} value={inputValue} onChange={setInputValue} onSend={sendText} placeholder={placeholder} onAction={handleMenuAction} />
      </div>
    </div>
  );
}

Object.assign(window, { LineOA });
