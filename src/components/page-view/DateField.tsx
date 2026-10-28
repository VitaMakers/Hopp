"use client";

import { useState } from "react";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const pad = (n: number) => String(n).padStart(2, "0");

// Date (and optional time) picker styled like the reference, writing its value
// into readOnly inputs so the form still validates and submits natively.
export function DateField({ name, required, datetime }: { name: string; required?: boolean; datetime?: boolean }) {
  const today = new Date();
  const [dateVal, setDateVal] = useState("");
  const [timeVal, setTimeVal] = useState("");
  const [openCal, setOpenCal] = useState(false);
  const [openTime, setOpenTime] = useState(false);
  const [viewY, setViewY] = useState(today.getFullYear());
  const [viewM, setViewM] = useState(today.getMonth());

  const firstDay = new Date(viewY, viewM, 1).getDay();
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isToday = (d: number) => d === today.getDate() && viewM === today.getMonth() && viewY === today.getFullYear();

  const selectDay = (d: number) => {
    setDateVal(`${pad(d)}/${pad(viewM + 1)}/${viewY}`);
    setOpenCal(false);
  };
  const prevMonth = () => (viewM === 0 ? (setViewM(11), setViewY(viewY - 1)) : setViewM(viewM - 1));
  const nextMonth = () => (viewM === 11 ? (setViewM(0), setViewY(viewY + 1)) : setViewM(viewM + 1));

  const box = "w-full cursor-pointer rounded-md border border-stone-200 bg-white px-3 py-2.5 pr-9 text-left text-[15px] outline-none focus:border-stone-400";

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <input
          readOnly
          required={required}
          name={name}
          value={dateVal}
          placeholder="Selecionar data"
          onClick={() => {
            setOpenCal((o) => !o);
            setOpenTime(false);
          }}
          className={`${box} ${dateVal ? "text-stone-900" : "text-stone-400"}`}
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">▦</span>
        {openCal ? (
          <div className="absolute z-20 mt-1 w-64 rounded-lg bg-white p-3 shadow-lg ring-1 ring-stone-200">
            <div className="mb-2 flex items-center justify-between text-sm">
              <button type="button" onClick={prevMonth} className="px-2 text-stone-500 hover:text-stone-900">
                ‹
              </button>
              <span className="font-semibold text-stone-800">
                {viewY} {MONTHS[viewM]}
              </span>
              <button type="button" onClick={nextMonth} className="px-2 text-stone-500 hover:text-stone-900">
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] text-stone-400">
              {WEEKDAYS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-sm">
              {cells.map((d, i) =>
                d === null ? (
                  <span key={i} />
                ) : (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectDay(d)}
                    className={`rounded py-1 hover:bg-stone-100 ${isToday(d) ? "ring-1 ring-emerald-500" : ""}`}
                  >
                    {d}
                  </button>
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const n = new Date();
                setViewY(n.getFullYear());
                setViewM(n.getMonth());
                setDateVal(`${pad(n.getDate())}/${pad(n.getMonth() + 1)}/${n.getFullYear()}`);
                setOpenCal(false);
              }}
              className="mt-2 w-full py-1 text-center text-sm font-medium text-emerald-600 hover:underline"
            >
              Hoje
            </button>
          </div>
        ) : null}
      </div>

      {datetime ? (
        <div className="relative flex-1">
          <input
            readOnly
            required={required}
            name={`${name}_time`}
            value={timeVal}
            placeholder="Hora"
            onClick={() => {
              setOpenTime((o) => !o);
              setOpenCal(false);
            }}
            className={`${box} ${timeVal ? "text-stone-900" : "text-stone-400"}`}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">◷</span>
          {openTime ? (
            <TimePopover
              value={timeVal}
              onPick={(v) => setTimeVal(v)}
              onClose={() => setOpenTime(false)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function TimePopover({ value, onPick, onClose }: { value: string; onPick: (v: string) => void; onClose: () => void }) {
  const [h, m] = value ? value.split(":") : ["", ""];
  const [hour, setHour] = useState(h);
  const [min, setMin] = useState(m);
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const mins = Array.from({ length: 60 }, (_, i) => pad(i));
  const col = "h-40 w-16 overflow-y-auto text-center text-sm";
  const cell = (active: boolean) => `cursor-pointer rounded py-1 ${active ? "bg-stone-900 text-white" : "hover:bg-stone-100"}`;

  return (
    <div className="absolute z-20 mt-1 rounded-lg bg-white p-2 shadow-lg ring-1 ring-stone-200">
      <div className="flex gap-1">
        <div className={col}>
          {hours.map((hh) => (
            <div key={hh} onClick={() => setHour(hh)} className={cell(hour === hh)}>
              {hh}
            </div>
          ))}
        </div>
        <div className={col}>
          {mins.map((mm) => (
            <div key={mm} onClick={() => setMin(mm)} className={cell(min === mm)}>
              {mm}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            const n = new Date();
            setHour(pad(n.getHours()));
            setMin(pad(n.getMinutes()));
          }}
          className="text-sm font-medium text-emerald-600 hover:underline"
        >
          Agora
        </button>
        <button
          type="button"
          onClick={() => {
            onPick(`${hour || "00"}:${min || "00"}`);
            onClose();
          }}
          className="rounded-md bg-stone-900 px-3 py-1 text-sm font-semibold text-white hover:bg-stone-700"
        >
          OK
        </button>
      </div>
    </div>
  );
}
