import { useState, useEffect } from 'react';
import { Home, TrendingUp, TrendingDown, Check, Plus, Trash2, X } from 'lucide-react';
import { api } from '../../utils/api';
import { formatAmount } from '../../types';

interface Charge { label: string; amount: number; }

interface PropertyMonthData {
  rent_validated: boolean;
  rent_date: string | null;
  copro_charges: Charge[];
  agence_charges: Charge[];
}

interface RentalProperty {
  id: number;
  name: string;
  credit_label: string;
  credit_amount: number;
  rent_label: string;
  rent_amount: number;
}

interface Props { month: string; }

type SubTab = 'loyer' | 'copro' | 'agence';

const EMPTY_DATA: PropertyMonthData = {
  rent_validated: false,
  rent_date: null,
  copro_charges: [],
  agence_charges: [],
};

export function RentalBlock({ month }: Props) {
  const [properties, setProperties] = useState<RentalProperty[]>([]);
  const [monthData, setMonthData] = useState<Record<number, PropertyMonthData>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [subTab, setSubTab] = useState<SubTab>('loyer');
  const [newCharge, setNewCharge] = useState({ label: '', amount: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getRentalProperties().then(async props => {
      setProperties(props);
      if (props.length && !selectedId) setSelectedId(props[0].id);
      const data: Record<number, PropertyMonthData> = {};
      for (const p of props) {
        data[p.id] = await api.getRentalMonthData(p.id, month);
      }
      setMonthData(data);
    });
  }, [month]);

  const prop = properties.find(p => p.id === selectedId);
  const data = selectedId ? (monthData[selectedId] ?? EMPTY_DATA) : EMPTY_DATA;

  const save = async (patch: Partial<PropertyMonthData>) => {
    if (!selectedId) return;
    const updated = { ...data, ...patch };
    setSaving(true);
    try {
      const saved = await api.updateRentalMonthData(selectedId, month, updated);
      setMonthData(d => ({ ...d, [selectedId]: saved }));
    } finally {
      setSaving(false);
    }
  };

  const getProfitability = (propId: number) => {
    const p = properties.find(x => x.id === propId);
    const d = monthData[propId];
    if (!p || !d) return null;
    const income = d.rent_validated ? p.rent_amount : 0;
    const charges = [...(d.copro_charges ?? []), ...(d.agence_charges ?? [])]
      .reduce((s, c) => s + c.amount, 0);
    return income - p.credit_amount - charges;
  };

  const addCharge = async (type: 'copro' | 'agence') => {
    const amount = parseFloat(newCharge.amount);
    if (!newCharge.label || !amount) return;
    const key = type === 'copro' ? 'copro_charges' : 'agence_charges';
    await save({ [key]: [...(data[key] ?? []), { label: newCharge.label, amount }] });
    setNewCharge({ label: '', amount: '' });
  };

  const removeCharge = async (type: 'copro' | 'agence', index: number) => {
    const key = type === 'copro' ? 'copro_charges' : 'agence_charges';
    const list = [...(data[key] ?? [])];
    list.splice(index, 1);
    await save({ [key]: list });
  };

  const ChargeList = ({ type }: { type: 'copro' | 'agence' }) => {
    const key = type === 'copro' ? 'copro_charges' : 'agence_charges';
    const list: Charge[] = data[key] ?? [];
    const total = list.reduce((s, c) => s + c.amount, 0);
    return (
      <div className="space-y-2">
        {list.length === 0 ? (
          <p className="text-center text-gray-400 text-xs py-3">Aucune charge ce mois-ci</p>
        ) : (
          list.map((c, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-gray-100">
              <span className="text-xs text-gray-700 flex-1 truncate">{c.label}</span>
              <span className="text-xs font-semibold text-red-500 ml-2">-{formatAmount(c.amount)}</span>
              <button
                onClick={() => removeCharge(type, i)}
                className="ml-2 text-gray-300 hover:text-red-400 transition-colors"
              >
                <X size={13} />
              </button>
            </div>
          ))
        )}
        {list.length > 0 && (
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>Total</span>
            <span className="font-semibold text-red-500">-{formatAmount(total)}</span>
          </div>
        )}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newCharge.label}
            onChange={e => setNewCharge(s => ({ ...s, label: e.target.value }))}
            placeholder={type === 'copro' ? 'Ex: Charges T1 2026' : 'Ex: Honoraires agence'}
            className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
          />
          <input
            type="number"
            step="0.01"
            value={newCharge.amount}
            onChange={e => setNewCharge(s => ({ ...s, amount: e.target.value }))}
            placeholder="0.00"
            className="w-20 text-xs border border-gray-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-foyer-300"
          />
          <button
            onClick={() => addCharge(type)}
            className="px-3 py-2 bg-foyer-500 text-white rounded-lg hover:bg-foyer-600 transition-colors"
          >
            <Plus size={13} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-500 rounded-xl flex items-center justify-center">
          <Home size={16} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-blue-900 text-sm">Gestion Locative</h3>
          <p className="text-blue-500 text-xs">2 appartements</p>
        </div>
        {saving && <span className="ml-auto text-xs text-blue-400 animate-pulse">Enregistrement...</span>}
      </div>

      {/* Property tabs */}
      <div className="flex gap-2">
        {properties.map(p => {
          const profit = getProfitability(p.id);
          const isProfitable = profit !== null && profit >= 0;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedId(p.id); setSubTab('loyer'); }}
              className={`flex-1 rounded-xl px-3 py-2.5 text-left transition-all ${
                selectedId === p.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white/70 text-blue-800 border border-blue-200'
              }`}
            >
              <p className="text-xs font-semibold truncate">{p.name}</p>
              {profit !== null && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${isProfitable ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className={`text-[10px] font-medium ${
                    selectedId === p.id
                      ? isProfitable ? 'text-green-200' : 'text-red-200'
                      : isProfitable ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {profit >= 0 ? '+' : ''}{formatAmount(profit)}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {prop && (
        <>
          {/* Sub-tabs */}
          <div className="flex gap-1 bg-blue-100/60 rounded-xl p-1">
            {([['loyer', '🏠 Loyer'], ['copro', '🏢 Copro'], ['agence', '🤝 Agence']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSubTab(key)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  subTab === key ? 'bg-white text-blue-800 shadow-sm' : 'text-blue-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Loyer tab */}
          {subTab === 'loyer' && (
            <div className="space-y-3">
              {/* Credit vs Rent correlation */}
              <div className="bg-white rounded-2xl p-3 space-y-2">
                <p className="text-xs font-semibold text-gray-600 mb-2">Bilan mensuel</p>
                <div className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={13} className="text-red-400" />
                    <span className="text-xs text-gray-600">{prop.credit_label}</span>
                  </div>
                  <span className="text-xs font-bold text-red-500">-{formatAmount(prop.credit_amount)}</span>
                </div>
                <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${data.rent_validated ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <TrendingUp size={13} className={data.rent_validated ? 'text-green-500' : 'text-gray-400'} />
                    <span className="text-xs text-gray-600">{prop.rent_label}</span>
                  </div>
                  <span className={`text-xs font-bold ${data.rent_validated ? 'text-green-600' : 'text-gray-400'}`}>
                    +{formatAmount(prop.rent_amount)}
                  </span>
                </div>
                {/* Net line */}
                <div className={`flex items-center justify-between rounded-xl px-3 py-2 ${
                  (data.rent_validated ? prop.rent_amount : 0) - prop.credit_amount >= 0
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  <span className="text-xs font-semibold text-gray-700">Écart loyer / crédit</span>
                  <span className={`text-sm font-bold ${
                    (data.rent_validated ? prop.rent_amount : 0) - prop.credit_amount >= 0
                      ? 'text-green-700' : 'text-red-600'
                  }`}>
                    {((data.rent_validated ? prop.rent_amount : 0) - prop.credit_amount) >= 0 ? '+' : ''}
                    {formatAmount((data.rent_validated ? prop.rent_amount : 0) - prop.credit_amount)}
                  </span>
                </div>
              </div>

              {/* Rent validation */}
              <div className="bg-white rounded-2xl p-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">Validation du loyer</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => save({ rent_validated: !data.rent_validated, rent_date: !data.rent_validated ? new Date().toISOString().slice(0, 10) : null })}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border-2 ${
                      data.rent_validated ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}
                  >
                    {data.rent_validated && <Check size={14} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-700">
                    {data.rent_validated ? 'Loyer perçu ✓' : 'Marquer le loyer comme perçu'}
                  </span>
                </label>
                {data.rent_validated && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400">Date :</span>
                    <input
                      type="date"
                      value={data.rent_date ?? ''}
                      onChange={e => save({ rent_date: e.target.value })}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Copro tab */}
          {subTab === 'copro' && (
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Charges de copropriété</p>
              <ChargeList type="copro" />
            </div>
          )}

          {/* Agence tab */}
          {subTab === 'agence' && (
            <div className="bg-white rounded-2xl p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Frais d'agence</p>
              <ChargeList type="agence" />
            </div>
          )}

          {/* Profitability footer */}
          {(() => {
            const profit = getProfitability(prop.id);
            if (profit === null) return null;
            const charges = [...(data.copro_charges ?? []), ...(data.agence_charges ?? [])].reduce((s, c) => s + c.amount, 0);
            const isProfitable = profit >= 0;
            return (
              <div className={`rounded-2xl px-4 py-3 flex items-center justify-between ${
                isProfitable ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'
              }`}>
                <div>
                  <p className={`text-xs font-medium ${isProfitable ? 'text-green-700' : 'text-red-600'}`}>
                    {isProfitable ? '✅ Rentable ce mois-ci' : '🔴 Déficitaire ce mois-ci'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Loyer {data.rent_validated ? '' : '(non perçu)'} − crédit{charges > 0 ? ' − charges' : ''}
                  </p>
                </div>
                <p className={`text-lg font-bold ${isProfitable ? 'text-green-700' : 'text-red-600'}`}>
                  {profit >= 0 ? '+' : ''}{formatAmount(profit)}
                </p>
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
