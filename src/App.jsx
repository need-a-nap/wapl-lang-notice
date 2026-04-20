import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Settings, Image as ImageIcon, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';

// 유틸: 둥근 직사각형 그리기
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function App() {
  const canvasRef = useRef(null);
  
  // 상태 관리
  const [bgImgObj, setBgImgObj] = useState(null);
  const [qrImgObj, setQrImgObj] = useState(null);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // 폼 입력 데이터
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [link, setLink] = useState('https://forms.google.com/');
  const [badgeColor, setBadgeColor] = useState('#E13E30'); // 원본 이미지와 비슷한 빨간색
  
  // 좌표 및 크기 상태 (1080x1080 비율 기준 기본값)
  const [pos, setPos] = useState({
    badge: { x: 770, y: 245, w: 220, h: 100, radius: 25 },
    textRegion: { x: 535, y: 620, w: 240, h: 100 },
    text: { x: 540, y: 660 },
    qr: { x: 790, y: 620, size: 100 }
  });

  // 폰트 로딩 대기
  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  // qrcode.js 라이브러리 동적 로드
  useEffect(() => {
    if (window.QRCode) {
      setQrLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js';
    script.onload = () => setQrLoaded(true);
    document.body.appendChild(script);
  }, []);

  // QR 코드 이미지 생성
  useEffect(() => {
    if (qrLoaded && window.QRCode && link) {
      window.QRCode.toDataURL(link, { margin: 1, width: 300 }, (err, url) => {
        if (!err) {
          const img = new Image();
          img.onload = () => setQrImgObj(img);
          img.src = url;
        }
      });
    }
  }, [link, qrLoaded]);

  // 배경 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => setBgImgObj(img);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // 캔버스 드로잉 로직
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImgObj || !fontsLoaded) return;
    
    canvas.width = bgImgObj.width;
    canvas.height = bgImgObj.height;
    
    const scaleX = bgImgObj.width / 1080;
    const scaleY = bgImgObj.height / 1080;

    const ctx = canvas.getContext('2d');
    
    // 1. 원본 배경 그리기
    ctx.drawImage(bgImgObj, 0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(scaleX, scaleY);

    // ============================================
    // 2. 우측 상단 '월' 뱃지 덮어쓰기 & 새 텍스트
    // ============================================
    ctx.fillStyle = badgeColor;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 5;
    roundRect(ctx, pos.badge.x, pos.badge.y, pos.badge.w, pos.badge.h, pos.badge.radius);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    // 모두 Noto Sans KR 통일 (가장 두꺼운 900 굵기 사용)
    ctx.font = "900 60px 'Noto Sans KR', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#000000';
    
    const badgeTextX = pos.badge.x + pos.badge.w / 2;
    const badgeTextY = pos.badge.y + pos.badge.h / 2 + 5;
    
    ctx.strokeText(`${month}월`, badgeTextX, badgeTextY);
    ctx.fillText(`${month}월`, badgeTextX, badgeTextY);

    // ============================================
    // 3. 중앙 '신청하기' 영역 덮어쓰기
    // ============================================
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pos.textRegion.x, pos.textRegion.y, pos.textRegion.w, pos.textRegion.h);

    // 4. 신청 관련 새 텍스트 작성
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    
    ctx.font = "700 22px 'Noto Sans KR', sans-serif";
    ctx.fillText(`${month}월 학습 신청하기 〉〉〉`, pos.text.x, pos.text.y);
    
    const lastDay = new Date(year, month, 0).getDate();
    ctx.font = "500 18px 'Noto Sans KR', sans-serif";
    ctx.fillText(`*학습일 : ${month}/1~${month}/${lastDay}`, pos.text.x, pos.text.y + 35);

    // ============================================
    // 5. QR 코드 영역 덮어쓰기 & 새 QR 그리기
    // ============================================
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(pos.qr.x, pos.qr.y, pos.qr.size, pos.qr.size);
    if (qrImgObj) {
      ctx.drawImage(qrImgObj, pos.qr.x, pos.qr.y, pos.qr.size, pos.qr.size);
    }
    
    ctx.restore();

  }, [bgImgObj, qrImgObj, year, month, pos, badgeColor, fontsLoaded]);

  const updatePos = (category, field, value) => {
    setPos(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: Number(value) }
    }));
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `와플어학당_공지_${month}월.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  };

  const RangeInput = ({ label, value, onChange, max=1080 }) => (
    <div className="flex items-center text-sm mt-2">
      <span className="w-10 text-gray-700 font-medium">{label}</span>
      <input 
        type="range" min="0" max={max} value={value} 
        onChange={e => onChange(e.target.value)} 
        className="flex-1 mx-2 h-2 bg-yellow-200 rounded-lg appearance-none cursor-pointer accent-yellow-500" 
      />
      <span className="w-12 text-right text-gray-600 font-mono bg-white px-1 rounded border border-gray-100">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF5] p-4 md:p-8" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&display=swap');`}
      </style>

      <div className="max-w-6xl mx-auto">
        <header className="mb-10 text-center">
          <div className="inline-block bg-yellow-400 text-yellow-900 px-4 py-1.5 rounded-full text-sm font-bold mb-3 shadow-sm">
            와이지플러스 어학지원제도
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight">와플어학당 공지 자동 생성기</h1>
          <p className="text-gray-500 mt-3 font-medium">단 1분 만에 매월 바뀌는 새로운 공지문을 만들어보세요.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 좌측: 제어 패널 */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Step 1 */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border ${bgImgObj ? 'border-green-200 bg-green-50/30' : 'border-yellow-300'}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                  <span className={`inline-flex items-center justify-center w-7 h-7 mr-2 rounded-full text-sm font-bold ${bgImgObj ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>1</span>
                  템플릿 이미지 로드
                </h2>
                {bgImgObj && <CheckCircle className="w-6 h-6 text-green-500" />}
              </div>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors bg-gray-50 hover:bg-yellow-50 hover:border-yellow-400 border-gray-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 text-yellow-500 mb-3" />
                  <p className="text-sm text-gray-600 font-bold">클릭하여 이미지 업로드 (PNG, JPG)</p>
                  <p className="text-xs text-gray-400 mt-1">기존에 사용하던 공지문 원본을 올려주세요.</p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>
            </div>

            {/* Step 2 */}
            <div className={`bg-white p-6 rounded-2xl shadow-sm border border-yellow-200 transition-opacity ${!bgImgObj ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-lg font-bold text-gray-800 mb-5 flex items-center">
                <span className="inline-flex items-center justify-center w-7 h-7 mr-2 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">2</span>
                공지 내용 수정
              </h2>
              
              <div className="space-y-5">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">적용 연도</label>
                    <input 
                      type="number" 
                      value={year} 
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white outline-none transition-all font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">공지 월 (Month)</label>
                    <select 
                      value={month} 
                      onChange={(e) => setMonth(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white outline-none transition-all font-medium appearance-none cursor-pointer"
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}월</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">신청 폼 링크 (자동 QR 생성)</label>
                  <input 
                    type="url" 
                    value={link} 
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://forms.google.com/..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 focus:bg-white outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* 고급 설정 아코디언 */}
              <div className="mt-6 border-t border-gray-100 pt-5">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full text-sm font-bold text-gray-500 hover:text-yellow-600 transition-colors p-2 rounded-lg hover:bg-yellow-50"
                >
                  <span className="flex items-center"><Settings className="w-4 h-4 mr-2" /> 덮어쓰기 위치/크기 미세 조정</span>
                  {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                
                {showAdvanced && (
                  <div className="mt-4 space-y-5 bg-[#FFFDF5] p-5 rounded-xl border border-yellow-100">
                    <div className="bg-yellow-100 text-yellow-800 text-xs p-3 rounded-lg mb-2 font-medium">
                      💡 원본 이미지의 비율이나 디자인이 조금 다를 경우 아래 슬라이더를 움직여 덮어쓰는 영역을 딱 맞게 조절하세요.
                    </div>
                    
                    <div>
                      <label className="text-sm font-bold text-gray-700 flex justify-between items-center mb-1">
                        우측 상단 N월 뱃지 박스
                        <div className="flex items-center gap-2 text-xs">
                          배경색: <input type="color" value={badgeColor} onChange={e=>setBadgeColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0" />
                        </div>
                      </label>
                      <RangeInput label="가로(X)" value={pos.badge.x} onChange={(v) => updatePos('badge', 'x', v)} />
                      <RangeInput label="세로(Y)" value={pos.badge.y} onChange={(v) => updatePos('badge', 'y', v)} />
                      <RangeInput label="너비" value={pos.badge.w} max="400" onChange={(v) => updatePos('badge', 'w', v)} />
                      <RangeInput label="높이" value={pos.badge.h} max="300" onChange={(v) => updatePos('badge', 'h', v)} />
                    </div>
                    
                    <hr className="border-gray-200"/>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1 block">기존 텍스트 지우기 (흰색 박스 영역)</label>
                      <RangeInput label="가로(X)" value={pos.textRegion.x} onChange={(v) => updatePos('textRegion', 'x', v)} />
                      <RangeInput label="세로(Y)" value={pos.textRegion.y} onChange={(v) => updatePos('textRegion', 'y', v)} />
                      <RangeInput label="너비" value={pos.textRegion.w} max="500" onChange={(v) => updatePos('textRegion', 'w', v)} />
                      <RangeInput label="높이" value={pos.textRegion.h} max="300" onChange={(v) => updatePos('textRegion', 'h', v)} />
                    </div>
                    
                    <hr className="border-gray-200"/>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1 block">새 텍스트 시작 위치</label>
                      <RangeInput label="가로(X)" value={pos.text.x} onChange={(v) => updatePos('text', 'x', v)} />
                      <RangeInput label="세로(Y)" value={pos.text.y} onChange={(v) => updatePos('text', 'y', v)} />
                    </div>

                    <hr className="border-gray-200"/>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-1 block">QR 코드 덮어쓰기 영역</label>
                      <RangeInput label="가로(X)" value={pos.qr.x} onChange={(v) => updatePos('qr', 'x', v)} />
                      <RangeInput label="세로(Y)" value={pos.qr.y} onChange={(v) => updatePos('qr', 'y', v)} />
                      <RangeInput label="크기" value={pos.qr.size} max="300" onChange={(v) => updatePos('qr', 'size', v)} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 3 */}
            <div className={`transition-opacity ${!bgImgObj ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                onClick={handleDownload}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black text-lg py-4 px-4 rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center transition-all transform hover:-translate-y-1"
              >
                <Download className="w-6 h-6 mr-2" />
                완성된 이미지 다운로드
              </button>
            </div>
          </div>

          {/* 우측: 미리보기 캔버스 */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-md border border-yellow-200 flex-1 flex flex-col items-center justify-center min-h-[500px] relative">
              
              <div className="absolute top-4 left-4 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg text-sm font-bold flex items-center shadow-sm z-10">
                <ImageIcon className="w-4 h-4 mr-1.5" /> 미리보기 화면
              </div>

              {!bgImgObj ? (
                <div className="text-center p-12">
                  <div className="w-24 h-24 bg-yellow-50 text-yellow-300 rounded-full flex items-center justify-center mx-auto mb-5">
                    <ImageIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-700 mb-2">여기에 이미지가 표시됩니다</h3>
                  <p className="text-gray-500">좌측 패널 1번에서 템플릿 이미지를 먼저 업로드해주세요.</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center mt-8">
                  <canvas 
                    ref={canvasRef} 
                    className="max-w-full h-auto rounded-xl shadow-sm border border-gray-100 object-contain"
                    style={{ maxHeight: '75vh' }}
                  />
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
