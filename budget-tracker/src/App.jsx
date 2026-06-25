const API_URL =
  import.meta.env.VITE_API_URL;

const API_KEY =
  import.meta.env.VITE_API_KEY;

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import {
  CalendarDays, CalendarRange, PlusCircle, Settings2, ChevronLeft, ChevronRight,
  Plus, Trash2, ClipboardPaste, Pencil, X, Wallet, RotateCcw
} from 'lucide-react';

/* =========================================================================
   DESIGN TOKENS
   ========================================================================= */
const COLORS = {
  paper: '#EAEDF2',
  surface: '#FFFFFF',
  ink: '#1C2430',
  inkSoft: '#5C6573',
  inkFaint: '#8C94A1',
  hairline: '#D8DCE3',
  teal: '#2F6F62',
  tealSoft: '#E3EEEB',
  amber: '#C2873A',
  amberSoft: '#F5EBDB',
  rust: '#B6473B',
  rustSoft: '#F5E3E0',
};

const FONT_DISPLAY = "'Fraunces', serif";
const FONT_BODY = "'Manrope', sans-serif";
const FONT_MONO = "'IBM Plex Mono', monospace";

const INCOME_PALETTE = ['#2F6F62', '#3E8E7E', '#1F5C50', '#4F9E8C', '#276358'];
const SAVINGS_PALETTE = ['#4F7CAC', '#3C6491', '#6F93BE', '#2C4F72', '#5685A8'];
const EXPENSE_PALETTE = [
  '#C2873A', '#B6473B', '#8B5FBF', '#A14E72', '#D17A22', '#6F4E7C', '#1B2430',
  '#5B6472', '#946C4A', '#B0793D', '#4A6B5C', '#8A5A8A', '#C45A4A', '#5C7A9E',
  '#9B6B3C', '#6B8E6E', '#7A4E63', '#9E7A3F', '#5E7A8E', '#8E5E5E', '#6E7A3F',
  '#7A5E9E', '#3F6E7A', '#9E6E3F',
];
function paletteForGroup(group) {
  if (group === 'income') return INCOME_PALETTE;
  if (group === 'savings') return SAVINGS_PALETTE;
  return EXPENSE_PALETTE;
}

function slugify(name) {
  return name.toLowerCase()
    .replace(/%/g, 'pct')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '');
}

const RAW_CATEGORIES = [
  { name: 'Jacobus Salary Income', group: 'income' },
  { name: 'Juane Salary Income', group: 'income' },
  { name: 'Best Start Grant', group: 'income' },
  { name: 'Other Income', group: 'income' },
  { name: 'Save %/invest', group: 'savings' },
  { name: 'Save %/invest James', group: 'savings' },
  { name: 'Save parental leave', group: 'savings' },
  { name: 'Other Savings', group: 'savings' },
  { name: 'Rent/Mortgage', group: 'expense' },
  { name: 'Water charges', group: 'expense' },
  { name: 'House & Contents Insurance', group: 'expense' },
  { name: 'Car Insurance', group: 'expense' },
  { name: 'Electricity/Gas', group: 'expense' },
  { name: 'Wifi', group: 'expense' },
  { name: 'Mobile Phone', group: 'expense' },
  { name: 'Huis Insurance', group: 'expense' },
  { name: 'Rates', group: 'expense' },
  { name: 'Life and Trauma Insurance', group: 'expense' },
  { name: 'Kindy', group: 'expense' },
  { name: 'Gym', group: 'expense' },
  { name: 'Car Payment', group: 'expense' },
  { name: 'Food', group: 'expense' },
  { name: 'Petrol', group: 'expense' },
  { name: 'Vehicle Maintenance', group: 'expense' },
  { name: 'Entertainment', group: 'expense' },
  { name: 'Personal Care', group: 'expense' },
  { name: 'Subscriptions', group: 'expense' },
  { name: 'Clothing', group: 'expense' },
  { name: 'One-Off', group: 'expense' },
  { name: 'Travel', group: 'expense' },
  { name: 'Other Expenses', group: 'expense' },
  { name: 'Rosie Expenses', group: 'expense' },
];

const DEFAULT_CATEGORIES = (() => {
  const counts = { income: 0, savings: 0, expense: 0 };
  return RAW_CATEGORIES.map((c) => {
    const palette = paletteForGroup(c.group);
    const color = palette[counts[c.group] % palette.length];
    counts[c.group] += 1;
    return { id: slugify(c.name), name: c.name, group: c.group, color };
  });
})();

const CATEGORY_KEYWORDS = {
  food: ['countdown', 'new world', 'pak n save', 'paknsave', 'woolworths', 'fresh choice', 'four square'],
  petrol: ['bp connect', 'bp ', 'z energy', 'mobil', 'gull', 'caltex'],
  'electricity-gas': ['contact energy', 'mercury energy', 'genesis energy', 'nova energy', 'flick electric', 'frank energy'],
  wifi: ['fibre', 'broadband', 'ufb', 'orcon', 'slingshot', 'voyager internet'],
  'mobile-phone': ['skinny mobile', 'prepay', 'mobile plan'],
  subscriptions: ['netflix', 'spotify', 'disney', 'amazon prime', 'sky tv', 'youtube premium', 'apple.com/bill', 'icloud'],
  gym: ['les mills', 'anytime fitness', 'jetts', 'club physical', 'snap fitness'],
  kindy: ['early learning', 'kindergarten', 'childcare', 'day care', 'kindy'],
  rates: ['city council', 'district council rates', 'council rates'],
  'water-charges': ['watercare'],
  'rent-mortgage': ['rent', 'mortgage', 'body corporate', 'property management'],
  'vehicle-maintenance': ['repco', 'supercheap auto', 'vtnz', 'wof', 'tyres'],
  entertainment: ['cinema', 'event cinemas', 'reading cinema', 'ticketek', 'eventfinda'],
  clothing: ['kmart', 'farmers', 'postie', 'hallenstein', 'glassons', 'cotton on'],
  travel: ['air new zealand', 'jetstar', 'booking.com', 'airbnb', 'flight centre'],
  'personal-care': ['hairdresser', 'barber', 'beauty therapy'],
};

const ACCOUNTS = ['ASB', 'Westpac', 'Cash', 'Other'];
const GROUP_LABELS = { income: 'Income', savings: 'Savings', expense: 'Expenses' };

/* =========================================================================
   DATE HELPERS
   ========================================================================= */
function pad(n) { return String(n).padStart(2, '0'); }
function toKey(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
function monthKeyOf(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
function daysInMonthOf(d) { return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); }
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}
function getWeekDates(monday) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    out.push(d);
  }
  return out;
}
function addDays(d, n) { const nd = new Date(d); nd.setDate(nd.getDate() + n); return nd; }
function addMonths(d, n) { return new Date(d.getFullYear(), d.getMonth() + n, 1); }
function todayKey() { return toKey(new Date()); }

function fmtDayShort(d) { return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]; }
function fmtMonthLabel(d) { return d.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' }); }
function fmtWeekLabel(weekDates) {
  const a = weekDates[0], b = weekDates[6];
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  const aLabel = a.toLocaleDateString('en-NZ', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  const bLabel = b.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${aLabel} \u2013 ${bLabel}`;
}
function fmtMoney(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}
function fmtMoneyShort(n) {
  const v = Number(n) || 0;
  return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

/* =========================================================================
   BUDGET HELPERS
   ========================================================================= */
function effectiveBudgetInfo(budgets, mKey, catId) {
  const keys = Object.keys(budgets).filter((k) => k <= mKey).sort().reverse();
  for (const k of keys) {
    if (budgets[k] && budgets[k][catId] !== undefined) {
      return { amount: budgets[k][catId], sourceMonth: k, inherited: k !== mKey };
    }
  }
  return { amount: 0, sourceMonth: null, inherited: false };
}
function effectiveBudget(budgets, mKey, catId) {
  return effectiveBudgetInfo(budgets, mKey, catId).amount;
}
function weeklyBudgetForCat(budgets, weekMonday, catId) {
  const days = getWeekDates(weekMonday);
  let total = 0;
  for (const d of days) {
    const mk = monthKeyOf(d);
    total += effectiveBudget(budgets, mk, catId) / daysInMonthOf(d);
  }
  return total;
}
function dailyPaceTotal(budgets, categoriesSubset, d) {
  const mk = monthKeyOf(d);
  const dim = daysInMonthOf(d);
  return categoriesSubset.reduce((s, c) => s + effectiveBudget(budgets, mk, c.id) / dim, 0);
}
// "less is better" — used for Expenses (over budget = bad)
function statusColorExpense(spent, budget) {
  if (budget <= 0.004) return spent > 0 ? COLORS.rust : COLORS.inkFaint;
  const ratio = spent / budget;
  if (ratio > 1) return COLORS.rust;
  if (ratio >= 0.8) return COLORS.amber;
  return COLORS.teal;
}
// "more is better" — used for Income & Savings (falling short = bad)
function statusColorPositive(actual, target) {
  if (target <= 0.004) return actual > 0 ? COLORS.teal : COLORS.inkFaint;
  const ratio = actual / target;
  if (ratio >= 1) return COLORS.teal;
  if (ratio >= 0.8) return COLORS.amber;
  return COLORS.rust;
}

/* =========================================================================
   STATEMENT PASTE PARSER
   ========================================================================= */
function parseStatementLine(line) {
  let delimiter = '\t';
  if (!line.includes('\t')) {
    const commaCount = (line.match(/,/g) || []).length;
    delimiter = commaCount >= 2 ? ',' : null;
  }
  let cols;
  if (delimiter) {
    cols = line.split(delimiter).map((s) => s.trim()).filter((s) => s.length > 0);
  } else {
    cols = line.trim().split(/\s{2,}/).filter((s) => s.length > 0);
    if (cols.length < 2) cols = line.trim().split(/\s+/);
  }
  const joined = cols.join(' ');

  let date = null;
  const ymd = joined.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);
  const dmy = joined.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b/);
  if (ymd) {
    date = `${ymd[1]}-${pad(+ymd[2])}-${pad(+ymd[3])}`;
  } else if (dmy) {
    const yr = dmy[3].length === 2 ? '20' + dmy[3] : dmy[3];
    date = `${yr}-${pad(+dmy[2])}-${pad(+dmy[1])}`; // assume DD/MM/YYYY (NZ format)
  }

  const moneyMatches = [...joined.matchAll(/-?\$?[\d,]*\d\.\d{2}/g)].map((m) => m[0]);
  let amountStr = null;
  if (moneyMatches.length >= 2) {
    amountStr = moneyMatches[moneyMatches.length - 2];
  } else if (moneyMatches.length === 1) {
    amountStr = moneyMatches[0];
  }
  const amount = amountStr ? parseFloat(amountStr.replace(/[$,]/g, '')) : null;

  let desc = joined;
  if (ymd) desc = desc.replace(ymd[0], '');
  if (dmy) desc = desc.replace(dmy[0], '');
  for (const m of moneyMatches) desc = desc.replace(m, '');
  desc = desc.replace(/\s+/g, ' ').trim();

  return { date, amount, desc };
}

function findByExactName(categories, name) {
  const m = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return m ? m.id : null;
}

function suggestCategory(desc, amount, categories) {
  const lower = (desc || '').toLowerCase();
  if (amount != null && amount > 0) {
    const firstIncome = categories.find((c) => c.group === 'income');
    return findByExactName(categories, 'Other Income') || (firstIncome ? firstIncome.id : (categories[0] ? categories[0].id : null));
  }
  for (const [key, words] of Object.entries(CATEGORY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) {
      const match = categories.find((c) => c.id === key);
      if (match) return match.id;
    }
  }
  const firstExpense = categories.find((c) => c.group === 'expense');
  return findByExactName(categories, 'Other Expenses') || (firstExpense ? firstExpense.id : (categories[0] ? categories[0].id : null));
}

function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/* =========================================================================
   SMALL SHARED UI PIECES
   ========================================================================= */
function FontStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap');
      * { box-sizing: border-box; }
      input, select, textarea, button { font-family: ${FONT_BODY}; }
      input::placeholder, textarea::placeholder { color: ${COLORS.inkFaint}; }
    `}</style>
  );
}

function PeriodNav({ label, onPrev, onNext, onToday, isCurrent }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 20px 14px' }}>
      <button onClick={onPrev} aria-label="Previous period" style={navBtnStyle}>
        <ChevronLeft size={18} color={COLORS.ink} />
      </button>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 19, color: COLORS.ink, letterSpacing: '-0.01em' }}>
          {label}
        </div>
        {!isCurrent && (
          <button onClick={onToday} style={{ background: 'none', border: 'none', color: COLORS.teal, fontSize: 12, fontWeight: 600, padding: '2px 0 0', cursor: 'pointer' }}>
            Jump to today
          </button>
        )}
      </div>
      <button onClick={onNext} aria-label="Next period" style={navBtnStyle}>
        <ChevronRight size={18} color={COLORS.ink} />
      </button>
    </div>
  );
}
const navBtnStyle = {
  width: 34, height: 34, borderRadius: 17, border: `1px solid ${COLORS.hairline}`,
  background: COLORS.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
};

function StatBlock({ label, value, color }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: COLORS.inkFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 600, color, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </div>
    </div>
  );
}
function Divider() {
  return <div style={{ width: 1, background: COLORS.hairline, margin: '2px 14px' }} />;
}

/* Headline 3-row summary: Income / Savings / Expenses, actual vs target */
function GroupSummaryRow({ label, actual, target, direction }) {
  const color = direction === 'positive' ? statusColorPositive(actual, target) : statusColorExpense(actual, target);
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : (actual > 0 ? 100 : 0);
  const diff = actual - target;
  const actualLabel = direction === 'positive' ? 'Actual' : 'Spent';
  const targetLabel = direction === 'positive' ? 'Target' : 'Budget';
  let footer = null, footerColor = COLORS.inkFaint;
  if (target > 0.004) {
    if (direction === 'positive') {
      footer = diff >= 0 ? `${fmtMoney(diff)} above target` : `${fmtMoney(Math.abs(diff))} short of target`;
      footerColor = diff >= 0 ? COLORS.teal : color;
    } else {
      footer = diff > 0 ? `${fmtMoney(diff)} over budget` : `${fmtMoney(Math.abs(diff))} remaining`;
      footerColor = diff > 0 ? COLORS.rust : COLORS.inkSoft;
    }
  }
  return (
    <div style={{ padding: '13px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7, gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.ink, flexShrink: 0 }}>{label}</span>
        <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: COLORS.inkSoft, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
          {actualLabel} {fmtMoneyShort(actual)} <span style={{ color: COLORS.inkFaint }}>/ {targetLabel} {fmtMoneyShort(target)}</span>
        </span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: COLORS.hairline, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      {footer && <div style={{ fontSize: 11, fontWeight: 600, color: footerColor, marginTop: 4 }}>{footer}</div>}
    </div>
  );
}
function GroupSummary({ rows }) {
  return (
    <div style={{ margin: '0 20px 18px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, overflow: 'hidden' }}>
      {rows.map((r, i) => (
        <div key={r.label} style={{ borderTop: i === 0 ? 'none' : `1px solid ${COLORS.hairline}` }}>
          <GroupSummaryRow {...r} />
        </div>
      ))}
    </div>
  );
}

function CategoryRow({ cat, actual, target, direction }) {
  const color = direction === 'positive' ? statusColorPositive(actual, target) : statusColorExpense(actual, target);
  const pct = target > 0 ? Math.min(100, (actual / target) * 100) : (actual > 0 ? 100 : 0);
  const diff = actual - target;
  let footer = null, footerColor = COLORS.inkFaint;
  if (target > 0.004) {
    if (direction === 'positive') {
      footer = diff >= 0 ? `${fmtMoney(diff)} above target` : `${fmtMoney(Math.abs(diff))} short of target`;
      footerColor = diff >= 0 ? COLORS.inkFaint : color;
    } else {
      footer = diff > 0 ? `${fmtMoney(diff)} over budget` : `${fmtMoney(Math.abs(diff))} left`;
      footerColor = diff > 0 ? COLORS.rust : COLORS.inkFaint;
    }
  }
  return (
    <div style={{ padding: '11px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <span style={{ width: 9, height: 9, borderRadius: 5, background: cat.color, flexShrink: 0 }} />
          <span style={{ fontSize: 14.5, fontWeight: 600, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {cat.name}
          </span>
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, color: COLORS.inkSoft, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
          {fmtMoney(actual)} <span style={{ color: COLORS.inkFaint }}>/ {fmtMoney(target)}</span>
        </div>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: COLORS.hairline, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3 }} />
      </div>
      {footer && <div style={{ fontSize: 11, color: footerColor, marginTop: 4, fontWeight: 600 }}>{footer}</div>}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ padding: '4px 20px 10px', fontSize: 12, fontWeight: 700, color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </div>
  );
}

function CategoryGroupList({ title, items, direction }) {
  if (items.length === 0) return null;
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, marginBottom: 22 }}>
        {items.map((c, i) => (
          <div key={c.id} style={{ borderTop: i === 0 ? 'none' : `1px solid ${COLORS.hairline}` }}>
            <CategoryRow cat={c} actual={c.spent} target={c.budget} direction={direction} />
          </div>
        ))}
      </div>
    </>
  );
}

function sumGroup(items) {
  return { actual: items.reduce((s, c) => s + c.spent, 0), target: items.reduce((s, c) => s + c.budget, 0) };
}

/* =========================================================================
   WEEK VIEW
   ========================================================================= */
function WeekView({ categories, budgets, transactions, weekMonday, setWeekMonday }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const weekDates = useMemo(() => getWeekDates(weekMonday), [weekMonday]);
  const weekKeys = useMemo(() => new Set(weekDates.map(toKey)), [weekDates]);

  const expenseCategories = useMemo(() => categories.filter((c) => c.group === 'expense'), [categories]);
  const expenseIds = useMemo(() => new Set(expenseCategories.map((c) => c.id)), [expenseCategories]);

  const weekExpenseTxs = useMemo(
    () => transactions.filter((t) => expenseIds.has(t.categoryId) && weekKeys.has(t.date)),
    [transactions, weekKeys, expenseIds]
  );

  const perCategory = useMemo(() => categories.map((c) => {
    const spent = transactions
      .filter((t) => t.categoryId === c.id && weekKeys.has(t.date))
      .reduce((s, t) => s + t.amount, 0);
    const budget = weeklyBudgetForCat(budgets, weekMonday, c.id);
    return { ...c, spent, budget };
  }), [categories, transactions, weekKeys, budgets, weekMonday]);

  const incomeCats = perCategory.filter((c) => c.group === 'income');
  const savingsCats = perCategory.filter((c) => c.group === 'savings');
  const expenseCats = perCategory.filter((c) => c.group === 'expense');
  const incomeSum = sumGroup(incomeCats);
  const savingsSum = sumGroup(savingsCats);
  const expenseSum = sumGroup(expenseCats);

  const perDay = useMemo(() => weekDates.map((d) => {
    const key = toKey(d);
    const spent = weekExpenseTxs.filter((t) => t.date === key).reduce((s, t) => s + t.amount, 0);
    const pace = dailyPaceTotal(budgets, expenseCategories, d);
    return { date: d, key, spent, pace };
  }), [weekDates, weekExpenseTxs, budgets, expenseCategories]);

  const maxBar = Math.max(1, ...perDay.map((d) => Math.max(d.spent, d.pace)));
  const isCurrentWeek = toKey(weekMonday) === toKey(getMonday(new Date()));

  const selectedDayTxs = selectedDay
    ? transactions.filter((t) => t.date === selectedDay).sort((a, b) => (a.id < b.id ? 1 : -1))
    : [];

  return (
    <div>
      <PeriodNav
        label={fmtWeekLabel(weekDates)}
        onPrev={() => { setWeekMonday(addDays(weekMonday, -7)); setSelectedDay(null); }}
        onNext={() => { setWeekMonday(addDays(weekMonday, 7)); setSelectedDay(null); }}
        onToday={() => { setWeekMonday(getMonday(new Date())); setSelectedDay(null); }}
        isCurrent={isCurrentWeek}
      />
      <GroupSummary rows={[
        { label: 'Income', actual: incomeSum.actual, target: incomeSum.target, direction: 'positive' },
        { label: 'Savings', actual: savingsSum.actual, target: savingsSum.target, direction: 'positive' },
        { label: 'Expenses', actual: expenseSum.actual, target: expenseSum.target, direction: 'expense' },
      ]} />

      <div style={{ margin: '0 20px 18px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: '16px 14px 10px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 6px 10px' }}>
          Daily spend (expenses)
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
          {perDay.map((d) => {
            const barH = Math.round((d.spent / maxBar) * 88);
            const paceH = Math.round((d.pace / maxBar) * 88);
            const color = statusColorExpense(d.spent, d.pace);
            const isSel = selectedDay === d.key;
            const isToday = d.key === todayKey();
            return (
              <button
                key={d.key}
                onClick={() => setSelectedDay(isSel ? null : d.key)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: 0 }}
              >
                <div style={{ position: 'relative', height: 96, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                  {paceH > 1 && (
                    <div style={{ position: 'absolute', bottom: paceH, left: '14%', right: '14%', borderTop: `1.5px dashed ${COLORS.inkFaint}` }} />
                  )}
                  <div style={{
                    width: '60%', minWidth: 6, height: Math.max(barH, d.spent > 0 ? 3 : 0),
                    background: color, borderRadius: 3,
                    outline: isSel ? `2px solid ${COLORS.ink}` : 'none', outlineOffset: 2,
                  }} />
                </div>
                <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: isToday ? COLORS.teal : COLORS.inkFaint, letterSpacing: '0.02em' }}>
                  {fmtDayShort(d.date)[0]}
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: isToday ? COLORS.ink : COLORS.inkSoft, fontWeight: isToday ? 700 : 400 }}>
                  {d.date.getDate()}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div style={{ margin: '-10px 20px 18px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: '12px 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.inkSoft }}>
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'short' })}
            </span>
            <button onClick={() => setSelectedDay(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={15} color={COLORS.inkFaint} />
            </button>
          </div>
          {selectedDayTxs.length === 0 && (
            <div style={{ fontSize: 13, color: COLORS.inkFaint, padding: '6px 0' }}>No transactions logged this day.</div>
          )}
          {selectedDayTxs.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            return (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderTop: `1px solid ${COLORS.hairline}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 4, background: cat ? cat.color : COLORS.inkFaint, flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, color: COLORS.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.description || '(no description)'}
                    </div>
                    <div style={{ fontSize: 11.5, color: COLORS.inkFaint }}>{cat ? cat.name : 'Uncategorised'} &middot; {t.account}</div>
                  </div>
                </div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, flexShrink: 0, marginLeft: 10 }}>
                  {fmtMoney(t.amount)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CategoryGroupList title="Income" items={incomeCats} direction="positive" />
      <CategoryGroupList title="Savings" items={savingsCats} direction="positive" />
      <CategoryGroupList title="Expenses" items={expenseCats} direction="expense" />
    </div>
  );
}

/* =========================================================================
   MONTH VIEW
   ========================================================================= */
function MonthView({ categories, budgets, transactions, monthStart, setMonthStart }) {
  const mKey = monthKeyOf(monthStart);
  const monthTxs = useMemo(
    () => transactions.filter((t) => t.date.slice(0, 7) === mKey),
    [transactions, mKey]
  );
  const perCategory = useMemo(() => categories.map((c) => {
    const spent = monthTxs.filter((t) => t.categoryId === c.id).reduce((s, t) => s + t.amount, 0);
    const budget = effectiveBudget(budgets, mKey, c.id);
    return { ...c, spent, budget };
  }), [categories, monthTxs, budgets, mKey]);

  const incomeCats = perCategory.filter((c) => c.group === 'income');
  const savingsCats = perCategory.filter((c) => c.group === 'savings');
  const expenseCats = perCategory.filter((c) => c.group === 'expense');
  const incomeSum = sumGroup(incomeCats);
  const savingsSum = sumGroup(savingsCats);
  const expenseSum = sumGroup(expenseCats);
  const isCurrentMonth = mKey === monthKeyOf(new Date());

  const chartData = expenseCats.map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 15) + '\u2026' : c.name,
    budget: Math.round(c.budget),
    actual: Math.round(c.spent),
    color: statusColorExpense(c.spent, c.budget),
  }));
  const chartHeight = Math.max(180, expenseCats.length * 40 + 16);

  return (
    <div>
      <PeriodNav
        label={fmtMonthLabel(monthStart)}
        onPrev={() => setMonthStart(addMonths(monthStart, -1))}
        onNext={() => setMonthStart(addMonths(monthStart, 1))}
        onToday={() => setMonthStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
        isCurrent={isCurrentMonth}
      />
      <GroupSummary rows={[
        { label: 'Income', actual: incomeSum.actual, target: incomeSum.target, direction: 'positive' },
        { label: 'Savings', actual: savingsSum.actual, target: savingsSum.target, direction: 'positive' },
        { label: 'Expenses', actual: expenseSum.actual, target: expenseSum.target, direction: 'expense' },
      ]} />

      <div style={{ margin: '0 20px 6px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: '14px 10px 6px' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '0 8px 10px', fontSize: 11, color: COLORS.inkFaint, fontWeight: 600 }}>
          <LegendDot color={COLORS.hairline} label="Budget" />
          <LegendDot color={COLORS.ink} label="Actual" />
          <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>Expenses only</span>
        </div>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 14, left: 0, bottom: 0 }} barGap={3}>
            <XAxis type="number" hide />
            <YAxis
              type="category" dataKey="name" width={108} tickLine={false} axisLine={false}
              tick={{ fontSize: 11.5, fill: COLORS.inkSoft, fontFamily: FONT_BODY }}
            />
            <Bar dataKey="budget" fill={COLORS.hairline} radius={[3, 3, 3, 3]} barSize={9} />
            <Bar dataKey="actual" radius={[3, 3, 3, 3]} barSize={9}>
              {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: 8 }} />
      <CategoryGroupList title="Income" items={incomeCats} direction="positive" />
      <CategoryGroupList title="Savings" items={savingsCats} direction="positive" />
      <CategoryGroupList title="Expenses" items={expenseCats} direction="expense" />
    </div>
  );
}
function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />
      {label}
    </span>
  );
}

/* =========================================================================
   ADD VIEW (quick add + paste statement)
   ========================================================================= */
function CategorySelect({ categories, value, onChange, style }) {
  const groups = ['income', 'savings', 'expense'];
  return (
    <select value={value} onChange={onChange} style={style}>
      {groups.map((g) => {
        const items = categories.filter((c) => c.group === g);
        if (items.length === 0) return null;
        return (
          <optgroup key={g} label={GROUP_LABELS[g]}>
            {items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </optgroup>
        );
      })}
    </select>
  );
}

function AddView({ categories, addTransaction, addTransactionsBulk }) {
  const [subTab, setSubTab] = useState('quick');
  return (
    <div>
      <div style={{ display: 'flex', gap: 8, margin: '4px 20px 18px' }}>
        <PillToggle active={subTab === 'quick'} onClick={() => setSubTab('quick')} icon={<Plus size={14} />} label="Quick add" />
        <PillToggle active={subTab === 'paste'} onClick={() => setSubTab('paste')} icon={<ClipboardPaste size={14} />} label="Paste statement" />
      </div>
      {subTab === 'quick'
        ? <QuickAddForm categories={categories} addTransaction={addTransaction} />
        : <PasteImport categories={categories} addTransactionsBulk={addTransactionsBulk} />}
    </div>
  );
}
function PillToggle({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: '10px 0', borderRadius: 10, border: `1px solid ${active ? COLORS.ink : COLORS.hairline}`,
      background: active ? COLORS.ink : COLORS.surface, color: active ? COLORS.surface : COLORS.inkSoft,
      fontSize: 13, fontWeight: 700, cursor: 'pointer',
    }}>
      {icon}{label}
    </button>
  );
}
const fieldLabelStyle = { fontSize: 11.5, fontWeight: 700, color: COLORS.inkFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'block' };
const inputStyle = {
  width: '100%', padding: '11px 12px', borderRadius: 10, border: `1px solid ${COLORS.hairline}`,
  background: COLORS.surface, fontSize: 14.5, color: COLORS.ink, outline: 'none',
};

function QuickAddForm({ categories, addTransaction }) {
  const firstExpense = categories.find((c) => c.group === 'expense');
  const [date, setDate] = useState(todayKey());
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(firstExpense ? firstExpense.id : (categories[0] ? categories[0].id : ''));
  const [account, setAccount] = useState('ASB');
  const [confirmed, setConfirmed] = useState(false);

  function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0 || !categoryId) return;
    addTransaction({ date, description: description.trim() || 'Transaction', amount: amt, categoryId, account });
    setDescription(''); setAmount('');
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 1800);
  }

  return (
    <div style={{ margin: '0 20px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 18 }}>
      <label style={fieldLabelStyle}>Date</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />

      <label style={fieldLabelStyle}>Description</label>
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Countdown Ponsonby" style={{ ...inputStyle, marginBottom: 14 }} />

      <label style={fieldLabelStyle}>Amount (NZD)</label>
      <input type="number" inputMode="decimal" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ ...inputStyle, marginBottom: 14, fontFamily: FONT_MONO }} />

      <label style={fieldLabelStyle}>Category</label>
      <CategorySelect categories={categories} value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle, marginBottom: 14 }} />

      <label style={fieldLabelStyle}>Account</label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {ACCOUNTS.map((a) => (
          <button key={a} onClick={() => setAccount(a)} style={{
            flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
            border: `1px solid ${account === a ? COLORS.ink : COLORS.hairline}`,
            background: account === a ? COLORS.ink : COLORS.surface, color: account === a ? COLORS.surface : COLORS.inkSoft,
          }}>
            {a}
          </button>
        ))}
      </div>

      <button onClick={submit} style={{
        width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
        background: COLORS.teal, color: '#fff', fontSize: 14.5, fontWeight: 700,
      }}>
        {confirmed ? 'Added \u2713' : 'Add transaction'}
      </button>
    </div>
  );
}

function PasteImport({ categories, addTransactionsBulk }) {
  const [text, setText] = useState('');
  const [account, setAccount] = useState('ASB');
  const [rows, setRows] = useState(null);
  const [done, setDone] = useState(0);

  function parse() {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const parsed = lines.map((line) => {
      const p = parseStatementLine(line);
      return {
        rid: uid('row'),
        date: p.date || todayKey(),
        description: p.desc || '(no description)',
        amount: p.amount == null ? '' : Math.abs(p.amount),
        sign: p.amount == null ? null : (p.amount < 0 ? 'debit' : 'credit'),
        categoryId: suggestCategory(p.desc, p.amount, categories),
        include: true,
      };
    });
    setRows(parsed);
    setDone(0);
  }

  function updateRow(rid, patch) {
    setRows((rs) => rs.map((r) => (r.rid === rid ? { ...r, ...patch } : r)));
  }
  function removeRow(rid) {
    setRows((rs) => rs.filter((r) => r.rid !== rid));
  }

  function importAll() {
    const toImport = rows.filter((r) => r.include && r.amount !== '' && !isNaN(parseFloat(r.amount)));
    const list = toImport.map((r) => ({
      date: r.date, description: r.description.trim() || 'Transaction',
      amount: parseFloat(r.amount), categoryId: r.categoryId, account,
    }));
    addTransactionsBulk(list);
    setDone(list.length);
    setRows(null);
    setText('');
  }

  return (
    <div style={{ margin: '0 20px' }}>
      {!rows && (
        <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 18 }}>
          <p style={{ fontSize: 12.5, color: COLORS.inkSoft, lineHeight: 1.5, margin: '0 0 14px' }}>
            Copy rows straight from your ASB or Westpac internet banking transaction list (or a downloaded CSV) and paste them below \u2014 one transaction per line. Debits should appear as negative amounts; you'll get a chance to fix anything before importing.
          </p>
          <label style={fieldLabelStyle}>Statement account</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {ACCOUNTS.map((a) => (
              <button key={a} onClick={() => setAccount(a)} style={{
                flex: 1, padding: '9px 0', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${account === a ? COLORS.ink : COLORS.hairline}`,
                background: account === a ? COLORS.ink : COLORS.surface, color: account === a ? COLORS.surface : COLORS.inkSoft,
              }}>
                {a}
              </button>
            ))}
          </div>
          <label style={fieldLabelStyle}>Paste statement lines</label>
          <textarea
            value={text} onChange={(e) => setText(e.target.value)} rows={7}
            placeholder={'18/06/2026, COUNTDOWN PONSONBY, -84.50\n17/06/2026, BP CONNECT NEWMARKET, -62.00'}
            style={{ ...inputStyle, fontFamily: FONT_MONO, fontSize: 12.5, marginBottom: 14, resize: 'vertical' }}
          />
          <button onClick={parse} disabled={!text.trim()} style={{
            width: '100%', padding: '13px 0', borderRadius: 10, border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            background: text.trim() ? COLORS.ink : COLORS.hairline, color: text.trim() ? '#fff' : COLORS.inkFaint, fontSize: 14.5, fontWeight: 700,
          }}>
            Parse statement
          </button>
          {done > 0 && (
            <div style={{ marginTop: 12, fontSize: 13, color: COLORS.teal, fontWeight: 700, textAlign: 'center' }}>
              Imported {done} transaction{done === 1 ? '' : 's'} \u2713
            </div>
          )}
        </div>
      )}

      {rows && (
        <div>
          <div style={{ fontSize: 12.5, color: COLORS.inkSoft, margin: '0 0 12px' }}>
            Found {rows.length} line{rows.length === 1 ? '' : 's'}. Check the amounts and categories below, untick anything you don't want, then import.
          </div>
          {rows.map((r) => (
            <div key={r.rid} style={{ background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 12, padding: 12, marginBottom: 10, opacity: r.include ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <input
                  type="checkbox" checked={r.include} onChange={(e) => updateRow(r.rid, { include: e.target.checked })}
                  style={{ marginTop: 4 }}
                />
                <input
                  type="text" value={r.description} onChange={(e) => updateRow(r.rid, { description: e.target.value })}
                  style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 13.5 }}
                />
                <button onClick={() => removeRow(r.rid)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={15} color={COLORS.inkFaint} />
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="date" value={r.date} onChange={(e) => updateRow(r.rid, { date: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', fontSize: 12.5, flex: 1 }} />
                <input
                  type="number" step="0.01" value={r.amount}
                  onChange={(e) => updateRow(r.rid, { amount: e.target.value })}
                  style={{ ...inputStyle, padding: '8px 10px', fontSize: 12.5, width: 90, fontFamily: FONT_MONO }}
                />
                {r.sign && (
                  <span style={{
                    alignSelf: 'center', fontSize: 10.5, fontWeight: 700, padding: '4px 8px', borderRadius: 6, flexShrink: 0,
                    background: r.sign === 'debit' ? COLORS.rustSoft : COLORS.tealSoft,
                    color: r.sign === 'debit' ? COLORS.rust : COLORS.teal,
                  }}>
                    {r.sign === 'debit' ? 'Money out' : 'Money in'}
                  </span>
                )}
              </div>
              <CategorySelect categories={categories} value={r.categoryId} onChange={(e) => updateRow(r.rid, { categoryId: e.target.value })} style={{ ...inputStyle, padding: '8px 10px', fontSize: 12.5 }} />
            </div>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 4, marginBottom: 24 }}>
            <button onClick={() => setRows(null)} style={{
              flex: 1, padding: '13px 0', borderRadius: 10, border: `1px solid ${COLORS.hairline}`, cursor: 'pointer',
              background: COLORS.surface, color: COLORS.inkSoft, fontSize: 14, fontWeight: 700,
            }}>
              Cancel
            </button>
            <button onClick={importAll} style={{
              flex: 2, padding: '13px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: COLORS.teal, color: '#fff', fontSize: 14, fontWeight: 700,
            }}>
              Import {rows.filter((r) => r.include).length} transaction{rows.filter((r) => r.include).length === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================================
   BUDGET VIEW
   ========================================================================= */
function BudgetCategoryList({ title, items, mKey, updateBudget }) {
  if (items.length === 0) return null;
  return (
    <>
      <SectionLabel>{title}</SectionLabel>
      <div style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}`, marginBottom: 22 }}>
        {items.map((c, i) => {
          const info = c.__info;
          return (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
                <span style={{ width: 9, height: 9, borderRadius: 5, background: c.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                  {info && info.inherited && info.sourceMonth && (
                    <div style={{ fontSize: 10.5, color: COLORS.inkFaint }}>carried from {info.sourceMonth}</div>
                  )}
                </div>
              </div>
              <input
                type="number" step="1" min="0" defaultValue={info ? (info.amount || '') : ''} placeholder="0"
                key={`${c.id}-${mKey}-${info ? info.amount : 0}`}
                onBlur={(e) => updateBudget(mKey, c.id, parseFloat(e.target.value) || 0)}
                style={{ width: 92, padding: '8px 10px', borderRadius: 8, border: `1px solid ${COLORS.hairline}`, fontFamily: FONT_MONO, fontSize: 13.5, textAlign: 'right', color: COLORS.ink, flexShrink: 0 }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

function BudgetView({ categories, budgets, monthStart, setMonthStart, updateBudget, addCategory, renameCategory, recolorCategory, regroupCategory, deleteCategory }) {
  const mKey = monthKeyOf(monthStart);
  const isCurrentMonth = mKey === monthKeyOf(new Date());

  const withInfo = categories.map((c) => ({ ...c, __info: effectiveBudgetInfo(budgets, mKey, c.id) }));
  const incomeItems = withInfo.filter((c) => c.group === 'income');
  const savingsItems = withInfo.filter((c) => c.group === 'savings');
  const expenseItems = withInfo.filter((c) => c.group === 'expense');
  const totalOf = (items) => items.reduce((s, c) => s + (c.__info ? c.__info.amount : 0), 0);

  return (
    <div>
      <PeriodNav
        label={fmtMonthLabel(monthStart)}
        onPrev={() => setMonthStart(addMonths(monthStart, -1))}
        onNext={() => setMonthStart(addMonths(monthStart, 1))}
        onToday={() => setMonthStart(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
        isCurrent={isCurrentMonth}
      />

      <div style={{ margin: '0 20px 18px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: '16px 18px', display: 'flex', justifyContent: 'space-between' }}>
        <StatBlock label="Income target" value={fmtMoneyShort(totalOf(incomeItems))} color={COLORS.teal} />
        <Divider />
        <StatBlock label="Savings target" value={fmtMoneyShort(totalOf(savingsItems))} color={COLORS.inkSoft} />
        <Divider />
        <StatBlock label="Expense budget" value={fmtMoneyShort(totalOf(expenseItems))} color={COLORS.ink} />
      </div>

      <SectionLabel>{`Set budgets for ${fmtMonthLabel(monthStart)}`}</SectionLabel>
      <BudgetCategoryList title="Income" items={incomeItems} mKey={mKey} updateBudget={updateBudget} />
      <BudgetCategoryList title="Savings" items={savingsItems} mKey={mKey} updateBudget={updateBudget} />
      <BudgetCategoryList title="Expenses" items={expenseItems} mKey={mKey} updateBudget={updateBudget} />

      <ManageCategories
        categories={categories}
        addCategory={addCategory}
        renameCategory={renameCategory}
        recolorCategory={recolorCategory}
        regroupCategory={regroupCategory}
        deleteCategory={deleteCategory}
      />
    </div>
  );
}

function ManageCategories({ categories, addCategory, renameCategory, recolorCategory, regroupCategory, deleteCategory }) {
  const [editingId, setEditingId] = useState(null);
  const [draftName, setDraftName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('expense');

  function startEdit(c) { setEditingId(c.id); setDraftName(c.name); }
  function saveEdit(id) {
    if (draftName.trim()) renameCategory(id, draftName.trim());
    setEditingId(null);
  }

  function renderGroupSection(group) {
    const items = categories.filter((c) => c.group === group);
    if (items.length === 0) return null;
    return (
      <div key={group}>
        <SectionLabel>{GROUP_LABELS[group]}</SectionLabel>
        <div style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.hairline}`, borderBottom: `1px solid ${COLORS.hairline}` }}>
          {items.map((c, i) => (
            <div key={c.id} style={{ padding: '11px 20px', borderTop: i === 0 ? 'none' : `1px solid ${COLORS.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                  {paletteForGroup(c.group).slice(0, 5).map((col) => (
                    <button key={col} onClick={() => recolorCategory(c.id, col)} style={{
                      width: 13, height: 13, borderRadius: 7, background: col, border: c.color === col ? `2px solid ${COLORS.ink}` : '2px solid transparent', cursor: 'pointer', padding: 0,
                    }} />
                  ))}
                </div>
                {editingId === c.id ? (
                  <input
                    autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)}
                    onBlur={() => saveEdit(c.id)} onKeyDown={(e) => e.key === 'Enter' && saveEdit(c.id)}
                    style={{ ...inputStyle, padding: '6px 9px', fontSize: 13, flex: 1, minWidth: 0 }}
                  />
                ) : (
                  <span onClick={() => startEdit(c)} style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: COLORS.ink, cursor: 'pointer', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.name}
                  </span>
                )}
                <select
                  value={c.group} onChange={(e) => regroupCategory(c.id, e.target.value)}
                  style={{ fontSize: 10.5, fontWeight: 700, color: COLORS.inkSoft, border: `1px solid ${COLORS.hairline}`, borderRadius: 6, padding: '4px 4px', flexShrink: 0, background: COLORS.surface }}
                >
                  <option value="income">Income</option>
                  <option value="savings">Savings</option>
                  <option value="expense">Expense</option>
                </select>
                <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0 }}>
                  <Pencil size={13} color={COLORS.inkFaint} />
                </button>
                <button onClick={() => setConfirmDeleteId(confirmDeleteId === c.id ? null : c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 3, flexShrink: 0 }}>
                  <Trash2 size={13} color={COLORS.inkFaint} />
                </button>
              </div>
              {confirmDeleteId === c.id && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: COLORS.rustSoft, borderRadius: 8, padding: '8px 12px', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: 11.5, color: COLORS.rust, fontWeight: 600 }}>Delete this category? Past transactions move to the nearest "Other" category.</span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => { deleteCategory(c.id); setConfirmDeleteId(null); }} style={{ background: COLORS.rust, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
                    <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'none', border: 'none', color: COLORS.inkSoft, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{ height: 18 }} />
      </div>
    );
  }

  return (
    <div>
      <SectionLabel>Manage categories</SectionLabel>
      {renderGroupSection('income')}
      {renderGroupSection('savings')}
      {renderGroupSection('expense')}

      <div style={{ margin: '4px 20px 30px', background: COLORS.surface, border: `1px solid ${COLORS.hairline}`, borderRadius: 14, padding: 16 }}>
        <label style={fieldLabelStyle}>Add a category</label>
        <input
          value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name"
          style={{ ...inputStyle, marginBottom: 10 }}
        />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['income', 'savings', 'expense'].map((g) => (
            <button key={g} onClick={() => setNewGroup(g)} style={{
              flex: 1, padding: '8px 0', borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${newGroup === g ? COLORS.ink : COLORS.hairline}`,
              background: newGroup === g ? COLORS.ink : COLORS.surface, color: newGroup === g ? COLORS.surface : COLORS.inkSoft,
            }}>
              {GROUP_LABELS[g]}
            </button>
          ))}
        </div>
        <button
          onClick={() => { if (newName.trim()) { addCategory(newName.trim(), newGroup); setNewName(''); } }}
          style={{ width: '100%', padding: '12px 0', borderRadius: 10, border: 'none', background: COLORS.ink, color: '#fff', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Plus size={16} /> Add category
        </button>
      </div>
    </div>
  );
}

/* =========================================================================
   BOTTOM NAV
   ========================================================================= */
function BottomNav({ active, onChange }) {
  const items = [
    { id: 'week', label: 'Week', icon: CalendarDays },
    { id: 'month', label: 'Month', icon: CalendarRange },
    { id: 'add', label: 'Add', icon: PlusCircle },
    { id: 'budget', label: 'Budget', icon: Settings2 },
  ];
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: COLORS.surface, borderTop: `1px solid ${COLORS.hairline}` }}>
      <div style={{ maxWidth: 448, margin: '0 auto', display: 'flex' }}>
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onChange(it.id)} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0 8px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <Icon size={20} color={isActive ? COLORS.teal : COLORS.inkFaint} strokeWidth={isActive ? 2.3 : 2} />
              <span style={{ fontSize: 10.5, fontWeight: isActive ? 700 : 600, color: isActive ? COLORS.teal : COLORS.inkFaint }}>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================================
   APP ROOT
   ========================================================================= */
export default function BudgetTrackerApp() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('week');
  const [weekMonday, setWeekMonday] = useState(() => getMonday(new Date()));
  const [monthStart, setMonthStart] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [resetConfirm, setResetConfirm] = useState(false);

useEffect(() => {
  let cancelled = false;

  (async () => {

    try {

      const response =
        await fetch(
          `${API_URL}?apiKey=${API_KEY}`
        );

      const data =
        await response.json();

      const categories =
        Array.isArray(data.categories)
          ? data.categories
          : DEFAULT_CATEGORIES;

      const budgets =
        data.budgets || {};

      const transactions =
        Array.isArray(data.transactions)
          ? data.transactions
          : [];

      if (!cancelled) {

        setCategories(categories);
        setBudgets(budgets);
        setTransactions(transactions);
        setLoading(false);

      }

    } catch (error) {

      console.error(
        "Failed loading budget data",
        error
      );

      if (!cancelled) {

        setCategories(
          DEFAULT_CATEGORIES
        );

        setBudgets({});
        setTransactions([]);
        setLoading(false);

      }

    }

  })();

  return () => {
    cancelled = true;
  };

}, []);

async function persistConfig(cats, buds) {

  setCategories(cats);
  setBudgets(buds);

  try {

    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        type: "config",
        categories: cats,
        budgets: buds
      })
    });

  } catch (e) {

    console.error(
      "Failed to save config",
      e
    );

  }

}
async function persistTransactions(txs) {

  setTransactions(txs);

  try {

    await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        apiKey: API_KEY,
        type: "transactions",
        transactions: txs
      })
    });

  } catch (e) {

    console.error(
      "Failed to save transactions",
      e
    );

  }

}

  function addTransaction(tx) {
    persistTransactions([...transactions, { id: uid('tx'), ...tx }]);
  }
  function addTransactionsBulk(list) {
    const stamped = list.map((t) => ({ id: uid('tx'), ...t }));
    persistTransactions([...transactions, ...stamped]);
  }
  function updateBudget(mKey, catId, amount) {
    const next = { ...budgets, [mKey]: { ...(budgets[mKey] || {}), [catId]: amount } };
    persistConfig(categories, next);
  }
  function addCategory(name, group) {
    const id = uid('cat');
    const palette = paletteForGroup(group);
    const countInGroup = categories.filter((c) => c.group === group).length;
    const color = palette[countInGroup % palette.length];
    persistConfig([...categories, { id, name, group, color }], budgets);
  }
  function renameCategory(id, name) {
    persistConfig(categories.map((c) => (c.id === id ? { ...c, name } : c)), budgets);
  }
  function recolorCategory(id, color) {
    persistConfig(categories.map((c) => (c.id === id ? { ...c, color } : c)), budgets);
  }
  function regroupCategory(id, group) {
    persistConfig(categories.map((c) => (c.id === id ? { ...c, group } : c)), budgets);
  }
  function deleteCategory(id) {
    if (categories.length <= 1) return;
    const deleted = categories.find((c) => c.id === id);
    const sameGroup = deleted ? categories.filter((c) => c.group === deleted.group && c.id !== id) : categories.filter((c) => c.id !== id);
    const fallback = sameGroup.find((c) => c.name.toLowerCase().startsWith('other')) || sameGroup[0] || categories.find((c) => c.id !== id);
    const fallbackId = fallback ? fallback.id : null;
    const newTxs = transactions.map((t) => (t.categoryId === id ? { ...t, categoryId: fallbackId } : t));
    const newCats = categories.filter((c) => c.id !== id);
    const newBudgets = {};
    for (const [mk, obj] of Object.entries(budgets)) {
      const o = { ...obj };
      delete o[id];
      newBudgets[mk] = o;
    }
    persistTransactions(newTxs);
    persistConfig(newCats, newBudgets);
  }
  function resetAll() {
    persistConfig(DEFAULT_CATEGORIES, {});
    persistTransactions([]);
    setResetConfirm(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: COLORS.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, color: COLORS.inkSoft }}>
        <FontStyles />
        Loading your ledger\u2026
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.paper, fontFamily: FONT_BODY }}>
      <FontStyles />
      <div style={{ maxWidth: 448, margin: '0 auto', paddingBottom: 88 }}>
        <div style={{ padding: '22px 20px 4px', display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wallet size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 21, color: COLORS.ink, letterSpacing: '-0.01em' }}>Household Ledger</div>
            <div style={{ fontSize: 11.5, color: COLORS.inkFaint }}>Actual vs budget &mdash; income, savings &amp; expenses</div>
          </div>
        </div>

        {activeTab === 'week' && (
          <WeekView categories={categories} budgets={budgets} transactions={transactions} weekMonday={weekMonday} setWeekMonday={setWeekMonday} />
        )}
        {activeTab === 'month' && (
          <MonthView categories={categories} budgets={budgets} transactions={transactions} monthStart={monthStart} setMonthStart={setMonthStart} />
        )}
        {activeTab === 'add' && (
          <AddView categories={categories} addTransaction={addTransaction} addTransactionsBulk={addTransactionsBulk} />
        )}
        {activeTab === 'budget' && (
          <>
            <BudgetView
              categories={categories} budgets={budgets} monthStart={monthStart} setMonthStart={setMonthStart}
              updateBudget={updateBudget} addCategory={addCategory} renameCategory={renameCategory}
              recolorCategory={recolorCategory} regroupCategory={regroupCategory} deleteCategory={deleteCategory}
            />
            <div style={{ margin: '0 20px 30px', textAlign: 'center' }}>
              {!resetConfirm ? (
                <button onClick={() => setResetConfirm(true)} style={{ background: 'none', border: 'none', color: COLORS.inkFaint, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <RotateCcw size={12} /> Reset all data
                </button>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: COLORS.rustSoft, borderRadius: 10, padding: '8px 14px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: COLORS.rust, fontWeight: 700 }}>Erase everything?</span>
                  <button onClick={resetAll} style={{ background: COLORS.rust, color: '#fff', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Yes, reset</button>
                  <button onClick={() => setResetConfirm(false)} style={{ background: 'none', border: 'none', color: COLORS.inkSoft, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}
