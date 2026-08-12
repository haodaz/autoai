'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Building2 } from 'lucide-react';

const VIDEOS = [
  '/videos/video1.mp4',
  '/videos/video2.mp4',
  '/videos/video3.mp4',
  '/videos/video4.mp4',
  '/videos/video5.mp4'
];

export default function Home() {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // When index changes, force video to load and play
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(e => console.log('Video autoplay blocked:', e));
    }
  }, [currentVideoIndex]);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-black">
      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnd}
        className="absolute top-0 left-0 w-full h-full object-cover z-0 transition-opacity duration-1000 scale-[1.35]"
      >
        <source src={VIDEOS[currentVideoIndex]} type="video/mp4" />
      </video>

      {/* Dark Overlay for better text readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/50 z-0 backdrop-blur-[2px]"></div>

      <div className="z-10 w-full max-w-6xl mt-12">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="flex justify-center mb-6 drop-shadow-2xl">
            <img src="/logo.webp" alt="Myddelton College Logo" className="h-24 object-contain brightness-110" />
          </div>
          <h2 className="text-white/90 text-lg font-medium mt-4 tracking-[0.2em] uppercase drop-shadow-md">
            智能院校招生与客情管理枢纽
          </h2>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 px-4">
          {/* External Portal */}
          <Link href="/chat/external" className="group relative bg-black/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl hover:shadow-[#427759]/40 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between h-[320px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#427759]/30 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-[#427759] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#427759]/50 group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">院校数字分身</h2>
              <p className="text-gray-300 leading-relaxed font-light">
                面向潜/在校学生、家长以及合作方。<br/>提供全天候的智能招生政策解答、专业介绍及合作咨询。
              </p>
            </div>
            <div className="relative z-10 flex items-center text-[#86d9a9] font-medium mt-4 group-hover:text-white transition-colors">
              进入咨询 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Internal Portal */}
          <Link href="/internal" className="group relative bg-black/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl hover:shadow-[#7e57c2]/30 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between h-[320px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7e57c2]/20 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-[#7e57c2] to-[#5e35b1] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#7e57c2]/40 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">校长秘书控制台</h2>
              <p className="text-gray-300 leading-relaxed font-light">
                内部专属统筹工作站。<br/>掌握全局CRM客情数据，可视化管理知识库，配置AI业务逻辑。
              </p>
            </div>
            <div className="relative z-10 flex items-center text-[#bba0e8] font-medium mt-4 group-hover:text-white transition-colors">
              进入控制台 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Agency Studio Portal */}
          <Link href="/agency" className="group relative bg-black/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl hover:shadow-[#1e3a8a]/30 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between h-[320px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#1e3a8a]/25 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#1e3a8a]/40 group-hover:scale-110 transition-transform">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">留学招生工作室</h2>
              <p className="text-gray-300 leading-relaxed font-light">
                多院校招生代理平台。<br/>智能选校匹配、多校知识库、学员CRM与营销物料一站式管理。
              </p>
            </div>
            <div className="relative z-10 flex items-center text-[#93b5f5] font-medium mt-4 group-hover:text-white transition-colors">
              进入工作室 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Agency Studio AI Chat Portal */}
          <Link href="/chat/agency" className="group relative bg-black/40 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-2xl hover:shadow-[#f59e0b]/30 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden flex flex-col justify-between h-[320px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#f59e0b]/25 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 blur-xl"></div>
            <div className="relative z-10">
              <div className="w-14 h-14 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#f59e0b]/40 group-hover:scale-110 transition-transform">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-wide">独立顾问 AI</h2>
              <p className="text-gray-300 leading-relaxed font-light">
                面向广大家长的专属留学规划师。<br/>客观测评、解答英国教育体系并智能匹配顶尖寄宿学校。
              </p>
            </div>
            <div className="relative z-10 flex items-center text-[#fcd34d] font-medium mt-4 group-hover:text-white transition-colors">
              向顾问咨询 <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}