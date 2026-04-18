const SUPABASE_URL = "https://izswetacghaqelgjarij.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6c3dldGFjZ2hhcWVsZ2phcmlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTkxMjksImV4cCI6MjA5MjA5NTEyOX0.K1FdnIXtr7RDbevCov2JYrE2b45LHbxHTVpAej-_ikg";

const WEEKLY_BUDGET = 200;

function getMonday(d = new Date()) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

async function supabaseRequest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  if (res.status === 204) return null;
  return res.json();
}

async function loadWeekData() {
  const monday = getMonday();
  const mondayIso = monday.toISOString();

  const data = await supabaseRequest(
    `/rest/v1/entries?select=amount,created_at&created_at=gte.${encodeURIComponent(mondayIso)}`
  );

  const sum = (data || []).reduce((acc, row) => acc + Number(row.amount || 0), 0);
  document.getElementById("wochensumme").textContent = `${sum.toFixed(2)} €`;
  document.getElementById("restbudget").textContent = `${(WEEKLY_BUDGET - sum).toFixed(2)} €`;
}

async function saveEntry() {
  const amount = parseFloat(document.getElementById("amount").value);
  const note = document.getElementById("note").value;

  if (isNaN(amount)) {
    document.getElementById("msg").textContent = "Bitte Betrag eingeben.";
    return;
  }

  await supabaseRequest("/rest/v1/entries", {
    method: "POST",
    body: JSON.stringify([
      {
        amount,
        note
      }
    ]),
    headers: {
      "Prefer": "return=minimal"
    }
  });

  document.getElementById("amount").value = "";
  document.getElementById("note").value = "";
  document.getElementById("msg").textContent = "Gespeichert ✔";
  loadWeekData();
}

document.getElementById("saveBtn").addEventListener("click", saveEntry);

loadWeekData().catch(err => {
  document.getElementById("msg").textContent = "Fehler beim Laden.";
  console.error(err);
});
