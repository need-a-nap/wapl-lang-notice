<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>와플어학당 공지 생성기</title>
    <!-- 구글 폰트 (Jua: Rix이누아리두리체 대체용) -->
    <link href="https://fonts.googleapis.com/css2?family=Jua&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* CSS 폰트 정의 - 브라우저 캐싱 유도 */
        @font-face {
            font-family: 'RixInuAriduri';
            src: local('Rix이누아리두리체'), local('RixInuAriduriR'), 
                 url('https://fonts.gstatic.com/s/jua/v15/7VmY5z9b_O3p_G0.woff2') format('woff2');
        }

        @font-face {
            font-family: 'GongFont';
            src: local('공체 Light'), local('GongChe L'), local('GongChe'),
                 url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10@1.0/Gong.woff') format('woff');
            font-weight: normal;
            font-style: normal;
            font-display: swap;
        }

        body {
            background-color: #f3f4f6;
            font-family: 'Pretendard', sans-serif;
        }
        canvas {
            max-width: 100%;
            height: auto;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            border-radius: 8px;
        }

        /* 실제 텍스트가 화면에 있어야 브라우저가 로딩 우선순위를 높임 */
        .font-preload {
            position: absolute;
            left: -9999px;
            top: -9999px;
            white-space: nowrap;
        }
    </style>
</head>
<body class="p-4 md:p-8">
    <!-- 폰트 로딩 강제 유도용 숨김 요소 -->
    <div class="font-preload">
        <span style="font-family: 'RixInuAriduri'; font-weight: bold;">Rix Font</span>
        <span style="font-family: 'GongFont';">Gong Font</span>
    </div>

    <div class="max-w-5xl mx-auto">
        <header class="mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">와플어학당 공지 생성기</h1>
            <p class="text-gray-600 font-medium text-sm">폰트가 보이지 않을 경우 1~2초 후 '이미지 생성하기'를 다시 눌러주세요.</p>
        </header>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <!-- 설정 패널 -->
            <div class="bg-white p-6 rounded-2xl shadow-sm space-y-6">
                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">1. 양식 이미지 업로드</label>
                    <input type="file" id="templateUpload" accept="image/*" class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100">
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">2. 연도 선택</label>
                        <select id="yearSelect" class="w-full p-2 border rounded-lg outline-none">
                            <option value="2025" selected>2025년</option>
                            <option value="2026">2026년</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">3. 월 선택</label>
                        <select id="monthSelect" class="w-full p-2 border rounded-lg outline-none">
                            <script>
                                for(let i=1; i<=12; i++) {
                                    const selected = i === new Date().getMonth() + 1 ? 'selected' : '';
                                    document.write(`<option value="${i}" ${selected}>${i}월</option>`);
                                }
                            </script>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-2">4. QR 코드 연결 URL</label>
                    <input type="text" id="qrUrl" class="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-orange-500" value="https://example.com/apply">
                </div>

                <div class="pt-4">
                    <button id="generateBtn" class="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg active:scale-95">
                        이미지 생성하기
                    </button>
                </div>

                <div class="pt-2">
                    <button id="downloadBtn" disabled class="w-full bg-gray-800 hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">
                        이미지 다운로드
                    </button>
                </div>
            </div>

            <!-- 프리뷰 패널 -->
            <div class="lg:col-span-2 flex flex-col items-center justify-start">
                <div id="canvasContainer" class="w-full flex justify-center bg-gray-200 rounded-2xl p-4 min-h-[400px] items-center overflow-hidden">
                    <p id="placeholderText" class="text-gray-500 font-medium text-center">양식 이미지를 업로드하고<br>'이미지 생성하기'를 눌러주세요.</p>
                    <canvas id="mainCanvas" style="display:none;"></canvas>
                </div>
                <div id="qrcode" style="display:none;"></div>
            </div>
        </div>
    </div>

    <script>
        const canvas = document.getElementById('mainCanvas');
        const ctx = canvas.getContext('2d');
        const templateUpload = document.getElementById('templateUpload');
        const generateBtn = document.getElementById('generateBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const placeholderText = document.getElementById('placeholderText');
        const qrcodeContainer = document.getElementById('qrcode');

        let templateImg = null;

        // 폰트 강제 로딩 함수 - 네트워크 에러 방지를 위해 여러 경로 시도 및 예외 처리
        async function loadWebFont(name, url) {
            try {
                const font = new FontFace(name, `url(${url})`);
                const loadedFont = await font.load();
                document.fonts.add(loadedFont);
                return true;
            } catch (err) {
                console.warn(`Font load failed from ${url}:`, err);
                return false;
            }
        }

        // 초기 실행 시 공체 폰트 로드 시도 (cdn.jsdelivr.net 사용)
        loadWebFont('GongFont', 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10@1.0/Gong.woff');

        templateUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    templateImg = img;
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.style.display = 'block';
                    placeholderText.style.display = 'none';
                    draw();
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        function getLastDay(year, month) {
            return new Date(year, month, 0).getDate();
        }

        async function draw() {
            if (!templateImg) return;

            // 폰트가 준비될 때까지 대기
            try {
                await document.fonts.ready;
            } catch (e) {
                console.log("Font matching might not be perfect yet, continuing draw...");
            }

            const year = parseInt(document.getElementById('yearSelect').value);
            const month = parseInt(document.getElementById('monthSelect').value);
            const url = document.getElementById('qrUrl').value;
            const lastDay = getLastDay(year, month);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(templateImg, 0, 0);

            // 1. 상단 월 제목 (Rix이누아리두리체 / Jua)
            const monthText = `${month}월`;
            const titleX = canvas.width * 0.87;
            const titleY = canvas.height * 0.35;
            
            ctx.save();
            ctx.translate(titleX, titleY);
            ctx.rotate(10 * Math.PI / 180);
            
            ctx.font = `bold 100px "RixInuAriduri", "Jua", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.lineJoin = 'round';

            // 외곽선 90
            ctx.strokeStyle = '#fc5230';
            ctx.lineWidth = 90;
            ctx.strokeText(monthText, 0, 0);
            ctx.fillStyle = '#fc5230';
            ctx.fillText(monthText, 0, 0);

            // 위쪽 레이어 외곽선 20
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 20;
            ctx.strokeText(monthText, 0, 0);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(monthText, 0, 0);
            ctx.restore();

            // 2. 중간 우측 텍스트 (공체 - 볼드 제거)
            ctx.save();
            const textStartX = canvas.width * 0.54;
            const textStartY = (canvas.height * 0.655) + 15;
            const lineHeight = 40;
            
            ctx.fillStyle = '#333';
            ctx.textAlign = 'left';
            
            // 자간 설정 -5px
            if ('letterSpacing' in ctx) {
                ctx.letterSpacing = "-5px";
            }

            // 첫 번째 줄: n월 학습 신청하기
            ctx.save();
            ctx.font = `30px "GongFont", sans-serif`;
            ctx.translate(textStartX, textStartY);
            ctx.scale(0.95, 1); // 장평 95
            ctx.fillText(`${month}월 학습 신청하기 >>>`, 0, 0);
            ctx.restore();

            // 두 번째 줄: 학습일 정보
            ctx.save();
            ctx.font = `25px "GongFont", sans-serif`;
            ctx.translate(textStartX, textStartY + lineHeight);
            ctx.scale(0.95, 1); // 장평 95
            ctx.fillText(`*학습일 : ${month}/1~${month}/${lastDay}`, 0, 0);
            ctx.restore();
            
            ctx.restore();

            // 3. QR 코드 (70% 사이즈)
            const baseQrSize = 140;
            const targetQrSize = Math.floor(baseQrSize * 0.7);
            
            qrcodeContainer.innerHTML = '';
            const qrcode = new QRCode(qrcodeContainer, {
                text: url,
                width: targetQrSize,
                height: targetQrSize,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // QR 이미지가 생성된 후 캔버스에 그리기
            setTimeout(() => {
                const qrImg = qrcodeContainer.querySelector('img');
                if (qrImg) {
                    const offset = (baseQrSize - targetQrSize) / 2;
                    const qrX = (canvas.width * 0.745) + offset;
                    const qrY = (canvas.height * 0.615) + offset;
                    ctx.drawImage(qrImg, qrX, qrY, targetQrSize, targetQrSize);
                    downloadBtn.disabled = false;
                }
            }, 300);
        }

        generateBtn.addEventListener('click', draw);

        downloadBtn.addEventListener('click', () => {
            const year = document.getElementById('yearSelect').value;
            const month = document.getElementById('monthSelect').value;
            const link = document.createElement('a');
            link.download = `와플어학당_공지_${year}_${month}월.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    </script>
</body>
</html>
