import { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const DEFAULT_CONFIG = {
  passwords: { maya: "maya2024", principal: "principal2024" },
  labels: { maya: "רכזת HR", principal: "מנהלת" },
  schoolName: "בית הספר",
  statusOptions: ["פעיל", 'חל"ת', "שבתון", "חופשת לידה"],
  potentialOptions: ["גבוה", "בינוני", "נמוך", "לא הוערך"],
  retentionOptions: ["ירוק", "צהוב", "אדום"],
  burnoutOptions: ["נמוכה", "בינונית", "גבוהה", "גבוהה מאוד"],
  absenceTrend: ["יורדת", "יציבה", "עולה"],
  teams: ["הנהלה","מדעים","הומניסטיקה","מתמטיקה","אנגלית","חינוך גופני","אמנויות","מקצועות טכנולוגיים","ייעוץ","מינהל"],
  retentionColors: { ירוק:"#22c55e", צהוב:"#eab308", אדום:"#ef4444" },
  burnoutColors: { נמוכה:"#22c55e", בינונית:"#eab308", גבוהה:"#f97316", "גבוהה מאוד":"#ef4444" }
};

const CONFIG_KEY = "hr_config_v1";
const STORAGE_KEY = "hr_employees_v1";

const loadConfig = () => { try { const d = window.localStorage?.getItem(CONFIG_KEY); return d ? {...DEFAULT_CONFIG,...JSON.parse(d)} : DEFAULT_CONFIG; } catch(e){ return DEFAULT_CONFIG; } };
const saveConfig = (c) => { try { window.localStorage?.setItem(CONFIG_KEY, JSON.stringify(c)); } catch(e){} };

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const mkEmpty = (cfg) => ({
  id:"",fullName:"",roles:"",eduStartDate:"",eduSeniority:"",
  schoolStartDate:"",schoolSeniority:"",team:"",status:cfg.statusOptions[0],
  managementPotential:cfg.potentialOptions[cfg.potentialOptions.length-1],
  careerAspirations:"",annualGoal:"",coordinatorFeedback:"",
  retentionStatus:cfg.retentionOptions[0],absenceTrend:cfg.absenceTrend[1],
  burnoutLevel:cfg.burnoutOptions[0],prevCheckinDate:"",prevCheckinBy:"",
  lastCheckinDate:"",lastCheckinBy:"",checkinNotes:"",illness:"",lifeEvents:"",
  salaryReform:"",benefits:"",currentGrade:"",gradePromotionYear:"",
  salaryIssues:"",smallThing:"",committees:"",birthDate:"",phone:"",email:"",generalNotes:""
});

const STORAGE_KEY_EMP = "hr_employees_v1";
const saveEmployees = async (e) => { try { await window.storage.set(STORAGE_KEY_EMP, JSON.stringify(e), false); } catch(_){} };
const loadEmployees = async () => { try { const r = await window.storage.get(STORAGE_KEY_EMP, false); return r ? JSON.parse(r.value) : []; } catch(_){ return []; } };

const importCSV = (file, employees, cfg, onDone) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target.result.replace(/^\uFEFF/,"");
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    if (lines.length < 2) return alert("הקובץ ריק או לא תקין");
    const headers = lines[0].split(",").map(h=>h.replace(/^"|"$/g,"").trim());
    const colMap = {"שם מלא":"fullName","תפקיד":"roles","תאריך תחילת עבודה בחינוך":"eduStartDate","ותק בחינוך":"eduSeniority",'תאריך תחילת עבודה בביה"ס':"schoolStartDate",'ותק בביה"ס':"schoolSeniority","שיוך ארגוני":"team","סטטוס":"status","פוטנציאל ניהולי":"managementPotential","שאיפות קריירה":"careerAspirations","יעד שנתי":"annualGoal","משוב רכזים":"coordinatorFeedback","שימור":"retentionStatus","מגמת היעדרויות":"absenceTrend","שחיקה":"burnoutLevel","תאריך שיחה קודמת":"prevCheckinDate","מי ביצע קודם":"prevCheckinBy","תאריך שיחה אחרונה":"lastCheckinDate","מי ביצע אחרון":"lastCheckinBy","הערות שיחות":"checkinNotes","מחלה":"illness","אירועי חיים":"lifeEvents","רפורמת שכר":"salaryReform","גמולים":"benefits","דרגה":"currentGrade","צפי דרגה":"gradePromotionYear","פניות שכר":"salaryIssues","הדבר הקטן":"smallThing","ועדים":"committees","תאריך לידה":"birthDate","נייד":"phone","מייל":"email"};
    const imported = [];
    for (let i=1;i<lines.length;i++) {
      const vals = lines[i].split(",").map(v=>v.replace(/^"|"$/g,"").replace(/""/g,'"'));
      const emp = {...mkEmpty(cfg), id:generateId()};
      headers.forEach((h,idx)=>{ const key=colMap[h]; if(key) emp[key]=vals[idx]||""; });
      if (emp.fullName) imported.push(emp);
    }
    if (!imported.length) return alert("לא נמצאו רשומות תקינות");
    const merged = [...employees];
    imported.forEach(imp=>{ if(!merged.find(e=>e.fullName===imp.fullName)) merged.push(imp); });
    onDone(merged, imported.length);
  };
  reader.readAsText(file,"UTF-8");
};

const exportCSV = (employees) => {
  const headers = ["שם מלא","תפקיד","תאריך תחילת עבודה בחינוך","ותק בחינוך",'תאריך תחילת עבודה בביה"ס','ותק בביה"ס',"שיוך ארגוני","סטטוס","פוטנציאל ניהולי","שאיפות קריירה","יעד שנתי","משוב רכזים","שימור","מגמת היעדרויות","שחיקה","תאריך שיחה קודמת","מי ביצע קודם","תאריך שיחה אחרונה","מי ביצע אחרון","הערות שיחות","מחלה","אירועי חיים","רפורמת שכר","גמולים","דרגה","צפי דרגה","פניות שכר","הדבר הקטן","ועדים","תאריך לידה","נייד","מייל"];
  const rows = employees.map(e=>[e.fullName,e.roles,e.eduStartDate,e.eduSeniority,e.schoolStartDate,e.schoolSeniority,e.team,e.status,e.managementPotential,e.careerAspirations,e.annualGoal,e.coordinatorFeedback,e.retentionStatus,e.absenceTrend,e.burnoutLevel,e.prevCheckinDate,e.prevCheckinBy,e.lastCheckinDate,e.lastCheckinBy,e.checkinNotes,e.illness,e.lifeEvents,e.salaryReform,e.benefits,e.currentGrade,e.gradePromotionYear,e.salaryIssues,e.smallThing,e.committees,e.birthDate,e.phone,e.email].map(v=>`"${(v||"").replace(/"/g,'""')}"`).join(","));
  const csv = "\uFEFF"+[headers.join(","),...rows].join("\n");
  const blob = new Blob([csv],{type:"text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="hr_employees.csv"; a.click();
};

const useWidth = () => {
  const [w,setW] = useState(window.innerWidth);
  useEffect(()=>{ const h=()=>setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h); },[]);
  return w;
};

function SettingsPanel({cfg, onSave, onClose}) {
  const [draft,setDraft] = useState(JSON.parse(JSON.stringify(cfg)));
  const [tab,setTab] = useState("access");
  const [newPw1,setNewPw1] = useState("");
  const [newPw2,setNewPw2] = useState("");
  const [pwMsg,setPwMsg] = useState("");
  const inp = {width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,direction:"rtl",boxSizing:"border-box"};
  const lbl = {fontSize:13,color:"#374151",marginBottom:4,display:"block",fontWeight:600};
  const setList=(key,idx,val)=>{ const arr=[...draft[key]]; arr[idx]=val; setDraft({...draft,[key]:arr}); };
  const addItem=(key)=>setDraft({...draft,[key]:[...draft[key],""]});
  const removeItem=(key,idx)=>{ const arr=draft[key].filter((_,i)=>i!==idx); setDraft({...draft,[key]:arr}); };
  const handleChangePw=(user)=>{
    if(!newPw1) return setPwMsg("הכנסי סיסמה חדשה");
    if(newPw1!==newPw2) return setPwMsg("הסיסמאות אינן תואמות");
    setDraft({...draft,passwords:{...draft.passwords,[user]:newPw1}});
    setNewPw1(""); setNewPw2(""); setPwMsg("✅ עודכן — לחצי שמירה לאישור");
  };
  const ListEditor = ({title,draftKey,colorKey}) => (
    <div style={{marginBottom:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <label style={lbl}>{title}</label>
        <button onClick={()=>addItem(draftKey)} style={{padding:"3px 10px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>+ הוספה</button>
      </div>
      {draft[draftKey].map((item,i)=>(
        <div key={i} style={{display:"flex",gap:6,marginBottom:6,alignItems:"center"}}>
          <input value={item} onChange={e=>setList(draftKey,i,e.target.value)} style={{...inp,flex:1}}/>
          {colorKey && <input type="color" value={draft[colorKey]?.[item]||"#94a3b8"} onChange={e=>setDraft({...draft,[colorKey]:{...draft[colorKey],[item]:e.target.value}})} style={{width:36,height:36,padding:2,border:"1px solid #d1d5db",borderRadius:6,cursor:"pointer"}}/>}
          {draft[draftKey].length>1 && <button onClick={()=>removeItem(draftKey,i)} style={{padding:"4px 8px",background:"#fee2e2",color:"#ef4444",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>✕</button>}
        </div>
      ))}
    </div>
  );
  const sTabs=[{id:"access",label:"🔐 גישה"},{id:"teams",label:"👥 צוותים"},{id:"lists",label:"📋 רשימות"},{id:"colors",label:"🎨 צבעים"}];
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500,padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:560,maxHeight:"90vh",display:"flex",flexDirection:"column",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{padding:"18px 24px",borderBottom:"1px solid #e2e8f0",display:"flex",justifyContent:"space-between",alignItems:"center",flexShrink:0}}>
          <h2 style={{margin:0,color:"#1e293b",fontSize:18}}>⚙️ הגדרות מערכת</h2>
          <button onClick={onClose} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:13}}>✕</button>
        </div>
        <div style={{display:"flex",gap:4,padding:"12px 24px 0",borderBottom:"1px solid #e2e8f0",flexShrink:0,overflowX:"auto"}}>
          {sTabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"7px 14px",border:"none",borderRadius:"8px 8px 0 0",cursor:"pointer",fontSize:13,fontWeight:600,background:tab===t.id?"#6366f1":"#f8fafc",color:tab===t.id?"#fff":"#475569",whiteSpace:"nowrap"}}>{t.label}</button>)}
        </div>
        <div style={{overflowY:"auto",padding:24,flex:1}}>
          {tab==="access" && (
            <div>
              <div style={{marginBottom:20}}>
                <label style={lbl}>שם בית הספר</label>
                <input value={draft.schoolName} onChange={e=>setDraft({...draft,schoolName:e.target.value})} style={inp}/>
              </div>
              {["maya","principal"].map(user=>(
                <div key={user} style={{background:"#f8fafc",borderRadius:12,padding:16,marginBottom:16}}>
                  <div style={{fontWeight:700,marginBottom:12,fontSize:14}}>{user==="maya"?"👤 משתמש 1 (את)":"👤 משתמש 2 (מנהלת)"}</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px",marginBottom:10}}>
                    <div><label style={lbl}>תווית תפקיד</label><input value={draft.labels[user]} onChange={e=>setDraft({...draft,labels:{...draft.labels,[user]:e.target.value}})} style={inp}/></div>
                    <div><label style={lbl}>סיסמה נוכחית</label><input type="password" value={draft.passwords[user]} readOnly style={{...inp,background:"#f1f5f9",color:"#94a3b8"}}/></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 12px"}}>
                    <div><label style={lbl}>סיסמה חדשה</label><input type="password" value={newPw1} onChange={e=>setNewPw1(e.target.value)} style={inp}/></div>
                    <div><label style={lbl}>אימות</label><input type="password" value={newPw2} onChange={e=>setNewPw2(e.target.value)} style={inp}/></div>
                  </div>
                  <button onClick={()=>handleChangePw(user)} style={{marginTop:10,padding:"7px 16px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>עדכון סיסמה</button>
                  {pwMsg&&<div style={{marginTop:8,fontSize:13,color:pwMsg.includes("✅")?"#166534":"#ef4444"}}>{pwMsg}</div>}
                </div>
              ))}
            </div>
          )}
          {tab==="teams" && <ListEditor title="צוותים" draftKey="teams"/>}
          {tab==="lists" && <div><ListEditor title="סטטוס" draftKey="statusOptions"/><ListEditor title="פוטנציאל ניהולי" draftKey="potentialOptions"/><ListEditor title="מגמת היעדרויות" draftKey="absenceTrend"/></div>}
          {tab==="colors" && <div><ListEditor title="שימור + צבעים" draftKey="retentionOptions" colorKey="retentionColors"/><ListEditor title="שחיקה + צבעים" draftKey="burnoutOptions" colorKey="burnoutColors"/></div>}
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid #e2e8f0",display:"flex",justifyContent:"flex-end",gap:10,flexShrink:0}}>
          <button onClick={onClose} style={{padding:"9px 20px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>ביטול</button>
          <button onClick={()=>onSave(draft)} style={{padding:"9px 24px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700}}>💾 שמירה</button>
        </div>
      </div>
    </div>
  );
}

const StatCard = ({label,value,color}) => (
  <div style={{background:"#fff",borderRadius:12,padding:"14px 16px",boxShadow:"0 1px 4px rgba(0,0,0,0.08)",borderTop:`4px solid ${color}`,flex:1,minWidth:100}}>
    <div style={{fontSize:26,fontWeight:800,color}}>{value}</div>
    <div style={{fontSize:12,color:"#666",marginTop:2,lineHeight:1.3}}>{label}</div>
  </div>
);

const FORM_TABS = [{id:"personal",label:"👤 אישי"},{id:"role",label:"💼 תפקיד"},{id:"development",label:"🌱 פיתוח"},{id:"welfare",label:"❤️ רווחה"},{id:"salary",label:"💰 שכר"},{id:"notes",label:"📝 הערות"}];

export default function App() {
  const w = useWidth();
  const isMobile = w < 640;
  const isTablet = w < 1024;

  const [cfg,setCfg] = useState(loadConfig);
  const [auth,setAuth] = useState(null);
  const [pwInput,setPwInput] = useState("");
  const [pwError,setPwError] = useState("");
  const [employees,setEmployees] = useState([]);
  const [loading,setLoading] = useState(true);
  const [view,setView] = useState("dashboard");
  const [editEmp,setEditEmp] = useState(null);
  const [search,setSearch] = useState("");
  const [filterStatus,setFilterStatus] = useState("");
  const [filterTeam,setFilterTeam] = useState("");
  const [filterRetention,setFilterRetention] = useState("");
  const [activeTab,setActiveTab] = useState("personal");
  const [confirmDelete,setConfirmDelete] = useState(null);
  const [importMsg,setImportMsg] = useState("");
  const [mobileNav,setMobileNav] = useState(false);
  const [showSettings,setShowSettings] = useState(false);

  useEffect(()=>{ loadEmployees().then(d=>{ setEmployees(d); setLoading(false); }); },[]);

  const saveAndSet = useCallback(async (list)=>{ setEmployees(list); await saveEmployees(list); },[]);
  const handleSaveConfig = (newCfg) => { setCfg(newCfg); saveConfig(newCfg); setShowSettings(false); };

  const handleLogin = () => {
    if (cfg.passwords.maya===pwInput) { setAuth("maya"); setPwError(""); }
    else if (cfg.passwords.principal===pwInput) { setAuth("principal"); setPwError(""); }
    else setPwError("סיסמה שגויה");
  };

  const openNew = () => { setEditEmp({...mkEmpty(cfg),id:generateId()}); setActiveTab("personal"); setView("form"); };
  const openEdit = (emp) => { setEditEmp({...emp}); setActiveTab("personal"); setView("form"); };

  const handleSave = async () => {
    if (!editEmp.fullName.trim()) return alert("שם מלא הוא שדה חובה");
    const exists = employees.find(e=>e.id===editEmp.id);
    const newList = exists ? employees.map(e=>e.id===editEmp.id?editEmp:e) : [...employees,editEmp];
    await saveAndSet(newList); setView("list");
  };

  const handleDelete = async (id) => { await saveAndSet(employees.filter(e=>e.id!==id)); setConfirmDelete(null); setView("list"); };

  const active = employees.filter(e=>e.status===cfg.statusOptions[0]).length;
  const leaves = employees.length - active;
  const red = employees.filter(e=>e.retentionStatus===cfg.retentionOptions[cfg.retentionOptions.length-1]).length;
  const yellow = employees.filter(e=>e.retentionStatus===cfg.retentionOptions[1]).length;
  const highBurnout = employees.filter(e=>{ const idx=cfg.burnoutOptions.indexOf(e.burnoutLevel); return idx>=cfg.burnoutOptions.length-2; }).length;
  const highPotential = employees.filter(e=>e.managementPotential===cfg.potentialOptions[0]).length;

  const filtered = employees.filter(e=>{
    const q=search.toLowerCase();
    return (!q||e.fullName.toLowerCase().includes(q)||e.roles.toLowerCase().includes(q)||e.team.toLowerCase().includes(q))
      &&(!filterStatus||e.status===filterStatus)
      &&(!filterTeam||e.team===filterTeam)
      &&(!filterRetention||e.retentionStatus===filterRetention);
  });

  const inp = {width:"100%",padding:"9px 11px",borderRadius:8,border:"1px solid #d1d5db",fontSize:14,direction:"rtl",boxSizing:"border-box",background:"#fff"};
  const lbl = {fontSize:13,color:"#374151",marginBottom:4,display:"block",fontWeight:600};
  const fg = (label,children) => <div style={{marginBottom:14}}><label style={lbl}>{label}</label>{children}</div>;
  const set = (field) => (e) => setEditEmp({...editEmp,[field]:e.target.value});

  if (!auth) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:20,padding:isMobile?28:40,width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",textAlign:"center",direction:"rtl"}}>
        <div style={{fontSize:44,marginBottom:8}}>🏫</div>
        <h2 style={{margin:"0 0 2px",color:"#1e293b",fontSize:22}}>{cfg.schoolName}</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>מאגר עובדים HR — גישה מורשית בלבד</p>
        <input type="password" placeholder="הכנסי סיסמה" value={pwInput}
          onChange={e=>setPwInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
          style={{...inp,marginBottom:12,fontSize:15,padding:"11px 14px"}}/>
        {pwError&&<div style={{color:"#ef4444",fontSize:13,marginBottom:10}}>{pwError}</div>}
        <button onClick={handleLogin} style={{width:"100%",padding:11,background:"#6366f1",color:"#fff",border:"none",borderRadius:10,fontSize:15,cursor:"pointer",fontWeight:700}}>כניסה</button>
      </div>
    </div>
  );

  const Header = () => (
    <div style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)",padding:isMobile?"12px 16px":"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:"0 2px 8px rgba(99,102,241,0.3)",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",gap:6,alignItems:"center"}}>
        {isMobile ? (
          <><button onClick={()=>setMobileNav(!mobileNav)} style={{background:"rgba(255,255,255,0.2)",border:"none",color:"#fff",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:18}}>☰</button>
          <span style={{color:"#fff",fontWeight:700,fontSize:15}}>🏫 {cfg.schoolName}</span></>
        ) : (
          <><span style={{color:"rgba(255,255,255,0.9)",fontWeight:700,fontSize:15,marginLeft:8}}>🏫 {cfg.schoolName}</span>
          {["dashboard","list"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"7px 18px",borderRadius:20,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,background:view===v?"#fff":"rgba(255,255,255,0.2)",color:view===v?"#6366f1":"#fff"}}>
              {v==="dashboard"?"📊 דשבורד":"👥 עובדים"}
            </button>
          ))}</>
        )}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {!isMobile&&<span style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>👤 {cfg.labels[auth]}</span>}
        <button onClick={()=>setShowSettings(true)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid rgba(255,255,255,0.4)",background:"rgba(255,255,255,0.15)",color:"#fff",cursor:"pointer",fontSize:14}}>⚙️ {!isMobile&&"הגדרות"}</button>
        <button onClick={()=>setAuth(null)} style={{padding:"5px 12px",borderRadius:20,border:"1px solid rgba(255,255,255,0.4)",background:"transparent",color:"#fff",cursor:"pointer",fontSize:13}}>יציאה</button>
      </div>
    </div>
  );

  const MobileDrawer = () => !mobileNav ? null : (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:200}}>
      <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}} onClick={()=>setMobileNav(false)}/>
      <div style={{position:"absolute",right:0,top:0,bottom:0,width:220,background:"#fff",padding:24,direction:"rtl",boxShadow:"-4px 0 20px rgba(0,0,0,0.15)"}}>
        <div style={{fontWeight:700,fontSize:16,color:"#6366f1",marginBottom:20}}>🏫 {cfg.schoolName}</div>
        {["dashboard","list"].map(v=>(
          <button key={v} onClick={()=>{setView(v);setMobileNav(false);}} style={{display:"block",width:"100%",padding:"12px 14px",marginBottom:8,borderRadius:10,border:"none",cursor:"pointer",fontSize:15,fontWeight:600,background:view===v?"#6366f1":"#f1f5f9",color:view===v?"#fff":"#1e293b",textAlign:"right"}}>
            {v==="dashboard"?"📊 דשבורד":"👥 עובדים"}
          </button>
        ))}
        <button onClick={()=>{setShowSettings(true);setMobileNav(false);}} style={{display:"block",width:"100%",padding:"12px 14px",marginBottom:8,borderRadius:10,border:"none",cursor:"pointer",fontSize:15,fontWeight:600,background:"#f1f5f9",color:"#1e293b",textAlign:"right"}}>⚙️ הגדרות</button>
        <div style={{marginTop:20,paddingTop:20,borderTop:"1px solid #e2e8f0",fontSize:13,color:"#64748b"}}>👤 {cfg.labels[auth]}</div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div>
      <h2 style={{marginBottom:16,color:"#1e293b",fontSize:isMobile?18:22}}>סקירה כללית</h2>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":isTablet?"repeat(3,1fr)":"repeat(7,1fr)",gap:10,marginBottom:20}}>
        <StatCard label="סך עובדים" value={employees.length} color="#6366f1"/>
        <StatCard label="פעילים" value={active} color="#22c55e"/>
        <StatCard label='חופשות / חל"ת' value={leaves} color="#f59e0b"/>
        <StatCard label="🔴 בסכנת עזיבה" value={red} color="#ef4444"/>
        <StatCard label="🟡 מעקב שימור" value={yellow} color="#eab308"/>
        <StatCard label="שחיקה גבוהה" value={highBurnout} color="#f97316"/>
        <StatCard label="פוטנציאל גבוה" value={highPotential} color="#0ea5e9"/>
      </div>
      {employees.length===0 ? (
        <div style={{textAlign:"center",padding:60,color:"#94a3b8"}}><div style={{fontSize:48}}>📊</div><p>אין עובדים עדיין.</p></div>
      ) : (<>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16,marginBottom:16}}>
          {[
            {title:"התפלגות סטטוס",data:cfg.statusOptions.map((s,i)=>({name:s,value:employees.filter(e=>e.status===s).length,color:["#6366f1","#f59e0b","#60a5fa","#f472b6","#a78bfa"][i%5]}))},
            {title:"סטטוס שימור",data:cfg.retentionOptions.map(r=>({name:r,value:employees.filter(e=>e.retentionStatus===r).length,color:cfg.retentionColors[r]||"#94a3b8"}))},
            {title:"רמת שחיקה",data:cfg.burnoutOptions.map(b=>({name:b,value:employees.filter(e=>e.burnoutLevel===b).length,color:cfg.burnoutColors[b]||"#94a3b8"}))}
          ].map(chart=>(
            <div key={chart.title} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
              <h3 style={{margin:"0 0 10px",color:"#1e293b",fontSize:13,fontWeight:700}}>{chart.title}</h3>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chart.data.filter(d=>d.value>0)} cx="50%" cy="50%" outerRadius={68} dataKey="value" label={({name,value})=>`${name} (${value})`} labelLine={false} fontSize={10}>
                    {chart.data.map(d=><Cell key={d.name} fill={d.color}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
            <h3 style={{margin:"0 0 10px",color:"#1e293b",fontSize:13,fontWeight:700}}>עובדים לפי צוות</h3>
            <ResponsiveContainer width="100%" height={Math.max(180,cfg.teams.length*28)}>
              <BarChart data={cfg.teams.map(t=>({name:t,עובדים:employees.filter(e=>e.team===t).length})).filter(d=>d.עובדים>0)} layout="vertical" margin={{right:30,left:10}}>
                <XAxis type="number" allowDecimals={false} fontSize={11}/>
                <YAxis type="category" dataKey="name" width={130} fontSize={11}/>
                <Tooltip/><Bar dataKey="עובדים" fill="#6366f1" radius={[0,6,6,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[
              {title:"פוטנציאל ניהולי",data:cfg.potentialOptions.map((p,i)=>({name:p,value:employees.filter(e=>e.managementPotential===p).length,color:["#6366f1","#60a5fa","#94a3b8","#e2e8f0"][i%4]}))},
              {title:"מגמת היעדרויות",data:cfg.absenceTrend.map((a,i)=>({name:a,value:employees.filter(e=>e.absenceTrend===a).length,color:["#22c55e","#60a5fa","#ef4444"][i%3]}))}
            ].map(chart=>(
              <div key={chart.title} style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",flex:1}}>
                <h3 style={{margin:"0 0 8px",color:"#1e293b",fontSize:13,fontWeight:700}}>{chart.title}</h3>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={chart.data} margin={{top:0,right:10,left:-20,bottom:0}}>
                    <XAxis dataKey="name" fontSize={11}/><YAxis allowDecimals={false} fontSize={11}/>
                    <Tooltip/><Bar dataKey="value" radius={[6,6,0,0]}>{chart.data.map(d=><Cell key={d.name} fill={d.color}/>)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </div>
        {employees.filter(e=>!e.lastCheckinDate).length>0&&(
          <div style={{background:"#fff",borderRadius:12,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",borderRight:"4px solid #f59e0b"}}>
            <h3 style={{margin:"0 0 10px",color:"#1e293b",fontSize:14}}>⚠️ עובדים ללא שיחת "מה נשמע"</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {employees.filter(e=>!e.lastCheckinDate).map(e=>(
                <span key={e.id} onClick={()=>openEdit(e)} style={{background:"#fef3c7",color:"#92400e",padding:"4px 12px",borderRadius:20,fontSize:13,cursor:"pointer"}}>{e.fullName}</span>
              ))}
            </div>
          </div>
        )}
      </>)}
    </div>
  );

  const EmployeeList = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <h2 style={{margin:0,color:"#1e293b",fontSize:isMobile?17:22}}>רשימת עובדים ({filtered.length})</h2>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>exportCSV(employees)} style={{padding:"8px 12px",background:"#10b981",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>⬇️ ייצוא</button>
          <label style={{padding:"8px 12px",background:"#0ea5e9",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>
            📂 ייבוא
            <input type="file" accept=".csv" style={{display:"none"}} onChange={e=>{
              const file=e.target.files[0]; if(!file) return;
              importCSV(file,employees,cfg,async(merged,count)=>{ await saveAndSet(merged); setImportMsg(`✅ יובאו ${count} עובדים`); setTimeout(()=>setImportMsg(""),4000); });
              e.target.value="";
            }}/>
          </label>
          <button onClick={openNew} style={{padding:"8px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:600}}>+ הוספה</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)",gap:8,marginBottom:14}}>
        <input placeholder="🔍 חיפוש..." value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,fontSize:13}}/>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...inp,fontSize:13}}><option value="">כל הסטטוסים</option>{cfg.statusOptions.map(s=><option key={s}>{s}</option>)}</select>
        <select value={filterTeam} onChange={e=>setFilterTeam(e.target.value)} style={{...inp,fontSize:13}}><option value="">כל הצוותים</option>{cfg.teams.map(t=><option key={t}>{t}</option>)}</select>
        <select value={filterRetention} onChange={e=>setFilterRetention(e.target.value)} style={{...inp,fontSize:13}}><option value="">כל השימור</option>{cfg.retentionOptions.map(r=><option key={r}>{r}</option>)}</select>
      </div>
      {importMsg&&<div style={{background:"#dcfce7",color:"#166534",padding:"10px 14px",borderRadius:8,marginBottom:10,fontWeight:600,fontSize:13}}>{importMsg}</div>}
      {filtered.length===0 ? (
        <div style={{textAlign:"center",padding:60,color:"#94a3b8"}}>{employees.length===0?<><div style={{fontSize:48}}>👥</div><p>אין עובדים עדיין.</p></>:<div>לא נמצאו תוצאות</div>}</div>
      ) : isMobile ? (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {filtered.map(emp=>(
            <div key={emp.id} onClick={()=>openEdit(emp)} style={{background:"#fff",borderRadius:12,padding:14,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",cursor:"pointer",borderRight:`4px solid ${cfg.retentionColors[emp.retentionStatus]||"#94a3b8"}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div><div style={{fontWeight:700,color:"#1e293b",fontSize:15}}>{emp.fullName}</div><div style={{color:"#64748b",fontSize:12,marginTop:2}}>{emp.team}</div></div>
                <span style={{background:emp.status===cfg.statusOptions[0]?"#dcfce7":"#fef9c3",color:emp.status===cfg.statusOptions[0]?"#166534":"#92400e",padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{emp.status}</span>
              </div>
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                <span style={{fontSize:11,color:cfg.burnoutColors[emp.burnoutLevel]||"#94a3b8",fontWeight:600}}>שחיקה: {emp.burnoutLevel}</span>
                <span style={{fontSize:11,color:"#6366f1",fontWeight:600}}>פוטנציאל: {emp.managementPotential}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.08)",overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:700}}>
            <thead><tr style={{background:"#f8fafc",borderBottom:"2px solid #e2e8f0"}}>{["שם מלא","תפקיד","צוות","סטטוס","שימור","שחיקה","שיחה אחרונה","פוטנציאל",""].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"right",color:"#475569",fontWeight:700,whiteSpace:"nowrap"}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((emp,i)=>(
                <tr key={emp.id} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#fafafa"}}>
                  <td style={{padding:"10px 14px",fontWeight:700,color:"#1e293b"}}>{emp.fullName}</td>
                  <td style={{padding:"10px 14px",color:"#475569",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{emp.roles}</td>
                  <td style={{padding:"10px 14px"}}>{emp.team}</td>
                  <td style={{padding:"10px 14px"}}><span style={{background:emp.status===cfg.statusOptions[0]?"#dcfce7":"#fef9c3",color:emp.status===cfg.statusOptions[0]?"#166534":"#92400e",padding:"2px 10px",borderRadius:20,fontSize:12,fontWeight:600}}>{emp.status}</span></td>
                  <td style={{padding:"10px 14px"}}><span style={{display:"inline-block",width:14,height:14,borderRadius:"50%",background:cfg.retentionColors[emp.retentionStatus]||"#94a3b8",verticalAlign:"middle"}}/></td>
                  <td style={{padding:"10px 14px"}}><span style={{color:cfg.burnoutColors[emp.burnoutLevel]||"#94a3b8",fontWeight:600}}>{emp.burnoutLevel}</span></td>
                  <td style={{padding:"10px 14px",color:"#64748b",fontSize:12}}>{emp.lastCheckinDate||"—"}</td>
                  <td style={{padding:"10px 14px"}}><span style={{color:emp.managementPotential===cfg.potentialOptions[0]?"#6366f1":"#94a3b8",fontWeight:emp.managementPotential===cfg.potentialOptions[0]?700:400}}>{emp.managementPotential}</span></td>
                  <td style={{padding:"10px 14px"}}><button onClick={()=>openEdit(emp)} style={{padding:"4px 12px",background:"#6366f1",color:"#fff",border:"none",borderRadius:6,cursor:"pointer",fontSize:12}}>עריכה</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const EmployeeForm = () => (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button onClick={()=>setView("list")} style={{padding:"6px 12px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",fontSize:13}}>← חזרה</button>
          <h2 style={{margin:0,color:"#1e293b",fontSize:isMobile?16:20}}>{employees.find(e=>e.id===editEmp.id)?`✏️ ${editEmp.fullName||"עובד"}`:"➕ עובד חדש"}</h2>
        </div>
        <div style={{display:"flex",gap:6}}>
          {employees.find(e=>e.id===editEmp.id)&&<button onClick={()=>setConfirmDelete(editEmp.id)} style={{padding:"8px 12px",background:"#fee2e2",color:"#ef4444",border:"none",borderRadius:8,cursor:"pointer",fontSize:13,fontWeight:600}}>🗑</button>}
          <button onClick={handleSave} style={{padding:"8px 18px",background:"#6366f1",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:14,fontWeight:700}}>💾 שמירה</button>
        </div>
      </div>
      <div style={{display:"flex",gap:6,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
        {FORM_TABS.map(t=><button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:isMobile?"7px 12px":"8px 16px",border:"none",borderRadius:20,cursor:"pointer",fontSize:isMobile?12:13,fontWeight:600,background:activeTab===t.id?"#6366f1":"#f1f5f9",color:activeTab===t.id?"#fff":"#475569",whiteSpace:"nowrap",flexShrink:0}}>{t.label}</button>)}
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:isMobile?16:24,boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>
        {activeTab==="personal"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 20px"}}>
          {fg("שם מלא *",<input style={inp} value={editEmp.fullName} onChange={set("fullName")}/>)}
          {fg("תאריך לידה",<input type="date" style={inp} value={editEmp.birthDate} onChange={set("birthDate")}/>)}
          {fg("טלפון נייד",<input style={inp} value={editEmp.phone} onChange={set("phone")}/>)}
          {fg("כתובת מייל",<input style={inp} value={editEmp.email} onChange={set("email")}/>)}
          {fg("צוות",<select style={inp} value={editEmp.team} onChange={set("team")}><option value="">בחר צוות</option>{cfg.teams.map(t=><option key={t}>{t}</option>)}</select>)}
          {fg("סטטוס",<select style={inp} value={editEmp.status} onChange={set("status")}>{cfg.statusOptions.map(s=><option key={s}>{s}</option>)}</select>)}
          {fg("שיוך ועדי",<input style={inp} value={editEmp.committees} onChange={set("committees")}/>)}
          {fg('"הדבר הקטן"',<input style={inp} value={editEmp.smallThing} onChange={set("smallThing")}/>)}
        </div>}
        {activeTab==="role"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 20px"}}>
          <div style={{gridColumn:"1/-1"}}>{fg("תפקיד עיקרי",<textarea style={{...inp,height:70,resize:"vertical"}} value={editEmp.roles} onChange={set("roles")}/>)}</div>
          {fg("תחילת עבודה בחינוך",<input type="date" style={inp} value={editEmp.eduStartDate} onChange={set("eduStartDate")}/>)}
          {fg("ותק בחינוך (שנים)",<input type="number" style={inp} value={editEmp.eduSeniority} onChange={set("eduSeniority")}/>)}
          {fg('תחילת עבודה בביה"ס',<input type="date" style={inp} value={editEmp.schoolStartDate} onChange={set("schoolStartDate")}/>)}
          {fg('ותק בביה"ס (שנים)',<input type="number" style={inp} value={editEmp.schoolSeniority} onChange={set("schoolSeniority")}/>)}
        </div>}
        {activeTab==="development"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 20px"}}>
          {fg("פוטנציאל ניהולי",<select style={inp} value={editEmp.managementPotential} onChange={set("managementPotential")}>{cfg.potentialOptions.map(p=><option key={p}>{p}</option>)}</select>)}
          <div/>
          <div style={{gridColumn:"1/-1"}}>{fg("שאיפות קריירה",<textarea style={{...inp,height:60,resize:"vertical"}} value={editEmp.careerAspirations} onChange={set("careerAspirations")}/>)}</div>
          <div style={{gridColumn:"1/-1"}}>{fg("יעד שנתי",<textarea style={{...inp,height:60,resize:"vertical"}} value={editEmp.annualGoal} onChange={set("annualGoal")}/>)}</div>
          <div style={{gridColumn:"1/-1"}}>{fg("משוב רכזים",<textarea style={{...inp,height:80,resize:"vertical"}} value={editEmp.coordinatorFeedback} onChange={set("coordinatorFeedback")}/>)}</div>
        </div>}
        {activeTab==="welfare"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 20px"}}>
          {fg("סטטוס שימור",<select style={inp} value={editEmp.retentionStatus} onChange={set("retentionStatus")}>{cfg.retentionOptions.map(r=><option key={r}>{r}</option>)}</select>)}
          {fg("מגמת היעדרויות",<select style={inp} value={editEmp.absenceTrend} onChange={set("absenceTrend")}>{cfg.absenceTrend.map(a=><option key={a}>{a}</option>)}</select>)}
          {fg("רמת שחיקה",<select style={inp} value={editEmp.burnoutLevel} onChange={set("burnoutLevel")}>{cfg.burnoutOptions.map(b=><option key={b}>{b}</option>)}</select>)}
          <div/>
          {fg("תאריך שיחה קודמת",<input type="date" style={inp} value={editEmp.prevCheckinDate} onChange={set("prevCheckinDate")}/>)}
          {fg("מי ביצע (קודמת)",<input style={inp} value={editEmp.prevCheckinBy} onChange={set("prevCheckinBy")}/>)}
          {fg("תאריך שיחה אחרונה",<input type="date" style={inp} value={editEmp.lastCheckinDate} onChange={set("lastCheckinDate")}/>)}
          {fg("מי ביצע (אחרונה)",<input style={inp} value={editEmp.lastCheckinBy} onChange={set("lastCheckinBy")}/>)}
          <div style={{gridColumn:"1/-1"}}>{fg("הערות משיחות",<textarea style={{...inp,height:70,resize:"vertical"}} value={editEmp.checkinNotes} onChange={set("checkinNotes")}/>)}</div>
          {fg("מחלה",<input style={inp} value={editEmp.illness} onChange={set("illness")}/>)}
          {fg("אירועי חיים",<input style={inp} value={editEmp.lifeEvents} onChange={set("lifeEvents")}/>)}
        </div>}
        {activeTab==="salary"&&<div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:"0 20px"}}>
          {fg("רפורמת שכר",<input style={inp} value={editEmp.salaryReform} onChange={set("salaryReform")}/>)}
          {fg("מספר גמולים",<input type="number" style={inp} value={editEmp.benefits} onChange={set("benefits")}/>)}
          {fg("דרגה נוכחית",<input style={inp} value={editEmp.currentGrade} onChange={set("currentGrade")}/>)}
          {fg("צפי קידום דרגה",<input type="number" style={inp} value={editEmp.gradePromotionYear} onChange={set("gradePromotionYear")}/>)}
          <div style={{gridColumn:"1/-1"}}>{fg("פניות פתוחות שכר",<textarea style={{...inp,height:70,resize:"vertical"}} value={editEmp.salaryIssues} onChange={set("salaryIssues")}/>)}</div>
        </div>}
        {activeTab==="notes"&&fg("הערות כלליות",<textarea style={{...inp,height:200,resize:"vertical"}} value={editEmp.generalNotes||""} onChange={set("generalNotes")}/>)}
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"#f8fafc",fontFamily:"'Segoe UI',Arial,sans-serif",direction:"rtl"}}>
      <Header/>
      <MobileDrawer/>
      <div style={{padding:isMobile?"12px":"24px",maxWidth:1400,margin:"0 auto"}}>
        {view==="dashboard"&&<Dashboard/>}
        {view==="list"&&<EmployeeList/>}
        {view==="form"&&editEmp&&<EmployeeForm/>}
      </div>
      {showSettings&&<SettingsPanel cfg={cfg} onSave={handleSaveConfig} onClose={()=>setShowSettings(false)}/>}
      {confirmDelete&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
          <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:320,textAlign:"center",direction:"rtl"}}>
            <div style={{fontSize:36,marginBottom:10}}>⚠️</div>
            <h3 style={{margin:"0 0 8px"}}>מחיקת עובד</h3>
            <p style={{color:"#64748b",marginBottom:22,fontSize:14}}>האם את בטוחה? פעולה זו אינה הפיכה.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setConfirmDelete(null)} style={{padding:"8px 20px",background:"#f1f5f9",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>ביטול</button>
              <button onClick={()=>handleDelete(confirmDelete)} style={{padding:"8px 20px",background:"#ef4444",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:600}}>מחיקה</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}