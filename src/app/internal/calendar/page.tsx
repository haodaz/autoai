'use client';

import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, User, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crm/meetings')
      .then(res => res.json())
      .then(data => {
        setMeetings(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  // Format date helper
  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  };

  // Group by date
  const groupedMeetings = Array.isArray(meetings) ? meetings.reduce((acc: any, meeting: any) => {
    if (!meeting.startTime) return acc;
    const dateKey = new Date(meeting.startTime).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(meeting);
    return acc;
  }, {}) : {};

  const sortedDates = Object.keys(groupedMeetings).sort();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#141b38]">日程看板</h1>
            <p className="text-sm text-gray-500">所有已确认发送的系统邀约均会在此防冲突占位</p>
          </div>
        </div>
        <Link href="/internal/crm" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4 mr-2" />
          去 CRM 发送新邀约
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>正在拉取日程表...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <CalendarIcon className="w-12 h-12 mb-4 text-gray-200" />
            <p>暂无任何已发送的邀约安排。</p>
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {sortedDates.map((dateStr) => (
              <div key={dateStr} className="relative">
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-lg font-bold text-gray-900 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
                    {formatDate(dateStr)}
                  </h2>
                  <div className="h-px flex-1 bg-gray-100"></div>
                </div>

                {/* Meetings for this date */}
                <div className="space-y-3 pl-4 border-l-2 border-gray-100 ml-4">
                  {groupedMeetings[dateStr].map((meeting: any) => (
                    <div key={meeting.id} className="relative group bg-white border border-gray-200 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow hover:border-amber-300">
                      {/* Timeline Dot */}
                      <div className="absolute -left-[23px] top-5 w-3 h-3 bg-white border-2 border-amber-500 rounded-full"></div>
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg text-amber-600">{formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}</span>
                            <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-600 border border-amber-100">
                              {meeting.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-gray-900 text-base mb-2">{meeting.subject}</h3>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {meeting.customer && (
                              <div className="flex items-center gap-1.5">
                                <User className="w-4 h-4" />
                                <span>{meeting.customer.name} ({meeting.customer.email})</span>
                              </div>
                            )}
                            {meeting.location && (
                              <div className="flex items-center gap-1.5 text-blue-600 hover:underline cursor-pointer">
                                <MapPin className="w-4 h-4" />
                                <span>{meeting.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {meeting.customerId && (
                          <Link href={`/internal/crm/${meeting.customerId}`} className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                            查看线索卡片 &rarr;
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
