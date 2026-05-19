"use client";

import { Calendar } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DatePickerFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-lg p-2 pr-4 backdrop-blur-md">
      <div className="bg-blue-500/20 p-2 rounded-md">
        <Calendar className="w-5 h-5 text-blue-400" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Filter by Date</span>
        <input 
          type="date" 
          value={currentDate} 
          onChange={handleDateChange}
          className="bg-transparent text-white font-semibold outline-none focus:ring-0 [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
        />
      </div>
    </div>
  );
}
